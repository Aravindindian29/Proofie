import fitz
import re
import logging
import base64
import io
from PIL import Image

logger = logging.getLogger(__name__)


class PDFExtractor:
    """Extract text, images, and metadata from PDF files"""
    
    def extract_full_text(self, pdf_path):
        """Extract all text with page numbers"""
        try:
            doc = fitz.open(pdf_path)
            pages = []
            total_text = ""
            
            for page_num, page in enumerate(doc, start=1):
                text = page.get_text()
                pages.append({
                    'page_number': page_num,
                    'text': text,
                    'word_count': len(text.split())
                })
                total_text += f"\n--- Page {page_num} ---\n{text}"
            
            doc.close()
            
            return {
                'total_pages': len(pages),
                'pages': pages,
                'full_text': total_text,
                'metadata': doc.metadata if hasattr(doc, 'metadata') else {}
            }
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise
    
    def extract_images_as_base64(self, pdf_path, max_images_per_page=3, max_pages=10):
        """
        Extract images from PDF and convert to base64 for vision API
        
        Args:
            pdf_path: Path to PDF file
            max_images_per_page: Maximum number of images to extract per page
            max_pages: Maximum number of pages to process (to control costs)
        
        Returns:
            List of dicts with page_number, image_base64, and image_index
        """
        try:
            doc = fitz.open(pdf_path)
            extracted_images = []
            
            # Limit pages to control API costs
            pages_to_process = min(len(doc), max_pages)
            logger.info(f"Extracting images from {pages_to_process} pages (total: {len(doc)})")
            
            for page_num in range(pages_to_process):
                page = doc[page_num]
                image_list = page.get_images(full=True)
                
                # Limit images per page
                images_to_extract = min(len(image_list), max_images_per_page)
                
                for img_index in range(images_to_extract):
                    try:
                        xref = image_list[img_index][0]
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        
                        # Convert to base64
                        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                        
                        # Get image format
                        image_ext = base_image["ext"]
                        
                        extracted_images.append({
                            'page_number': page_num + 1,
                            'image_index': img_index + 1,
                            'image_base64': image_base64,
                            'image_format': image_ext,
                            'mime_type': f'image/{image_ext}'
                        })
                        
                        logger.info(f"Extracted image {img_index + 1} from page {page_num + 1}")
                        
                    except Exception as img_error:
                        logger.warning(f"Failed to extract image {img_index} from page {page_num + 1}: {img_error}")
                        continue
            
            doc.close()
            logger.info(f"Total images extracted: {len(extracted_images)}")
            
            return extracted_images
            
        except Exception as e:
            logger.error(f"Error extracting images from PDF: {e}")
            raise
    
    def render_pages_as_images(self, pdf_path, max_pages=5, dpi=150):
        """
        Render PDF pages as images for vision analysis
        This is useful when images are embedded in complex layouts
        
        Args:
            pdf_path: Path to PDF file
            max_pages: Maximum number of pages to render
            dpi: Resolution for rendering (150 is good balance of quality/size)
        
        Returns:
            List of dicts with page_number and image_base64
        """
        try:
            doc = fitz.open(pdf_path)
            rendered_pages = []
            
            pages_to_process = min(len(doc), max_pages)
            logger.info(f"Rendering {pages_to_process} pages as images")
            
            for page_num in range(pages_to_process):
                page = doc[page_num]
                
                # Render page to image at specified DPI
                mat = fitz.Matrix(dpi/72, dpi/72)  # 72 is default DPI
                pix = page.get_pixmap(matrix=mat)
                
                # Convert to PIL Image
                img_data = pix.tobytes("png")
                img = Image.open(io.BytesIO(img_data))
                
                # Convert to base64
                buffered = io.BytesIO()
                img.save(buffered, format="PNG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
                
                rendered_pages.append({
                    'page_number': page_num + 1,
                    'image_base64': img_base64,
                    'mime_type': 'image/png',
                    'width': pix.width,
                    'height': pix.height
                })
                
                logger.info(f"Rendered page {page_num + 1} as image ({pix.width}x{pix.height})")
            
            doc.close()
            logger.info(f"Total pages rendered: {len(rendered_pages)}")
            
            return rendered_pages
            
        except Exception as e:
            logger.error(f"Error rendering PDF pages: {e}")
            raise
    
    def extract_text_with_coordinates(self, pdf_path):
        """Extract text with bounding box coordinates for diff highlighting"""
        try:
            doc = fitz.open(pdf_path)
            pages_data = []
            
            for page_num, page in enumerate(doc, start=1):
                words = page.get_text("words")
                page_data = {
                    'page_number': page_num,
                    'words': []
                }
                
                for word in words:
                    x0, y0, x1, y1, text, block_no, line_no, word_no = word
                    page_data['words'].append({
                        'text': text,
                        'bbox': {'x0': x0, 'y0': y0, 'x1': x1, 'y1': y1},
                        'block': block_no,
                        'line': line_no
                    })
                
                pages_data.append(page_data)
            
            doc.close()
            return pages_data
        except Exception as e:
            logger.error(f"Error extracting text with coordinates: {e}")
            raise
    
    def find_cpi_id_from_filename(self, pdf_path):
        """Extract CPI ID from filename using pattern CPI-XXX"""
        try:
            import os
            filename = os.path.basename(pdf_path)
            
            # Pattern: CPI-XXX (any number of digits after CPI-)
            pattern = r'CPI-\d+'
            
            match = re.search(pattern, filename, re.IGNORECASE)
            if match:
                cpi_id = match.group(0).upper()
                logger.info(f"Found CPI ID from filename: {cpi_id}")
                return cpi_id
            
            logger.warning(f"No CPI ID found in filename: {filename}")
            return None
        except Exception as e:
            logger.error(f"Error extracting CPI ID from filename: {e}")
            return None
    
    def find_cpi_id(self, pdf_path):
        """Search for CPI ID pattern in PDF content (fallback method)"""
        try:
            doc = fitz.open(pdf_path)
            
            # Pattern: CPI-XXXXX or CPI_XXXXX (case insensitive)
            pattern = r'CPI[_-]\d{5,}'
            
            for page in doc:
                text = page.get_text()
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    cpi_id = match.group(0)
                    doc.close()
                    logger.info(f"Found CPI ID in content: {cpi_id}")
                    return cpi_id
            
            doc.close()
            logger.warning("No CPI ID found in PDF content")
            return None
        except Exception as e:
            logger.error(f"Error finding CPI ID: {e}")
            return None
    
    def extract_page_text(self, pdf_path, page_number):
        """Extract text from a specific page"""
        try:
            doc = fitz.open(pdf_path)
            
            if page_number < 1 or page_number > len(doc):
                raise ValueError(f"Page number {page_number} out of range")
            
            page = doc[page_number - 1]
            text = page.get_text()
            doc.close()
            
            return text
        except Exception as e:
            logger.error(f"Error extracting page {page_number}: {e}")
            raise

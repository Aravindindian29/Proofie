import fitz
import re
import logging

logger = logging.getLogger(__name__)


class PDFExtractor:
    """Extract text and metadata from PDF files"""
    
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
    
    def find_cpi_id(self, pdf_path):
        """Search for CPI ID pattern in PDF"""
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
                    logger.info(f"Found CPI ID: {cpi_id}")
                    return cpi_id
            
            doc.close()
            logger.warning("No CPI ID found in PDF")
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

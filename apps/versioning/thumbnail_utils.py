import os
import io
from PIL import Image
from django.core.files.base import ContentFile
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def generate_pdf_thumbnail(file_path, thumbnail_size=(400, 565)):
    """
    Generate a thumbnail from the first page of a PDF file.
    Returns a ContentFile that can be saved to a model's ImageField.
    """
    logger.info(f"📄 PDF THUMBNAIL: Starting for {file_path}")
    
    try:
        # Try using PyMuPDF (fitz) first - it's more reliable
        import fitz  # PyMuPDF
        logger.info(f"📄 PDF THUMBNAIL: PyMuPDF imported successfully")
        
        # Open the PDF
        pdf_document = fitz.open(file_path)
        logger.info(f"📄 PDF THUMBNAIL: PDF opened, {len(pdf_document)} pages")
        
        if len(pdf_document) == 0:
            logger.warning("📄 PDF THUMBNAIL: PDF has no pages")
            return None
        
        # Get first page
        first_page = pdf_document[0]
        logger.info(f"📄 PDF THUMBNAIL: Got first page")
        
        # Render page to image at higher resolution for quality
        mat = fitz.Matrix(2, 2)  # 2x zoom for better quality
        pix = first_page.get_pixmap(matrix=mat)
        logger.info(f"📄 PDF THUMBNAIL: Rendered pixmap {pix.width}x{pix.height}")
        
        # Convert to PIL Image
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))
        logger.info(f"📄 PDF THUMBNAIL: Created PIL image {img.size}")
        
        # Resize to thumbnail size while maintaining aspect ratio
        img.thumbnail(thumbnail_size, Image.LANCZOS)
        logger.info(f"📄 PDF THUMBNAIL: Resized to {img.size}")
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Save to bytes
        thumb_io = io.BytesIO()
        img.save(thumb_io, format='JPEG', quality=85, optimize=True)
        thumb_io.seek(0)
        logger.info(f"📄 PDF THUMBNAIL: Saved JPEG, size={len(thumb_io.getvalue())} bytes")
        
        # Clean up
        pdf_document.close()
        
        # Return ContentFile
        filename = os.path.basename(file_path)
        name, _ = os.path.splitext(filename)
        result = ContentFile(thumb_io.getvalue(), name=f"{name}_thumb.jpg")
        logger.info(f"📄 PDF THUMBNAIL: Created ContentFile successfully")
        return result
        
    except ImportError as e:
        logger.warning(f"📄 PDF THUMBNAIL: PyMuPDF not available: {e}")
    except Exception as e:
        logger.error(f"📄 PDF THUMBNAIL ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    logger.warning("📄 PDF THUMBNAIL: Returning None")
    return None
    
    # Fallback to pdf2image
    try:
        from pdf2image import convert_from_path
        
        # Convert first page only
        images = convert_from_path(file_path, first_page=1, last_page=1, dpi=150)
        
        if not images:
            logger.warning("pdf2image returned no images")
            return None
        
        img = images[0]
        
        # Resize to thumbnail size
        img.thumbnail(thumbnail_size, Image.LANCZOS)
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Save to bytes
        thumb_io = io.BytesIO()
        img.save(thumb_io, format='JPEG', quality=85, optimize=True)
        thumb_io.seek(0)
        
        # Return ContentFile
        filename = os.path.basename(file_path)
        name, _ = os.path.splitext(filename)
        return ContentFile(thumb_io.getvalue(), name=f"{name}_thumb.jpg")
        
    except ImportError:
        logger.error("Neither PyMuPDF nor pdf2image available for PDF thumbnail generation")
        return None
    except Exception as e:
        logger.error(f"pdf2image thumbnail generation failed: {e}")
        return None


def generate_image_thumbnail(file_path, thumbnail_size=(400, 565)):
    """
    Generate a thumbnail from an image file.
    Returns a ContentFile that can be saved to a model's ImageField.
    """
    try:
        img = Image.open(file_path)
        
        # Convert to RGB if necessary (handles RGBA, P, etc.)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to thumbnail size while maintaining aspect ratio
        img.thumbnail(thumbnail_size, Image.LANCZOS)
        
        # Save to bytes
        thumb_io = io.BytesIO()
        img.save(thumb_io, format='JPEG', quality=85, optimize=True)
        thumb_io.seek(0)
        
        # Return ContentFile
        filename = os.path.basename(file_path)
        name, _ = os.path.splitext(filename)
        return ContentFile(thumb_io.getvalue(), name=f"{name}_thumb.jpg")
        
    except Exception as e:
        logger.error(f"Image thumbnail generation failed: {e}")
        return None


def generate_video_thumbnail(file_path, thumbnail_size=(400, 565)):
    """
    Generate a thumbnail from a video file (first frame).
    Returns a ContentFile that can be saved to a model's ImageField.
    """
    try:
        import cv2
        
        # Open video file
        cap = cv2.VideoCapture(file_path)
        
        if not cap.isOpened():
            logger.warning(f"Could not open video file: {file_path}")
            return None
        
        # Read first frame
        ret, frame = cap.read()
        cap.release()
        
        if not ret or frame is None:
            logger.warning("Could not read first frame from video")
            return None
        
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Create PIL Image
        img = Image.fromarray(frame_rgb)
        
        # Resize to thumbnail size
        img.thumbnail(thumbnail_size, Image.LANCZOS)
        
        # Save to bytes
        thumb_io = io.BytesIO()
        img.save(thumb_io, format='JPEG', quality=85, optimize=True)
        thumb_io.seek(0)
        
        # Return ContentFile
        filename = os.path.basename(file_path)
        name, _ = os.path.splitext(filename)
        return ContentFile(thumb_io.getvalue(), name=f"{name}_thumb.jpg")
        
    except ImportError:
        logger.warning("OpenCV not available for video thumbnail generation")
        return None
    except Exception as e:
        logger.error(f"Video thumbnail generation failed: {e}")
        return None


def generate_thumbnail_for_asset(file_path, file_type, thumbnail_size=(400, 565)):
    """
    Generate a thumbnail based on file type.
    Returns a ContentFile or None.
    """
    if not os.path.exists(file_path):
        logger.warning(f"File not found: {file_path}")
        return None
    
    if file_type == 'pdf':
        return generate_pdf_thumbnail(file_path, thumbnail_size)
    elif file_type == 'image':
        return generate_image_thumbnail(file_path, thumbnail_size)
    elif file_type == 'video':
        return generate_video_thumbnail(file_path, thumbnail_size)
    else:
        logger.warning(f"Unknown file type for thumbnail: {file_type}")
        return None

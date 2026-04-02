from django.http import HttpResponse, Http404
from django.conf import settings
import os
import mimetypes


def serve_asset_cors_free(request, file_path):
    """
    Ultra-minimal asset serving with absolutely no headers that could trigger Chrome blocking.
    """
    try:
        # Basic security check
        if '..' in file_path or file_path.startswith('/'):
            raise Http404("Invalid file path")
        
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        if not os.path.exists(full_path):
            raise Http404("File not found")
        
        # Get MIME type
        mime_type, _ = mimetypes.guess_type(full_path)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        # Read file
        with open(full_path, 'rb') as f:
            content = f.read()
        
        # Create response with minimal headers
        response = HttpResponse(content, content_type=mime_type)
        
        # Only add the most essential header
        response['Content-Length'] = len(content)
        
        return response
        
    except Exception as e:
        raise Http404(f"Error: {str(e)}")


def serve_asset_data_url(request, file_path):
    """
    Serve file as base64 data URL for maximum compatibility
    """
    try:
        if '..' in file_path or file_path.startswith('/'):
            raise Http404("Invalid file path")
        
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        if not os.path.exists(full_path):
            raise Http404("File not found")
        
        # Get MIME type
        mime_type, _ = mimetypes.guess_type(full_path)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        # Read file and convert to base64
        with open(full_path, 'rb') as f:
            content = f.read()
            import base64
            base64_content = base64.b64encode(content).decode()
        
        # Return as data URL
        data_url = f"data:{mime_type};base64,{base64_content}"
        
        return HttpResponse(data_url, content_type='text/plain')
        
    except Exception as e:
        raise Http404(f"Error: {str(e)}")

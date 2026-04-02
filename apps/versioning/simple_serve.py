from django.urls import path
from django.http import HttpResponse, Http404
from django.conf import settings
import os
import mimetypes


def serve_asset_simple(request, file_path):
    """
    Ultra-simple asset serving without any authentication or complex headers.
    This is the most basic approach to avoid Chrome blocking.
    """
    try:
        # Basic security check
        if '..' in file_path or file_path.startswith('/'):
            raise Http404("Invalid file path")
        
        # Get file path
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        if not os.path.exists(full_path):
            raise Http404("File not found")
        
        # Get MIME type
        mime_type, _ = mimetypes.guess_type(full_path)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        # Read and serve file
        with open(full_path, 'rb') as f:
            content = f.read()
        
        response = HttpResponse(content, content_type=mime_type)
        response['Content-Length'] = len(content)
        
        # Minimal headers only
        response['Access-Control-Allow-Origin'] = '*'
        
        return response
        
    except Exception as e:
        raise Http404(f"Error serving file: {str(e)}")

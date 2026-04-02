from django.http import HttpResponse, Http404, FileResponse
from django.conf import settings
from django.core.files.storage import default_storage
from django.views.decorators.http import require_GET
from django.views.decorators.csrf import csrf_exempt
import os
import mimetypes


@require_GET
@csrf_exempt
def serve_asset(request, file_path):
    """
    Serve uploaded assets with proper headers for inline display in browser.
    This ensures files open in browser tabs instead of downloading.
    """
    try:
        # Security: sanitize file path to prevent directory traversal
        if '..' in file_path or file_path.startswith('/'):
            raise Http404("Invalid file path")
        
        # Construct full file path
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        # Check if file exists
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            raise Http404("File not found")
        
        # Get MIME type
        mime_type, _ = mimetypes.guess_type(full_path)
        if not mime_type:
            # Default MIME type for unknown files
            mime_type = 'application/octet-stream'
        
        # Use FileResponse for better streaming and memory efficiency
        response = FileResponse(open(full_path, 'rb'), content_type=mime_type)
        
        # Set headers for inline display (not attachment)
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(full_path)}"'
        
        # Comprehensive security headers to prevent Chrome blocking
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'SAMEORIGIN'
        response['Referrer-Policy'] = 'no-referrer-when-downgrade'
        response['Cross-Origin-Opener-Policy'] = 'same-origin'
        response['Cross-Origin-Embedder-Policy'] = 'unsafe-none'
        
        # CORS headers for cross-origin requests
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS, HEAD'
        response['Access-Control-Allow-Headers'] = '*'
        response['Access-Control-Max-Age'] = '86400'
        
        # Cache headers for better performance
        response['Cache-Control'] = 'public, max-age=3600, immutable'
        
        # Additional headers to prevent Chrome blocking
        response['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:;"
        
        return response
        
    except Exception as e:
        raise Http404(f"Error serving file: {str(e)}")

from django.http import HttpResponse, Http404
from django.conf import settings
import os
import mimetypes


def serve_asset_chrome_friendly(request, file_path):
    """
    Chrome-specific asset serving with headers that prevent Chrome blocking
    """
    try:
        # Security check
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
        
        # Create response with Chrome-friendly headers
        response = HttpResponse(content, content_type=mime_type)
        
        # Chrome-specific headers to prevent blocking
        response['Content-Length'] = len(content)
        response['Content-Disposition'] = f'inline; filename="{os.path.basename(full_path)}"'
        
        # Chrome security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'ALLOWALL'
        response['Cross-Origin-Opener-Policy'] = 'unsafe-none'
        response['Cross-Origin-Embedder-Policy'] = 'unsafe-none'
        
        # CORS headers for Chrome
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS, HEAD'
        response['Access-Control-Allow-Headers'] = '*'
        response['Access-Control-Max-Age'] = '86400'
        response['Access-Control-Allow-Credentials'] = 'false'
        
        # Chrome-specific headers
        response['Referrer-Policy'] = 'no-referrer-when-downgrade'
        response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # Cache headers
        response['Cache-Control'] = 'public, max-age=3600, immutable'
        
        # Content Security Policy header
        csp = (
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:8000 http://localhost:3002; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob: http: https:; "
            "media-src 'self' blob: data: http: https:; "
            "frame-src 'self' blob: data: http: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' http://localhost:8000 http://localhost:3002 ws://localhost:8000 ws://localhost:3002; "
            "object-src 'self'; "
            "child-src 'self' blob: data:;"
        )
        response['Content-Security-Policy'] = csp
        
        return response
        
    except Exception as e:
        raise Http404(f"Error: {str(e)}")

from django.http import HttpResponse, Http404
from django.conf import settings
import os
import mimetypes


def serve_asset_chrome_fixed(request, file_path):
    """
    Chrome-specific asset serving that completely bypasses X-Frame-Options
    """
    try:
        print(f"🔍 Chrome serving request for: {file_path}")
        print(f"🔍 Full path will be: {os.path.join(settings.MEDIA_ROOT, file_path)}")
        
        # Security check
        if '..' in file_path or file_path.startswith('/'):
            print(f"❌ Security check failed for: {file_path}")
            raise Http404("Invalid file path")
        
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        if not os.path.exists(full_path):
            print(f"❌ File not found: {full_path}")
            raise Http404("File not found")
        
        print(f"✅ File exists: {full_path}")
        
        # Get MIME type
        mime_type, _ = mimetypes.guess_type(full_path)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        print(f"📄 MIME type: {mime_type}")
        
        # Read file
        with open(full_path, 'rb') as f:
            content = f.read()
        
        print(f"📦 File size: {len(content)} bytes")
        
        # Create response with NO X-Frame-Options header
        response = HttpResponse(content, content_type=mime_type)
        
        # Essential headers only
        response['Content-Length'] = len(content)
        
        # For PDFs, ensure inline display
        if mime_type == 'application/pdf':
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(full_path)}"'
            response['Accept-Ranges'] = 'bytes'
            # Add PDF-specific headers for Chrome compatibility
            response['Content-Type'] = 'application/pdf'
            # Remove problematic headers for Chrome
            response['X-Content-Type-Options'] = 'nosniff'
            print(f"🔧 Applied PDF-specific headers for Chrome")
        else:
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(full_path)}"'
        
        # CORS headers
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS, HEAD'
        response['Access-Control-Allow-Headers'] = '*'
        
        # Cache headers
        response['Cache-Control'] = 'public, max-age=3600'
        
        # Security headers - explicitly remove problematic ones
        if 'X-Frame-Options' in response:
            del response['X-Frame-Options']
            print(f"🗑️ Removed X-Frame-Options header")
        if 'Content-Security-Policy' in response:
            del response['Content-Security-Policy']
            print(f"🗑️ Removed Content-Security-Policy header")
        
        print(f"✅ Chrome serving successful for: {file_path}")
        return response
        
    except Exception as e:
        print(f"❌ Chrome serving failed: {str(e)}")
        raise Http404(f"Error: {str(e)}")

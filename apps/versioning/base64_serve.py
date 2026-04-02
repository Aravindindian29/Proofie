from django.http import HttpResponse, Http404, JsonResponse
from django.conf import settings
import os
import mimetypes
import base64


def serve_asset_base64(request, file_path):
    """
    Serve asset as base64 JSON response
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
            base64_content = base64.b64encode(content).decode()
        
        # Return as JSON
        return JsonResponse({
            'success': True,
            'mime_type': mime_type,
            'base64_data': base64_content,
            'filename': os.path.basename(full_path)
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=404)


def serve_asset_info(request, file_path):
    """
    Serve basic file info without content
    """
    try:
        if '..' in file_path or file_path.startswith('/'):
            raise Http404("Invalid file path")
        
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        if not os.path.exists(full_path):
            raise Http404("File not found")
        
        # Get file info
        stat = os.stat(full_path)
        mime_type, _ = mimetypes.guess_type(full_path)
        
        return JsonResponse({
            'success': True,
            'filename': os.path.basename(full_path),
            'size': stat.st_size,
            'mime_type': mime_type or 'application/octet-stream',
            'modified': stat.st_mtime
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=404)

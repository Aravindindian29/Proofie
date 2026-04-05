from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.accounts.views import CustomObtainAuthToken
from django.http import HttpResponse, Http404
import os
import mimetypes

def serve_media_direct(request, file_path):
    """Serve media files using Django's static serving approach"""
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
        
        # Serve with Django's static file approach
        with open(full_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type=mime_type)
        
        return response
        
    except Exception as e:
        raise Http404(f"Error: {str(e)}")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', CustomObtainAuthToken.as_view(), name='api_token_auth'),
    path('api/versioning/', include('apps.versioning.urls')),
    path('api/annotations/', include('apps.annotations.urls')),
    path('api/workflows/', include('apps.workflows.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/ai-engine/', include('apps.ai_engine.urls')),
    # Direct media serving at root level
    path('media/<path:file_path>', serve_media_direct, name='serve_media_direct'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

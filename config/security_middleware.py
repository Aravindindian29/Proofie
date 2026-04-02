from django.http import HttpResponse
from django.conf import settings
import os


def add_security_headers(response):
    """Add security headers to prevent Chrome blocking"""
    # Prevent Chrome from blocking the content
    response['X-Content-Type-Options'] = 'nosniff'
    response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Add CORS headers
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    
    # Cache headers
    response['Cache-Control'] = 'public, max-age=3600'
    
    return response


class SecurityHeaderMiddleware:
    """Middleware to add security headers to media responses"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers to media/asset responses
        if request.path.startswith('/media/') or request.path.startswith('/api/versioning/media/'):
            add_security_headers(response)
        
        return response

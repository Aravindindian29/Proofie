from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse, Http404
from django.conf import settings
import os
import mimetypes

from .models import CreativeAsset
from .token_models import AssetShareToken, AssetAccessToken
from .token_serializers import (
    AssetShareTokenSerializer, AssetAccessTokenSerializer, CreateShareTokenSerializer
)


class AssetTokenViewSet(viewsets.ModelViewSet):
    """ViewSet for managing asset tokens"""
    permission_classes = [IsAuthenticated]
    serializer_class = AssetShareTokenSerializer
    
    def get_queryset(self):
        # Only show tokens created by the current user
        return AssetShareToken.objects.filter(created_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_share_token(self, request):
        """Create a new share token for an asset"""
        serializer = CreateShareTokenSerializer(
            data=request.data, context={'request': request}
        )
        
        if serializer.is_valid():
            token = serializer.save()
            response_serializer = AssetShareTokenSerializer(
                token, context={'request': request}
            )
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def create_access_token(self, request):
        """Create a short-lived access token"""
        asset_id = request.data.get('asset_id')
        purpose = request.data.get('purpose', 'view')
        expires_in_minutes = request.data.get('expires_in_minutes', 15)
        
        try:
            asset = CreativeAsset.objects.get(id=asset_id)
            
            # Check if user has access to this asset
            if not self._can_access_asset(request.user, asset):
                return Response(
                    {'detail': 'You do not have permission to access this asset'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            token = AssetAccessToken.generate_token(
                asset, request.user, purpose, expires_in_minutes
            )
            
            serializer = AssetAccessTokenSerializer(token)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except CreativeAsset.DoesNotExist:
            return Response(
                {'detail': 'Asset not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """Revoke a token"""
        token = self.get_object()
        token.is_active = False
        token.save()
        
        return Response({'detail': 'Token revoked successfully'})
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get token usage analytics"""
        token = self.get_object()
        
        return Response({
            'use_count': token.use_count,
            'max_uses': token.max_uses,
            'is_active': token.is_active,
            'expires_at': token.expires_at,
            'created_at': token.created_at,
            'days_until_expiry': (token.expires_at - token.created_at.replace(tzinfo=token.expires_at.tzinfo)).days
        })
    
    def _can_access_asset(self, user, asset):
        """Check if user has permission to access the asset"""
        # Check if user is the creator
        if asset.created_by == user:
            return True
        
        # Check if user is project owner
        if asset.project.owner == user:
            return True
        
        # Check if user is project member
        if asset.project.members.filter(user=user).exists():
            return True
        
        return False


@method_decorator(csrf_exempt, name='dispatch')
class TokenAssetView:
    """View for serving assets via tokens"""
    
    def __init__(self):
        pass
    
    def dispatch(self, request, token):
        """Handle token-based asset access"""
        try:
            # Try share token first
            share_token = AssetShareToken.objects.filter(
                token=token, is_active=True
            ).first()
            
            if share_token:
                return self._serve_via_share_token(request, share_token)
            
            # Try access token
            access_token = AssetAccessToken.objects.filter(
                token=token
            ).first()
            
            if access_token:
                return self._serve_via_access_token(request, access_token)
            
            return HttpResponse(
                {'error': 'Invalid or expired token'},
                status=404,
                content_type='application/json'
            )
            
        except Exception as e:
            return HttpResponse(
                {'error': str(e)},
                status=500,
                content_type='application/json'
            )
    
    def _serve_via_share_token(self, request, share_token):
        """Serve asset via share token"""
        # Check if token is valid
        if not share_token.is_valid():
            return HttpResponse(
                {'error': 'Token expired or invalid'},
                status=403,
                content_type='application/json'
            )
        
        # Check domain restrictions
        if request.META.get('HTTP_HOST'):
            domain = request.META['HTTP_HOST'].split(':')[0]  # Remove port
            if not share_token.is_domain_allowed(domain):
                return HttpResponse(
                    {'error': 'Domain not allowed'},
                    status=403,
                    content_type='application/json'
                )
        
        # Check password protection
        if share_token.password:
            # For now, skip password check in this简化版本
            pass
        
        # Get the current version of the asset
        current_version = share_token.asset.versions.filter(is_current=True).first()
        if not current_version or not current_version.file:
            return HttpResponse(
                {'error': 'Asset file not found'},
                status=404,
                content_type='application/json'
            )
        
        # Increment use count
        share_token.increment_use()
        
        # Serve the file
        return self._serve_file(current_version.file.path)
    
    def _serve_via_access_token(self, request, access_token):
        """Serve asset via access token"""
        # Check if token is valid
        if not access_token.is_valid():
            return HttpResponse(
                {'error': 'Token expired'},
                status=403,
                content_type='application/json'
            )
        
        # Get the current version of the asset
        current_version = access_token.asset.versions.filter(is_current=True).first()
        if not current_version or not current_version.file:
            return HttpResponse(
                {'error': 'Asset file not found'},
                status=404,
                content_type='application/json'
            )
        
        # Serve the file
        return self._serve_file(current_version.file.path)
    
    def _serve_file(self, file_path):
        """Serve the actual file"""
        try:
            if not os.path.exists(file_path):
                raise Http404("File not found")
            
            # Get MIME type
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                mime_type = 'application/octet-stream'
            
            # Read file
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Create response
            response = HttpResponse(content, content_type=mime_type)
            response['Content-Length'] = len(content)
            response['Content-Disposition'] = f'inline; filename="{os.path.basename(file_path)}"'
            
            # Add CORS headers
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Headers'] = '*'
            
            return response
            
        except Exception as e:
            return HttpResponse(
                {'error': f'Error serving file: {str(e)}'},
                status=500,
                content_type='application/json'
            )


# Create a view instance
token_asset_view = TokenAssetView()

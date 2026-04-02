from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, CreativeAssetViewSet, FileVersionViewSet, FolderViewSet
from .token_views import AssetTokenViewSet, token_asset_view
from . import asset_serving
from . import simple_serve
from . import cors_free_serve
from . import base64_serve
from . import chrome_serve
from . import chrome_fixed_serve

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'assets', CreativeAssetViewSet, basename='asset')
router.register(r'versions', FileVersionViewSet, basename='version')
router.register(r'tokens', AssetTokenViewSet, basename='asset_token')
router.register(r'folders', FolderViewSet, basename='folder')

urlpatterns = [
    path('', include(router.urls)),
    # Token-based asset serving
    path('token/<str:token>', token_asset_view.dispatch, name='serve_asset_via_token'),
    # Chrome-fixed serving approach (no X-Frame-Options)
    path('media/<path:file_path>', chrome_fixed_serve.serve_asset_chrome_fixed, name='serve_asset_chrome_fixed'),
    # Other serving approaches for testing
    path('media-simple/<path:file_path>', simple_serve.serve_asset_simple, name='serve_asset_simple'),
    path('media-data/<path:file_path>', cors_free_serve.serve_asset_data_url, name='serve_asset_data_url'),
    path('media-base64/<path:file_path>', base64_serve.serve_asset_base64, name='serve_asset_base64'),
    path('media-info/<path:file_path>', base64_serve.serve_asset_info, name='serve_asset_info'),
    path('media-advanced/<path:file_path>', asset_serving.serve_asset, name='serve_asset'),
]

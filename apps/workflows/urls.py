from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkflowTemplateViewSet, ReviewCycleViewSet

router = DefaultRouter()
router.register(r'templates', WorkflowTemplateViewSet, basename='workflow-template')
router.register(r'review-cycles', ReviewCycleViewSet, basename='review-cycle')

urlpatterns = [
    path('', include(router.urls)),
]

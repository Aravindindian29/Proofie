from django.urls import path
from . import views

app_name = 'ai_engine'

urlpatterns = [
    path('summarize/', views.summarize_document, name='summarize'),
    path('compare/', views.compare_versions, name='compare'),
    path('analyze-content/', views.analyze_content, name='analyze_content'),
    path('analyses/', views.list_analyses, name='list_analyses'),
]

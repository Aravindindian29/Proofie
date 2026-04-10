from django.urls import path
from . import views

app_name = 'ai_engine'

urlpatterns = [
    path('summarize/', views.summarize_document, name='summarize'),
    path('compare/', views.compare_versions, name='compare'),
    path('analyze-content/', views.analyze_content, name='analyze_content'),
    path('analyses/', views.list_analyses, name='list_analyses'),
    path('test-jira/', views.test_jira_connection, name='test_jira'),
    path('jira-post/', views.post_to_jira, name='post_to_jira'),
    path('generate-tests/', views.generate_test_cases, name='generate_tests'),
    path('generate-tests-single/', views.generate_test_cases_single, name='generate_tests_single'),
]

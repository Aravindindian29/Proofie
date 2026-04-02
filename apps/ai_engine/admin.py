from django.contrib import admin
from .models import AIAnalysis, DiffAnalysis, JIRAIntegration, TestCaseGeneration


@admin.register(AIAnalysis)
class AIAnalysisAdmin(admin.ModelAdmin):
    list_display = ['id', 'analysis_type', 'asset', 'version', 'cpi_id', 'created_by', 'created_at', 'tokens_used']
    list_filter = ['analysis_type', 'created_at']
    search_fields = ['asset__name', 'cpi_id', 'created_by__username']
    readonly_fields = ['created_at', 'tokens_used', 'processing_time']
    date_hierarchy = 'created_at'


@admin.register(DiffAnalysis)
class DiffAnalysisAdmin(admin.ModelAdmin):
    list_display = ['id', 'as_is_version', 'to_be_version', 'changes_count', 'severity_score', 'created_at']
    list_filter = ['created_at', 'severity_score']
    search_fields = ['as_is_version__asset__name', 'to_be_version__asset__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(JIRAIntegration)
class JIRAIntegrationAdmin(admin.ModelAdmin):
    list_display = ['id', 'cpi_id', 'jira_ticket_key', 'summary_posted', 'test_cases_attached', 'created_at']
    list_filter = ['summary_posted', 'test_cases_attached', 'created_at']
    search_fields = ['cpi_id', 'jira_ticket_key', 'asset__name']
    readonly_fields = ['last_sync_at', 'created_at']
    date_hierarchy = 'created_at'


@admin.register(TestCaseGeneration)
class TestCaseGenerationAdmin(admin.ModelAdmin):
    list_display = ['id', 'diff_analysis', 'created_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['diff_analysis__as_is_version__asset__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'

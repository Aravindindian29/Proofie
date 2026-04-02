from rest_framework import serializers
from .models import AIAnalysis, DiffAnalysis, JIRAIntegration, TestCaseGeneration


class AIAnalysisSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    version_number = serializers.IntegerField(source='version.version_number', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = AIAnalysis
        fields = [
            'id', 'asset', 'asset_name', 'version', 'version_number',
            'analysis_type', 'result', 'cpi_id', 'created_by',
            'created_by_username', 'created_at', 'tokens_used', 'processing_time'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']


class DiffAnalysisSerializer(serializers.ModelSerializer):
    as_is_version_number = serializers.IntegerField(source='as_is_version.version_number', read_only=True)
    to_be_version_number = serializers.IntegerField(source='to_be_version.version_number', read_only=True)
    
    class Meta:
        model = DiffAnalysis
        fields = [
            'id', 'as_is_version', 'as_is_version_number',
            'to_be_version', 'to_be_version_number', 'diff_summary',
            'changes_count', 'pages_affected', 'severity_score',
            'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class JIRAIntegrationSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    
    class Meta:
        model = JIRAIntegration
        fields = [
            'id', 'asset', 'asset_name', 'cpi_id', 'jira_ticket_key',
            'jira_comment_id', 'summary_posted', 'test_cases_attached',
            'last_sync_at', 'created_at'
        ]
        read_only_fields = ['id', 'last_sync_at', 'created_at']


class TestCaseGenerationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestCaseGeneration
        fields = [
            'id', 'diff_analysis', 'test_cases', 'excel_file',
            'jira_attachment_id', 'created_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SummarizeRequestSerializer(serializers.Serializer):
    version_id = serializers.UUIDField(required=True)
    detail_level = serializers.ChoiceField(choices=['brief', 'detailed'], default='brief')


class CompareRequestSerializer(serializers.Serializer):
    as_is_version_id = serializers.UUIDField(required=True)
    to_be_version_id = serializers.UUIDField(required=True)


class AnalyzeContentRequestSerializer(serializers.Serializer):
    version_id = serializers.UUIDField(required=True)
    analysis_types = serializers.ListField(
        child=serializers.ChoiceField(choices=['language', 'compliance', 'formatting']),
        default=['language', 'compliance']
    )


class JIRASyncRequestSerializer(serializers.Serializer):
    version_id = serializers.UUIDField(required=True)
    cpi_id = serializers.CharField(required=False, allow_blank=True)
    action = serializers.ChoiceField(choices=['post_summary', 'attach_test_cases'], default='post_summary')


class GenerateTestCasesRequestSerializer(serializers.Serializer):
    diff_analysis_id = serializers.IntegerField(required=True)
    include_regression = serializers.BooleanField(default=True)
    attach_to_jira = serializers.BooleanField(default=False)

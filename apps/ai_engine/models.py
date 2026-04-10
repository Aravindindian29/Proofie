from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class AIAnalysis(models.Model):
    """Stores AI analysis results for caching and history"""
    ANALYSIS_TYPES = [
        ('summary', 'Document Summary'),
        ('diff', 'Version Diff'),
        ('content_analysis', 'Content Analysis'),
        ('test_cases', 'Test Cases'),
    ]
    
    asset = models.ForeignKey('versioning.CreativeAsset', on_delete=models.CASCADE, related_name='ai_analyses')
    version = models.ForeignKey('versioning.FileVersion', on_delete=models.CASCADE, related_name='ai_analyses')
    analysis_type = models.CharField(max_length=20, choices=ANALYSIS_TYPES)
    result = models.JSONField()
    cpi_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    tokens_used = models.IntegerField(default=0)
    processing_time = models.FloatField(default=0.0)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['asset', 'analysis_type']),
            models.Index(fields=['cpi_id']),
        ]
    
    def __str__(self):
        return f"{self.analysis_type} - {self.asset.name} (v{self.version.version_number})"


class DiffAnalysis(models.Model):
    """Stores comparison results between AS-IS and TO-BE versions"""
    as_is_version = models.ForeignKey('versioning.FileVersion', on_delete=models.CASCADE, related_name='as_is_diffs')
    to_be_version = models.ForeignKey('versioning.FileVersion', on_delete=models.CASCADE, related_name='to_be_diffs')
    diff_summary = models.JSONField()
    changes_count = models.IntegerField(default=0)
    pages_affected = models.JSONField(default=list)
    severity_score = models.FloatField(default=0.0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['as_is_version', 'to_be_version']
    
    def __str__(self):
        return f"Diff: v{self.as_is_version.version_number} -> v{self.to_be_version.version_number}"


class JIRAIntegration(models.Model):
    """Tracks JIRA ticket interactions"""
    asset = models.ForeignKey('versioning.CreativeAsset', on_delete=models.CASCADE, related_name='jira_integrations')
    cpi_id = models.CharField(max_length=100, db_index=True)
    jira_ticket_key = models.CharField(max_length=50)
    jira_comment_id = models.CharField(max_length=100, blank=True)
    summary_posted = models.BooleanField(default=False)
    test_cases_attached = models.BooleanField(default=False)
    last_sync_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['cpi_id']),
            models.Index(fields=['jira_ticket_key']),
        ]
    
    def __str__(self):
        return f"{self.cpi_id} -> {self.jira_ticket_key}"


class TestCaseGeneration(models.Model):
    """Stores generated test cases"""
    diff_analysis = models.ForeignKey(DiffAnalysis, on_delete=models.CASCADE, related_name='test_cases', null=True, blank=True)
    version = models.ForeignKey('versioning.FileVersion', on_delete=models.CASCADE, related_name='test_cases', null=True, blank=True)
    test_cases = models.JSONField()
    excel_file = models.FileField(upload_to='test_cases/%Y/%m/%d/', blank=True, null=True)
    jira_attachment_id = models.CharField(max_length=100, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        if self.diff_analysis:
            return f"Test Cases for {self.diff_analysis}"
        elif self.version:
            return f"Test Cases for v{self.version.version_number}"
        return f"Test Cases #{self.id}"

from django.db import models
from django.contrib.auth.models import User
from apps.versioning.models import FileVersion


class Annotation(models.Model):
    ANNOTATION_TYPES = [
        ('comment', 'Comment'),
        ('highlight', 'Highlight'),
        ('shape', 'Shape'),
    ]

    version = models.ForeignKey(FileVersion, on_delete=models.CASCADE, related_name='annotations')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    annotation_type = models.CharField(max_length=20, choices=ANNOTATION_TYPES, default='comment')
    
    x_coordinate = models.FloatField()
    y_coordinate = models.FloatField()
    
    page_number = models.PositiveIntegerField(default=1)
    
    content = models.TextField()
    color = models.CharField(max_length=7, default='#FF0000')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_annotations')

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['version', 'created_at']),
            models.Index(fields=['author', 'created_at']),
        ]

    def __str__(self):
        return f"Annotation by {self.author.username} on {self.version}"


class AnnotationReply(models.Model):
    annotation = models.ForeignKey(Annotation, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Reply by {self.author.username}"


class AnnotationMention(models.Model):
    annotation = models.ForeignKey(Annotation, on_delete=models.CASCADE, related_name='mentions')
    mentioned_user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('annotation', 'mentioned_user')

    def __str__(self):
        return f"Mention of {self.mentioned_user.username}"

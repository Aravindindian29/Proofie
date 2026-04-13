"""
Clear cached AI summaries to force regeneration with vision
Run this script to clear all cached summaries
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.ai_engine.models import AIAnalysis

# Delete all cached summaries
deleted_count = AIAnalysis.objects.filter(analysis_type='summary').delete()
print(f"Deleted {deleted_count[0]} cached summaries")
print("All summaries will now be regenerated with vision on next request!")

#!/usr/bin/env python3
"""
Test script to verify the updated document summarization prompts
"""

import os
import sys
import django

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.ai_engine.services.ai_provider import AnthropicProvider, OpenAIProvider

def test_prompt_generation():
    """Test that the updated prompts generate correctly"""
    
    # Sample document text for testing
    sample_text = """
    PROJECT UPDATE: Mobile Banking Enhancement v2.1
    
    Overview:
    This document outlines the changes for the mobile banking application enhancement 
    version 2.1, focusing on improving user experience and adding new features.
    
    Changes Included:
    1. Updated login page with biometric authentication
    2. New dashboard layout with personalized widgets
    3. Enhanced transaction history with filtering options
    
    Channels Affected:
    - Mobile application (iOS and Android)
    - Web banking portal (synchronization features)
    
    Application Pages with Changes:
    - Login page: Added fingerprint and face recognition
    - Dashboard: Redesigned with customizable widgets
    - Transaction history: Added advanced filtering
    
    A/B Testing:
    We will conduct A/B testing on the new dashboard layout with 30% of users
    receiving the new design initially.
    
    New Email Templates:
    - Welcome email for new biometric authentication setup
    - Monthly summary email with new dashboard features
    
    Disclosures:
    - Updated privacy policy for biometric data collection
    - New terms for A/B testing participation
    """
    
    print("Testing Updated Document Summarization Prompts")
    print("=" * 50)
    
    # Test AnthropicProvider
    print("\n1. Testing AnthropicProvider:")
    try:
        anthropic_provider = AnthropicProvider("test_key")
        
        # Test detailed prompt
        detailed_prompt = anthropic_provider._build_summary_prompt(sample_text, 'detailed')
        print("   - Detailed prompt generated successfully")
        print(f"   - Prompt length: {len(detailed_prompt)} characters")
        
        # Check if prompt contains required elements
        required_elements = [
            "high_level_summary",
            "changes_included", 
            "application_pages_with_changes",
            "ab_testing_included",
            "new_email_templates",
            "disclosures"
        ]
        
        for element in required_elements:
            if element in detailed_prompt:
                print(f"   - Contains {element}: YES")
            else:
                print(f"   - Contains {element}: NO")
        
        # Test brief prompt
        brief_prompt = anthropic_provider._build_summary_prompt(sample_text, 'brief')
        print("   - Brief prompt generated successfully")
        print(f"   - Prompt length: {len(brief_prompt)} characters")
        
    except Exception as e:
        print(f"   - Error: {e}")
    
    # Test OpenAIProvider
    print("\n2. Testing OpenAIProvider:")
    try:
        openai_provider = OpenAIProvider("test_key")
        
        # Test detailed prompt
        detailed_prompt = openai_provider._build_summary_prompt(sample_text, 'detailed')
        print("   - Detailed prompt generated successfully")
        print(f"   - Prompt length: {len(detailed_prompt)} characters")
        
        # Check if prompt contains required elements
        for element in required_elements:
            if element in detailed_prompt:
                print(f"   - Contains {element}: YES")
            else:
                print(f"   - Contains {element}: NO")
        
        # Test brief prompt
        brief_prompt = openai_provider._build_summary_prompt(sample_text, 'brief')
        print("   - Brief prompt generated successfully")
        print(f"   - Prompt length: {len(brief_prompt)} characters")
        
    except Exception as e:
        print(f"   - Error: {e}")
    
    print("\n" + "=" * 50)
    print("Test completed!")
    
    # Show a sample of the detailed prompt structure
    print("\n3. Sample Detailed Prompt Structure:")
    print("-" * 30)
    try:
        sample_prompt = anthropic_provider._build_summary_prompt(sample_text, 'detailed')
        # Extract the JSON structure part
        json_start = sample_prompt.find('{')
        json_end = sample_prompt.rfind('}') + 1
        if json_start != -1 and json_end != -1:
            json_structure = sample_prompt[json_start:json_end]
            print("JSON Structure:")
            print(json_structure[:500] + "..." if len(json_structure) > 500 else json_structure)
    except Exception as e:
        print(f"Error showing sample structure: {e}")

if __name__ == "__main__":
    test_prompt_generation()

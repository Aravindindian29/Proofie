import logging
import time
from abc import ABC, abstractmethod
from django.conf import settings
import random

logger = logging.getLogger(__name__)


class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    def __init__(self, api_key):
        self.api_key = api_key
    
    @abstractmethod
    def summarize_text(self, text, detail_level='brief'):
        """Generate document summary"""
        pass
    
    @abstractmethod
    def analyze_diff(self, old_text, new_text):
        """Analyze differences between versions"""
        pass
    
    @abstractmethod
    def analyze_content(self, text, analysis_types):
        """Analyze content for language and compliance"""
        pass
    
    @abstractmethod
    def generate_test_cases(self, diff_data):
        """Generate test cases from diff analysis"""
        pass


class AnthropicProvider(AIProvider):
    """Anthropic Claude implementation"""
    
    def __init__(self, api_key):
        super().__init__(api_key)
        try:
            import anthropic
            self.client = anthropic.Anthropic(api_key=api_key)
            self.model = "claude-3-5-sonnet-20241022"
        except ImportError:
            logger.error("Anthropic library not installed. Run: pip install anthropic")
            raise
    
    def summarize_text(self, text, detail_level='brief'):
        """Generate AI-powered document summary using Claude"""
        start_time = time.time()
        
        try:
            max_chars = 12000 if detail_level == 'detailed' else 8000
            if len(text) > max_chars:
                text = text[:max_chars] + "...\n[Content truncated]"
            
            prompt = self._build_summary_prompt(text, detail_level)
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500 if detail_level == 'detailed' else 800,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            result = response.content[0].text
            tokens_used = response.usage.input_tokens + response.usage.output_tokens
            processing_time = time.time() - start_time
            
            summary_data = self._parse_summary_response(result)
            
            return {
                'summary': summary_data,
                'tokens_used': tokens_used,
                'processing_time': processing_time
            }
        except Exception as e:
            logger.error(f"Error in Claude summarization: {e}")
            raise
    
    def analyze_diff(self, old_text, new_text):
        """Analyze differences using Claude"""
        start_time = time.time()
        
        try:
            prompt = f"""Compare these two document versions and identify all changes:

AS-IS Version:
{old_text[:6000]}

TO-BE Version:
{new_text[:6000]}

Provide a JSON response with:
{{
    "total_changes": number,
    "changes": [
        {{
            "type": "text_modified/text_added/text_deleted",
            "section": "Section name",
            "old_text": "Original text",
            "new_text": "Modified text",
            "severity": "high/medium/low",
            "description": "Brief description of change"
        }}
    ],
    "summary": "Overall summary of changes",
    "severity_score": 0-10
}}"""
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            result = response.content[0].text
            tokens_used = response.usage.input_tokens + response.usage.output_tokens
            processing_time = time.time() - start_time
            
            diff_data = self._parse_summary_response(result)
            
            return {
                'diff_summary': diff_data,
                'tokens_used': tokens_used,
                'processing_time': processing_time
            }
        except Exception as e:
            logger.error(f"Error in Claude diff analysis: {e}")
            raise
    
    def analyze_content(self, text, analysis_types):
        """Analyze content using Claude"""
        start_time = time.time()
        
        try:
            analysis_prompts = {
                'language': "Analyze the language and suggest improvements for clarity and professionalism.",
                'compliance': "Check for legal and compliance issues (GDPR, contract requirements, etc.).",
                'formatting': "Review formatting and structure for consistency."
            }
            
            selected_analyses = [analysis_prompts.get(t, '') for t in analysis_types if t in analysis_prompts]
            analysis_instructions = '\n'.join(selected_analyses)
            
            prompt = f"""Analyze the following document content:

{text[:8000]}

{analysis_instructions}

Provide a JSON response with:
{{
    "language_suggestions": [
        {{
            "severity": "high/medium/low",
            "current": "Current text",
            "suggested": "Improved text",
            "reason": "Why this change is recommended"
        }}
    ],
    "compliance_issues": [
        {{
            "severity": "high/medium/low",
            "issue": "Description of issue",
            "suggested_action": "Recommended action"
        }}
    ],
    "formatting_recommendations": ["List of formatting suggestions"]
}}"""
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}]
            )
            
            result = response.content[0].text
            tokens_used = response.usage.input_tokens + response.usage.output_tokens
            processing_time = time.time() - start_time
            
            analysis_data = self._parse_summary_response(result)
            
            return {
                'analysis': analysis_data,
                'tokens_used': tokens_used,
                'processing_time': processing_time
            }
        except Exception as e:
            logger.error(f"Error in Claude content analysis: {e}")
            raise
    
    def generate_test_cases(self, diff_data):
        """Generate test cases using Claude"""
        start_time = time.time()
        
        try:
            changes_text = "\n".join([
                f"- {change.get('description', change.get('type', 'Change'))}"
                for change in diff_data.get('changes', [])
            ])
            
            prompt = f"""Based on the following document changes, generate comprehensive test cases:

Changes:
{changes_text}

Generate test cases in JSON format:
{{
    "test_cases": [
        {{
            "test_case_id": "TC001",
            "title": "Test case title",
            "description": "What this test validates",
            "preconditions": "Prerequisites",
            "steps": ["Step 1", "Step 2", "Step 3"],
            "expected_result": "Expected outcome",
            "priority": "high/medium/low",
            "type": "functional/regression/smoke"
        }}
    ]
}}

Generate at least 3-5 test cases covering the major changes."""
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            result = response.content[0].text
            tokens_used = response.usage.input_tokens + response.usage.output_tokens
            processing_time = time.time() - start_time
            
            test_data = self._parse_summary_response(result)
            
            return {
                'test_cases': test_data.get('test_cases', []),
                'tokens_used': tokens_used,
                'processing_time': processing_time
            }
        except Exception as e:
            logger.error(f"Error generating test cases with Claude: {e}")
            raise
    
    def _build_summary_prompt(self, text, detail_level):
        """Build prompt for document summarization"""
        if detail_level == 'detailed':
            return f"""Analyze the following document and provide a detailed summary in JSON format:

Document Content:
{text}

Provide a JSON response with the following structure:
{{
    "title": "Document title or main subject",
    "type": "Document type (Contract, Agreement, Specification, etc.)",
    "pages": "Estimated number of pages",
    "key_highlights": ["List of 4-6 key points"],
    "sections": [
        {{"name": "Section name", "summary": "Brief summary"}}
    ],
    "complexity": "low/medium/high",
    "estimated_review_time": "Estimated time to review",
    "main_parties": ["List of parties involved if applicable"],
    "important_dates": ["Any critical dates mentioned"],
    "action_items": ["Any action items or requirements"]
}}"""
        else:
            return f"""Analyze the following document and provide a brief summary in JSON format:

Document Content:
{text}

Provide a JSON response with the following structure:
{{
    "title": "Document title",
    "type": "Document type",
    "key_highlights": ["3-4 main points"],
    "complexity": "low/medium/high",
    "estimated_review_time": "Estimated time"
}}"""
    
    def _parse_summary_response(self, response_text):
        """Parse AI response into structured data"""
        import json
        import re
        
        try:
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                return {
                    'title': 'Document Summary',
                    'type': 'Unknown',
                    'key_highlights': [response_text],
                    'complexity': 'medium',
                    'estimated_review_time': '15-20 minutes'
                }
        except json.JSONDecodeError:
            logger.warning("Failed to parse AI response as JSON")
            return {
                'title': 'Document Summary',
                'raw_summary': response_text,
                'complexity': 'medium'
            }


class OpenAIProvider(AIProvider):
    """OpenAI GPT-3.5-turbo implementation"""
    
    def __init__(self, api_key):
        super().__init__(api_key)
        try:
            import openai
            self.client = openai.OpenAI(api_key=api_key)
            self.model = "gpt-3.5-turbo"  # Using GPT-3.5-turbo (available on all accounts)
        except ImportError:
            logger.error("OpenAI library not installed. Run: pip install openai")
            raise
    
    def summarize_text(self, text, detail_level='brief'):
        """Generate AI-powered document summary"""
        start_time = time.time()
        
        try:
            # Truncate text if too long (GPT-4 has token limits)
            max_chars = 12000 if detail_level == 'detailed' else 8000
            if len(text) > max_chars:
                text = text[:max_chars] + "...\n[Content truncated]"
            
            prompt = self._build_summary_prompt(text, detail_level)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert document analyst specializing in contract and specification review."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1500 if detail_level == 'detailed' else 800
            )
            
            result = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            processing_time = time.time() - start_time
            
            # Parse the AI response into structured format
            summary_data = self._parse_summary_response(result)
            
            return {
                'summary': summary_data,
                'tokens_used': tokens_used,
                'processing_time': processing_time
            }
        except Exception as e:
            logger.error(f"Error in OpenAI summarization: {e}")
            raise
    
    def _build_summary_prompt(self, text, detail_level):
        """Build prompt for document summarization"""
        if detail_level == 'detailed':
            return f"""Analyze the following document and provide a detailed summary in JSON format:

Document Content:
{text}

Provide a JSON response with the following structure:
{{
    "title": "Document title or main subject",
    "type": "Document type (Contract, Agreement, Specification, etc.)",
    "pages": "Estimated number of pages",
    "key_highlights": ["List of 4-6 key points"],
    "sections": [
        {{"name": "Section name", "summary": "Brief summary"}}
    ],
    "complexity": "low/medium/high",
    "estimated_review_time": "Estimated time to review",
    "main_parties": ["List of parties involved if applicable"],
    "important_dates": ["Any critical dates mentioned"],
    "action_items": ["Any action items or requirements"]
}}"""
        else:
            return f"""Analyze the following document and provide a brief summary in JSON format:

Document Content:
{text}

Provide a JSON response with the following structure:
{{
    "title": "Document title",
    "type": "Document type",
    "key_highlights": ["3-4 main points"],
    "complexity": "low/medium/high",
    "estimated_review_time": "Estimated time"
}}"""
    
    def _parse_summary_response(self, response_text):
        """Parse AI response into structured data"""
        import json
        import re
        
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                # Fallback: return raw text
                return {
                    'title': 'Document Summary',
                    'type': 'Unknown',
                    'key_highlights': [response_text],
                    'complexity': 'medium',
                    'estimated_review_time': '15-20 minutes'
                }
        except json.JSONDecodeError:
            logger.warning("Failed to parse AI response as JSON")
            return {
                'title': 'Document Summary',
                'raw_summary': response_text,
                'complexity': 'medium'
            }
    
    def analyze_diff(self, old_text, new_text):
        """Analyze differences between two versions"""
        start_time = time.time()
        
        try:
            prompt = f"""Compare these two document versions and identify all changes:

AS-IS Version:
{old_text[:6000]}

TO-BE Version:
{new_text[:6000]}

Provide a JSON response with:
{{
    "total_changes": number,
    "changes": [
        {{
            "type": "text_modified/text_added/text_deleted",
            "section": "Section name",
            "old_text": "Original text",
            "new_text": "Modified text",
            "severity": "high/medium/low",
            "description": "Brief description of change"
        }}
    ],
    "summary": "Overall summary of changes",
    "severity_score": 0-10
}}"""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert at document comparison and change analysis."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=2000
            )
            
            result = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            processing_time = time.time() - start_time
            
            diff_data = self._parse_summary_response(result)
            
            return {
                'diff_summary': diff_data,
                'tokens_used': tokens_used,
                'processing_time': processing_time
            }
        except Exception as e:
            logger.error(f"Error in diff analysis: {e}")
            raise
    
    def analyze_content(self, text, analysis_types):
        """Analyze content for UI changes, copy changes, CTA changes, and compliance issues"""
        start_time = time.time()
        
        try:
            prompt = f"""You are an expert UX reviewer + compliance analyst.

Analyze the document and classify ALL changes and risks.

Document:
{text[:8000]}

Return STRICT JSON ONLY:

{{
  "ui_changes": [
    {{"change": "", "impact": "low|medium|high"}}
  ],
  "copy_changes": [
    {{"original": "", "improved": "", "reason": ""}}
  ],
  "cta_changes": [
    {{"before": "", "after": "", "impact": ""}}
  ],
  "compliance_issues": [
    {{"issue": "", "severity": "high|medium|low", "fix": ""}}
  ],
  "risk_flags": [
    {{"risk": "", "severity": "high|medium|low"}}
  ],
  "summary": "Overall assessment"
}}

Rules:
- Always return valid JSON
- Do not include explanations outside JSON
- If nothing found, return empty arrays"""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert UX reviewer and compliance analyst. Analyze documents for UI changes, copy improvements, CTA updates, and compliance issues. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=1500
            )
            
            result = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            processing_time = time.time() - start_time
            
            logger.info(f"Raw OpenAI response: {result}")
            
            # Improved JSON parsing
            import json
            try:
                analysis_data = json.loads(result)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON from OpenAI response: {result}")
                # Fallback: try to extract JSON from response
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    try:
                        analysis_data = json.loads(json_match.group(0))
                    except json.JSONDecodeError:
                        logger.error("Failed to parse extracted JSON")
                        analysis_data = {
                            "ui_changes": [],
                            "copy_changes": [],
                            "cta_changes": [],
                            "compliance_issues": [],
                            "risk_flags": [],
                            "summary": "Failed to parse AI response"
                        }
                else:
                    analysis_data = {
                        "ui_changes": [],
                        "copy_changes": [],
                        "cta_changes": [],
                        "compliance_issues": [],
                        "risk_flags": [],
                        "summary": "No valid JSON found in response"
                    }
            
            return {
                'analysis': analysis_data,
                'tokens_used': tokens_used,
                'processing_time': processing_time
            }
        except Exception as e:
            logger.error(f"Error in content analysis: {e}")
            raise
    
    def generate_test_cases(self, diff_data):
        """Generate test cases based on diff analysis"""
        start_time = time.time()
        
        try:
            changes_text = "\n".join([
                f"- {change.get('description', change.get('type', 'Change'))}"
                for change in diff_data.get('changes', [])
            ])
            
            prompt = f"""Based on the following document changes, generate comprehensive test cases:

Changes:
{changes_text}

Generate test cases in JSON format:
{{
    "test_cases": [
        {{
            "test_case_id": "TC001",
            "title": "Test case title",
            "description": "What this test validates",
            "preconditions": "Prerequisites",
            "steps": ["Step 1", "Step 2", "Step 3"],
            "expected_result": "Expected outcome",
            "priority": "high/medium/low",
            "type": "functional/regression/smoke"
        }}
    ]
}}

Generate at least 3-5 test cases covering the major changes."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert QA engineer specializing in test case design."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=2000
            )
            
            result = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            processing_time = time.time() - start_time
            
            test_data = self._parse_summary_response(result)
            
            return {
                'test_cases': test_data.get('test_cases', []),
                'tokens_used': tokens_used,
                'processing_time': processing_time
            }
        except Exception as e:
            logger.error(f"Error generating test cases: {e}")
            raise

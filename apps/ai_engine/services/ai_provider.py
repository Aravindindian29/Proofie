import logging
import time
from abc import ABC, abstractmethod
from django.conf import settings
import random
from .product_context import get_product_context

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
    
    def generate_test_cases(self, diff_data, as_is_text="", to_be_text=""):
        """Generate test cases using Claude with full PDF content analysis"""
        start_time = time.time()
        product_context = get_product_context()
        
        try:
            changes_text = "\n".join([
                f"- {change.get('description', change.get('type', 'Change'))}"
                for change in diff_data.get('changes', [])
            ])
            
            # Include full PDF text for detailed analysis
            pdf_context = ""
            if as_is_text and to_be_text:
                pdf_context = f"""
AS-IS DOCUMENT CONTENT (Current State):
{as_is_text[:3000]}...

TO-BE DOCUMENT CONTENT (Future State):
{to_be_text[:3000]}...
"""
            
            prompt = f"""You are a QA expert for the Personify lending platform. Analyze the ACTUAL PDF CONTENT thoroughly to generate EXHAUSTIVE and SPECIFIC test cases.

{product_context}

{pdf_context}

CRITICAL INSTRUCTIONS:
1. READ THE ACTUAL PDF CONTENT ABOVE - Look for specific page names, field names, button labels, messaging, URLs, and visual elements
2. Identify AS-IS (current state) and TO-BE (future state) screens from the actual content
3. Pay special attention to areas marked with RED ARROWS, highlights, or annotations in TO-BE screens
4. Look for specific details like:
   - Exact page names (e.g., "RF-1", "RF-2", "RF-3", "RF-4")
   - Specific messaging changes (e.g., "Extra Cash" vs old messaging)
   - URL redirects and routing changes
   - Form field changes (SSN, email, phone number formats)
   - A/B test variants and traffic splits (e.g., 50/50, 60/40)
   - Email template names and content
   - Disclosure text changes
   - Button label changes (e.g., "Apply Now" vs "Get Started")

Changes Summary:
{changes_text}

For EACH specific change found in the PDF, create detailed test scenarios covering:
   - Happy path flows for each affected channel
   - Regression testing for existing functionality
   - Edge cases and negative scenarios
   - Channel-specific variations (ORG, RF, RA, PS, affiliates)
   - Originator-specific differences (ADF vs FEB)
   - Application page-specific flows

Generate test cases in JSON format with Excel-ready structure (ID | Scenario | Steps | Expected | Priority | Type):
{{
    "test_cases": [
        {{
            "id": "TC001",
            "scenario": "Detailed test scenario description",
            "steps": "Step 1\\nStep 2\\nStep 3\\nStep 4",
            "expected": "Expected outcome with specific validation points",
            "priority": "high/medium/low",
            "type": "functional/regression/smoke"
        }}
    ],
    "qa_validation_scope": [
        "Happy path flow for ORG channel - Landing Page to E-Sign",
        "Regression testing for RF channel - Offer page validation",
        "Focus on Disclosures page - ADF vs FEB originator differences",
        "A/B test validation - 50/50 traffic split on Landing Page variant A vs B",
        "Email template rendering - New template for RF channel",
        "Bank Data page - ACH payment flow validation",
        "Repayment page - Send check by mail option for PS channel",
        "Plaid integration - Third-party loan data fetch for RA channel"
    ]
}}

EXAMPLE TEST CASES (use as reference for specificity):
{{
    "id": "TC001",
    "scenario": "Validate 'Extra Cash' messaging consistency across LP, Email, and BP",
    "steps": "1. Navigate to Landing Page\\n2. Check header and CTA messaging\\n3. Open Email template\\n4. Verify messaging matches LP\\n5. Login to Borrower Portal\\n6. Verify popup messaging",
    "expected": "All three touchpoints display consistent 'Extra Cash' messaging with same tone and value proposition",
    "priority": "high",
    "type": "functional"
}}

{{
    "id": "TC002",
    "scenario": "Validate RF-1 and RF-2 redirection to RF-3/RF-4",
    "steps": "1. Clear browser cache\\n2. Navigate to old RF-1 URL\\n3. Observe redirect behavior\\n4. Verify landing on RF-3 or RF-4\\n5. Repeat for RF-2 URL",
    "expected": "RF-1 and RF-2 URLs automatically redirect to RF-3 or RF-4 with 301 redirect status",
    "priority": "high",
    "type": "regression"
}}

CRITICAL REQUIREMENTS: 
- Generate at least 15-20 EXHAUSTIVE test cases based on ACTUAL PDF CONTENT
- Each test case must reference SPECIFIC elements from the PDF (page names, field names, messaging, URLs)
- Include test cases for: redirects, A/B tests, messaging changes, form validations, email templates, disclosure updates
- QA Validation Scope should focus ONLY on: which channels need happy path, which need regression, which application pages to focus on
- DO NOT include generic items like GDPR, accessibility standards, protocols, cross-browser compatibility
- Be specific about channel names (ORG, RF, RA, PS, CMPQ, etc.) and page names (Landing, Mini App, Disclosures, Offer, Bank Data, Repayment, Plaid, E-Sign)
- Use the EXACT terminology and names found in the PDF content"""
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            
            result = response.content[0].text
            tokens_used = response.usage.input_tokens + response.usage.output_tokens
            processing_time = time.time() - start_time
            
            test_data = self._parse_summary_response(result)
            
            return {
                'test_cases': test_data.get('test_cases', []),
                'qa_validation_scope': test_data.get('qa_validation_scope', []),
                'tokens_used': tokens_used,
                'processing_time': processing_time
            }
        except Exception as e:
            logger.error(f"Error generating test cases with Claude: {e}")
            raise
    
    def _build_summary_prompt(self, text, detail_level):
        """Build prompt for document summarization"""
        product_context = get_product_context()
        
        if detail_level == 'detailed':
            return f"""You are an expert document analyst specializing in lending platform documentation and technical specifications.

{product_context}

Document Content:
{text}

Analyze this document in the context of the Personify lending platform. Focus on extracting the following specific information:
1. High-level summary of the document (what is the initiative/change about?)
2. Changes included and which channels they affect (ORG, RF, RA, PS, or affiliate channels: CMPQ, CKPQ, QS, LT, CMACT, ML, MO)
3. Which application pages have changes (Landing Page, Mini Application, Disclosures, Offer, Bank Data, Repayment, Plaid, E-Sign, Reject, IDology, Pend pages)
4. Whether A/B testing is included (describe the test details, traffic split, variants)
5. New email templates to be designed (note if there are originator-specific differences for ADF/FEB)
6. Disclosures added or modified (especially origination fee disclosures, APR rules, legal disclaimers)

Provide a JSON response with the following structure:
{{
    "high_level_summary": "Brief overview of the document's purpose and main content",
    "changes_included": [
        {{
            "description": "Description of the change",
            "affected_channels": ["List of channels affected (e.g., web, mobile, email, etc.)"],
            "impact_level": "low/medium/high"
        }}
    ],
    "application_pages_with_changes": [
        {{
            "page_name": "Name of the application page",
            "change_type": "UI/UX, functionality, content, etc.",
            "description": "Brief description of changes on this page"
        }}
    ],
    "ab_testing_included": {{
        "has_ab_testing": true/false,
        "test_details": "Description of A/B test if present, otherwise null"
    }},
    "new_email_templates": [
        {{
            "template_name": "Name or purpose of the email template",
            "purpose": "What this template is used for",
            "key_content": "Main content or purpose of the template"
        }}
    ],
    "disclosures": [
        {{
            "type": "new/modified",
            "disclosure_text": "The disclosure content",
            "location": "Where this disclosure appears",
            "importance": "low/medium/high"
        }}
    ],
    "additional_highlights": ["Other important points not captured above"],
    "complexity": "low/medium/high",
    "estimated_review_time": "Estimated time for thorough review"
}}"""
        else:
            return f"""You are an expert document analyst. Analyze the following document and provide a brief summary focusing on key business and technical changes in JSON format:

Document Content:
{text}

Provide a JSON response with the following structure:
{{
    "high_level_summary": "Brief overview of the document's purpose",
    "key_changes": ["Main changes described in the document"],
    "affected_channels": ["Channels impacted by changes"],
    "pages_affected": ["Application pages with changes"],
    "has_ab_testing": true/false,
    "new_email_templates": ["Brief description of new email templates"],
    "disclosures_updated": true/false,
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
        product_context = get_product_context()
        
        if detail_level == 'detailed':
            return f"""You are an expert document analyst specializing in lending platform documentation and technical specifications.

{product_context}

Document Content:
{text}

Analyze this document in the context of the Personify lending platform. Focus on extracting the following specific information:
1. High-level summary of the document (what is the initiative/change about?)
2. Changes included and which channels they affect (ORG, RF, RA, PS, or affiliate channels: CMPQ, CKPQ, QS, LT, CMACT, ML, MO)
3. Which application pages have changes (Landing Page, Mini Application, Disclosures, Offer, Bank Data, Repayment, Plaid, E-Sign, Reject, IDology, Pend pages)
4. Whether A/B testing is included (describe the test details, traffic split, variants)
5. New email templates to be designed (note if there are originator-specific differences for ADF/FEB)
6. Disclosures added or modified (especially origination fee disclosures, APR rules, legal disclaimers)

Provide a JSON response with the following structure:
{{
    "high_level_summary": "Brief overview of the document's purpose and main content",
    "changes_included": [
        {{
            "description": "Description of the change",
            "affected_channels": ["List of channels affected (e.g., web, mobile, email, etc.)"],
            "impact_level": "low/medium/high"
        }}
    ],
    "application_pages_with_changes": [
        {{
            "page_name": "Name of the application page",
            "change_type": "UI/UX, functionality, content, etc.",
            "description": "Brief description of changes on this page"
        }}
    ],
    "ab_testing_included": {{
        "has_ab_testing": true/false,
        "test_details": "Description of A/B test if present, otherwise null"
    }},
    "new_email_templates": [
        {{
            "template_name": "Name or purpose of the email template",
            "purpose": "What this template is used for",
            "key_content": "Main content or purpose of the template"
        }}
    ],
    "disclosures": [
        {{
            "type": "new/modified",
            "disclosure_text": "The disclosure content",
            "location": "Where this disclosure appears",
            "importance": "low/medium/high"
        }}
    ],
    "additional_highlights": ["Other important points not captured above"],
    "complexity": "low/medium/high",
    "estimated_review_time": "Estimated time for thorough review"
}}"""
        else:
            return f"""You are an expert document analyst. Analyze the following document and provide a brief summary focusing on key business and technical changes in JSON format:

Document Content:
{text}

Provide a JSON response with the following structure:
{{
    "high_level_summary": "Brief overview of the document's purpose",
    "key_changes": ["Main changes described in the document"],
    "affected_channels": ["Channels impacted by changes"],
    "pages_affected": ["Application pages with changes"],
    "has_ab_testing": true/false,
    "new_email_templates": ["Brief description of new email templates"],
    "disclosures_updated": true/false,
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
    
    def generate_test_cases(self, diff_data, as_is_text="", to_be_text=""):
        """Generate test cases based on diff analysis with optional full PDF text"""
        start_time = time.time()
        product_context = get_product_context()
        
        try:
            changes_text = "\n".join([
                f"- {change.get('description', change.get('type', 'Change'))}"
                for change in diff_data.get('changes', [])
            ])
            
            # Include full PDF text for detailed analysis
            pdf_context = ""
            if as_is_text and to_be_text:
                pdf_context = f"""
AS-IS DOCUMENT CONTENT (Current State):
{as_is_text[:3000]}...

TO-BE DOCUMENT CONTENT (Future State):
{to_be_text[:3000]}...
"""
            elif to_be_text:
                pdf_context = f"""
DOCUMENT CONTENT:
{to_be_text[:3000]}...
"""
            
            prompt = f"""You are a QA expert for the Personify lending platform. Analyze the ACTUAL PDF CONTENT to generate EXHAUSTIVE and SPECIFIC test cases.

{product_context}

{pdf_context}

Changes Summary:
{changes_text}

Generate test cases in JSON format with Excel-ready structure (ID | Scenario | Steps | Expected | Priority | Type):
{{
    "test_cases": [
        {{
            "id": "TC001",
            "scenario": "Detailed test scenario description",
            "steps": "Step 1\\nStep 2\\nStep 3\\nStep 4",
            "expected": "Expected outcome with specific validation points",
            "priority": "high/medium/low",
            "type": "functional/regression/smoke"
        }}
    ],
    "qa_validation_scope": [
        "Happy path flow for ORG channel - Landing Page to E-Sign",
        "Regression testing for RF channel - Offer page validation",
        "Focus on Disclosures page - ADF vs FEB originator differences"
    ]
}}

CRITICAL: Generate at least 15-20 EXHAUSTIVE test cases based on ACTUAL PDF CONTENT. Be specific about channel names (ORG, RF, RA, PS, CMPQ, etc.) and page names."""
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert QA engineer specializing in test case design for the Personify lending platform."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=4000
            )
            
            result = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            processing_time = time.time() - start_time
            
            test_data = self._parse_summary_response(result)
            
            return {
                'test_cases': test_data.get('test_cases', []),
                'qa_validation_scope': test_data.get('qa_validation_scope', []),
                'tokens_used': tokens_used,
                'processing_time': processing_time
            }
        except Exception as e:
            logger.error(f"Error generating test cases: {e}")
            raise

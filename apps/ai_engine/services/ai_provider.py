import logging
import time
import json
import re
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
    """OpenAI GPT implementation with Vision support"""
    
    def __init__(self, api_key):
        super().__init__(api_key)
        try:
            import openai
            self.client = openai.OpenAI(api_key=api_key)
            self.model = "gpt-4o"  # GPT-4o has vision capabilities and is more cost-effective
            self.vision_model = "gpt-4o"  # Same model for vision tasks
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
                    {"role": "system", "content": "You are an expert product analyst specializing in UX/UI documentation and technical specifications."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1500 if detail_level == 'detailed' else 800,
                temperature=0.7
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
    
    def summarize_with_vision(self, text, images=None, detail_level='brief'):
        """
        Generate AI-powered document summary with visual analysis
        
        Args:
            text: Extracted text from PDF
            images: List of base64 images from PDF
            detail_level: 'brief' or 'detailed'
        """
        start_time = time.time()
        product_context = get_product_context()
        
        try:
            # Truncate text if too long
            max_chars = 12000 if detail_level == 'detailed' else 8000
            if len(text) > max_chars:
                text = text[:max_chars] + "...\n[Content truncated]"
            
            prompt_text = f"""You are an expert product analyst specializing in UX/UI documentation. Analyze BOTH the text content AND visual elements (images, mockups, screenshots) to create a comprehensive summary.

{product_context}

TEXT CONTENT:
{text}

VISUAL ANALYSIS INSTRUCTIONS:
- Analyze UI mockups, screenshots, wireframes, and design elements in the images
- Identify key UI components: forms, buttons, navigation, layouts
- Note visual design elements: colors, typography, spacing, branding
- Extract specific UI details from images (button colors, sizes, positions)
- Identify user flows and interaction patterns shown in visuals

Provide a JSON response with the following structure:
{{
    "high_level_summary": "Clear 2-3 sentence overview including UI/visual changes visible in images",
    "goal_of_project": "Primary objective based on text and visual elements",
    "key_highlights": [
        "UI change 1 with specific visual details (e.g., 'Blue CTA button (#0A84FF) added to header, 48px height')",
        "UI change 2 with layout details (e.g., 'Form redesigned to 2-column layout with 16px spacing')",
        "Visual element 3 from images (e.g., 'New email template mockup with updated branding')",
        "Functional change 4 from text"
    ],
    "changes_included": [
        {{
            "description": "Specific change with visual details if shown in images",
            "affected_channels": ["ORG", "RF", "RA", "PS"],
            "impact_level": "low|medium|high"
        }}
    ],
    "application_pages_with_changes": [
        {{
            "page_name": "Page name from text or images",
            "change_type": "UI/UX|Layout|Design|Functionality",
            "description": "Description including visual specifications if visible"
        }}
    ],
    "ui_visual_changes": [
        "Specific UI element 1 with color/size from images",
        "Layout change 2 with spacing details",
        "Design element 3 with visual specifications"
    ],
    "complexity": "low|medium|high",
    "estimated_review_time": "Estimated time for review"
}}

Be VERY specific about visual elements from images - include colors, sizes, positions, layouts."""

            # Build messages with images
            messages = [
                {"role": "system", "content": "You are an expert product analyst specializing in UX/UI documentation and visual design analysis."}
            ]
            
            user_content = [{"type": "text", "text": prompt_text}]
            
            # Add images
            if images:
                logger.info(f"Adding {len(images)} images to summary analysis")
                for idx, img in enumerate(images[:8]):  # Limit to 8 images for summary
                    user_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{img['mime_type']};base64,{img['image_base64']}",
                            "detail": "high"
                        }
                    })
            
            messages.append({"role": "user", "content": user_content})
            
            # Call GPT-4 Vision
            logger.info(f"Calling GPT-4 Vision for summary with {len(user_content) - 1} images")
            response = self.client.chat.completions.create(
                model=self.vision_model,
                messages=messages,
                max_tokens=1500 if detail_level == 'detailed' else 1000,
                temperature=0.7
            )
            
            result = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            processing_time = time.time() - start_time
            
            logger.info(f"Vision summary complete. Tokens: {tokens_used}, Time: {processing_time:.2f}s")
            logger.info(f"Vision summary raw response (first 500 chars): {result[:500]}")
            
            parsed_summary = self._parse_summary_response(result)
            logger.info(f"Parsed summary keys: {parsed_summary.keys() if isinstance(parsed_summary, dict) else 'Not a dict'}")
            
            return {
                'summary': parsed_summary,
                'tokens_used': tokens_used,
                'processing_time': processing_time,
                'images_analyzed': len(images) if images else 0
            }
            
        except Exception as e:
            logger.error(f"Error in vision-based summarization: {e}")
            raise
    
    def _build_summary_prompt(self, text, detail_level):
        """Build prompt for document summarization - OpenAI version"""
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
            return f"""You are an expert product analyst specializing in UX/UI documentation and technical specifications.

Document Content:
{text}

Analyze this document thoroughly and provide a comprehensive, well-structured summary.

Provide a JSON response with the following structure:
{{
    "high_level_summary": "Clear, concise 2-3 sentence overview explaining what this document is about, what problem is being solved, and what enhancements are being made.",
    "goal_of_project": "What is the primary objective? What specific problem is this solving? What improvements or changes are being introduced?",
    "key_highlights": [
        "Introduction/refinement of specific feature or behavior (be concrete)",
        "Improved error handling & validation messaging details",
        "UX updates for better clarity (mention specific areas)",
        "Backend/technical changes and their purpose"
    ],
    "changes_included": [
        {{
            "description": "Detailed description of the specific change with context",
            "affected_areas": ["Specific pages, flows, components, or features affected"],
            "impact_level": "low/medium/high"
        }}
    ],
    "application_pages_with_changes": ["List specific page/screen names mentioned in the document"],
    "has_ab_testing": true/false,
    "new_email_templates": ["Email template names or purposes if mentioned"],
    "disclosures_updated": true/false,
    "complexity": "low/medium/high",
    "estimated_review_time": "Realistic time estimate based on document length and complexity"
}}

IMPORTANT: Be specific and detailed - extract real information from the document, not generic placeholders."""
    
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
            prompt = f"""You are an expert UX reviewer and compliance analyst specializing in product documentation analysis.

Document:
{text[:8000]}

Perform a COMPREHENSIVE content analysis and classify ALL changes, risks, and recommendations.

Provide a detailed JSON response with this EXACT structure:

{{
  "ui_changes": [
    {{
      "change": "Specific UI change (e.g., 'OTP input field layout enhancements', 'Error message placement improved', 'Resend OTP UI logic added')",
      "details": "What exactly changed - be specific about visual elements, positioning, behavior, and user interaction improvements",
      "impact": "low|medium|high"
    }}
  ],
  "copy_changes": [
    {{
      "area": "Where the copy changed (e.g., 'OTP error messages', 'Instructional text', 'Success/failure messaging')",
      "original": "Original text if mentioned or 'Not specified'",
      "improved": "New/improved text with actual examples from the document",
      "reason": "Why this change improves clarity/UX - be specific about tone, guidance, or user understanding"
    }}
  ],
  "cta_changes": [
    {{
      "cta_name": "Specific button/link name (e.g., 'Verify OTP', 'Resend OTP', 'Try Again')",
      "before": "Previous text/behavior if mentioned",
      "after": "New text/behavior with details about enable/disable logic or visual feedback",
      "impact": "Expected impact on user behavior - be specific about conversion, clarity, or friction reduction"
    }}
  ],
  "legal_compliance_changes": [
    {{
      "type": "Type of legal/compliance change (e.g., 'OTP-related disclaimers', 'Security messaging alignment', 'Privacy notices')",
      "description": "What changed or was added with specific examples",
      "importance": "low|medium|high"
    }}
  ],
  "compliance_issues": [
    {{
      "issue": "Specific compliance issue or missing element (e.g., 'No explicit OTP expiry disclaimer visible', 'Missing rate-limit messaging')",
      "severity": "high|medium|low",
      "recommendation": "Actionable fix with examples (e.g., 'Add OTP valid for X minutes message', 'Add attempt restriction notice')"
    }}
  ],
  "risk_flags": [
    {{
      "risk": "Specific risk identified (e.g., 'Ambiguous error messages', 'No fraud/security advisory text', 'Generic retry messaging')",
      "severity": "high|medium|low",
      "mitigation": "How to address this risk with specific actions and examples"
    }}
  ],
  "missing_risky_areas": [
    {{
      "missing_element": "What's missing (e.g., 'OTP expiry info', 'Retry limit messaging', 'Fraud advisory text', 'Accessibility hints')",
      "severity": "high|medium|low",
      "recommendation": "What should be added with specific examples (e.g., 'Add: OTP expires in 5 minutes', 'Add: Maximum 3 attempts allowed')"
    }}
  ],
  "ai_suggestions": [
    "Add: 'OTP expires in 5 minutes' message for clarity",
    "Add: 'Maximum 3 attempts allowed' notice for security",
    "Improve: Error specificity - make errors actionable (e.g., 'Invalid OTP' → 'OTP incorrect. X attempts remaining')",
    "Standardize: Messaging across all authentication flows",
    "Enhance: Accessibility with focus states and screen reader hints"
  ],
  "summary": "Overall assessment of the document quality, key risks identified, compliance gaps, and priority recommendations for improvement"
}}

CRITICAL REQUIREMENTS:
- Be thorough and specific - identify REAL issues from the actual document content
- Don't use generic observations - extract actual problems, risks, and missing elements
- Provide actionable recommendations with concrete examples
- Focus on user experience, security, compliance, and accessibility
- Mention specific UI elements, messages, buttons, and behaviors from the document
- Identify what's missing that should be present for a complete user experience"""
            
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
    
    def analyze_content_with_vision(self, text, images=None, analysis_types=None):
        """
        Analyze content with visual elements for UI changes, copy changes, CTA changes, and compliance
        
        Args:
            text: Extracted text from PDF
            images: List of base64 images from PDF
            analysis_types: List of analysis types to perform
        """
        start_time = time.time()
        product_context = get_product_context()
        
        try:
            prompt_text = f"""You are an expert UX reviewer and compliance analyst. Analyze BOTH text AND visual elements for UI changes, copy improvements, CTA updates, and compliance issues.

{product_context}

TEXT CONTENT:
{text[:8000]}

VISUAL ANALYSIS INSTRUCTIONS:
- Analyze UI mockups, screenshots, and design elements in the images
- Identify specific UI components: buttons, forms, inputs, navigation, layouts
- Note visual design changes: colors, typography, spacing, positioning
- Identify CTAs and their visual treatment (color, size, placement)
- Check for compliance elements: disclaimers, disclosures, legal text
- Compare visual elements with text descriptions

Provide comprehensive analysis in JSON format:
{{
  "ui_changes": [
    {{
      "change": "Specific UI change with visual details (e.g., 'Blue CTA button added to landing page header, 48px height, #0A84FF color')",
      "details": "Exact visual specifications from images: colors, sizes, positions, spacing",
      "impact": "low|medium|high",
      "visual_reference": "Description of what's shown in the image"
    }}
  ],
  "copy_changes": [
    {{
      "area": "Where copy appears visually (e.g., 'Form error message below email field')",
      "original": "Original text if visible",
      "improved": "New text with visual context (font, color, position)",
      "reason": "Why this improves UX based on visual presentation"
    }}
  ],
  "cta_changes": [
    {{
      "cta_name": "Button/link name from images",
      "visual_details": "Color, size, position, hover state if shown",
      "before": "Previous design if shown",
      "after": "New design with specifications",
      "impact": "Expected impact on conversion/engagement"
    }}
  ],
  "layout_changes": [
    {{
      "area": "Page/section with layout change",
      "change": "Specific layout modification (e.g., '2-column to 3-column grid')",
      "visual_details": "Spacing, alignment, responsive behavior if shown"
    }}
  ],
  "design_elements": [
    {{
      "element": "Visual design element (e.g., 'Header banner', 'Icon set', 'Illustration')",
      "description": "Detailed description from images",
      "purpose": "Why this element is included"
    }}
  ],
  "legal_compliance_changes": [
    {{
      "type": "Compliance change visible in images",
      "description": "What changed with visual context",
      "importance": "low|medium|high"
    }}
  ],
  "compliance_issues": [
    {{
      "issue": "Missing or problematic element visible in images",
      "severity": "high|medium|low",
      "recommendation": "Specific fix with visual specifications"
    }}
  ],
  "accessibility_notes": [
    {{
      "issue": "Accessibility concern from visual analysis (e.g., 'Low contrast ratio', 'Small text size')",
      "recommendation": "Specific improvement"
    }}
  ]
}}

Be VERY specific about visual elements. Include colors, sizes, positions, and exact UI component details."""

            # Build messages with images
            messages = [
                {"role": "system", "content": "You are an expert UX reviewer, visual designer, and compliance analyst specializing in UI/UX analysis."}
            ]
            
            user_content = [{"type": "text", "text": prompt_text}]
            
            # Add images
            if images:
                logger.info(f"Adding {len(images)} images to content analysis")
                for idx, img in enumerate(images[:8]):  # Limit to 8 images
                    user_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{img['mime_type']};base64,{img['image_base64']}",
                            "detail": "high"
                        }
                    })
            
            messages.append({"role": "user", "content": user_content})
            
            # Call GPT-4 Vision
            logger.info(f"Calling GPT-4 Vision for content analysis with {len(user_content) - 1} images")
            response = self.client.chat.completions.create(
                model=self.vision_model,
                messages=messages,
                max_tokens=3000,
                temperature=0.3
            )
            
            result = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            processing_time = time.time() - start_time
            
            logger.info(f"Vision content analysis complete. Tokens: {tokens_used}, Time: {processing_time:.2f}s")
            
            # Parse JSON response
            try:
                json_match = re.search(r'\{.*\}', result, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group(0))
                else:
                    analysis_data = {
                        "ui_changes": [],
                        "copy_changes": [],
                        "cta_changes": [],
                        "layout_changes": [],
                        "design_elements": [],
                        "compliance_issues": [],
                        "summary": "No valid JSON in response"
                    }
            except json.JSONDecodeError:
                analysis_data = {"error": "Failed to parse response", "raw": result}
            
            return {
                'analysis': analysis_data,
                'tokens_used': tokens_used,
                'processing_time': processing_time,
                'images_analyzed': len(images) if images else 0
            }
            
        except Exception as e:
            logger.error(f"Error in vision-based content analysis: {e}")
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
            
            prompt = f"""You are a QA expert specializing in test case design. Analyze the document and generate comprehensive, specific test cases.

{pdf_context}

Changes Summary:
{changes_text}

Generate detailed test cases in JSON format with Excel-ready structure:

{{
    "test_cases": [
        {{
            "id": "TC_001",
            "scenario": "Specific, detailed test scenario (e.g., 'Valid OTP verification', 'Invalid OTP entry', 'Expired OTP handling')",
            "steps": "1. Specific action with details\\n2. Next action\\n3. Verification step\\n4. Expected behavior check",
            "expected": "Clear expected result with specific validation points and success criteria",
            "priority": "high|medium|low",
            "type": "functional|regression|security|ui"
        }}
    ],
    "qa_validation_scope": [
        "Specific flow to test (e.g., 'Login flow with OTP authentication')",
        "API/backend validation (e.g., 'Authentication APIs', 'OTP generation service')",
        "Integration points (e.g., 'Email delivery system', 'SMS gateway')",
        "Security aspects (e.g., 'Session handling', 'Rate limiting', 'Attempt tracking')"
    ]
}}

REQUIREMENTS:
- Generate at least 6-10 comprehensive test cases covering different scenarios
- Include: happy path (valid inputs), error scenarios (invalid/expired), edge cases, security tests, UI validation
- Be specific about steps - mention actual UI elements, fields, buttons, and expected behaviors
- Each test case should have clear, actionable steps and measurable expected results
- Priority should reflect business impact (high for critical flows, medium for important features, low for nice-to-have)
- Type should accurately categorize the test (functional for features, regression for existing functionality, security for auth/access, ui for visual/interaction)
- QA validation scope should list actual systems, APIs, flows, and integration points to test

EXAMPLES OF GOOD TEST CASES:
{{
    "id": "TC_001",
    "scenario": "Valid OTP verification",
    "steps": "1. Enter valid OTP received via email\\n2. Click 'Verify' button\\n3. Observe system response",
    "expected": "User successfully logged in and redirected to dashboard. Session created with proper authentication token.",
    "priority": "high",
    "type": "functional"
}}

{{
    "id": "TC_002",
    "scenario": "Invalid OTP entry",
    "steps": "1. Enter incorrect OTP (e.g., 123456 when actual is 789012)\\n2. Click 'Verify' button\\n3. Check error message display",
    "expected": "Error message displayed: 'Invalid OTP. Please try again.' Focus returns to OTP input field. Attempt counter incremented.",
    "priority": "high",
    "type": "functional"
}}

{{
    "id": "TC_005",
    "scenario": "Max attempts exceeded",
    "steps": "1. Enter wrong OTP 3 times consecutively\\n2. Observe system behavior after 3rd failed attempt",
    "expected": "Account temporarily locked. Warning message shown: 'Maximum attempts exceeded. Please try again after X minutes.' Resend OTP button disabled.",
    "priority": "high",
    "type": "security"
}}

Generate similar detailed, specific test cases based on the actual document content."""
            
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
    
    def generate_test_cases_with_vision(self, diff_data, as_is_text="", to_be_text="", as_is_images=None, to_be_images=None):
        """
        Generate test cases using GPT-4 Vision with both text and images
        
        Args:
            diff_data: Diff analysis data
            as_is_text: Text from AS-IS PDF
            to_be_text: Text from TO-BE PDF
            as_is_images: List of base64 images from AS-IS PDF
            to_be_images: List of base64 images from TO-BE PDF
        """
        start_time = time.time()
        product_context = get_product_context()
        
        try:
            changes_text = "\n".join([
                f"- {change.get('description', change.get('type', 'Change'))}"
                for change in diff_data.get('changes', [])
            ])
            
            # Build the prompt
            prompt_text = f"""You are a QA expert for the Personify lending platform. Analyze BOTH the text content AND the visual elements (images, UI mockups, layouts, forms) to generate comprehensive test cases.

{product_context}

TEXT CONTENT ANALYSIS:
AS-IS Text: {as_is_text[:2000] if as_is_text else 'N/A'}...
TO-BE Text: {to_be_text[:2000] if to_be_text else 'N/A'}...

Changes Summary:
{changes_text}

VISUAL ANALYSIS INSTRUCTIONS:
- Analyze UI mockups, screenshots, and visual elements in the images
- Identify form fields, buttons, CTAs, layouts, and visual changes
- Note color schemes, positioning, and visual hierarchy
- Compare AS-IS vs TO-BE visual differences

Generate comprehensive test cases in JSON format:
{{
    "test_cases": [
        {{
            "test_case_id": "TC001",
            "scenario": "Specific test scenario including visual elements",
            "steps": ["Step 1 with UI element details", "Step 2", "Step 3"],
            "expected_result": "Detailed expected outcome including visual validation",
            "priority": "high|medium|low",
            "type": "functional|ui|security|regression"
        }}
    ],
    "qa_validation_scope": ["Scope item 1", "Scope item 2"]
}}

REQUIREMENTS:
- Generate 10-15 test cases covering: UI validation, functional testing, visual regression, form validation
- Include specific UI element names from the images (buttons, fields, labels)
- Test visual changes (colors, layouts, positioning)
- Cover both happy path and error scenarios
- Include accessibility and responsive design tests if applicable"""

            # Build messages with images
            messages = [
                {"role": "system", "content": "You are an expert QA engineer specializing in visual and functional testing for web applications."}
            ]
            
            # Build user message with text and images
            user_content = [{"type": "text", "text": prompt_text}]
            
            # Add AS-IS images
            if as_is_images:
                logger.info(f"Adding {len(as_is_images)} AS-IS images to vision analysis")
                for idx, img in enumerate(as_is_images[:5]):  # Limit to 5 images to control costs
                    user_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{img['mime_type']};base64,{img['image_base64']}",
                            "detail": "high"  # Use high detail for better analysis
                        }
                    })
            
            # Add TO-BE images
            if to_be_images:
                logger.info(f"Adding {len(to_be_images)} TO-BE images to vision analysis")
                for idx, img in enumerate(to_be_images[:5]):  # Limit to 5 images
                    user_content.append({
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{img['mime_type']};base64,{img['image_base64']}",
                            "detail": "high"
                        }
                    })
            
            messages.append({"role": "user", "content": user_content})
            
            # Call GPT-4 Vision API
            logger.info(f"Calling GPT-4 Vision with {len(user_content) - 1} images")
            response = self.client.chat.completions.create(
                model=self.vision_model,
                messages=messages,
                max_tokens=4000,
                temperature=0.7
            )
            
            result = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            processing_time = time.time() - start_time
            
            logger.info(f"Vision analysis complete. Tokens: {tokens_used}, Time: {processing_time:.2f}s")
            
            # Parse JSON response
            test_data = self._parse_summary_response(result)
            
            return {
                'test_cases': test_data.get('test_cases', []),
                'qa_validation_scope': test_data.get('qa_validation_scope', []),
                'tokens_used': tokens_used,
                'processing_time': processing_time,
                'images_analyzed': (len(as_is_images) if as_is_images else 0) + (len(to_be_images) if to_be_images else 0)
            }
            
        except Exception as e:
            logger.error(f"Error in vision-based test case generation: {e}")
            raise

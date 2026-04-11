# IMPROVED AI PROMPTS FOR BETTER RESPONSES
# This file contains the updated prompt templates based on user feedback
# Replace the prompts in ai_provider.py with these

SUMMARIZATION_PROMPT_BRIEF = """You are an expert product analyst specializing in UX/UI documentation and technical specifications.

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

IMPORTANT: 
- Be specific and detailed - extract real information from the document
- Don't use generic placeholders - mention actual features, pages, and changes
- Focus on what's actually changing and why it matters
- Include technical details when present"""

CONTENT_ANALYSIS_PROMPT = """You are an expert UX reviewer and compliance analyst specializing in product documentation analysis.

Document:
{text}

Perform a COMPREHENSIVE content analysis and classify ALL changes, risks, and recommendations.

Provide a detailed JSON response with this EXACT structure:

{{
  "ui_changes": [
    {{
      "change": "Specific UI change (e.g., 'OTP input field layout enhancements', 'Error message placement improved')",
      "details": "What exactly changed - be specific about visual elements, positioning, behavior",
      "impact": "low|medium|high"
    }}
  ],
  "copy_changes": [
    {{
      "area": "Where the copy changed (e.g., 'OTP error messages', 'Instructional text')",
      "original": "Original text if mentioned or 'Not specified'",
      "improved": "New/improved text with actual examples",
      "reason": "Why this change improves clarity/UX - be specific"
    }}
  ],
  "cta_changes": [
    {{
      "cta_name": "Specific button/link name (e.g., 'Verify OTP', 'Resend OTP')",
      "before": "Previous text/behavior if mentioned",
      "after": "New text/behavior with details",
      "impact": "Expected impact on user behavior - be specific"
    }}
  ],
  "legal_compliance_changes": [
    {{
      "type": "Type of legal/compliance change (e.g., 'OTP-related disclaimers', 'Security messaging')",
      "description": "What changed or was added",
      "importance": "low|medium|high"
    }}
  ],
  "compliance_issues": [
    {{
      "issue": "Specific compliance issue or missing element (e.g., 'No explicit OTP expiry disclaimer')",
      "severity": "high|medium|low",
      "recommendation": "Actionable fix (e.g., 'Add OTP valid for X minutes message')"
    }}
  ],
  "risk_flags": [
    {{
      "risk": "Specific risk identified (e.g., 'Missing rate-limit messaging', 'Ambiguous error messages')",
      "severity": "high|medium|low",
      "mitigation": "How to address this risk with specific actions"
    }}
  ],
  "missing_risky_areas": [
    {{
      "missing_element": "What's missing (e.g., 'OTP expiry info', 'Retry limit messaging', 'Fraud advisory text')",
      "severity": "high|medium|low",
      "recommendation": "What should be added with examples"
    }}
  ],
  "ai_suggestions": [
    "Add: 'OTP expires in 5 minutes' message",
    "Add: 'Maximum 3 attempts allowed' notice",
    "Improve: Error specificity - make errors actionable",
    "Standardize: Messaging across all flows"
  ],
  "summary": "Overall assessment of the document quality, risks identified, and key recommendations"
}}

CRITICAL REQUIREMENTS:
- Be thorough and specific - identify REAL issues from the actual document
- Don't use generic observations - extract actual problems and risks
- Provide actionable recommendations with examples
- Focus on user experience, security, and compliance
- Mention specific UI elements, messages, and behaviors from the document"""

TEST_CASE_GENERATION_PROMPT = """You are a QA expert specializing in test case design. Analyze the document and generate comprehensive test cases.

Document Content:
{pdf_context}

Changes Summary:
{changes_text}

Generate detailed test cases in JSON format:

{{
    "test_cases": [
        {{
            "id": "TC_001",
            "scenario": "Specific, detailed test scenario (e.g., 'Valid OTP verification', 'Invalid OTP entry')",
            "steps": "1. Specific action\\n2. Next action\\n3. Verification step\\n4. Expected behavior check",
            "expected": "Clear expected result with specific validation points",
            "priority": "high|medium|low",
            "type": "functional|regression|security|ui"
        }}
    ],
    "qa_validation_scope": [
        "Specific flow to test (e.g., 'Login flow with OTP')",
        "API/backend validation (e.g., 'Authentication APIs')",
        "Integration points (e.g., 'Email delivery system')",
        "Security aspects (e.g., 'Session handling')"
    ]
}}

REQUIREMENTS:
- Generate at least 6-10 comprehensive test cases
- Cover: happy path, error scenarios, edge cases, security, UI validation
- Be specific about steps and expected results
- Include priority and type for each test case
- QA validation scope should list actual systems/flows to test"""

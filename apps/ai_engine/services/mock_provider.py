import logging
import time
import random

logger = logging.getLogger(__name__)


class MockProvider:
    """Mock AI provider for testing without API costs"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or "mock-key"
        logger.info("MockProvider initialized - No API costs!")
    
    def summarize_text(self, text, detail_level='brief'):
        """Generate mock document summary"""
        time.sleep(random.uniform(0.5, 1.5))  # Simulate processing time
        
        # Extract some basic info from text
        word_count = len(text.split())
        pages = max(1, word_count // 250)
        
        if detail_level == 'detailed':
            summary_data = {
                'title': 'Sample Document Analysis',
                'type': 'Contract',
                'pages': pages,
                'key_highlights': [
                    'This is a demo response from the Mock AI Provider',
                    'No API costs are incurred when using this provider',
                    'The document contains important contractual terms',
                    'Multiple sections require stakeholder review',
                    'Compliance requirements are outlined in detail'
                ],
                'sections': [
                    {'name': 'Introduction', 'summary': 'Overview of the agreement and parties involved'},
                    {'name': 'Terms & Conditions', 'summary': 'Detailed contractual obligations and requirements'},
                    {'name': 'Payment Terms', 'summary': 'Financial arrangements and payment schedules'},
                    {'name': 'Confidentiality', 'summary': 'Non-disclosure and data protection clauses'}
                ],
                'complexity': 'medium',
                'estimated_review_time': '20-30 minutes',
                'main_parties': ['Company A', 'Company B'],
                'important_dates': ['2026-04-15: Contract Start Date', '2027-04-15: Renewal Date'],
                'action_items': [
                    'Review and approve terms by legal team',
                    'Obtain stakeholder signatures',
                    'File executed copy with records'
                ]
            }
        else:
            summary_data = {
                'title': 'Sample Document Summary',
                'type': 'Contract',
                'pages': pages,
                'key_highlights': [
                    'Demo response from Mock AI Provider (no API costs)',
                    'Document contains standard contractual terms',
                    'Review required by legal and finance teams'
                ],
                'complexity': 'medium',
                'estimated_review_time': '15-20 minutes'
            }
        
        return {
            'summary': summary_data,
            'tokens_used': random.randint(800, 1200),
            'processing_time': random.uniform(0.5, 1.5)
        }
    
    def analyze_diff(self, old_text, new_text):
        """Generate mock diff analysis"""
        time.sleep(random.uniform(1.0, 2.0))
        
        diff_data = {
            'total_changes': 8,
            'changes': [
                {
                    'type': 'text_modified',
                    'section': 'Payment Terms',
                    'old_text': 'Payment due within 30 days',
                    'new_text': 'Payment due within 45 days',
                    'severity': 'high',
                    'description': 'Payment terms extended from 30 to 45 days'
                },
                {
                    'type': 'text_added',
                    'section': 'Confidentiality',
                    'old_text': '',
                    'new_text': 'All proprietary information must be protected',
                    'severity': 'medium',
                    'description': 'New confidentiality clause added'
                },
                {
                    'type': 'text_modified',
                    'section': 'Termination',
                    'old_text': '30 days notice required',
                    'new_text': '60 days notice required',
                    'severity': 'medium',
                    'description': 'Termination notice period increased'
                }
            ],
            'summary': 'Mock diff analysis shows 8 changes including payment term modifications, new confidentiality clauses, and updated termination requirements. Major changes require legal review.',
            'severity_score': 6.5
        }
        
        return {
            'diff_summary': diff_data,
            'tokens_used': random.randint(1500, 2000),
            'processing_time': random.uniform(1.0, 2.0)
        }
    
    def analyze_content(self, text, analysis_types):
        """Generate mock content analysis"""
        time.sleep(random.uniform(1.0, 2.0))
        
        analysis_data = {
            'language_suggestions': [
                {
                    'severity': 'medium',
                    'current': 'The party of the first part shall be responsible',
                    'suggested': 'Company A shall be responsible',
                    'reason': 'Simplify legal language for better clarity'
                },
                {
                    'severity': 'low',
                    'current': 'In the event that',
                    'suggested': 'If',
                    'reason': 'Use simpler, more direct language'
                },
                {
                    'severity': 'high',
                    'current': 'Said agreement',
                    'suggested': 'This agreement',
                    'reason': 'Avoid archaic legal terminology'
                }
            ],
            'compliance_issues': [
                {
                    'severity': 'high',
                    'issue': 'Missing GDPR compliance clause',
                    'suggested_action': 'Add data protection and privacy clause per GDPR requirements'
                },
                {
                    'severity': 'medium',
                    'issue': 'Unclear dispute resolution process',
                    'suggested_action': 'Specify arbitration or mediation procedures'
                },
                {
                    'severity': 'low',
                    'issue': 'No force majeure clause',
                    'suggested_action': 'Consider adding force majeure provisions'
                }
            ],
            'formatting_recommendations': [
                'Use consistent heading styles throughout',
                'Add table of contents for easier navigation',
                'Number all sections and subsections',
                'Use bullet points for lists instead of paragraphs'
            ]
        }
        
        return {
            'analysis': analysis_data,
            'tokens_used': random.randint(1200, 1800),
            'processing_time': random.uniform(1.0, 2.0)
        }
    
    def generate_test_cases(self, diff_data):
        """Generate mock test cases"""
        time.sleep(random.uniform(1.5, 2.5))
        
        test_cases = [
            {
                'test_case_id': 'TC001',
                'title': 'Verify Payment Terms Update',
                'description': 'Validate that payment terms have been correctly updated from 30 to 45 days',
                'preconditions': 'Contract document is accessible and approved',
                'steps': [
                    'Open the contract document',
                    'Navigate to Payment Terms section',
                    'Verify payment due date is 45 days',
                    'Confirm no references to old 30-day term remain'
                ],
                'expected_result': 'Payment terms show 45 days throughout document',
                'priority': 'high',
                'type': 'functional'
            },
            {
                'test_case_id': 'TC002',
                'title': 'Verify Confidentiality Clause Addition',
                'description': 'Confirm new confidentiality clause is present and complete',
                'preconditions': 'Updated contract version is available',
                'steps': [
                    'Open contract document',
                    'Locate Confidentiality section',
                    'Verify new clause text is present',
                    'Check clause numbering is correct'
                ],
                'expected_result': 'Confidentiality clause is properly added',
                'priority': 'high',
                'type': 'functional'
            },
            {
                'test_case_id': 'TC003',
                'title': 'Verify Termination Notice Period',
                'description': 'Validate termination notice period change from 30 to 60 days',
                'preconditions': 'Contract is in final review stage',
                'steps': [
                    'Access Termination section',
                    'Verify notice period is 60 days',
                    'Check for consistency across document'
                ],
                'expected_result': 'All termination references show 60 days',
                'priority': 'medium',
                'type': 'regression'
            }
        ]
        
        return {
            'test_cases': test_cases,
            'tokens_used': random.randint(1500, 2200),
            'processing_time': random.uniform(1.5, 2.5)
        }

import logging
import time
import random
import re

logger = logging.getLogger(__name__)


class MockProvider:
    """Mock AI provider for testing without API costs - Enhanced with version intelligence"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or "mock-key"
        logger.info("MockProvider initialized - Enhanced features, No API costs!")
    
    def summarize_text(self, text, detail_level='brief'):
        """Generate enhanced mock document summary with project context"""
        time.sleep(random.uniform(0.5, 1.5))  # Simulate processing time
        
        # Extract some basic info from text
        word_count = len(text.split())
        pages = max(1, word_count // 250)
        
        if detail_level == 'detailed':
            summary_data = {
                'title': 'Refinance UX Updates',
                'project': 'Refinance Funnel Optimization',
                'priority': 'High',
                'type': 'UX Specification',
                'pages': pages,
                'brief_summary': 'This document outlines UX updates to the refinance funnel, focusing on improving conversion rates through landing page consolidation, A/B testing of challenger designs, and consistent "Extra Cash" messaging across landing pages, borrower portal, and email.',
                'key_highlights': [
                    'Landing Page Optimization: RF-1 and RF-2 deprecated, redirected to RF-3 and RF-4',
                    'A/B Testing: Introduction of challenger designs with 50/50 traffic split',
                    'Unified Messaging: "Extra Cash" theme across all touchpoints',
                    'Borrower Portal: Updated popup UX and messaging alignment',
                    'Email Redesign: Cleaner layout with improved engagement metrics'
                ],
                'sections': [
                    {
                        'name': 'Landing Page Consolidation & Optimization',
                        'summary': 'Removal of landing pages RF-1 and RF-2 with traffic redirected to RF-3 and RF-4. Introduction of A/B testing for challenger designs with 50/50 split. RF P+ funnel integration using updated designs.'
                    },
                    {
                        'name': 'Borrower Portal Updates',
                        'summary': 'Messaging aligned to "Extra Cash" theme. Updated popup UX for improved engagement and conversion.'
                    },
                    {
                        'name': 'Email Redesign',
                        'summary': 'Cleaner layout and improved messaging alignment. A/B testing between new and existing templates to measure engagement.'
                    },
                    {
                        'name': 'Compliance & Financial Messaging',
                        'summary': 'APR rules, rate reduction logic, and legal disclaimers included. Emphasis on transparent financial communication.'
                    }
                ],
                'complexity': 'high',
                'estimated_review_time': '30-45 minutes',
                'goal': 'Improve conversion, maintain compliance, and unify messaging across all channels',
                'cached': True
            }
        else:
            summary_data = {
                'title': 'Refinance UX Updates',
                'project': 'Refinance Funnel Optimization',
                'priority': 'High',
                'type': 'UX Specification',
                'pages': pages,
                'brief_summary': 'This document outlines UX updates to the refinance funnel, focusing on improving conversion rates through landing page consolidation, A/B testing of challenger designs, and consistent "Extra Cash" messaging across landing pages, borrower portal, and email.',
                'complexity': 'high',
                'estimated_review_time': '20-30 minutes',
                'cached': True
            }
        
        return {
            'summary': summary_data,
            'tokens_used': random.randint(800, 1200),
            'processing_time': random.uniform(0.5, 1.5)
        }
    
    def analyze_diff(self, old_text, new_text):
        """Generate enhanced version intelligence diff analysis (v1 vs v2)"""
        time.sleep(random.uniform(1.0, 2.0))
        
        diff_data = {
            'version_comparison': 'v1 → v2',
            'total_changes': 8,
            'severity_score': 6,
            'pages_affected': [2, 5, 7, 9],
            'changes': [
                {
                    'change_number': 1,
                    'type': 'text_modified',
                    'location': 'Page 5, Offer Page CTA',
                    'section': 'Call to Action Button',
                    'v1_text': 'CTA button is "Confirm and continue"',
                    'v2_text': 'CTA button is "Confirm and Continue"',
                    'severity': 'low',
                    'impact': 'Capitalization change only',
                    'classification': 'Copy refinement',
                    'description': 'Minor capitalization update in CTA button text'
                },
                {
                    'change_number': 2,
                    'type': 'section_added',
                    'location': 'Page 2, Landing Page',
                    'section': 'Social Proof',
                    'v1_text': '',
                    'v2_text': 'Trustpilot rating section with 4.5 stars',
                    'severity': 'high',
                    'impact': 'New social proof element',
                    'classification': 'UI Enhancement',
                    'description': 'Added Trustpilot section to increase credibility'
                },
                {
                    'change_number': 3,
                    'type': 'text_deleted',
                    'location': 'Page 7, Legal Disclaimers',
                    'section': 'Rate Terms',
                    'v1_text': 'Rates subject to change without notice',
                    'v2_text': '',
                    'severity': 'high',
                    'impact': 'Legal language modification',
                    'classification': 'Compliance Change',
                    'risk': 'Requires legal review',
                    'description': 'Removed rate change disclaimer - legal review needed'
                },
                {
                    'change_number': 4,
                    'type': 'text_modified',
                    'location': 'Page 2, Landing Page',
                    'section': 'Headline Messaging',
                    'v1_text': 'Get Your Offer Today',
                    'v2_text': 'Unlock Your Extra Cash',
                    'severity': 'medium',
                    'impact': 'Messaging shift to "Extra Cash" theme',
                    'classification': 'Copy Change',
                    'description': 'Updated headline to align with new messaging strategy'
                },
                {
                    'change_number': 5,
                    'type': 'section_removed',
                    'location': 'Page 9, Form Fields',
                    'section': 'RF-1 Landing Page',
                    'v1_text': 'RF-1 landing page with 8 form fields',
                    'v2_text': '',
                    'severity': 'high',
                    'impact': 'Entire landing page removed',
                    'classification': 'UI Change',
                    'description': 'RF-1 page deprecated and removed from flow'
                },
                {
                    'change_number': 6,
                    'type': 'text_modified',
                    'location': 'Page 5, CTA Button',
                    'section': 'Primary Action',
                    'v1_text': 'Get My Offer',
                    'v2_text': 'View My Offer',
                    'severity': 'medium',
                    'impact': 'CTA wording change',
                    'classification': 'CTA Change',
                    'description': 'Updated CTA for conversion optimization'
                },
                {
                    'change_number': 7,
                    'type': 'text_added',
                    'location': 'Page 7, Legal Section',
                    'section': 'APR Disclosure',
                    'v1_text': '',
                    'v2_text': 'APR calculation methodology and rate reduction logic explained',
                    'severity': 'medium',
                    'impact': 'Enhanced transparency',
                    'classification': 'Legal/Compliance Change',
                    'description': 'Added detailed APR disclosure for compliance'
                },
                {
                    'change_number': 8,
                    'type': 'text_modified',
                    'location': 'Page 9, Email Template',
                    'section': 'Email Layout',
                    'v1_text': 'Standard email template with sidebar',
                    'v2_text': 'Cleaner single-column email layout',
                    'severity': 'low',
                    'impact': 'Improved email rendering',
                    'classification': 'UI Change',
                    'description': 'Simplified email template for better mobile compatibility'
                }
            ],
            'summary': 'Version comparison (v1 → v2) shows 8 significant changes including CTA updates, new Trustpilot section, RF-1 page removal, messaging shift to "Extra Cash" theme, and enhanced legal disclosures. High-severity changes require legal and compliance review.',
            'recommendations': [
                'Legal review required for removed rate disclaimer',
                'Validate Trustpilot integration and rating accuracy',
                'Test RF-1 redirect functionality',
                'Ensure "Extra Cash" messaging is consistent across all touchpoints'
            ]
        }
        
        return {
            'diff_summary': diff_data,
            'tokens_used': random.randint(1500, 2000),
            'processing_time': random.uniform(1.0, 2.0)
        }
    
    def analyze_content(self, text, analysis_types):
        """Generate enhanced content analysis with UI/Copy/Legal/CTA classification"""
        time.sleep(random.uniform(1.0, 2.0))
        
        analysis_data = {
            'ui_changes': [
                'Removal of RF-1, RF-2 pages',
                'Reduced / modified form fields in RF-3 & RF-4',
                'Added Trustpilot section',
                'Improved layout hierarchy'
            ],
            'copy_changes': [
                'Introduction of "Extra Cash" messaging',
                'Stronger CTA-driven language',
                'Simplified user communication'
            ],
            'legal_compliance_changes': [
                'APR clauses repeated across sections',
                'Rate reduction explanation included',
                'Soft vs Hard inquiry disclaimers added'
            ],
            'cta_changes': [
                {
                    'old': 'Get My Offer',
                    'new': 'View My Offer',
                    'classification': 'Conversion Optimization',
                    'impact': 'Medium–High'
                }
            ],
            'compliance_risks': {
                'high_severity': [
                    {
                        'issue': 'APR-related legal text repeated multiple times',
                        'risk': 'Inconsistency across sections possible',
                        'action': 'Validate against legal-approved master copy'
                    }
                ],
                'medium_severity': [
                    {
                        'issue': 'Messaging variations across channels',
                        'examples': ['"Unlock My Extra Cash"', '"View My Offer"'],
                        'risk': 'Brand inconsistency',
                        'action': 'Standardize messaging across touchpoints'
                    }
                ],
                'low_severity': [
                    {
                        'issue': 'Minor grammar issues',
                        'example': '"a excellent customer" → should be "an excellent customer"',
                        'action': 'Copyediting pass recommended'
                    }
                ]
            },
            'missing_risky_checks': [
                {'status': 'good', 'item': 'Disclaimer present'},
                {'status': 'warning', 'item': 'No explicit regulatory reference validation'},
                {'status': 'warning', 'item': 'Email vs Landing legal text mismatch risk'}
            ],
            'language_improvements': [
                'Replace repetitive financial clauses with summarized version',
                'Improve readability of long legal paragraphs',
                'Standardize CTA language'
            ],
            'severity_legend': {
                'high': 'Legal risks, compliance issues',
                'medium': 'UX inconsistency, brand misalignment',
                'low': 'Language improvements, minor fixes'
            }
        }
        
        return {
            'analysis': analysis_data,
            'tokens_used': random.randint(1200, 1800),
            'processing_time': random.uniform(1.0, 2.0)
        }
    
    def generate_test_cases(self, diff_data):
        """Generate enhanced test cases with risk areas and regression scope"""
        time.sleep(random.uniform(1.5, 2.5))
        
        test_cases = [
            {
                'test_case_id': 'TC001',
                'scenario': 'Validate RF-1 and RF-2 redirection',
                'title': 'Verify deprecated landing page redirects',
                'description': 'Ensure RF-1 and RF-2 landing pages redirect correctly to RF-3 or RF-4',
                'preconditions': 'Old URLs (RF-1, RF-2) are still accessible',
                'steps': [
                    'Open RF-1 URL in browser',
                    'Observe redirect behavior',
                    'Verify landing on RF-3 or RF-4',
                    'Check URL parameters preserved'
                ],
                'expected_result': 'Automatic redirect to RF-3 or RF-4 with parameters intact',
                'priority': 'high',
                'type': 'regression'
            },
            {
                'test_case_id': 'TC002',
                'scenario': 'Validate A/B test traffic split',
                'title': 'Verify challenger design shows to 50% of users',
                'description': 'Test that A/B testing infrastructure correctly distributes traffic',
                'preconditions': 'A/B test configured and active',
                'steps': [
                    'Hit landing page URL 100 times',
                    'Capture variant shown (control vs challenger)',
                    'Calculate distribution percentage'
                ],
                'expected_result': '~50/50 distribution (±5% tolerance)',
                'priority': 'high',
                'type': 'functional'
            },
            {
                'test_case_id': 'TC003',
                'scenario': 'Validate "Extra Cash" messaging consistency',
                'title': 'Ensure messaging is consistent across all touchpoints',
                'description': 'Verify "Extra Cash" messaging appears identically across LP, Email, and BP',
                'preconditions': 'Access to LP, Email, and BP',
                'steps': [
                    'Check landing page messaging',
                    'Review email template text',
                    'Verify borrower portal popup',
                    'Compare all instances'
                ],
                'expected_result': '"Extra Cash" messaging identical across LP, Email, and BP',
                'priority': 'medium',
                'type': 'functional'
            },
            {
                'test_case_id': 'TC004',
                'scenario': 'Validate APR disclaimer visibility',
                'title': 'Ensure legal disclaimers are present and readable',
                'description': 'Test that APR disclaimers meet legal and accessibility requirements',
                'preconditions': 'Landing page loaded',
                'steps': [
                    'Scroll to footer section',
                    'Locate APR disclaimer text',
                    'Verify text is complete and readable',
                    'Check font size meets accessibility standards'
                ],
                'expected_result': 'Legal text present, complete, and readable (min 10px font)',
                'priority': 'high',
                'type': 'compliance'
            },
            {
                'test_case_id': 'TC005',
                'scenario': 'Validate form field inputs',
                'title': 'Test form validation for invalid inputs',
                'description': 'Ensure form properly validates and shows error messages',
                'preconditions': 'RF-3 or RF-4 form displayed',
                'steps': [
                    'Enter invalid SSN format (e.g., "123")',
                    'Attempt to submit form',
                    'Observe error message'
                ],
                'expected_result': 'Error message shown: "Please enter a valid 9-digit SSN"',
                'priority': 'high',
                'type': 'negative'
            }
        ]
        
        risk_areas = {
            'high_risk': [
                'Traffic redirection issues (RF-1/RF-2 → RF-3/RF-4)',
                'A/B testing misconfiguration',
                'Legal compliance mismatch across channels'
            ],
            'medium_risk': [
                'Messaging inconsistency across touchpoints',
                'Email template rendering issues',
                'Form validation edge cases'
            ],
            'low_risk': [
                'Minor UI alignment issues',
                'Copyediting inconsistencies'
            ]
        }
        
        regression_scope = {
            'core_functionality': [
                'Landing page rendering',
                'Form validations',
                'API integrations (offer fetch)',
                'Email template rendering',
                'Borrower portal popup'
            ],
            'integration_points': [
                'A/B testing platform',
                'Analytics tracking',
                'CRM data sync',
                'Email delivery service'
            ],
            'compliance': [
                'Legal disclaimer presence',
                'APR calculation accuracy',
                'Privacy policy links'
            ]
        }
        
        return {
            'test_cases': test_cases,
            'risk_areas': risk_areas,
            'regression_scope': regression_scope,
            'tokens_used': random.randint(1500, 2200),
            'processing_time': random.uniform(1.5, 2.5)
        }

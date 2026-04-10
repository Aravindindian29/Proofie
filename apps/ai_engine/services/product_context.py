"""
Product Context Configuration for Personify Application
This context is used by AI features to provide domain-specific analysis
"""

PERSONIFY_CONTEXT = """
PRODUCT CONTEXT: Personify Lending Platform

Personify is a lending platform where users can apply for loans. Based on their scores, activity on previous loans, 
and credit information received from third-party sources, the product will reject, pend, or approve the loan.

CHANNELS AVAILABLE:
- ORG (Organic)
- RF (Refinance)
- RA (Reactivation)
- PS (Prescreen)
- Affiliate Channels: CMPQ, CKPQ, QS, LT, CMACT, ML, MO

ORIGINATORS:
- ADF (Applied Data Finance)
- FEB (First Electronic Bank)
Note: Based on licensing, states are divided between ADF and FEB. Origination fee-related disclosures and email templates differ between these originators.

APPLICATION PAGES:
1. Landing Page - Entry point for customers
2. Mini Application Page - Customer details entry
3. Disclosures Page - Legal and compliance information
4. Offer Page - Loan offer presentation
5. Bank Data Page - Customer bank account and routing number entry
6. Repayment Page - ACH payment or send check by mail options
7. Plaid Page - Third-party loan details integration
8. E-Sign Page - Electronic signature for loan agreement
9. Additional Pages: Reject Page, IDology Page, Pend Pages

KEY AREAS TO ANALYZE:
- Channel-specific changes (ORG, RF, RA, PS, affiliates)
- Originator-specific differences (ADF vs FEB)
- Application page modifications
- A/B testing implementations
- Email template changes (consider originator differences)
- Disclosure updates (especially origination fee disclosures)
- Compliance requirements
- Legal disclaimers and APR rules
"""

def get_product_context():
    """Returns the Personify product context for AI analysis"""
    return PERSONIFY_CONTEXT

from rest_framework import status

from rest_framework.decorators import api_view, permission_classes

from rest_framework.permissions import IsAuthenticated

from rest_framework.response import Response

from django.conf import settings

from django.shortcuts import get_object_or_404

import logging

import os

import datetime



from apps.versioning.models import FileVersion, CreativeAsset

from .models import AIAnalysis, DiffAnalysis, JIRAIntegration, TestCaseGeneration

from .serializers import (

    AIAnalysisSerializer, SummarizeRequestSerializer,

    CompareRequestSerializer, AnalyzeContentRequestSerializer

)

from .services.pdf_extractor import PDFExtractor

from .services.ai_provider import OpenAIProvider

from .services.mock_provider import MockProvider

from .services.jira_service import JIRAService

from .services.excel_service import ExcelService



logger = logging.getLogger(__name__)





def get_ai_provider():

    """Get configured AI provider instance"""

    provider_type = getattr(settings, 'AI_PROVIDER', 'mock').lower()

    

    logger.info(f"Initializing AI provider: {provider_type}")

    

    if provider_type == 'mock':

        logger.info("Using Mock AI Provider (no API costs)")

        return MockProvider()

    

    elif provider_type == 'openai':

        api_key = getattr(settings, 'OPENAI_API_KEY', '')

        logger.info(f"OpenAI API key length: {len(api_key) if api_key else 0}")

        if not api_key:

            logger.error("OPENAI_API_KEY is empty or not set")

            raise ValueError("OPENAI_API_KEY not configured in settings")

        logger.info("Creating OpenAI provider instance")

        return OpenAIProvider(api_key)

    

    elif provider_type == 'anthropic':

        # Lazy import to avoid ImportError when anthropic library isn't installed

        try:

            from .services.ai_provider import AnthropicProvider

        except ImportError:

            logger.error("Anthropic library not installed. Run: pip install anthropic")

            raise ValueError("Anthropic provider selected but anthropic library not installed. Run: pip install anthropic")

        

        api_key = getattr(settings, 'ANTHROPIC_API_KEY', '')

        logger.info(f"Anthropic API key length: {len(api_key) if api_key else 0}")

        if not api_key:

            logger.error("ANTHROPIC_API_KEY is empty or not set")

            raise ValueError("ANTHROPIC_API_KEY not configured in settings")

        logger.info("Creating Anthropic Claude provider instance")

        return AnthropicProvider(api_key)

    

    else:

        raise ValueError(f"Unsupported AI provider: {provider_type}. Use 'mock', 'openai', or 'anthropic'")





@api_view(['POST'])

@permission_classes([IsAuthenticated])

def summarize_document(request):

    """

    Generate AI-powered summary of document

    POST /api/ai-engine/summarize/

    """

    serializer = SummarizeRequestSerializer(data=request.data)

    if not serializer.is_valid():

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    

    version_id = serializer.validated_data['version_id']

    detail_level = serializer.validated_data['detail_level']

    

    try:

        # Get the file version

        version = get_object_or_404(FileVersion, id=version_id)

        asset = version.asset

        

        # Check if we have cached analysis

        cached_analysis = AIAnalysis.objects.filter(

            version=version,

            analysis_type='summary'

        ).first()

        

        if cached_analysis:

            logger.info(f"Returning cached summary for version {version_id}")

            return Response({

                'cached': True,

                'summary': cached_analysis.result,

                'cpi_id': cached_analysis.cpi_id,

                'tokens_used': cached_analysis.tokens_used,

                'processing_time': cached_analysis.processing_time

            })

        

        # Extract PDF text

        pdf_path = version.file.path

        if not os.path.exists(pdf_path):

            return Response(

                {'error': 'PDF file not found'},

                status=status.HTTP_404_NOT_FOUND

            )

        

        extractor = PDFExtractor()

        pdf_data = extractor.extract_full_text(pdf_path)

        

        # Extract CPI ID from filename first, then fallback to content

        cpi_id = extractor.find_cpi_id_from_filename(pdf_path)

        if not cpi_id:

            cpi_id = extractor.find_cpi_id(pdf_path)

        

        # Generate AI summary

        ai_provider = get_ai_provider()

        result = ai_provider.summarize_text(pdf_data['full_text'], detail_level)

        

        # Add PDF metadata to summary

        summary_data = result['summary']

        summary_data['pages'] = pdf_data['total_pages']

        summary_data['cpi_id'] = cpi_id

        

        # Save analysis to database

        analysis = AIAnalysis.objects.create(

            asset=asset,

            version=version,

            analysis_type='summary',

            result=summary_data,

            cpi_id=cpi_id,

            created_by=request.user,

            tokens_used=result['tokens_used'],

            processing_time=result['processing_time']

        )

        

        return Response({

            'cached': False,

            'summary': summary_data,

            'cpi_id': cpi_id,

            'tokens_used': result['tokens_used'],

            'processing_time': result['processing_time']

        })

    

    except FileVersion.DoesNotExist:

        return Response(

            {'error': 'File version not found'},

            status=status.HTTP_404_NOT_FOUND

        )

    except Exception as e:

        logger.error(f"Error in summarize_document: {e}")

        return Response(

            {'error': str(e)},

            status=status.HTTP_500_INTERNAL_SERVER_ERROR

        )





@api_view(['POST'])

@permission_classes([IsAuthenticated])

def compare_versions(request):

    """

    Compare AS-IS and TO-BE versions

    POST /api/ai-engine/compare/

    """

    serializer = CompareRequestSerializer(data=request.data)

    if not serializer.is_valid():

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    

    as_is_id = serializer.validated_data['as_is_version_id']

    to_be_id = serializer.validated_data['to_be_version_id']

    

    try:

        # Get versions

        as_is_version = get_object_or_404(FileVersion, id=as_is_id)

        to_be_version = get_object_or_404(FileVersion, id=to_be_id)

        

        # Check for cached diff

        cached_diff = DiffAnalysis.objects.filter(

            as_is_version=as_is_version,

            to_be_version=to_be_version

        ).first()

        

        if cached_diff:

            logger.info(f"Returning cached diff analysis")

            return Response({

                'cached': True,

                'diff_summary': cached_diff.diff_summary,

                'changes_count': cached_diff.changes_count,

                'pages_affected': cached_diff.pages_affected,

                'severity_score': cached_diff.severity_score

            })

        

        # Extract text from both versions

        extractor = PDFExtractor()

        

        as_is_path = as_is_version.file.path

        to_be_path = to_be_version.file.path

        

        if not os.path.exists(as_is_path) or not os.path.exists(to_be_path):

            return Response(

                {'error': 'One or both PDF files not found'},

                status=status.HTTP_404_NOT_FOUND

            )

        

        as_is_data = extractor.extract_full_text(as_is_path)

        to_be_data = extractor.extract_full_text(to_be_path)

        

        # Generate AI diff analysis

        ai_provider = get_ai_provider()

        result = ai_provider.analyze_diff(

            as_is_data['full_text'],

            to_be_data['full_text']

        )

        

        diff_summary = result['diff_summary']

        

        # Extract pages affected from changes

        pages_affected = list(set([

            change.get('page', 0)

            for change in diff_summary.get('changes', [])

            if change.get('page')

        ]))

        

        # Save diff analysis

        diff_analysis = DiffAnalysis.objects.create(

            as_is_version=as_is_version,

            to_be_version=to_be_version,

            diff_summary=diff_summary,

            changes_count=diff_summary.get('total_changes', 0),

            pages_affected=pages_affected,

            severity_score=diff_summary.get('severity_score', 5.0),

            created_by=request.user

        )

        

        return Response({

            'cached': False,

            'diff_summary': diff_summary,

            'changes_count': diff_analysis.changes_count,

            'pages_affected': pages_affected,

            'severity_score': diff_analysis.severity_score,

            'tokens_used': result['tokens_used'],

            'processing_time': result['processing_time']

        })

    

    except FileVersion.DoesNotExist:

        return Response(

            {'error': 'One or both file versions not found'},

            status=status.HTTP_404_NOT_FOUND

        )

    except Exception as e:

        logger.error(f"Error in compare_versions: {e}")

        return Response(

            {'error': str(e)},

            status=status.HTTP_500_INTERNAL_SERVER_ERROR

        )





@api_view(['POST'])

@permission_classes([IsAuthenticated])

def analyze_content(request):

    """

    Analyze content for language improvements and compliance

    POST /api/ai-engine/analyze-content/

    """

    serializer = AnalyzeContentRequestSerializer(data=request.data)

    if not serializer.is_valid():

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    

    version_id = serializer.validated_data['version_id']

    analysis_types = serializer.validated_data['analysis_types']

    

    try:

        version = get_object_or_404(FileVersion, id=version_id)

        asset = version.asset

        

        # Check cache

        cached_analysis = AIAnalysis.objects.filter(

            version=version,

            analysis_type='content_analysis'

        ).first()

        

        if cached_analysis:

            return Response({

                'cached': True,

                'analysis': cached_analysis.result,

                'tokens_used': cached_analysis.tokens_used,

                'processing_time': cached_analysis.processing_time

            })

        

        # Extract PDF text

        pdf_path = version.file.path

        if not os.path.exists(pdf_path):

            return Response(

                {'error': 'PDF file not found'},

                status=status.HTTP_404_NOT_FOUND

            )

        

        extractor = PDFExtractor()

        pdf_data = extractor.extract_full_text(pdf_path)

        

        # Generate AI content analysis

        ai_provider = get_ai_provider()

        result = ai_provider.analyze_content(pdf_data['full_text'], analysis_types)

        

        # Save analysis

        analysis = AIAnalysis.objects.create(

            asset=asset,

            version=version,

            analysis_type='content_analysis',

            result=result['analysis'],

            created_by=request.user,

            tokens_used=result['tokens_used'],

            processing_time=result['processing_time']

        )

        

        return Response({

            'cached': False,

            'analysis': result['analysis'],

            'tokens_used': result['tokens_used'],

            'processing_time': result['processing_time']

        })

    

    except FileVersion.DoesNotExist:

        return Response(

            {'error': 'File version not found'},

            status=status.HTTP_404_NOT_FOUND

        )

    except Exception as e:

        logger.error(f"Error in analyze_content: {e}")

        return Response(

            {'error': str(e)},

            status=status.HTTP_500_INTERNAL_SERVER_ERROR

        )





@api_view(['GET'])

@permission_classes([IsAuthenticated])

def list_analyses(request):

    """

    List all AI analyses for user's assets

    GET /api/ai-engine/analyses/

    """

    try:

        analyses = AIAnalysis.objects.filter(

            created_by=request.user

        ).select_related('asset', 'version')[:50]

        

        serializer = AIAnalysisSerializer(analyses, many=True)

        return Response(serializer.data)

    

    except Exception as e:

        logger.error(f"Error listing analyses: {e}")

        return Response(

            {'error': str(e)},

            status=status.HTTP_500_INTERNAL_SERVER_ERROR

        )





@api_view(['GET'])

@permission_classes([IsAuthenticated])

def test_jira_connection(request):

    """

    Test JIRA connection and search

    GET /api/ai-engine/test-jira/?cpi_id=CPI-3632

    """

    cpi_id = request.GET.get('cpi_id', 'CPI-3632')

    

    try:

        jira_service = JIRAService()

        

        # Test 1: Check if client is initialized

        if not jira_service.client:

            return Response({

                'error': 'JIRA client not initialized',

                'details': 'Check JIRA_SERVER, JIRA_EMAIL, and JIRA_API_TOKEN in .env'

            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        

        # Test 2: Get server info

        try:

            server_info = jira_service.client.server_info()

            logger.info(f"JIRA server info: {server_info}")

        except Exception as e:

            return Response({

                'error': 'Failed to connect to JIRA server',

                'details': str(e)

            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        

        # Test 3: Search for ticket

        ticket = jira_service.search_ticket_by_cpi(cpi_id)

        

        if ticket:

            return Response({

                'success': True,

                'message': f'JIRA connection successful! Found ticket for {cpi_id}',

                'server': jira_service.server,

                'ticket': ticket

            })

        else:

            # Test 4: Try to list some recent tickets to verify access

            try:

                recent_issues = jira_service.client.search_issues('order by created DESC', maxResults=5)

                recent_tickets = [{'key': i.key, 'summary': i.fields.summary} for i in recent_issues]

                

                return Response({

                    'success': False,

                    'message': f'JIRA connection works but no ticket found for {cpi_id}',

                    'server': jira_service.server,

                    'cpi_id_searched': cpi_id,

                    'suggestion': f'Create a JIRA ticket with "{cpi_id}" in the summary or description',

                    'recent_tickets': recent_tickets,

                    'note': 'You have access to JIRA. The issue is that no ticket contains the CPI ID.'

                })

            except Exception as e:

                return Response({

                    'success': False,

                    'message': 'JIRA connection works but cannot search tickets',

                    'error': str(e)

                })

    

    except Exception as e:

        logger.error(f"Error testing JIRA connection: {e}")

        return Response({

            'error': str(e),

            'details': 'Check Django logs for more information'

        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)





@api_view(['POST'])

@permission_classes([IsAuthenticated])
def post_to_jira(request):
    """
    Post AI-generated acceptance criteria to JIRA ticket.

    Available to all authenticated users.

    """
    
    version_id = request.data.get('version_id')

    cpi_id = request.data.get('cpi_id')

    

    if not version_id:

        return Response(

            {'error': 'version_id is required'},

            status=status.HTTP_400_BAD_REQUEST

        )

    

    try:

        version = get_object_or_404(FileVersion, id=version_id)

        asset = version.asset

        

        # Get or create summary

        analysis = AIAnalysis.objects.filter(

            version=version,

            analysis_type='summary'

        ).first()

        

        if not analysis:

            # Generate summary if not exists

            pdf_path = version.file.path

            if not os.path.exists(pdf_path):

                return Response(

                    {'error': 'PDF file not found'},

                    status=status.HTTP_404_NOT_FOUND

                )

            

            extractor = PDFExtractor()

            pdf_data = extractor.extract_full_text(pdf_path)

            

            # Extract CPI ID from filename first, then fallback to content

            detected_cpi = extractor.find_cpi_id_from_filename(pdf_path)

            if not detected_cpi:

                detected_cpi = extractor.find_cpi_id(pdf_path)

            

            ai_provider = get_ai_provider()

            result = ai_provider.summarize_text(pdf_data['full_text'], 'brief')

            

            summary_data = result['summary']

            summary_data['pages'] = pdf_data['total_pages']

            summary_data['cpi_id'] = detected_cpi

            

            analysis = AIAnalysis.objects.create(

                asset=asset,

                version=version,

                analysis_type='summary',

                result=summary_data,

                cpi_id=detected_cpi,

                created_by=request.user,

                tokens_used=result['tokens_used'],

                processing_time=result['processing_time']

            )

            cpi_id = detected_cpi

        else:

            # If analysis exists but no CPI ID, try to extract from filename

            if not analysis.cpi_id:

                pdf_path = version.file.path

                extractor = PDFExtractor()

                detected_cpi = extractor.find_cpi_id_from_filename(pdf_path)

                if detected_cpi:

                    analysis.cpi_id = detected_cpi

                    analysis.save()

                    cpi_id = detected_cpi

            else:

                cpi_id = cpi_id or analysis.cpi_id

        

        if not cpi_id:

            return Response(

                {'error': 'No CPI ID found in filename or document content. Please ensure filename contains pattern "CPI-XXX".'},

                status=status.HTTP_400_BAD_REQUEST

            )

        

        # Search for JIRA ticket

        jira_service = JIRAService()

        ticket = jira_service.search_ticket_by_cpi(cpi_id)

        

        if not ticket:

            return Response(

                {'error': f'No JIRA ticket found for CPI ID: {cpi_id}'},

                status=status.HTTP_404_NOT_FOUND

            )

        

        # Get content analysis for enhanced acceptance criteria

        content_analysis = None

        try:

            content_analysis_obj = AIAnalysis.objects.filter(

                asset=asset,

                analysis_type='content_analysis'

            ).order_by('-created_at').first()

            if content_analysis_obj:

                content_analysis = content_analysis_obj.result

        except:

            pass

        

        # Format and post acceptance criteria comment

        comment_text = jira_service.format_acceptance_criteria(

            summary_data=analysis.result,

            analysis_data=content_analysis,

            cpi_id=cpi_id

        )

        comment = jira_service.post_comment(ticket['key'], comment_text)

        

        # Save JIRA integration record

        jira_integration = JIRAIntegration.objects.create(

            asset=asset,

            cpi_id=cpi_id,

            jira_ticket_key=ticket['key'],

            jira_comment_id=comment.get('id', ''),

            summary_posted=True

        )

        

        return Response({

            'success': True,

            'ticket_key': ticket['key'],

            'ticket_url': ticket['url'],

            'comment_url': comment['url'],

            'cpi_id': cpi_id

        })

    

    except ValueError as e:

        return Response(

            {'error': str(e)},

            status=status.HTTP_400_BAD_REQUEST

        )

    except Exception as e:

        logger.error(f"Error posting to JIRA: {e}")

        return Response(

            {'error': str(e)},

            status=status.HTTP_500_INTERNAL_SERVER_ERROR

        )





@api_view(['POST'])

@permission_classes([IsAuthenticated])

def generate_test_cases(request):

    """

    Generate test cases from diff analysis

    POST /api/ai-engine/generate-tests/

    """

    as_is_id = request.data.get('as_is_version_id')

    to_be_id = request.data.get('to_be_version_id')

    attach_to_jira = request.data.get('attach_to_jira', False)

    

    if not as_is_id or not to_be_id:

        return Response(

            {'error': 'Both as_is_version_id and to_be_version_id are required'},

            status=status.HTTP_400_BAD_REQUEST

        )

    

    try:

        as_is_version = get_object_or_404(FileVersion, id=as_is_id)

        to_be_version = get_object_or_404(FileVersion, id=to_be_id)

        

        # Get or create diff analysis

        diff_analysis = DiffAnalysis.objects.filter(

            as_is_version=as_is_version,

            to_be_version=to_be_version

        ).first()

        

        if not diff_analysis:

            # Generate diff if not exists

            extractor = PDFExtractor()

            as_is_data = extractor.extract_full_text(as_is_version.file.path)

            to_be_data = extractor.extract_full_text(to_be_version.file.path)

            

            ai_provider = get_ai_provider()

            result = ai_provider.analyze_diff(

                as_is_data['full_text'],

                to_be_data['full_text']

            )

            

            diff_summary = result['diff_summary']

            pages_affected = list(set([

                change.get('page', 0)

                for change in diff_summary.get('changes', [])

                if change.get('page')

            ]))

            

            diff_analysis = DiffAnalysis.objects.create(

                as_is_version=as_is_version,

                to_be_version=to_be_version,

                diff_summary=diff_summary,

                changes_count=diff_summary.get('total_changes', 0),

                pages_affected=pages_affected,

                severity_score=diff_summary.get('severity_score', 5.0),

                created_by=request.user

            )

        

        # Generate test cases with risk areas and regression scope
        # Extract full PDF text for detailed analysis
        extractor = PDFExtractor()
        as_is_data = extractor.extract_full_text(as_is_version.file.path)
        to_be_data = extractor.extract_full_text(to_be_version.file.path)

        ai_provider = get_ai_provider()

        test_result = ai_provider.generate_test_cases(
            diff_analysis.diff_summary,
            as_is_text=as_is_data['full_text'],
            to_be_text=to_be_data['full_text']
        )

        test_cases = test_result['test_cases']

        risk_areas = test_result.get('risk_areas')

        regression_scope = test_result.get('regression_scope')
        
        qa_validation_scope = test_result.get('qa_validation_scope', [])

        

        # Create Excel file with enhanced data

        filename = f"test_cases_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

        excel_service = ExcelService()

        excel_data = excel_service.create_test_cases_excel(

            test_cases, 

            risk_areas=risk_areas,

            regression_scope=regression_scope,

            filename=filename

        )

        

        # Save test case generation record

        test_gen = TestCaseGeneration.objects.create(

            diff_analysis=diff_analysis,

            test_cases=test_cases,

            excel_file=excel_data['file_path'],

            created_by=request.user

        )

        

        # Build full URL for Excel file
        excel_url = request.build_absolute_uri(excel_data['file_url'])
        
        response_data = {

            'success': True,

            'test_cases': test_cases,

            'risk_areas': risk_areas,

            'regression_scope': regression_scope,
            
            'qa_validation_scope': qa_validation_scope,

            'excel_url': excel_url,

            'excel_filename': excel_data['filename'],

            'tokens_used': test_result['tokens_used'],

            'processing_time': test_result['processing_time']

        }

        

        # Attach to JIRA if requested

        if attach_to_jira:

            extractor = PDFExtractor()

            # Extract CPI ID from filename first, then fallback to content

            cpi_id = extractor.find_cpi_id_from_filename(to_be_version.file.path)

            if not cpi_id:

                cpi_id = extractor.find_cpi_id(to_be_version.file.path)

            

            if cpi_id:

                try:

                    jira_service = JIRAService()

                    ticket = jira_service.search_ticket_by_cpi(cpi_id)

                    

                    if ticket:

                        attachment = jira_service.attach_file(

                            ticket['key'],

                            excel_data['file_path'],

                            excel_data['filename']

                        )

                        

                        test_gen.jira_attached = True

                        test_gen.save()

                        

                        response_data['jira_ticket'] = ticket['key']

                        response_data['jira_url'] = ticket['url']

                        response_data['attachment_url'] = attachment['url']

                except Exception as jira_error:

                    logger.warning(f"Failed to attach to JIRA: {jira_error}")

                    response_data['jira_error'] = str(jira_error)

        

        return Response(response_data)

    

    except FileVersion.DoesNotExist:

        return Response(

            {'error': 'One or both file versions not found'},

            status=status.HTTP_404_NOT_FOUND

        )

    except Exception as e:

        logger.error(f"Error generating test cases: {e}")

        return Response(

            {'error': str(e)},

            status=status.HTTP_500_INTERNAL_SERVER_ERROR

        )


@api_view(['POST'])

@permission_classes([IsAuthenticated])

def generate_test_cases_single(request):

    """

    Generate test cases from a single PDF document

    POST /api/ai-engine/generate-tests-single/

    """

    version_id = request.data.get('version_id')

    

    if not version_id:

        return Response(

            {'error': 'version_id is required'},

            status=status.HTTP_400_BAD_REQUEST

        )

    

    try:

        # Get the file version

        version = get_object_or_404(FileVersion, id=version_id)

        

        # Extract full PDF text

        extractor = PDFExtractor()

        pdf_data = extractor.extract_full_text(version.file.path)

        

        # Generate test cases using AI

        ai_provider = get_ai_provider()

        

        # Create a mock diff_data structure for single PDF

        diff_data = {

            'changes': [

                {'description': 'Analyze entire PDF document for test scenarios', 'type': 'full_document'}

            ],

            'total_changes': 1

        }

        

        test_result = ai_provider.generate_test_cases(

            diff_data,

            as_is_text="",  # No AS-IS for single PDF

            to_be_text=pdf_data['full_text']  # Use current PDF as TO-BE

        )



        test_cases = test_result['test_cases']

        qa_validation_scope = test_result.get('qa_validation_scope', [])

        

        # Create Excel file

        filename = f"test_cases_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

        excel_service = ExcelService()

        excel_data = excel_service.create_test_cases_excel(

            test_cases, 

            risk_areas=None,

            regression_scope=None,

            filename=filename

        )

        

        # Save test case generation record

        test_gen = TestCaseGeneration.objects.create(

            diff_analysis=None,  # No diff analysis for single PDF

            version=version,  # Store the version for single PDF

            test_cases=test_cases,

            excel_file=excel_data['file_path'],

            created_by=request.user

        )

        

        # Build full URL for Excel file
        excel_url = request.build_absolute_uri(excel_data['file_url'])
        
        response_data = {

            'success': True,

            'test_cases': test_cases,

            'qa_validation_scope': qa_validation_scope,

            'excel_url': excel_url,

            'excel_filename': excel_data['filename'],

            'tokens_used': test_result['tokens_used'],

            'processing_time': test_result['processing_time']

        }

        

        return Response(response_data)

        

    except FileVersion.DoesNotExist:

        return Response(

            {'error': 'File version not found'},

            status=status.HTTP_404_NOT_FOUND

        )

    except Exception as e:

        logger.error(f"Error generating test cases from single PDF: {e}")

        return Response(

            {'error': str(e)},

            status=status.HTTP_500_INTERNAL_SERVER_ERROR

        )

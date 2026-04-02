from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.shortcuts import get_object_or_404
import logging
import os

from apps.versioning.models import FileVersion, CreativeAsset
from .models import AIAnalysis, DiffAnalysis
from .serializers import (
    AIAnalysisSerializer, SummarizeRequestSerializer,
    CompareRequestSerializer, AnalyzeContentRequestSerializer
)
from .services.pdf_extractor import PDFExtractor
from .services.ai_provider import OpenAIProvider
from .services.mock_provider import MockProvider

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

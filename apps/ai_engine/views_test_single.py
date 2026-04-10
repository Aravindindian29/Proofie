# Temporary file to add new endpoint - will be merged into views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from apps.versioning.models import FileVersion
from .services.pdf_extractor import PDFExtractor
from .services.ai_provider import get_ai_provider
from .services.excel_service import ExcelService
from .models import TestCaseGeneration
import datetime
import logging

logger = logging.getLogger(__name__)


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
            test_cases=test_cases,
            excel_file=excel_data['file_path'],
            created_by=request.user
        )
        
        response_data = {
            'success': True,
            'test_cases': test_cases,
            'qa_validation_scope': qa_validation_scope,
            'excel_url': excel_data['file_url'],
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

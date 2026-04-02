from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Annotation, AnnotationReply, AnnotationMention
from .serializers import AnnotationSerializer, AnnotationCreateSerializer, AnnotationReplySerializer
from apps.versioning.models import FileVersion


class AnnotationViewSet(viewsets.ModelViewSet):
    serializer_class = AnnotationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Accept both 'version' and 'version_id' for backward compatibility
        version_id = self.request.query_params.get('version') or self.request.query_params.get('version_id')
        
        if version_id:
            return Annotation.objects.filter(
                version_id=version_id,
                version__asset__project__members__user=user
            ).distinct() | Annotation.objects.filter(
                version_id=version_id,
                version__asset__project__owner=user
            ).distinct()
        
        return Annotation.objects.filter(
            version__asset__project__owner=user
        ).distinct() | Annotation.objects.filter(
            version__asset__project__members__user=user
        ).distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return AnnotationCreateSerializer
        return AnnotationSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        annotation = self.get_object()
        annotation.is_resolved = True
        annotation.resolved_at = timezone.now()
        annotation.resolved_by = request.user
        annotation.save()

        serializer = self.get_serializer(annotation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def unresolve(self, request, pk=None):
        annotation = self.get_object()
        annotation.is_resolved = False
        annotation.resolved_at = None
        annotation.resolved_by = None
        annotation.save()

        serializer = self.get_serializer(annotation)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_reply(self, request, pk=None):
        annotation = self.get_object()
        content = request.data.get('content')

        if not content:
            return Response(
                {'detail': 'Content is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reply = AnnotationReply.objects.create(
            annotation=annotation,
            author=request.user,
            content=content
        )

        serializer = AnnotationReplySerializer(reply)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def replies(self, request, pk=None):
        annotation = self.get_object()
        replies = annotation.replies.all()
        serializer = AnnotationReplySerializer(replies, many=True)
        return Response(serializer.data)

from rest_framework import serializers
from .models import Annotation, AnnotationReply, AnnotationMention
from apps.versioning.serializers import UserBasicSerializer


class AnnotationReplySerializer(serializers.ModelSerializer):
    author = UserBasicSerializer(read_only=True)

    class Meta:
        model = AnnotationReply
        fields = ['id', 'author', 'content', 'created_at', 'updated_at']


class AnnotationMentionSerializer(serializers.ModelSerializer):
    mentioned_user = UserBasicSerializer(read_only=True)

    class Meta:
        model = AnnotationMention
        fields = ['id', 'mentioned_user', 'created_at']


class AnnotationSerializer(serializers.ModelSerializer):
    author = UserBasicSerializer(read_only=True)
    resolved_by = UserBasicSerializer(read_only=True)
    replies = AnnotationReplySerializer(many=True, read_only=True)
    mentions = AnnotationMentionSerializer(many=True, read_only=True)

    class Meta:
        model = Annotation
        fields = [
            'id', 'version', 'author', 'annotation_type', 'x_coordinate', 'y_coordinate',
            'page_number', 'content', 'color', 'created_at', 'updated_at', 'is_resolved',
            'resolved_at', 'resolved_by', 'replies', 'mentions'
        ]


class AnnotationCreateSerializer(serializers.ModelSerializer):
    mentioned_user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Annotation
        fields = [
            'version', 'annotation_type', 'x_coordinate', 'y_coordinate',
            'page_number', 'content', 'color', 'mentioned_user_ids'
        ]

    def create(self, validated_data):
        mentioned_user_ids = validated_data.pop('mentioned_user_ids', [])
        annotation = Annotation.objects.create(**validated_data)
        
        for user_id in mentioned_user_ids:
            AnnotationMention.objects.create(annotation=annotation, mentioned_user_id=user_id)
        
        return annotation

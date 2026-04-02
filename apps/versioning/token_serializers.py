from rest_framework import serializers
from .token_models import AssetShareToken, AssetAccessToken


class AssetShareTokenSerializer(serializers.ModelSerializer):
    share_url = serializers.SerializerMethodField()
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    has_password = serializers.SerializerMethodField()
    
    class Meta:
        model = AssetShareToken
        fields = [
            'id', 'token', 'asset', 'asset_name', 'created_by', 'created_by_username',
            'created_at', 'expires_at', 'is_active', 'max_uses', 'use_count',
            'can_download', 'can_view', 'can_comment', 'allowed_domains', 'has_password',
            'share_url'
        ]
        read_only_fields = ['token', 'created_at', 'use_count', 'share_url']
    
    def get_share_url(self, obj):
        request = self.context.get('request')
        return obj.get_share_url(request)
    
    def get_has_password(self, obj):
        return bool(obj.password)
    
    def create(self, validated_data):
        # Generate token if not provided
        if 'token' not in validated_data:
            token = AssetShareToken.generate_token(
                validated_data['asset'],
                validated_data['created_by'],
                validated_data.get('expires_in_hours', 24)
            )
            # Update with additional validated data
            for key, value in validated_data.items():
                if key not in ['asset', 'created_by', 'expires_in_hours']:
                    setattr(token, key, value)
            token.save()
            return token
        return super().create(validated_data)


class AssetAccessTokenSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = AssetAccessToken
        fields = [
            'id', 'token', 'asset', 'asset_name', 'user', 'user_username',
            'created_at', 'expires_at', 'purpose'
        ]
        read_only_fields = ['token', 'created_at', 'expires_at']


class CreateShareTokenSerializer(serializers.Serializer):
    asset_id = serializers.IntegerField()
    expires_in_hours = serializers.IntegerField(default=24, min_value=1, max_value=8760)
    max_uses = serializers.IntegerField(required=False, allow_null=True, min_value=1)
    can_download = serializers.BooleanField(default=True)
    can_view = serializers.BooleanField(default=True)
    can_comment = serializers.BooleanField(default=False)
    allowed_domains = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    def validate_asset_id(self, value):
        from .models import CreativeAsset
        try:
            asset = CreativeAsset.objects.get(id=value)
            return asset
        except CreativeAsset.DoesNotExist:
            raise serializers.ValidationError("Asset not found")
    
    def create(self, validated_data):
        asset = validated_data.pop('asset_id')
        user = self.context['request'].user
        password = validated_data.pop('password', None)
        
        # Create token
        token = AssetShareToken.generate_token(
            asset, user, validated_data.pop('expires_in_hours', 24), **validated_data
        )
        
        # Set password if provided
        if password:
            token.set_password(password)
            token.save()
        
        return token

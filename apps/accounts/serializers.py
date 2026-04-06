from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, EmailVerification


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'role', 'avatar', 'bio', 'phone', 'company', 'job_title', 
            'created_at', 'updated_at', 'permissions_updated_at',
            # Proof Permissions
            'can_create_proof',
            # Folder Permissions
            'can_create_folder', 'can_add_delete_member', 'can_edit_folder', 
            'can_add_delete_proof', 'can_delete_folder',
            # Inside Folder Permissions
            'can_delete_proof_in_folder',
            # Proof Preview Permissions
            'can_use_proofieplus', 'can_add_comment', 'can_delete_proof_in_preview',
            'can_make_decisions'
        ]


class UserDetailSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=12)
    password_confirm = serializers.CharField(write_only=True, min_length=12)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        
        # Create email verification
        EmailVerification.objects.create(
            user=user,
            token=self.generate_verification_token()
        )
        
        return user
    
    def generate_verification_token(self):
        import uuid
        return str(uuid.uuid4())

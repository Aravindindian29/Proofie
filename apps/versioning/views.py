from rest_framework import viewsets, status, permissions

from rest_framework.decorators import action

from rest_framework.response import Response

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django.shortcuts import get_object_or_404

from django.db.models import Q

from django.http import HttpResponse, JsonResponse

from django.conf import settings

from django.contrib.auth.models import User

import os

from .models import Project, ProjectMember, CreativeAsset, FileVersion, VersionComment, Folder, FolderMember

from .serializers import (

    ProjectSerializer, ProjectMemberSerializer, CreativeAssetSerializer,

    FileVersionSerializer, FileVersionUploadSerializer, VersionCommentSerializer,

    FolderSerializer, FolderMemberSerializer

)

from .permissions import (

    CanCreateContent, CanEditContent, CanDeleteContent, CanViewContent,

    can_create_folder, CanCreateFolder

)





class ProjectViewSet(viewsets.ModelViewSet):

    serializer_class = ProjectSerializer

    permission_classes = [permissions.IsAuthenticated]

    parser_classes = (JSONParser, MultiPartParser, FormParser)



    def get_permissions(self):

        """Apply different permissions based on action"""

        if self.action in ['create']:

            return [permissions.IsAuthenticated(), CanCreateContent()]

        elif self.action in ['update', 'partial_update']:

            return [permissions.IsAuthenticated(), CanEditContent()]

        elif self.action in ['destroy']:

            return [permissions.IsAuthenticated(), CanDeleteContent()]

        elif self.action in ['retrieve', 'list']:

            return [permissions.IsAuthenticated(), CanViewContent()]

        else:

            return [permissions.IsAuthenticated()]



    def get_serializer_context(self):

        """Pass request context to serializer for building absolute URIs"""

        context = super().get_serializer_context()

        context['request'] = self.request

        return context



    def get_queryset(self):

        """Return projects based on user role and permissions"""

        from .permissions import get_user_accessible_projects

        return get_user_accessible_projects(self.request.user).prefetch_related('members', 'assets', 'assets__versions')



    def perform_create(self, serializer):

        serializer.save(owner=self.request.user)

    

    def update(self, request, *args, **kwargs):

        """Update project and broadcast folder changes if folder_id changed"""

        project = self.get_object()

        old_folder_id = project.folder_id

        

        response = super().update(request, *args, **kwargs)

        project.refresh_from_db()

        new_folder_id = project.folder_id

        

        # If folder changed, broadcast updates

        if old_folder_id != new_folder_id:

            from .services import FolderUpdateService

            

            # Broadcast removal from old folder

            if old_folder_id:

                try:

                    old_folder = Folder.objects.get(id=old_folder_id)

                    FolderUpdateService.broadcast_folder_update(

                        old_folder,

                        'proof_removed',

                        {'project_id': project.id, 'project_name': project.name}

                    )

                except Folder.DoesNotExist:

                    pass

            

            # Broadcast addition to new folder and auto-add reviewers

            if new_folder_id:

                try:

                    new_folder = Folder.objects.get(id=new_folder_id)

                    

                    # Auto-add project reviewers as folder members

                    for member in project.members.all():

                        FolderMember.objects.get_or_create(

                            folder=new_folder,

                            user=member.user,

                            defaults={'role': 'viewer', 'added_by': request.user}

                        )

                    

                    FolderUpdateService.broadcast_folder_update(

                        new_folder,

                        'proof_added',

                        {'project_id': project.id, 'project_name': project.name}

                    )

                except Folder.DoesNotExist:

                    pass

        

        return response



    def create(self, request, *args, **kwargs):

        try:

            # Handle folder creation if folder_name is provided

            folder = None

            folder_name = request.data.get('folder_name')

            if folder_name and folder_name.strip():

                # Check if user has permission to create folders

                if not can_create_folder(request.user):

                    return Response(

                        {

                            'error': 'You do not have permission to perform this action.',

                            'detail': 'Please contact your administrator for assistance.'

                        },

                        status=status.HTTP_403_FORBIDDEN

                    )

                # Get or create folder for this user

                folder, created = Folder.objects.get_or_create(

                    name=folder_name.strip(),

                    owner=request.user,

                    defaults={'is_active': True}

                )

            

            # Check if folder_id is provided directly

            folder_id = request.data.get('folder_id')

            if folder_id and not folder:

                try:

                    folder = Folder.objects.get(id=folder_id, owner=request.user)

                except Folder.DoesNotExist:

                    pass

            

            # Prepare data for serializer

            data = request.data.copy()

            if folder:

                data['folder_id'] = folder.id

            

            serializer = self.get_serializer(data=data)

            if not serializer.is_valid():

                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            

            self.perform_create(serializer)

            

            # Handle reviewers - create ProjectMember entries

            reviewers = request.data.get('reviewers', [])

            project = serializer.instance

            for user_id in reviewers:

                try:

                    user = User.objects.get(id=user_id)

                    ProjectMember.objects.get_or_create(

                        project=project,

                        user=user,

                        defaults={'role': 'reviewer'}

                    )

                    

                    # Auto-add reviewers as folder members if project is in a folder

                    if folder:

                        FolderMember.objects.get_or_create(

                            folder=folder,

                            user=user,

                            defaults={'role': 'viewer', 'added_by': request.user}

                        )

                except User.DoesNotExist:

                    pass  # Skip if user doesn't exist

            

            # Broadcast proof addition to folder members if folder exists

            if folder:

                from .services import FolderUpdateService

                FolderUpdateService.broadcast_folder_update(

                    folder,

                    'proof_added',

                    {'project_id': project.id, 'project_name': project.name}

                )

            

            # Refresh serializer to include updated member data

            serializer = self.get_serializer(project)

            

            headers = self.get_success_headers(serializer.data)

            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:

            return Response(

                {'detail': f'Failed to create project: {str(e)}'}, 

                status=status.HTTP_400_BAD_REQUEST

            )



    @action(detail=True, methods=['post'])

    def add_member(self, request, pk=None):

        project = self.get_object()

        username = request.data.get('username')

        role = request.data.get('role', 'viewer')



        if project.owner != request.user:

            return Response(

                {'detail': 'Only project owner can add members.'},

                status=status.HTTP_403_FORBIDDEN

            )



        try:

            user = User.objects.get(username=username)

        except User.DoesNotExist:

            return Response(

                {'detail': f'User with username "{username}" not found.'},

                status=status.HTTP_404_NOT_FOUND

            )



        member, created = ProjectMember.objects.get_or_create(

            project=project,

            user=user,

            defaults={'role': role}

        )



        serializer = ProjectMemberSerializer(member)

        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK

        return Response(serializer.data, status=status_code)



    @action(detail=False, methods=['get'])

    def list_users(self, request):

        users = User.objects.filter(is_superuser=False).order_by('username')

        user_list = []

        for user in users:

            user_list.append({

                'id': user.id,

                'username': user.username,

                'full_name': f"{user.first_name} {user.last_name}".strip() or user.username,

                'email': user.email

            })

        return Response({'users': user_list})



    @action(detail=True, methods=['get'])

    def assets(self, request, pk=None):

        """Get all assets for this project"""

        project = self.get_object()

        assets = project.assets.all()

        serializer = CreativeAssetSerializer(assets, many=True, context={'request': request})

        return Response(serializer.data)



    @action(detail=False, methods=['get'])

    def check_username(self, request):

        username = request.GET.get('username', '').strip()

        

        if not username:

            return Response(

                {'exists': False, 'message': 'Username is required'},

                status=status.HTTP_400_BAD_REQUEST

            )

        

        exists = User.objects.filter(username=username, is_superuser=False).exists()

        

        if exists:

            user = User.objects.get(username=username, is_superuser=False)

            return Response({

                'exists': True,

                'message': f'User "{username}" found',

                'user_info': {

                    'username': user.username,

                    'email': user.email,

                    'first_name': user.first_name,

                    'last_name': user.last_name

                }

            })

        else:

            return Response({

                'exists': False,

                'message': 'Username not found'

            })



    @action(detail=True, methods=['delete'])

    def remove_member(self, request, pk=None):

        project = self.get_object()

        user_id = request.data.get('user_id')



        if project.owner != request.user:

            return Response(

                {'detail': 'Only project owner can remove members.'},

                status=status.HTTP_403_FORBIDDEN

            )



        member = get_object_or_404(ProjectMember, project=project, user_id=user_id)

        member.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)



    @action(detail=True, methods=['get'])

    def versions(self, request, pk=None):

        """Get all versions of this proof (projects with same base name)"""

        current_project = self.get_object()

        # Get base name without version suffix (e.g., "Proof V1" -> "Proof")

        base_name = current_project.name

        if ' V' in base_name and base_name.split(' V')[-1].isdigit():

            base_name = ' V'.join(base_name.split(' V')[:-1])

        # Find all projects with this base name that the user can access

        user = request.user

        all_versions = Project.objects.filter(

            Q(name__startswith=base_name) | Q(name=base_name),

            Q(owner=user) | Q(members__user=user)

        ).distinct().order_by('-version_number')

        # Find the highest version number

        highest_version = all_versions.first() if all_versions.exists() else None

        # Serialize the versions with additional info

        serializer = ProjectSerializer(all_versions, many=True, context={'request': request})

        # Add highest version info to response

        response_data = {

            'versions': serializer.data,

            'highest_version_id': highest_version.id if highest_version else None

        }

        return Response(response_data)

    @action(detail=False, methods=['post'])
    def create_with_workflow(self, request):
        """
        Create a project with workflow template and stage reviewers.
        Expected payload:
        {
            "name": "Proof Name",
            "description": "Description",
            "folder_id": 123,
            "folder_name": "New Folder",
            "template_id": 1,
            "stage_reviewers": {
                "1": [user_id1, user_id2],
                "2": [user_id3, user_id4],
                "3": [user_id5]
            }
        }
        """
        from apps.workflows.models import WorkflowTemplate, ApprovalGroup, GroupMember, ReviewCycle
        from apps.workflows.services import WorkflowService
        from django.db import transaction
        
        try:
            with transaction.atomic():
                # Handle folder creation if folder_name is provided
                folder = None
                folder_name = request.data.get('folder_name')
                if folder_name and folder_name.strip():
                    if not can_create_folder(request.user):
                        return Response(
                            {
                                'error': 'You do not have permission to perform this action.',
                                'detail': 'Please contact your administrator for assistance.'
                            },
                            status=status.HTTP_403_FORBIDDEN
                        )
                    folder, created = Folder.objects.get_or_create(
                        name=folder_name.strip(),
                        owner=request.user,
                        defaults={'is_active': True}
                    )
                
                # Check if folder_id is provided directly
                folder_id = request.data.get('folder_id')
                if folder_id and not folder:
                    try:
                        folder = Folder.objects.get(id=folder_id, owner=request.user)
                    except Folder.DoesNotExist:
                        pass
                
                # Create project
                project_data = {
                    'name': request.data.get('name'),
                    'description': request.data.get('description', ''),
                }
                if folder:
                    project_data['folder_id'] = folder.id
                
                serializer = self.get_serializer(data=project_data)
                if not serializer.is_valid():
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
                self.perform_create(serializer)
                project = serializer.instance
                
                # Get workflow template
                template_id = request.data.get('template_id')
                stage_reviewers = request.data.get('stage_reviewers', {})
                
                if template_id:
                    try:
                        template = WorkflowTemplate.objects.get(id=template_id, is_active=True)
                        
                        # Create ReviewCycle (will be associated with first asset later)
                        # For now, we'll store the template_id and stage_reviewers in project metadata
                        # The actual ReviewCycle will be created when the first asset is uploaded
                        
                        # Store workflow configuration temporarily
                        project.workflow_template_id = template_id
                        project.workflow_stage_reviewers = stage_reviewers
                        project.save(update_fields=['workflow_template_id', 'workflow_stage_reviewers'])
                        print(f"✅ Saved workflow config to project {project.id}: template={template_id}, reviewers={stage_reviewers}")
                        
                        # Add all reviewers as project members
                        all_reviewer_ids = set()
                        for stage_id, reviewer_ids in stage_reviewers.items():
                            all_reviewer_ids.update(reviewer_ids)
                        
                        for user_id in all_reviewer_ids:
                            try:
                                user = User.objects.get(id=user_id)
                                ProjectMember.objects.get_or_create(
                                    project=project,
                                    user=user,
                                    defaults={'role': 'reviewer'}
                                )
                                
                                # Auto-add reviewers as folder members if project is in a folder
                                if folder:
                                    FolderMember.objects.get_or_create(
                                        folder=folder,
                                        user=user,
                                        defaults={'role': 'viewer', 'added_by': request.user}
                                    )
                            except User.DoesNotExist:
                                pass
                        
                    except WorkflowTemplate.DoesNotExist:
                        return Response(
                            {'error': 'Workflow template not found'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                else:
                    # No template specified, add reviewers from legacy format
                    reviewers = request.data.get('reviewers', [])
                    for user_id in reviewers:
                        try:
                            user = User.objects.get(id=user_id)
                            ProjectMember.objects.get_or_create(
                                project=project,
                                user=user,
                                defaults={'role': 'reviewer'}
                            )
                            
                            if folder:
                                FolderMember.objects.get_or_create(
                                    folder=folder,
                                    user=user,
                                    defaults={'role': 'viewer', 'added_by': request.user}
                                )
                        except User.DoesNotExist:
                            pass
                
                # Broadcast proof addition to folder members if folder exists
                if folder:
                    from .services import FolderUpdateService
                    FolderUpdateService.broadcast_folder_update(
                        folder,
                        'proof_added',
                        {'project_id': project.id, 'project_name': project.name}
                    )
                
                # Refresh serializer to include updated member data
                serializer = self.get_serializer(project)
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response(
                {'detail': f'Failed to create project with workflow: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )



class CreativeAssetViewSet(viewsets.ModelViewSet):

    serializer_class = CreativeAssetSerializer

    permission_classes = [permissions.IsAuthenticated]

    parser_classes = (JSONParser, MultiPartParser, FormParser)



    def get_serializer_context(self):

        """Pass request context to serializer for building absolute URIs"""

        context = super().get_serializer_context()

        context['request'] = self.request

        return context



    def get_queryset(self):

        user = self.request.user

        project_id = self.request.query_params.get('project_id')

        

        if project_id:

            return CreativeAsset.objects.filter(

                project_id=project_id,

                project__members__user=user

            ) | CreativeAsset.objects.filter(

                project_id=project_id,

                project__owner=user

            ) | CreativeAsset.objects.filter(

                project_id=project_id,

                project__folder__members__user=user

            )

        

        return CreativeAsset.objects.filter(

            Q(project__owner=user) | 

            Q(project__members__user=user) | 

            Q(project__folder__members__user=user)

        ).distinct()



    def perform_create(self, serializer):

        serializer.save(created_by=self.request.user)



    def create(self, request, *args, **kwargs):

        try:

            print(f"CreativeAsset create request data: {request.data}")

            print(f"Request content type: {request.content_type}")

            

            # Get file type from request or determine from file

            file_type = request.data.get('file_type')

            

            serializer = self.get_serializer(data=request.data)

            if not serializer.is_valid():

                print(f"CreativeAsset serializer errors: {serializer.errors}")

                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

            

            self.perform_create(serializer)

            asset = serializer.instance

            

            # If file was uploaded, create FileVersion and update Project

            if 'file' in request.FILES:

                uploaded_file = request.FILES['file']

                

                # Determine file type from MIME type if not provided

                if not file_type:

                    mime_type = uploaded_file.content_type

                    if mime_type:

                        if 'pdf' in mime_type:

                            file_type = 'pdf'

                        elif 'image' in mime_type:

                            file_type = 'image'

                        elif 'video' in mime_type:

                            file_type = 'video'

                

                # Fallback: determine from file extension

                if not file_type and uploaded_file.name:

                    import os

                    ext = os.path.splitext(uploaded_file.name)[1].lower()

                    if ext == '.pdf':

                        file_type = 'pdf'

                    elif ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']:

                        file_type = 'image'

                    elif ext in ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']:

                        file_type = 'video'

                    print(f"File type from extension: {file_type}")

                

                # Update asset file_type

                asset.file_type = file_type

                asset.save(update_fields=['file_type'])

                

                # Refresh asset from DB to ensure file_type is properly loaded

                asset.refresh_from_db()

                print(f"Asset file_type after refresh: {asset.file_type}")

                

                # Create FileVersion - thumbnail will be generated in save() method

                version = FileVersion.objects.create(

                    asset=asset,

                    version_number=1,

                    file=uploaded_file,

                    uploaded_by=request.user,

                    change_notes='Initial upload',

                    is_current=True,

                    file_size=uploaded_file.size

                )

                

                print(f"✅ FileVersion {version.id} created")

                

                # IMPORTANT: Re-fetch version to get any thumbnail that was generated

                version = FileVersion.objects.get(pk=version.pk)

                print(f"Version after re-fetch - thumbnail: {version.thumbnail}")

                

                # If thumbnail still not generated, try explicit generation

                if not version.thumbnail and version.file:

                    try:

                        from .thumbnail_utils import generate_thumbnail_for_asset

                        import os

                        file_path = version.file.path

                        print(f"Attempting explicit thumbnail generation for: {file_path}")

                        print(f"File exists: {os.path.exists(file_path)}, file_type: {file_type}")

                        

                        if os.path.exists(file_path) and file_type:

                            thumbnail_content = generate_thumbnail_for_asset(file_path, file_type)

                            if thumbnail_content:

                                thumb_filename = f"thumb_{os.path.basename(file_path)}.jpg"

                                version.thumbnail.save(thumb_filename, thumbnail_content, save=True)

                                print(f"✅ Thumbnail saved explicitly: {version.thumbnail.name}")

                            else:

                                print(f"⚠️ Thumbnail generation returned None")

                    except Exception as e:

                        print(f"⚠️ Explicit thumbnail generation failed: {e}")

                        import traceback

                        traceback.print_exc()

                

                # Get the project from asset and refresh to get updated thumbnail_url

                try:

                    proj = asset.project

                    if proj:

                        # Force project refresh and thumbnail regeneration

                        proj.refresh_from_db()

                        

                        # Build file URL

                        file_url = request.build_absolute_uri(f'/api/versioning/media/{version.file.name}')

                        

                        # Update the Project with file URL and type

                        proj.update_asset_info(

                            file_url=file_url,

                            file_type=file_type,

                            filename=version.file.name

                        )

                        

                        # Refresh again to get updated fields

                        proj.refresh_from_db()

                        

                        print(f"Updated Project {proj.id} - thumbnail_url will be computed in serializer")
                          # Create workflow ReviewCycle if project has workflow configuration
                        print(f"🔍 Checking workflow config - template_id: {proj.workflow_template_id}, stage_reviewers: {proj.workflow_stage_reviewers}")
                        if proj.workflow_template_id and proj.workflow_stage_reviewers:
                            print(f"✅ Project has workflow configuration, creating ReviewCycle...")
                            try:
                                from apps.workflows.models import WorkflowTemplate, ReviewCycle, ApprovalGroup, GroupMember
                                from apps.notifications.services import NotificationService
                                
                                # Check if ReviewCycle already exists for this asset
                                existing_cycle = ReviewCycle.objects.filter(asset=asset).first()
                                print(f"🔍 Existing cycle check: {existing_cycle}")
                                if not existing_cycle:
                                    template = WorkflowTemplate.objects.get(id=proj.workflow_template_id)
                                    
                                    # Create ReviewCycle
                                    review_cycle = ReviewCycle.objects.create(
                                        asset=asset,
                                        template=template,
                                        status='not_started',
                                        initiated_by=request.user,
                                        created_by=request.user
                                    )
                                    
                                    # Create ApprovalGroups for each stage
                                    stages = template.stages.all().order_by('order')
                                    for stage in stages:
                                        # Get reviewers for this stage
                                        stage_reviewer_ids = proj.workflow_stage_reviewers.get(str(stage.id), [])
                                        
                                        # Create ApprovalGroup
                                        group = ApprovalGroup.objects.create(
                                            review_cycle=review_cycle,
                                            stage=stage,
                                            name=stage.name,
                                            order=stage.order,
                                            status='locked' if stage.order > 1 else 'unlocked',
                                            unlocked_at=None if stage.order > 1 else review_cycle.initiated_at
                                        )
                                        
                                        # Add GroupMembers (reviewers)
                                        for user_id in stage_reviewer_ids:
                                            try:
                                                user = User.objects.get(id=user_id)
                                                GroupMember.objects.create(
                                                    group=group,
                                                    user=user,
                                                    socd_status='sent',
                                                    decision='pending'
                                                )
                                            except User.DoesNotExist:
                                                pass
                                    
                                    # Set current stage to first stage but keep status as 'not_started'
                                    first_stage = stages.first()
                                    if first_stage:
                                        review_cycle.current_stage = first_stage
                                        review_cycle.save()
                                    
                                    # Send notifications to reviewers
                                    try:
                                        NotificationService.notify_reviewers_new_proof(review_cycle)
                                    except Exception as notif_error:
                                        print(f"⚠️ Failed to send notifications: {notif_error}")
                                    
                                    print(f"✅ Created ReviewCycle {review_cycle.id} with {stages.count()} stages")
                            except Exception as workflow_error:
                                print(f"⚠️ Failed to create workflow: {workflow_error}")
                                import traceback
                                traceback.print_exc()
                        
                except Exception as proj_error:

                    print(f"⚠️ Could not update project info: {proj_error}")

            

            headers = self.get_success_headers(serializer.data)

            

            # Return the asset data with current_version properly populated

            # Re-fetch asset with fresh data to ensure current_version is included

            from django.db import transaction

            transaction.commit()

            

            fresh_asset = CreativeAsset.objects.prefetch_related(

                'versions',

                'project',

                'project__members'

            ).get(pk=asset.pk)

            

            # Serialize with request context to get proper file_url

            asset_serializer = CreativeAssetSerializer(

                fresh_asset,

                context={'request': request}

            )

            response_data = asset_serializer.data

            

            # Also include project data if available (for backward compatibility)

            if asset.project:

                from .serializers import ProjectSerializer

                fresh_project = Project.objects.prefetch_related(

                    'assets', 

                    'assets__versions'

                ).get(pk=asset.project.pk)

                project_serializer = ProjectSerializer(

                    fresh_project, 

                    context={'request': request}

                )

                response_data = {

                    'asset': asset_serializer.data,

                    'project': project_serializer.data

                }

            

            return Response(

                response_data, 

                status=status.HTTP_201_CREATED, 

                headers=headers

            )

        except Exception as e:

            print(f"CreativeAsset creation error: {str(e)}")

            import traceback

            traceback.print_exc()

            return Response(

                {'detail': f'Failed to create asset: {str(e)}'}, 

                status=status.HTTP_400_BAD_REQUEST

            )



    @action(detail=True, methods=['post'])

    def create_share_token(self, request, pk=None):

        """Create a share token for this asset"""

        asset = self.get_object()

        

        # Check if user has permission to create share token

        if not self._can_manage_asset(request.user, asset):

            return Response(

                {'detail': 'You do not have permission to create share tokens for this asset'},

                status=status.HTTP_403_FORBIDDEN

            )

        

        # Get token parameters

        expires_in_hours = request.data.get('expires_in_hours', 24)

        max_uses = request.data.get('max_uses', None)

        can_download = request.data.get('can_download', True)

        can_view = request.data.get('can_view', True)

        can_comment = request.data.get('can_comment', False)

        allowed_domains = request.data.get('allowed_domains', '')

        password = request.data.get('password', '')

        

        # Create token

        token = asset.generate_share_token(

            request.user,

            expires_in_hours=expires_in_hours,

            max_uses=max_uses,

            can_download=can_download,

            can_view=can_view,

            can_comment=can_comment,

            allowed_domains=allowed_domains,

            password=password if password else None

        )

        

        # Set password if provided

        if password:

            token.set_password(password)

            token.save()

        

        # Return token data

        from .token_serializers import AssetShareTokenSerializer

        serializer = AssetShareTokenSerializer(token, context={'request': request})

        return Response(serializer.data, status=status.HTTP_201_CREATED)



    @action(detail=True, methods=['post'])

    def create_access_token(self, request, pk=None):

        """Create a short-lived access token for this asset"""

        asset = self.get_object()

        

        # Check if user has permission to access this asset

        if not self._can_access_asset(request.user, asset):

            return Response(

                {'detail': 'You do not have permission to access this asset'},

                status=status.HTTP_403_FORBIDDEN

            )

        

        purpose = request.data.get('purpose', 'view')

        expires_in_minutes = request.data.get('expires_in_minutes', 15)

        

        # Create access token

        token = asset.generate_access_token(

            request.user,

            purpose=purpose,

            expires_in_minutes=expires_in_minutes

        )

        

        # Return token data

        from .token_serializers import AssetAccessTokenSerializer

        serializer = AssetAccessTokenSerializer(token)

        return Response(serializer.data, status=status.HTTP_201_CREATED)



    def _can_manage_asset(self, user, asset):

        """Check if user can manage the asset"""

        if asset.created_by == user:

            return True

        if asset.project.owner == user:

            return True

        if asset.project.members.filter(user=user, role='admin').exists():

            return True

        return False

    

    def _can_access_asset(self, user, asset):

        """Check if user can access the asset"""

        if asset.created_by == user:

            return True

        if asset.project.owner == user:

            return True

        if asset.project.members.filter(user=user).exists():

            return True

        return False



    @action(detail=True, methods=['get'])

    def thumbnail(self, request, pk=None):

        """Generate thumbnail for the current version of the asset"""

        asset = self.get_object()

        current_version = asset.versions.filter(is_current=True).first()

        

        if not current_version or not current_version.file:

            return Response({'error': 'No file available'}, status=status.HTTP_404_NOT_FOUND)

        

        file_path = current_version.file.path

        

        if not os.path.exists(file_path):

            return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)

        

        try:

            if asset.file_type == 'image':

                # Return the image directly as thumbnail

                with open(file_path, 'rb') as f:

                    return HttpResponse(f.read(), content_type='image/jpeg')

            

            elif asset.file_type == 'pdf':

                # Generate PDF thumbnail using a simpler approach

                try:

                    # For now, create a more detailed PDF preview thumbnail

                    # This shows a mini document representation

                    svg_content = f'''

                    <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">

                        <rect width="48" height="48" fill="#ffffff" stroke="#cccccc" stroke-width="1" rx="2"/>

                        <rect width="40" height="40" x="4" y="4" fill="#f8f8f8" rx="1"/>

                        <!-- Document lines -->

                        <rect x="8" y="8" width="24" height="2" fill="#333" rx="1"/>

                        <rect x="8" y="12" width="20" height="2" fill="#666" rx="1"/>

                        <rect x="8" y="16" width="28" height="2" fill="#666" rx="1"/>

                        <rect x="8" y="20" width="16" height="2" fill="#666" rx="1"/>

                        <rect x="8" y="24" width="24" height="2" fill="#666" rx="1"/>

                        <rect x="8" y="28" width="20" height="2" fill="#666" rx="1"/>

                        <rect x="8" y="32" width="26" height="2" fill="#666" rx="1"/>

                        <rect x="8" y="36" width="18" height="2" fill="#666" rx="1"/>

                        <!-- PDF indicator -->

                        <rect x="32" y="32" width="12" height="12" fill="#ff4444" rx="2"/>

                        <text x="38" y="40" font-family="Arial" font-size="6" font-weight="bold" 

                              text-anchor="middle" fill="white">PDF</text>

                    </svg>

                    '''

                    return HttpResponse(svg_content, content_type='image/svg+xml')

                        

                except Exception as e:

                    # Fallback on any error

                    svg_content = '''

                    <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">

                        <rect width="48" height="48" fill="#ff4444" rx="4"/>

                        <text x="24" y="28" font-family="Arial" font-size="8" font-weight="bold" 

                              text-anchor="middle" fill="white">PDF</text>

                    </svg>

                    '''

                    return HttpResponse(svg_content, content_type='image/svg+xml')

            

            elif asset.file_type == 'video':

                # For videos, create a simple placeholder

                svg_content = '''

                <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">

                    <rect width="48" height="48" fill="#00a8ff" rx="4"/>

                    <text x="24" y="28" font-family="Arial" font-size="6" font-weight="bold" 

                          text-anchor="middle" fill="white">VIDEO</text>

                </svg>

                '''

                return HttpResponse(svg_content, content_type='image/svg+xml')

            

            else:

                # Default placeholder for other file types

                svg_content = '''

                <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">

                    <rect width="48" height="48" fill="#666666" rx="4"/>

                    <text x="24" y="28" font-family="Arial" font-size="6" font-weight="bold" 

                          text-anchor="middle" fill="white">FILE</text>

                </svg>

                '''

                return HttpResponse(svg_content, content_type='image/svg+xml')

                

        except Exception as e:

            return Response({'error': f'Error generating thumbnail: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



    @action(detail=True, methods=['post'])

    def upload_version(self, request, pk=None):

        asset = self.get_object()

        serializer = FileVersionUploadSerializer(data=request.data)



        if serializer.is_valid():

            FileVersion.objects.filter(asset=asset).update(is_current=False)

            

            version_number = asset.versions.count() + 1

            version = FileVersion.objects.create(

                asset=asset,

                version_number=version_number,

                file=serializer.validated_data['file'],

                uploaded_by=request.user,

                change_notes=serializer.validated_data.get('change_notes', ''),

                is_current=True

            )

            

            # Update the asset's file_size if not set

            if version.file and hasattr(version.file, 'size'):

                version.file_size = version.file.size

                version.save()

            

            return Response(FileVersionSerializer(version).data, status=status.HTTP_201_CREATED)

        

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



    @action(detail=True, methods=['get'])

    def versions(self, request, pk=None):

        asset = self.get_object()

        versions = asset.versions.all()

        serializer = FileVersionSerializer(versions, many=True, context={'request': request})

        return Response(serializer.data)





class FileVersionViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = FileVersionSerializer

    permission_classes = [permissions.IsAuthenticated]



    def get_queryset(self):

        user = self.request.user

        return FileVersion.objects.filter(

            Q(asset__project__owner=user) | Q(asset__project__members__user=user)

        ).distinct()



    @action(detail=True, methods=['post'])

    def add_comment(self, request, pk=None):

        version = self.get_object()

        content = request.data.get('content')



        if not content:

            return Response(

                {'detail': 'Content is required.'},

                status=status.HTTP_400_BAD_REQUEST

            )



        comment = VersionComment.objects.create(

            version=version,

            author=request.user,

            content=content

        )



        serializer = VersionCommentSerializer(comment)

        return Response(serializer.data, status=status.HTTP_201_CREATED)



    @action(detail=True, methods=['get'])

    def comments(self, request, pk=None):

        version = self.get_object()

        comments = version.comments.all()

        serializer = VersionCommentSerializer(comments, many=True)

        return Response(serializer.data)





class FolderViewSet(viewsets.ModelViewSet):

    """ViewSet for managing folders"""

    serializer_class = FolderSerializer

    permission_classes = [permissions.IsAuthenticated]

    

    def get_permissions(self):

        """Apply different permissions based on action"""

        if self.action in ['create']:

            return [permissions.IsAuthenticated(), CanCreateFolder()]

        elif self.action in ['update', 'partial_update']:

            return [permissions.IsAuthenticated(), CanEditContent()]

        elif self.action in ['destroy']:

            return [permissions.IsAuthenticated(), CanDeleteContent()]

        elif self.action in ['retrieve', 'list']:

            return [permissions.IsAuthenticated(), CanViewContent()]

        else:

            return [permissions.IsAuthenticated()]

    

    def get_queryset(self):

        """Return folders based on user role and permissions"""

        from .permissions import get_user_accessible_folders

        return get_user_accessible_folders(self.request.user).prefetch_related('members', 'members__user', 'projects')

    

    def perform_create(self, serializer):

        """Set the owner to the current user and create owner membership"""

        folder = serializer.save(owner=self.request.user)

        # Automatically add creator as owner member

        FolderMember.objects.create(

            folder=folder,

            user=self.request.user,

            role='owner',

            added_by=self.request.user

        )

    

    def update(self, request, *args, **kwargs):

        """Update folder and broadcast changes"""

        response = super().update(request, *args, **kwargs)

        folder = self.get_object()

        # Broadcast folder update to all members

        from .services import FolderUpdateService

        FolderUpdateService.broadcast_folder_update(

            folder, 

            'folder_updated',

            {'name': folder.name, 'description': folder.description}

        )

        return response

    

    def destroy(self, request, *args, **kwargs):

        """Delete folder and broadcast to members"""

        folder = self.get_object()

        folder_id = folder.id

        # Broadcast deletion before actually deleting

        from .services import FolderUpdateService

        FolderUpdateService.broadcast_folder_update(

            folder,

            'folder_deleted',

            {'folder_id': folder_id}

        )

        return super().destroy(request, *args, **kwargs)

    

    @action(detail=True, methods=['get'])

    def projects(self, request, pk=None):

        """Get all projects in this folder - applies reviewer visibility restrictions"""

        folder = self.get_object()

        from .permissions import get_user_accessible_projects

        projects = get_user_accessible_projects(request.user).filter(folder=folder)

        serializer = ProjectSerializer(projects, many=True, context={'request': request})

        return Response(serializer.data)

    

    @action(detail=True, methods=['get'])

    def members(self, request, pk=None):

        """Get all members of this folder"""

        folder = self.get_object()

        members = folder.members.all()

        serializer = FolderMemberSerializer(members, many=True)

        return Response(serializer.data)

    

    @action(detail=True, methods=['post'])

    def add_member(self, request, pk=None):

        """Add a member to the folder"""

        folder = self.get_object()

        

        # Check if user has permission to add members

        from .permissions import can_manage_folder_members

        permissions = can_manage_folder_members(request.user, folder)

        

        # Block if user doesn't have can_add permission (checkbox permission)

        if not permissions['can_add']:

            return Response(

                {'detail': 'You do not have permission to add members to this folder.'},

                status=status.HTTP_403_FORBIDDEN

            )

        

        user_id = request.data.get('user_id')

        role = request.data.get('role', 'viewer')

        

        if not user_id:

            return Response(

                {'detail': 'user_id is required.'},

                status=status.HTTP_400_BAD_REQUEST

            )

        

        try:

            user = User.objects.get(id=user_id)

        except User.DoesNotExist:

            return Response(

                {'detail': 'User not found.'},

                status=status.HTTP_404_NOT_FOUND

            )

        

        # Check if user is already a member

        if folder.members.filter(user=user).exists():

            return Response(

                {'detail': 'User is already a member of this folder.'},

                status=status.HTTP_400_BAD_REQUEST

            )

        

        # Create folder member

        member = FolderMember.objects.create(

            folder=folder,

            user=user,

            role=role,

            added_by=request.user

        )

        

        # Broadcast member addition

        from .services import FolderUpdateService

        FolderUpdateService.broadcast_folder_update(

            folder,

            'member_added',

            {

                'member_id': member.id,

                'user': {'id': user.id, 'username': user.username},

                'role': role

            }

        )

        

        serializer = FolderMemberSerializer(member)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    

    @action(detail=True, methods=['delete'])

    def remove_member(self, request, pk=None):

        """Remove a member from the folder"""

        folder = self.get_object()

        

        member_id = request.data.get('member_id')

        if not member_id:

            return Response(

                {'detail': 'member_id is required.'},

                status=status.HTTP_400_BAD_REQUEST

            )

        

        try:

            member = FolderMember.objects.get(id=member_id, folder=folder)

        except FolderMember.DoesNotExist:

            return Response(

                {'detail': 'Member not found.'},

                status=status.HTTP_404_NOT_FOUND

            )

        

        # Check if user has permission to remove this member

        from .permissions import can_remove_folder_member

        if not can_remove_folder_member(request.user, member.user, folder):

            return Response(

                {'detail': 'You do not have permission to remove this member.'},

                status=status.HTTP_403_FORBIDDEN

            )

        

        # Additional check: prevent removing the last owner

        if member.role == 'owner':

            remaining_owners = folder.members.filter(role='owner').exclude(id=member.id).count()

            if remaining_owners == 0:

                return Response(

                    {'detail': 'Cannot remove the last owner of the folder.'},

                    status=status.HTTP_400_BAD_REQUEST

                )

        

        removed_user_id = member.user.id

        member.delete()

        

        # Broadcast member removal

        from .services import FolderUpdateService

        FolderUpdateService.broadcast_folder_update(

            folder,

            'member_removed',

            {'member_id': member_id, 'user_id': removed_user_id}

        )

        

        return Response(status=status.HTTP_204_NO_CONTENT)

    

    @action(detail=True, methods=['patch'])

    def update_member_role(self, request, pk=None):

        """Update a member's role in the folder"""

        folder = self.get_object()

        

        # Check if user has permission (must be owner)

        user_member = folder.members.filter(user=request.user).first()

        if not user_member or user_member.role != 'owner':

            return Response(

                {'detail': 'Only folder owners can update member roles.'},

                status=status.HTTP_403_FORBIDDEN

            )

        

        member_id = request.data.get('member_id')

        new_role = request.data.get('role')

        

        if not member_id or not new_role:

            return Response(

                {'detail': 'member_id and role are required.'},

                status=status.HTTP_400_BAD_REQUEST

            )

        

        try:

            member = FolderMember.objects.get(id=member_id, folder=folder)

        except FolderMember.DoesNotExist:

            return Response(

                {'detail': 'Member not found.'},

                status=status.HTTP_404_NOT_FOUND

            )

        

        # Cannot change owner role

        if member.role == 'owner':

            return Response(

                {'detail': 'Cannot change folder owner role.'},

                status=status.HTTP_400_BAD_REQUEST

            )

        

        member.role = new_role

        member.save()

        

        # Broadcast role update

        from .services import FolderUpdateService

        FolderUpdateService.broadcast_folder_update(

            folder,

            'member_role_updated',

            {'member_id': member_id, 'role': new_role}

        )

        

        serializer = FolderMemberSerializer(member)

        return Response(serializer.data)


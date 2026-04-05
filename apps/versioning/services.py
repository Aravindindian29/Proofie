from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)


class FolderUpdateService:
    """Service for broadcasting folder updates via WebSocket"""
    
    @staticmethod
    def get_folder_members_to_notify(folder):
        """
        Get all users who should receive folder update notifications.
        
        Args:
            folder: Folder instance
            
        Returns:
            Set of User instances
        """
        users_to_notify = set()
        
        # Add all folder members
        for member in folder.members.select_related('user'):
            users_to_notify.add(member.user)
        
        return users_to_notify
    
    @staticmethod
    def broadcast_folder_update(folder, update_type, data=None):
        """
        Broadcast folder update to all folder members via WebSocket.
        
        Args:
            folder: Folder instance
            update_type: Type of update ('folder_updated', 'folder_deleted', 'proof_added', 
                        'proof_removed', 'member_added', 'member_removed', 'member_role_updated')
            data: Additional data to send with the update
        """
        try:
            channel_layer = get_channel_layer()
            
            if not channel_layer:
                logger.warning("Channel layer not configured for WebSocket broadcasting")
                return
            
            # Get all users to notify
            users_to_notify = FolderUpdateService.get_folder_members_to_notify(folder)
            
            # Prepare update data
            update_data = {
                'type': 'folder_update',
                'folder_id': folder.id,
                'folder_name': folder.name,
                'update_type': update_type,
                'data': data or {}
            }
            
            # Send update to each user's notification channel
            success_count = 0
            for user in users_to_notify:
                try:
                    async_to_sync(channel_layer.group_send)(
                        f'notifications_{user.id}',
                        update_data
                    )
                    success_count += 1
                except Exception as e:
                    logger.error(f"Failed to send folder update to user {user.id}: {e}")
            
            logger.info(f"Broadcasted folder {folder.id} update ({update_type}) to {success_count}/{len(users_to_notify)} users")
            
        except Exception as e:
            logger.error(f"Failed to broadcast folder update: {e}")

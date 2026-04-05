import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Notification


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'notifications_{self.user_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def notification_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['message']
        }))

    async def review_cycle_update(self, event):
        """Handle review cycle status updates"""
        await self.send(text_data=json.dumps({
            'type': 'review_cycle_update',
            'review_cycle_id': event.get('review_cycle_id'),
            'status': event.get('status'),
            'current_stage_id': event.get('current_stage_id'),
            'updated_at': event.get('updated_at'),
            'asset_name': event.get('asset_name'),
            'asset_id': event.get('asset_id')
        }))
    
    async def folder_update(self, event):
        """Handle folder update notifications"""
        await self.send(text_data=json.dumps({
            'type': 'folder_update',
            'folder_id': event.get('folder_id'),
            'folder_name': event.get('folder_name'),
            'update_type': event.get('update_type'),
            'data': event.get('data', {})
        }))

    async def send_notification(self, notification_data):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'notification_message',
                'message': notification_data
            }
        )

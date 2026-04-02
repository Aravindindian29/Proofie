from django.contrib import admin
from .models import Notification, NotificationPreference, NotificationLog

admin.site.register(Notification)
admin.site.register(NotificationPreference)
admin.site.register(NotificationLog)

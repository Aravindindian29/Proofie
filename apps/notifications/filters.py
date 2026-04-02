import django_filters
from .models import Notification


class NotificationFilter(django_filters.FilterSet):
    notification_type = django_filters.CharFilter(field_name='notification_type', lookup_expr='iexact')
    is_read = django_filters.BooleanFilter(field_name='is_read')
    recipient = django_filters.NumberFilter(field_name='recipient__id')

    class Meta:
        model = Notification
        fields = ['notification_type', 'is_read', 'recipient']

import django_filters
from .models import ReviewCycle, WorkflowTemplate


class ReviewCycleFilter(django_filters.FilterSet):
    asset = django_filters.NumberFilter(field_name='asset__id')
    template = django_filters.NumberFilter(field_name='template__id')
    status = django_filters.CharFilter(field_name='status', lookup_expr='iexact')
    initiated_by = django_filters.NumberFilter(field_name='initiated_by__id')

    class Meta:
        model = ReviewCycle
        fields = ['asset', 'template', 'status', 'initiated_by']


class WorkflowTemplateFilter(django_filters.FilterSet):
    created_by = django_filters.NumberFilter(field_name='created_by__id')
    is_active = django_filters.BooleanFilter(field_name='is_active')

    class Meta:
        model = WorkflowTemplate
        fields = ['created_by', 'is_active']

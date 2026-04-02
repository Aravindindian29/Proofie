import django_filters
from .models import CreativeAsset, FileVersion


class CreativeAssetFilter(django_filters.FilterSet):
    file_type = django_filters.CharFilter(field_name='file_type', lookup_expr='iexact')
    project = django_filters.NumberFilter(field_name='project__id')
    created_by = django_filters.NumberFilter(field_name='created_by__id')
    is_archived = django_filters.BooleanFilter(field_name='is_archived')

    class Meta:
        model = CreativeAsset
        fields = ['file_type', 'project', 'created_by', 'is_archived']


class FileVersionFilter(django_filters.FilterSet):
    asset = django_filters.NumberFilter(field_name='asset__id')
    uploaded_by = django_filters.NumberFilter(field_name='uploaded_by__id')
    is_current = django_filters.BooleanFilter(field_name='is_current')

    class Meta:
        model = FileVersion
        fields = ['asset', 'uploaded_by', 'is_current']

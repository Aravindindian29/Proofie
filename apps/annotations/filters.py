import django_filters
from .models import Annotation


class AnnotationFilter(django_filters.FilterSet):
    version = django_filters.NumberFilter(field_name='version__id')
    author = django_filters.NumberFilter(field_name='author__id')
    annotation_type = django_filters.CharFilter(field_name='annotation_type', lookup_expr='iexact')
    is_resolved = django_filters.BooleanFilter(field_name='is_resolved')
    page_number = django_filters.NumberFilter(field_name='page_number')

    class Meta:
        model = Annotation
        fields = ['version', 'author', 'annotation_type', 'is_resolved', 'page_number']

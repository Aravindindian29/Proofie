from django.contrib import admin
from .models import Annotation, AnnotationReply, AnnotationMention

admin.site.register(Annotation)
admin.site.register(AnnotationReply)
admin.site.register(AnnotationMention)

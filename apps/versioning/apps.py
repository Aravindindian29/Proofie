from django.apps import AppConfig


class VersioningConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.versioning'

    def ready(self):
        # Import signals to connect them
        import apps.versioning.signals

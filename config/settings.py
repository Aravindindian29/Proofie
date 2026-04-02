import os

from pathlib import Path

from decouple import config



BASE_DIR = Path(__file__).resolve().parent.parent



SECRET_KEY = config('SECRET_KEY', default='django-insecure-dev-key-change-in-production')



DEBUG = config('DEBUG', default=True, cast=bool)



ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,testserver', cast=lambda v: [s.strip() for s in v.split(',')])



INSTALLED_APPS = [

    'django.contrib.admin',

    'django.contrib.auth',

    'django.contrib.contenttypes',

    'django.contrib.sessions',

    'django.contrib.messages',

    'django.contrib.staticfiles',

    'rest_framework',

    'corsheaders',

    'django_filters',

    'channels',

    'rest_framework.authtoken',

    'apps.versioning',

    'apps.annotations',

    'apps.workflows',

    'apps.notifications',

    'apps.accounts',

    'apps.ai_engine',

]



MIDDLEWARE = [

    'django.middleware.security.SecurityMiddleware',

    'corsheaders.middleware.CorsMiddleware',

    'config.middleware.DisableCSRFForAPI',

    # Remove security middleware temporarily to isolate the issue

    # 'config.security_middleware.SecurityHeaderMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',

    'django.middleware.common.CommonMiddleware',

    'django.middleware.csrf.CsrfViewMiddleware',

    'django.contrib.auth.middleware.AuthenticationMiddleware',

    'django.contrib.messages.middleware.MessageMiddleware',

    # Completely disable XFrameOptions middleware

    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',

]



# Chrome-specific security settings

SECURE_SSL_REDIRECT = False

SECURE_HSTS_SECONDS = 0

SECURE_HSTS_INCLUDE_SUBDOMAINS = False

SECURE_HSTS_PRELOAD = False

SECURE_CONTENT_TYPE_NOSNIFF = False

SECURE_BROWSER_XSS_FILTER = False

SECURE_REFERRER_POLICY = 'no-referrer-when-downgrade'



# Content Security Policy for Chrome

CONTENT_SECURITY_POLICY = {

    'default-src': "'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:8000 http://localhost:3002",

    'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",

    'style-src': "'self' 'unsafe-inline'",

    'img-src': "'self' data: blob: http: https:",

    'media-src': "'self' blob: data: http: https:",

    'frame-src': "'self' blob: data: http: https:",

    'font-src': "'self' data:",

    'connect-src': "'self' http://localhost:8000 http://localhost:3002 ws://localhost:8000 ws://localhost:3002",

    'object-src': "'self'",

    'child-src': "'self' blob: data:",

}



# Additional Chrome-specific headers

SECURE_CROSS_ORIGIN_OPENER_POLICY = None

SECURE_CROSS_ORIGIN_EMBEDDER_POLICY = None



# X-Frame-Options settings for Chrome

X_FRAME_OPTIONS = 'ALLOWALL'



# Chrome-specific CORS settings

CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [

    'accept',

    'accept-encoding',

    'authorization',

    'content-type',

    'dnt',

    'origin',

    'user-agent',

    'x-csrftoken',

    'x-requested-with',

    'sec-fetch-mode',

    'sec-fetch-site',

    'sec-fetch-dest',

]



ROOT_URLCONF = 'config.urls'



TEMPLATES = [

    {

        'BACKEND': 'django.template.backends.django.DjangoTemplates',

        'DIRS': [BASE_DIR / 'templates'],

        'APP_DIRS': True,

        'OPTIONS': {

            'context_processors': [

                'django.template.context_processors.debug',

                'django.template.context_processors.request',

                'django.contrib.auth.context_processors.auth',

                'django.contrib.messages.context_processors.messages',

            ],

        },

    },

]



WSGI_APPLICATION = 'config.wsgi.application'

ASGI_APPLICATION = 'config.asgi.application'



DATABASES = {

    'default': {

        'ENGINE': 'django.db.backends.sqlite3',

        'NAME': BASE_DIR / 'db.sqlite3',

    }

}



AUTH_PASSWORD_VALIDATORS = [

    {

        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',

    },

    {

        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',

    },

    {

        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',

    },

    {

        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',

    },

]



AUTHENTICATION_BACKENDS = [

    'apps.accounts.authentication.EmailVerificationBackend',

]



LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True



STATIC_URL = '/static/'

STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'

MEDIA_ROOT = BASE_DIR / 'media'



DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'



REST_FRAMEWORK = {

    'DEFAULT_AUTHENTICATION_CLASSES': [

        'rest_framework.authentication.TokenAuthentication',

        'rest_framework.authentication.SessionAuthentication',

    ],

    'DEFAULT_PERMISSION_CLASSES': [

        'rest_framework.permissions.IsAuthenticated',

    ],

    'DEFAULT_FILTER_BACKENDS': [

        'django_filters.rest_framework.DjangoFilterBackend',

        'rest_framework.filters.SearchFilter',

        'rest_framework.filters.OrderingFilter',

    ],

    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',

    'PAGE_SIZE': 20,

}



CORS_ALLOWED_ORIGINS = config(

    'CORS_ALLOWED_ORIGINS',

    default='http://localhost:3000,http://localhost:8000',

    cast=lambda v: [s.strip() for s in v.split(',')]

)



CORS_ALLOW_CREDENTIALS = True



# Additional CORS settings for asset serving

CORS_ALLOW_ALL_ORIGINS = True

CORS_ALLOW_HEADERS = [

    'accept',

    'accept-encoding',

    'authorization',

    'content-type',

    'dnt',

    'origin',

    'user-agent',

    'x-csrftoken',

    'x-requested-with',

]



CSRF_TRUSTED_ORIGINS = [

    'http://localhost:3000',

    'http://127.0.0.1:3000',

    'http://localhost:8000',

    'http://127.0.0.1:8000',

]



# X-Frame-Options settings for PDF viewing - completely disabled for testing

X_FRAME_OPTIONS = False



CHANNEL_LAYERS = {

    'default': {

        'BACKEND': 'channels.layers.InMemoryChannelLayer',

    },

}



CELERY_BROKER_URL = 'redis://localhost:6379/0'

CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'

CELERY_ACCEPT_CONTENT = ['json']

CELERY_TASK_SERIALIZER = 'json'



FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600

DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600



ALLOWED_FILE_TYPES = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm', 'mov']

MAX_FILE_SIZE = 500 * 1024 * 1024



# Email Configuration

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

EMAIL_HOST = config('EMAIL_HOST', default='smtp.mailgun.org')

EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)

EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)

EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='postmaster@sandbox123.mailgun.org')

EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='key-1234567890abcdef')

DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@proofie.com')



# Email Verification Settings

ACCOUNT_EMAIL_VERIFICATION = 'mandatory'

ACCOUNT_EMAIL_REQUIRED = True


# AI Engine Configuration
AI_PROVIDER = config('AI_PROVIDER', default='mock')
OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
ANTHROPIC_API_KEY = config('ANTHROPIC_API_KEY', default='')

# AI Feature Flags
AI_FEATURES = {
    'summarization': config('ENABLE_AI_SUMMARIZATION', default=True, cast=bool),
    'diff_analysis': config('ENABLE_DIFF_ANALYSIS', default=True, cast=bool),
    'content_analysis': config('ENABLE_CONTENT_ANALYSIS', default=True, cast=bool),
    'jira_integration': config('ENABLE_JIRA_INTEGRATION', default=False, cast=bool),
    'test_generation': config('ENABLE_TEST_GENERATION', default=False, cast=bool),
}

# JIRA Configuration (for Feature 4)
JIRA_SERVER = config('JIRA_SERVER', default='')
JIRA_EMAIL = config('JIRA_EMAIL', default='')
JIRA_API_TOKEN = config('JIRA_API_TOKEN', default='')


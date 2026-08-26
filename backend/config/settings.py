import os
import re
from pathlib import Path
from urllib.parse import urlparse, unquote
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'dsa-tracker-dev-secret-key-change-in-production-12345')
DEBUG = os.getenv('DJANGO_DEBUG', 'true').lower() == 'true'

allowed_hosts_raw = os.getenv('DJANGO_ALLOWED_HOSTS', '*')
ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_raw.split(',') if host.strip()]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'tracker',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]
WSGI_APPLICATION = 'config.wsgi.application'


def database_config() -> dict:
    database_url = os.getenv('DATABASE_URL', '').strip()
    if not database_url:
        return {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3'}}

    try:
        pattern = r'^postgres(?:ql)?://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/(.+)$'
        match = re.match(pattern, database_url)
        if match:
            username = unquote(match.group(1)).strip('[]')
            password = unquote(match.group(2)).strip('[]')
            host = match.group(3)
            port = int(match.group(4)) if match.group(4) else 5432
            db_name = match.group(5).split('?')[0]
        else:
            parsed = urlparse(database_url)
            username = unquote(parsed.username or '').strip('[]')
            password = unquote(parsed.password or '').strip('[]')
            host = parsed.hostname
            port = parsed.port or 5432
            db_name = parsed.path.lstrip('/') or 'postgres'

        return {'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_name,
            'USER': username,
            'PASSWORD': password,
            'HOST': host,
            'PORT': port,
            'CONN_MAX_AGE': 60,
            'OPTIONS': {'sslmode': 'require', 'connect_timeout': 10},
        }}
    except Exception as e:
        print(f"Warning: Failed to parse DATABASE_URL ({e}), falling back to SQLite.")
        return {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': BASE_DIR / 'db.sqlite3'}}


DATABASES = database_config()
AUTH_PASSWORD_VALIDATORS = []
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOWED_ORIGINS = [origin for origin in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173').split(',') if origin]
if '*' in os.getenv('CORS_ALLOWED_ORIGINS', ''):
    CORS_ALLOW_ALL_ORIGINS = True

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'],
}

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

# JWT Configuration
JWT_ALGORITHM = 'HS256'
JWT_DECODE_OPTIONS = {'verify_signature': False}  # Supabase provides verification

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Run migrations and start Gunicorn server safely (never crash container on migration warning)
CMD ["sh", "-c", "python manage.py migrate --noinput || true && gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120"]

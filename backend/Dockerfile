FROM python:3.11

WORKDIR /app

# Устанавливаем системные зависимости для Pillow
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn psycopg2-binary Pillow

COPY . .

RUN python manage.py collectstatic --noinput

CMD ["sh", "-c", "python wait-for-db.py && python manage.py migrate && gunicorn backend_project.wsgi:application --bind 0.0.0.0:8000 --workers 4 --graceful-timeout 10 --timeout 30"]
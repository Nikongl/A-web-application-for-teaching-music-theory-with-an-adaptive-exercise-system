FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Запускаем Gunicorn, который будет ждать, пока база данных не станет доступна
CMD ["sh", "-c", "python wait-for-db.py && gunicorn backend_project.wsgi:application --bind 0.0.0.0:8000 --workers 3"]
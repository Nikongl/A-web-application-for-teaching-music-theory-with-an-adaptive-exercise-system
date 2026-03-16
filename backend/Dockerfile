FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn psycopg2-binary

COPY . .

RUN python manage.py collectstatic --noinput

# Убираем ctl файл и добавляем правильные параметры
CMD ["sh", "-c", "python wait-for-db.py && python manage.py migrate && gunicorn backend_project.wsgi:application --bind 0.0.0.0:8000 --workers 4 --graceful-timeout 10 --timeout 30"]
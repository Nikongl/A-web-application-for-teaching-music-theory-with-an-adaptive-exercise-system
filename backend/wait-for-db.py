#!/usr/bin/env python
import time
import psycopg2
import os
import sys

def wait_for_db():
    DB_NAME = os.environ.get("DB_NAME", "music_app_db")
    DB_USER = os.environ.get("DB_USER", "music_user")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "supersecret")
    DB_HOST = os.environ.get("DB_HOST", "db")
    DB_PORT = os.environ.get("DB_PORT", "5432")
    
    max_attempts = 30
    attempt = 0
    
    print(f"⏳ Connecting to {DB_HOST}:{DB_PORT}/{DB_NAME} as {DB_USER}")
    
    while attempt < max_attempts:
        try:
            conn = psycopg2.connect(
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD,
                host=DB_HOST,
                port=DB_PORT,
                connect_timeout=3
            )
            conn.close()
            print("✅ Database is ready!")
            return True
        except psycopg2.OperationalError as e:
            attempt += 1
            print(f"⏳ Waiting for database... ({attempt}/{max_attempts}) - {str(e)[:50]}")
            time.sleep(2)
    
    print("❌ Database connection failed after 30 attempts")
    return False

if __name__ == "__main__":
    if not wait_for_db():
        sys.exit(1)
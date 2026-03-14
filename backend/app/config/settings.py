import os


class Settings:
    DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql+psycopg2://whiteboard:whiteboard@localhost:5432/whiteboard')
    KAFKA_BOOTSTRAP_SERVERS = os.environ.get('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    JWT_SECRET = os.environ.get('JWT_SECRET', 'supersecret')


settings = Settings()

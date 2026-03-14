from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker

from app.database.models import Base

engine = None
SessionLocal = None


def init_db(app):
    global engine, SessionLocal

    database_url = app.config['SQLALCHEMY_DATABASE_URI']
    engine = create_engine(database_url, future=True)
    SessionLocal = scoped_session(
        sessionmaker(bind=engine, autoflush=False, autocommit=False)
    )

    Base.metadata.create_all(bind=engine)


def is_db_ready():
    if engine is None:
        return False

    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return True
    except Exception:
        return False


@contextmanager
def get_db():
    if SessionLocal is None:
        raise RuntimeError('Database not initialized. Call init_db(app) first.')

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

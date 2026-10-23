from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# psycopg3 uses "postgresql+psycopg" driver
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = "postgresql://" + db_url[len("postgres://"):]
db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
# pre_ping: hosted Postgres (e.g. Neon) closes idle connections
# connect_timeout: fail fast with a clear error instead of hanging on startup
connect_args = {"connect_timeout": 10} if db_url.startswith("postgresql") else {}
engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
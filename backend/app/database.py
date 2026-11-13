from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import settings

# psycopg3 uses "postgresql+psycopg" driver
db_url = settings.DATABASE_URL.strip()
if not db_url:
    raise RuntimeError("DATABASE_URL is not set. Add your PostgreSQL connection string to the environment.")
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


def ensure_columns(engine, table: str, columns: dict[str, str]) -> list[str]:
    """Adds any of `columns` ({name: SQL type}) missing from an existing table; returns the ones added."""
    insp = inspect(engine)
    if not insp.has_table(table):
        return []
    have = {c["name"] for c in insp.get_columns(table)}
    missing = [name for name in columns if name not in have]
    if missing:
        with engine.begin() as conn:
            for name in missing:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {columns[name]}"))
    return missing


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
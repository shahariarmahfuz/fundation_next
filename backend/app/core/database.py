import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Engine configuration with robust connection pooling and health checks for PostgreSQL
# Specifically optimized for serverless / transaction-pooled environments (e.g. Neon, PgBouncer)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # Health check: tests connection with a ping before handing to session
    pool_recycle=60,          # Recycles connections after 60s to prevent stale/dropped serverless sockets
    pool_size=15,             # Safe base pool size for concurrent web requests
    max_overflow=10,          # Allow up to 25 total active connections during bursts
    pool_timeout=30,          # Timeout waiting for a free connection
    echo=False,
    connect_args={
        "prepare_threshold": None,  # CRITICAL for PgBouncer / Neon transaction pooler: disable prepared statements
        "connect_timeout": 15,      # Fail fast if remote database host cannot be reached
        "keepalives": 1,            # TCP keepalives to prevent silent drops
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI database session dependency.
    Guarantees rollback on exception so uncommitted/poisoned transactions are never
    returned to the connection pool.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as exc:
        try:
            db.rollback()
        except Exception as rb_exc:
            logger.warning(f"Error during database rollback: {rb_exc}")
        raise exc
    finally:
        db.close()

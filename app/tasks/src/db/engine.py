from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy.pool import AsyncAdaptedQueuePool, NullPool

from src.core.config import settings


def create_engine(url: str, is_testing: bool) -> AsyncEngine:
    if is_testing:
        return create_async_engine(url, poolclass=NullPool, echo=settings.DEBUG)

    return create_async_engine(
        url,
        poolclass=AsyncAdaptedQueuePool,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_recycle=settings.DB_POOL_RECYCLE,
        pool_pre_ping=True,
        echo=settings.DEBUG,
    )


engine = create_engine(settings.DATABASE_URL, settings.TESTING)
read_engine = create_engine(settings.read_database_url, settings.TESTING)

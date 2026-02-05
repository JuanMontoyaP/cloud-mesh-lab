from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.session import AsyncSessionLocal, AsyncReadSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_read_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for read-only operations (uses read replicas)"""
    async with AsyncReadSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from src.db.engine import engine, read_engine


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Important for async - prevents lazy loading issues
    autocommit=False,
    autoflush=False,
)

AsyncReadSessionLocal = async_sessionmaker(
    bind=read_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

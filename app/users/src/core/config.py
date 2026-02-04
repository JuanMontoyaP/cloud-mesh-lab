from typing import Optional
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "mysql+asyncmy://appuser:apppassword@localhost:3306/appdb"
    DATABASE_URL_READ: Optional[str] = None

    # Pool settings
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 30
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800

    # Application
    ENVIRONMENT: str = "development"
    TESTING: bool = False
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def read_database_url(self) -> str:
        """Return read URL or fall back to main URL"""
        return self.DATABASE_URL_READ or self.DATABASE_URL


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

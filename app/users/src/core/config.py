from typing import Optional
from functools import lru_cache
from pydantic import computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_HOST: str
    DATABASE_PORT: int
    DATABASE_USER: str
    DATABASE_PASSWORD: str
    DATABASE_NAME: str
    DATABASE_READ_HOST: Optional[str] = None

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

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """Construct the main database URL from components"""
        return f"mysql+asyncmy://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"

    @computed_field
    @property
    def DATABASE_URL_READ(self) -> Optional[str]:
        if self.DATABASE_READ_HOST:
            return f"mysql+asyncmy://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_READ_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        return None

    @property
    def read_database_url(self) -> str:
        """Return read URL or fall back to main URL"""
        return self.DATABASE_URL_READ or self.DATABASE_URL


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

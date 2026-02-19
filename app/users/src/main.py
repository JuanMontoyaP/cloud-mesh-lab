from fastapi import FastAPI
from contextlib import asynccontextmanager

from src.api.health import router as health
from src.api.users import router as users

from src.db.engine import engine, read_engine

from src.core.logging import setup_logging

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

    await engine.dispose()
    await read_engine.dispose()


app = FastAPI(title="User Service", root_path="/api/v1/users", lifespan=lifespan)


app.include_router(health)
app.include_router(users)


@app.get("/")
async def root():
    return {"message": "Welcome to the API", "docs": "/docs", "health": "/health"}

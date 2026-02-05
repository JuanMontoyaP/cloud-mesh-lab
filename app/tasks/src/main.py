from fastapi import FastAPI
from contextlib import asynccontextmanager

from src.api.tasks import router as tasks
from src.api.health import router as health

from src.db.engine import engine, read_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

    await engine.dispose()
    await read_engine.dispose()


app = FastAPI(title="Tasks Service", lifespan=lifespan)

app.include_router(tasks)
app.include_router(health)


@app.get("/")
async def root():
    return {"message": "Welcome to the API", "docs": "/docs", "health": "/health"}

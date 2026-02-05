from fastapi import FastAPI

from src.api.tasks import router as tasks
from src.api.health import router as health

app = FastAPI(title="Tasks Service")

app.include_router(tasks)
app.include_router(health)


@app.get("/")
async def root():
    return {"message": "Welcome to the API", "docs": "/docs", "health": "/health"}

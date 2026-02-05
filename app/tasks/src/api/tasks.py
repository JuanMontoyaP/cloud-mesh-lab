from fastapi import APIRouter, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.tasks import TaskCreate, TaskResponse
from src.core.dependencies import get_db
from src.services.task_repository import TaskRepository

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    description="Create a task for a specific user",
    response_description="Task created successfully",
    response_model=TaskResponse,
)
async def create_user(
    task: TaskCreate, db: AsyncSession = Depends(get_db)
) -> TaskResponse:
    repo = TaskRepository(db)

    response = await repo.create_task(task)

    return TaskResponse.model_validate(response)

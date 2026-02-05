import logging
from typing import Annotated, List

from fastapi import APIRouter, HTTPException, status, Depends, Path, Response
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.tasks import TaskCreate, TaskResponse, TaskUpdate
from src.core.dependencies import get_db
from src.services.task_repository import TaskRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    description="Create a task for a specific user",
    response_description="Task created successfully",
    response_model=TaskResponse,
)
async def create_task(
    task: TaskCreate, db: AsyncSession = Depends(get_db)
) -> TaskResponse:
    repo = TaskRepository(db)

    response = await repo.create_task(task)

    return TaskResponse.model_validate(response)


@router.get(
    "/{task_id}",
    status_code=status.HTTP_200_OK,
    description="Get task by task ID",
    response_description="Task retrieved successfully",
    response_model=TaskResponse,
)
async def get_task(
    task_id: Annotated[int, Path(title="The Id of the task to get", gt=0)],
    db: AsyncSession = Depends(get_db),
) -> TaskResponse:
    logging.info("Retrieving task")

    repo = TaskRepository(db)
    response = await repo.get_task_by_id(task_id)

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    return TaskResponse.model_validate(response)


@router.get(
    "/users/{user_id}",
    status_code=status.HTTP_200_OK,
    description="Get all the tasks of user with user_id",
    response_description="Task retrieved successfully",
    response_model=List[TaskResponse],
    responses={
        204: {
            "description": "No tasks found for user",
            "headers": {
                "X-Message": {
                    "description": "Status message",
                    "schema": {"type": "string"},
                }
            },
        },
    },
)
async def get_tasks_per_user(
    user_id: Annotated[int, Path(title="The Id of the user to get tasks to", gt=0)],
    db: AsyncSession = Depends(get_db),
) -> List[TaskResponse] | Response:
    logging.info("Retrieving all tasks of a user")

    repo = TaskRepository(db)
    response = await repo.get_tasks_per_user(user_id)

    if not response:
        logger.info("User does not have tasks")
        return Response(
            status_code=status.HTTP_204_NO_CONTENT,
            headers={"X-Message": "No tasks found for this user"},
        )

    return [TaskResponse.model_validate(task) for task in response]


@router.put(
    "/{task_id}",
    status_code=status.HTTP_200_OK,
    description="Update a task",
    response_description="Tasks updated successfully",
    response_model=TaskResponse,
)
async def update_task(
    task_id: Annotated[int, Path(title="The task ID to update", gt=0)],
    task_update: TaskUpdate,
    db: AsyncSession = Depends(get_db),
) -> TaskResponse:
    if not task_update.model_dump(exclude_unset=True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No data to update"
        )

    repo = TaskRepository(db)
    task = await repo.get_task_by_id(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task does not exist"
        )

    response = await repo.update_task(task_id, task_update)

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

    return TaskResponse.model_validate(response)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_200_OK,
    description="Delete Task by ID",
    response_description="Task deleted successfully",
)
async def delete_task(
    task_id: Annotated[int, Path(title="The ID of the task to delete", gt=0)],
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = TaskRepository(db)

    if not await repo.delete_task(task_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )

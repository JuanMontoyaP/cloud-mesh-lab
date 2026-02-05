from fastapi import APIRouter, status

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    description="Create a task for a specific user",
    response_description="Task created successfully",
    # response_model=
)
async def create_task():
    pass

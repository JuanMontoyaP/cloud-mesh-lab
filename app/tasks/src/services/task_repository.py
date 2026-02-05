from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Task
from src.schemas.tasks import TaskCreate


class TaskRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_task(self, task_data: TaskCreate) -> Task:
        task = Task(
            user_id=task_data.user_id,
            title=task_data.title,
            description=task_data.description,
        )

        self.session.add(task)
        await self.session.flush()
        await self.session.refresh(task)

        return task

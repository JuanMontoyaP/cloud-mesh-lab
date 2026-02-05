from typing import Optional, Sequence

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Task
from src.schemas.tasks import TaskCreate, TaskUpdate


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

    async def get_task_by_id(self, id: int) -> Optional[Task]:
        result = await self.session.execute(select(Task).where(Task.id == id))
        return result.scalar_one_or_none()

    async def get_tasks_per_user(self, user_id: int) -> Optional[Sequence[Task]]:
        result = await self.session.execute(select(Task).where(Task.user_id == user_id))

        tasks = result.scalars().all()
        return tasks if tasks else None

    async def update_task(
        self, task_id: int, task_update: TaskUpdate
    ) -> Optional[Task]:
        update_data = task_update.model_dump(exclude_unset=True)

        if not update_data:
            return await self.get_task_by_id(task_id)

        await self.session.execute(
            update(Task).where(Task.id == task_id).values(**update_data)
        )
        await self.session.flush()
        return await self.get_task_by_id(task_id)

    async def delete_task(self, task_id: int) -> bool:
        result = await self.session.execute(delete(Task).where(Task.id == task_id))
        return result.rowcount > 0  # type: ignore[attr-defined]

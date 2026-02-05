from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    title: str = Field(min_length=4, max_length=20, examples=["My First Task"])
    description: str = Field(
        min_length=4, max_length=255, examples=["My Task Description"]
    )


class TaskCreate(TaskBase):
    user_id: int = Field(ge=1)


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    user_id: Optional[int] = None
    complete: Optional[bool] = None


class TaskResponse(TaskBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    complete: bool

    model_config = ConfigDict(from_attributes=True)

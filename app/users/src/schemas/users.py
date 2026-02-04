from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(min_length=3, max_length=20, examples=["Juan"])
    lastname: str = Field(min_length=3, max_length=20, examples=["Perez"])


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=20, examples=["pass1234*"])


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserInDB(UserResponse):
    hashed_password: str

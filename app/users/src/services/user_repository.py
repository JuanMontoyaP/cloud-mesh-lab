from typing import Optional

from sqlalchemy import select, update, delete, func
from pydantic import EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import User
from src.schemas.users import UserBase, UserUpdate


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_by_id(self, id: int) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.id == id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: EmailStr) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create_user(self, user_data: UserBase, hashed_password: str) -> User:
        user = User(
            email=user_data.email,
            name=user_data.name,
            lastname=user_data.lastname,
            hashed_password=hashed_password,
        )

        self.session.add(user)
        await self.session.flush()
        await self.session.refresh(user)
        return user

    async def update_user(self, user_id: int, user_data: UserUpdate) -> Optional[User]:
        update_data = user_data.model_dump(exclude_unset=True)

        if not update_data:
            return await self.get_user_by_id(user_id)

        await self.session.execute(
            update(User).where(User.id == user_id).values(**update_data)
        )
        await self.session.flush()
        return await self.get_user_by_id(user_id)

    async def delete(self, user_id: int) -> bool:
        result = await self.session.execute(delete(User).where(User.id == user_id))
        return result.rowcount > 0  # type: ignore[attr-defined]

    async def exists(self, email: EmailStr) -> bool:
        result = await self.session.execute(
            select(func.count(User.id)).where(User.email == email)
        )
        return result.scalar_one() > 0

import logging

from typing import Annotated
from fastapi import APIRouter, Depends, Path, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.helpers.password import hash_password

from src.schemas.users import UserCreate, UserResponse, UserBase, UserUpdate
from src.core.dependencies import get_db
from src.services.user_repository import UserRepository

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    description="Create user with the specified data",
    response_description="User created successfully",
    response_model=UserResponse,
)
async def create_user(
    user: UserCreate, db: AsyncSession = Depends(get_db)
) -> UserResponse:
    logger.info("Creating user")
    repo = UserRepository(db)

    if await repo.exists(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    user_data = UserBase(email=user.email, name=user.name, lastname=user.lastname)
    hashed_password = hash_password(user.password)
    response = await repo.create_user(user_data, hashed_password)

    return UserResponse(
        id=response.id,
        email=response.email,
        name=response.name,
        lastname=response.lastname,
        created_at=response.created_at,
        updated_at=response.updated_at,
        is_active=response.is_active,
    )


@router.get(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
    description="Retrieve a user with user ID",
    response_description="User retrieved successfully",
    response_model=UserResponse,
)
async def get_user(
    user_id: Annotated[int, Path(title="The ID of the user to get", gt=0)],
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    logger.info("Retrieving user")

    repo = UserRepository(db)
    response = await repo.get_user_by_id(user_id)

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return UserResponse(
        id=response.id,
        email=response.email,
        name=response.name,
        lastname=response.lastname,
        created_at=response.created_at,
        updated_at=response.updated_at,
        is_active=response.is_active,
    )


@router.put(
    "/{user_id}",
    status_code=200,
    description="Update and user",
    response_description="User updated successfully",
    response_model=UserResponse,
)
async def update_user(
    user_id: Annotated[int, Path(title="The ID of the user to update")],
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    if not user_data.model_dump(exclude_unset=True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No data to update"
        )

    repo = UserRepository(db)
    user = await repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist"
        )

    if user_data.email and user_data.email != user.email:
        if await repo.get_user_by_email(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exist"
            )

    response = await repo.update_user(user_id, user_data)

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return UserResponse(
        id=response.id,
        email=response.email,
        name=response.name,
        lastname=response.lastname,
        created_at=response.created_at,
        updated_at=response.updated_at,
        is_active=response.is_active,
    )


@router.delete(
    "/{user_id}",
    status_code=200,
    description="Delete user with user ID",
    response_description="User deleted successfully",
)
async def delete_user(
    user_id: Annotated[int, Path(title="The ID of the user to delete")],
    db: AsyncSession = Depends(get_db),
) -> None:
    repo = UserRepository(db)

    if not await repo.delete(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

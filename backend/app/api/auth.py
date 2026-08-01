from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database.session import get_db
from app.models.models import User
from app.utils.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Query database for user
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()

    if user and verify_password(data.password, user.password_hash):
        token = create_access_token({"sub": user.username, "role": user.role})
        # Update user last login
        from datetime import datetime
        user.last_login = datetime.now()
        await db.commit()
        return TokenResponse(access_token=token, username=user.username, role=user.role)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password"
    )

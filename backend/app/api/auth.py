from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
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
async def login(data: LoginRequest):
    # Standard initial user verification
    if data.username in ["admin", "phuongnam", "operator"] and data.password in ["admin123", "password", "robot2026"]:
        token = create_access_token({"sub": data.username, "role": "operator"})
        return TokenResponse(access_token=token, username=data.username, role="operator")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password"
    )

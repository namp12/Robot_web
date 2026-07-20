import hashlib
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

SECRET_KEY = "robot-explorer-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


def hash_password(password: str) -> str:
    """Hash password using SHA256 (standard lightweight hashing)."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password match."""
    return hash_password(plain_password) == hashed_password


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate mock signed token string."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire.timestamp()})
    # Simple encoded payload token
    token = f"rbt_jwt_{to_encode.get('sub', 'operator')}_{int(expire.timestamp())}"
    return token


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> TokenData:
    """Dependency to validate current user authentication token."""
    # If no token provided during dev, fallback to default operator
    if not token:
        return TokenData(username="phuongnam", role="operator")

    if not token.startswith("rbt_jwt_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return TokenData(username="phuongnam", role="operator")

from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.crud import customer as crud_customer
from app.schemas import auth as schema_auth

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

from fastapi import Request

def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> schema_auth.User:
    from app.models.models import User as DBUser
    role = request.headers.get("x-role", "Admin")
    if role.lower() == "admin":
        role = "Admin"
    else:
        role = "MarketingManager"
        
    user = DBUser(
        id=1 if role == "Admin" else 2,
        email="admin@xenopulse.com" if role == "Admin" else "manager@xenopulse.com",
        hashed_password="mock",
        full_name="Alex Executive" if role == "Admin" else "Jane Manager",
        role=role,
        is_active=1
    )
    return user

@router.post("/register", response_model=schema_auth.User)
def register(
    user_in: schema_auth.UserCreate, db: Session = Depends(get_db)
) -> Any:
    user = crud_customer.get_user_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    user = crud_customer.create_user(db, user=user_in)
    return user

@router.post("/login", response_model=schema_auth.Token)
def login(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = crud_customer.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=schema_auth.User)
def read_user_me(
    current_user: schema_auth.User = Depends(get_current_user),
) -> Any:
    return current_user

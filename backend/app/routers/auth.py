import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

COLORS = ["#6366F1", "#EC4899", "#14B8A6", "#F59E0B", "#8B5CF6", "#EF4444", "#22C55E"]


def _find_by_email(db: Session, email: str):
    # Case-insensitive: phones often capitalise the first letter of an email field,
    # and accounts created before emails were lowercased may be stored mixed-case.
    return db.query(User).filter(func.lower(User.email) == email.lower()).first()


def _find_by_username(db: Session, username: str):
    matches = db.query(User).filter(func.lower(User.username) == username.lower()).all()
    if len(matches) == 1:
        return matches[0]
    # "Sam" and "sam" can both exist from before usernames were compared case-insensitively
    return next((u for u in matches if u.username == username), None)


@router.post("/register", response_model=Token)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if _find_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(func.lower(User.username) == data.username.lower()).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=data.email.lower(),
        username=data.username,
        hashed_password=hash_password(data.password),
        avatar_color=random.choice(COLORS),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    # Usernames can't contain "@", so anything with one is an email address
    user = _find_by_email(db, data.login) if "@" in data.login else _find_by_username(db, data.login)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email, username or password")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token}


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user

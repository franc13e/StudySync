from datetime import datetime, date
from pydantic import BaseModel, EmailStr


# ── Auth ──────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    avatar_color: str

    class Config:
        from_attributes = True


# ── Groups ────────────────────────────────────────────────────
class GroupCreate(BaseModel):
    name: str
    subject: str = "General"


class GroupOut(BaseModel):
    id: int
    name: str
    subject: str
    color: str
    invite_code: str
    member_count: int = 0
    members: list[UserOut] = []

    class Config:
        from_attributes = True


class GroupJoin(BaseModel):
    invite_code: str


# ── Schedule ──────────────────────────────────────────────────
class ScheduleCreate(BaseModel):
    label: str
    day_of_week: int  # 0-6
    start_hour: int   # 0-23
    duration: int      # hours
    color: str = "#6366F1"


class ScheduleOut(BaseModel):
    id: int
    user_id: int
    label: str
    day_of_week: int
    start_hour: int
    duration: int
    color: str
    username: str = ""

    class Config:
        from_attributes = True


# ── Messages ──────────────────────────────────────────────────
class MessageOut(BaseModel):
    id: int
    group_id: int
    user_id: int
    content: str
    created_at: datetime
    username: str = ""
    avatar_color: str = "#6366F1"

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    content: str


# ── Streaks ───────────────────────────────────────────────────
class StudyLogCreate(BaseModel):
    duration_minutes: int = 0
    note: str = ""
    logged_date: date | None = None


class StudyLogOut(BaseModel):
    id: int
    logged_date: date
    duration_minutes: int
    note: str

    class Config:
        from_attributes = True


class StreakOut(BaseModel):
    current_streak: int
    longest_streak: int
    total_days: int
    this_week: list[StudyLogOut]

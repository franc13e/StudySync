from datetime import datetime, date, timedelta
from typing import Annotated

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator, model_validator


def _text(min_length: int, max_length: int):
    """Trimmed string with length limits (limits match the database columns)."""
    return Annotated[str, StringConstraints(strip_whitespace=True, min_length=min_length, max_length=max_length)]


HexColor = Annotated[str, StringConstraints(pattern=r"^#[0-9A-Fa-f]{6}$")]


# ── Auth ──────────────────────────────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    username: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=30, pattern=r"^[A-Za-z0-9_.-]+$")]
    password: Annotated[str, StringConstraints(min_length=8, max_length=128)]


class UserLogin(BaseModel):
    # Email address or username. Older app versions send it as "email".
    login: _text(1, 255) = Field(validation_alias=AliasChoices("login", "email"))
    password: Annotated[str, StringConstraints(max_length=128)]


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    """The signed-in user's own profile (includes email)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    username: str
    avatar_color: str


class MemberOut(BaseModel):
    """Another user as seen by fellow group members (no email)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_color: str


# ── Groups ────────────────────────────────────────────────────
class GroupCreate(BaseModel):
    name: _text(1, 100)
    subject: _text(1, 100) = "General"


class GroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    subject: str
    color: str
    invite_code: str
    member_count: int = 0
    members: list[MemberOut] = []


class GroupJoin(BaseModel):
    invite_code: _text(1, 16)

    @field_validator("invite_code")
    @classmethod
    def normalise_code(cls, v: str) -> str:
        return v.upper()


# ── Schedule ──────────────────────────────────────────────────
MINUTES_PER_DAY = 24 * 60


class ScheduleCreate(BaseModel):
    label: _text(1, 100)
    day_of_week: int = Field(ge=0, le=6)  # 0 = Monday
    start_hour: int = Field(ge=0, le=23)
    start_minute: int = Field(default=0, ge=0, le=59)
    # Exact length in minutes. Older clients send whole hours in `duration` instead.
    duration_minutes: int | None = Field(default=None, ge=5, le=12 * 60)
    duration: int | None = Field(default=None, ge=1, le=12)  # hours
    color: HexColor = "#6366F1"

    @model_validator(mode="after")
    def length_and_end(self):
        if self.duration_minutes is None:
            if self.duration is None:
                raise ValueError("Give the class a length")
            self.duration_minutes = self.duration * 60
        # Whole hours, rounded up, for the legacy column
        self.duration = max(1, -(-self.duration_minutes // 60))
        if self.start_hour * 60 + self.start_minute + self.duration_minutes > MINUTES_PER_DAY:
            raise ValueError("A class must end by midnight")
        return self


class ScheduleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    label: str
    day_of_week: int
    start_hour: int
    start_minute: int = 0
    duration: int
    duration_minutes: int
    color: str
    username: str = ""


# ── Messages ──────────────────────────────────────────────────
MAX_MESSAGE_LENGTH = 2000


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    group_id: int
    user_id: int
    content: str
    created_at: datetime
    username: str = ""
    avatar_color: str = "#6366F1"


class MessageCreate(BaseModel):
    content: _text(1, MAX_MESSAGE_LENGTH)


# ── Streaks ───────────────────────────────────────────────────
MINUTES_PER_DAY = 24 * 60


class StudyLogCreate(BaseModel):
    duration_minutes: int = Field(default=0, ge=0, le=MINUTES_PER_DAY)
    note: _text(0, 500) = ""
    logged_date: date | None = None

    @field_validator("logged_date")
    @classmethod
    def not_in_future(cls, v: date | None) -> date | None:
        # One day of slack: the server runs on UTC and users can be up to 14h ahead.
        if v is not None and v > date.today() + timedelta(days=1):
            raise ValueError("Can't log study time in the future")
        return v


class StudyLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    logged_date: date
    duration_minutes: int
    note: str


class StreakOut(BaseModel):
    current_streak: int
    longest_streak: int
    total_days: int
    this_week: list[StudyLogOut]

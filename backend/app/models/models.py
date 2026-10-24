from datetime import datetime, date, timezone


def utcnow() -> datetime:
    """Naive UTC timestamp (the columns are timezone-naive)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Date,
    ForeignKey, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    avatar_color = Column(String(7), default="#6366F1")
    created_at = Column(DateTime, default=utcnow)

    memberships = relationship("GroupMember", back_populates="user")
    schedules = relationship("Schedule", back_populates="user")
    messages = relationship("Message", back_populates="user")
    streaks = relationship("StudyLog", back_populates="user")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    subject = Column(String(200), default="General")
    color = Column(String(7), default="#6366F1")
    invite_code = Column(String(8), unique=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=utcnow)

    members = relationship("GroupMember", back_populates="group")
    messages = relationship("Message", back_populates="group")


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    joined_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="memberships")
    group = relationship("Group", back_populates="members")

    __table_args__ = (
        UniqueConstraint("user_id", "group_id", name="uq_user_group"),
    )


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    label = Column(String(200), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Mon, 6=Sun
    start_hour = Column(Integer, nullable=False)    # 0-23
    duration = Column(Integer, nullable=False)      # hours
    color = Column(String(7), default="#6366F1")
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="schedules")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    group = relationship("Group", back_populates="messages")
    user = relationship("User", back_populates="messages")


class StudyLog(Base):
    __tablename__ = "study_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    logged_date = Column(Date, default=date.today, nullable=False)
    duration_minutes = Column(Integer, default=0)
    note = Column(String(500), default="")

    user = relationship("User", back_populates="streaks")

    __table_args__ = (
        UniqueConstraint("user_id", "logged_date", name="uq_user_date"),
    )

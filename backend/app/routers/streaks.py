from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, StudyLog
from app.schemas.schemas import StudyLogCreate, StudyLogOut, StreakOut, MINUTES_PER_DAY
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/streaks", tags=["streaks"])


def calculate_streak(logs: list[StudyLog]) -> tuple[int, int]:
    """Returns (current_streak, longest_streak)."""
    if not logs:
        return 0, 0

    dates = sorted({log.logged_date for log in logs}, reverse=True)
    today = date.today()

    # Current streak: consecutive days ending today or yesterday
    current = 0
    check_date = today
    if dates[0] < today - timedelta(days=1):
        current = 0
    else:
        if dates[0] == today - timedelta(days=1):
            check_date = today - timedelta(days=1)
        for d in dates:
            if d == check_date:
                current += 1
                check_date -= timedelta(days=1)
            elif d < check_date:
                break

    # Longest streak
    longest = 1
    run = 1
    sorted_asc = sorted(dates)
    for i in range(1, len(sorted_asc)):
        if sorted_asc[i] - sorted_asc[i - 1] == timedelta(days=1):
            run += 1
            longest = max(longest, run)
        else:
            run = 1

    return current, longest


@router.get("/me", response_model=StreakOut)
def get_streak(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(StudyLog).filter(StudyLog.user_id == user.id).all()

    current, longest = calculate_streak(logs)

    # This week's logs (Mon-Sun)
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    week_logs = [l for l in logs if l.logged_date >= monday]

    return StreakOut(
        current_streak=current,
        longest_streak=longest,
        total_days=len(set(l.logged_date for l in logs)),
        this_week=[StudyLogOut.model_validate(l) for l in sorted(week_logs, key=lambda x: x.logged_date)],
    )


@router.post("/log", response_model=StudyLogOut)
def log_study(data: StudyLogCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_date = data.logged_date or date.today()

    existing = (
        db.query(StudyLog)
        .filter(StudyLog.user_id == user.id, StudyLog.logged_date == log_date)
        .first()
    )
    if existing:
        existing.duration_minutes = min(existing.duration_minutes + data.duration_minutes, MINUTES_PER_DAY)
        existing.note = data.note or existing.note
        db.commit()
        db.refresh(existing)
        return existing

    log = StudyLog(
        user_id=user.id,
        logged_date=log_date,
        duration_minutes=data.duration_minutes,
        note=data.note,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

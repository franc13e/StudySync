from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, Schedule, GroupMember
from app.schemas.schemas import ScheduleCreate, ScheduleOut
from app.services.auth import get_current_user, require_group_member

router = APIRouter(prefix="/api/schedule", tags=["schedule"])


def _out(block: Schedule, username: str) -> ScheduleOut:
    data = {c.name: getattr(block, c.name) for c in Schedule.__table__.columns}
    data["start_minute"] = data.get("start_minute") or 0
    # Classes made before minutes existed only have whole hours
    data["duration_minutes"] = data.get("duration_minutes") or data["duration"] * 60
    return ScheduleOut(username=username, **data)


@router.get("", response_model=list[ScheduleOut])
def get_my_schedule(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    blocks = db.query(Schedule).filter(Schedule.user_id == user.id).all()
    return [_out(b, user.username) for b in blocks]


@router.post("", response_model=ScheduleOut)
def add_block(data: ScheduleCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    block = Schedule(user_id=user.id, **data.model_dump())
    db.add(block)
    db.commit()
    db.refresh(block)
    return _out(block, user.username)


@router.put("/{block_id}", response_model=ScheduleOut)
def update_block(block_id: int, data: ScheduleCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    block = db.query(Schedule).filter(Schedule.id == block_id, Schedule.user_id == user.id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    for key, value in data.model_dump().items():
        setattr(block, key, value)
    db.commit()
    db.refresh(block)
    return _out(block, user.username)


@router.delete("/{block_id}")
def delete_block(block_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    block = db.query(Schedule).filter(Schedule.id == block_id, Schedule.user_id == user.id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")
    db.delete(block)
    db.commit()
    return {"ok": True}


@router.get("/group/{group_id}", response_model=list[ScheduleOut])
def get_group_schedule(group_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get combined timetable for all members of a group."""
    require_group_member(group_id, user, db)
    member_ids = [
        m.user_id
        for m in db.query(GroupMember).filter(GroupMember.group_id == group_id).all()
    ]
    blocks = db.query(Schedule).filter(Schedule.user_id.in_(member_ids)).all()
    result = []
    for b in blocks:
        u = db.get(User, b.user_id)
        result.append(_out(b, u.username if u else ""))
    return result

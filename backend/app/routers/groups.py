import random
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User, Group, GroupMember
from app.schemas.schemas import GroupCreate, GroupOut, GroupJoin, MemberOut
from app.services.auth import get_current_user, require_group_member

router = APIRouter(prefix="/api/groups", tags=["groups"])

COLORS = ["#6366F1", "#EC4899", "#14B8A6", "#F59E0B", "#8B5CF6"]


def generate_invite_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


def group_to_out(group: Group, db: Session) -> GroupOut:
    members = (
        db.query(User)
        .join(GroupMember)
        .filter(GroupMember.group_id == group.id)
        .all()
    )
    return GroupOut(
        id=group.id,
        name=group.name,
        subject=group.subject,
        color=group.color,
        invite_code=group.invite_code,
        member_count=len(members),
        members=[MemberOut.model_validate(m) for m in members],
    )


@router.get("", response_model=list[GroupOut])
def list_groups(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    groups = (
        db.query(Group)
        .join(GroupMember)
        .filter(GroupMember.user_id == user.id)
        .all()
    )
    return [group_to_out(g, db) for g in groups]


@router.post("", response_model=GroupOut)
def create_group(data: GroupCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = Group(
        name=data.name,
        subject=data.subject,
        color=random.choice(COLORS),
        invite_code=generate_invite_code(),
        created_by=user.id,
    )
    db.add(group)
    db.flush()

    membership = GroupMember(user_id=user.id, group_id=group.id)
    db.add(membership)
    db.commit()
    db.refresh(group)

    return group_to_out(group, db)


@router.post("/join", response_model=GroupOut)
def join_group(data: GroupJoin, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    group = db.query(Group).filter(Group.invite_code == data.invite_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    existing = (
        db.query(GroupMember)
        .filter(GroupMember.user_id == user.id, GroupMember.group_id == group.id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already a member")

    db.add(GroupMember(user_id=user.id, group_id=group.id))
    db.commit()

    return group_to_out(group, db)


@router.get("/{group_id}/members", response_model=list[MemberOut])
def get_members(group_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_group_member(group_id, user, db)
    members = (
        db.query(User)
        .join(GroupMember)
        .filter(GroupMember.group_id == group_id)
        .all()
    )
    return members

import json
from datetime import datetime
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.models import User, Message, GroupMember
from app.schemas.schemas import MAX_MESSAGE_LENGTH, MessageOut
from app.services.auth import get_current_user, require_group_member

router = APIRouter(tags=["chat"])


# ── REST endpoint for chat history ───────────────────────────
@router.get("/api/messages/{group_id}", response_model=list[MessageOut])
def get_messages(
    group_id: int,
    limit: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_group_member(group_id, user, db)
    messages = (
        db.query(Message)
        .filter(Message.group_id == group_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for m in reversed(messages):
        u = db.get(User, m.user_id)
        result.append(MessageOut(
            id=m.id,
            group_id=m.group_id,
            user_id=m.user_id,
            content=m.content,
            created_at=m.created_at,
            username=u.username if u else "Unknown",
            avatar_color=u.avatar_color if u else "#6366F1",
        ))
    return result


# ── WebSocket connection manager ──────────────────────────────
class ConnectionManager:
    def __init__(self):
        # group_id -> list of (websocket, user_id)
        self.active: dict[int, list[tuple[WebSocket, int]]] = {}

    async def connect(self, websocket: WebSocket, group_id: int, user_id: int):
        await websocket.accept()
        if group_id not in self.active:
            self.active[group_id] = []
        self.active[group_id].append((websocket, user_id))

    def disconnect(self, websocket: WebSocket, group_id: int):
        if group_id in self.active:
            self.active[group_id] = [
                (ws, uid) for ws, uid in self.active[group_id] if ws != websocket
            ]

    async def broadcast(self, group_id: int, message: dict):
        if group_id in self.active:
            payload = json.dumps(message, default=str)
            for ws, _ in self.active[group_id]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    pass


manager = ConnectionManager()


@router.websocket("/ws/chat/{group_id}")
async def websocket_chat(websocket: WebSocket, group_id: int, token: str = ""):
    """
    WebSocket endpoint for real-time group chat.
    Connect with: ws://localhost:8000/ws/chat/{group_id}?token=JWT_TOKEN
    """
    # Validate token
    import jwt
    from app.config import settings

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = int(payload.get("sub"))
    except (jwt.PyJWTError, TypeError, ValueError):
        await websocket.close(code=4001)
        return

    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        db.close()
        await websocket.close(code=4001)
        return

    # Verify membership
    membership = (
        db.query(GroupMember)
        .filter(GroupMember.user_id == user_id, GroupMember.group_id == group_id)
        .first()
    )
    if not membership:
        db.close()
        await websocket.close(code=4003)
        return

    await manager.connect(websocket, group_id, user_id)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                content = str(json.loads(data).get("content", "")).strip()
            except (ValueError, AttributeError):
                continue
            if not content or len(content) > MAX_MESSAGE_LENGTH:
                continue

            # Persist message
            msg = Message(
                group_id=group_id,
                user_id=user_id,
                content=content,
            )
            db.add(msg)
            db.commit()
            db.refresh(msg)

            # Broadcast to group
            await manager.broadcast(group_id, {
                "id": msg.id,
                "group_id": group_id,
                "user_id": user_id,
                "content": content,
                "created_at": msg.created_at.isoformat(),
                "username": user.username,
                "avatar_color": user.avatar_color,
            })
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, group_id)
        db.close()

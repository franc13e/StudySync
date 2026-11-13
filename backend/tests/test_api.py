import pytest
from starlette.websockets import WebSocketDisconnect


def test_register_login_and_me(client):
    body = {"email": "ada@example.com", "username": "ada", "password": "correct horse"}
    assert client.post("/api/auth/register", json=body).status_code == 200
    assert client.post("/api/auth/register", json=body).status_code == 400  # duplicate

    bad = client.post("/api/auth/login", json={"email": "ada@example.com", "password": "nope"})
    assert bad.status_code == 401

    ok = client.post("/api/auth/login", json={"email": "ada@example.com", "password": "correct horse"})
    token = ok.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).json()
    assert me["username"] == "ada"


def test_email_is_case_insensitive(client):
    body = {"email": "Grace@Example.com", "username": "grace", "password": "correct horse"}
    assert client.post("/api/auth/register", json=body).status_code == 200
    dup = {**body, "email": "grace@example.com", "username": "grace2"}
    assert client.post("/api/auth/register", json=dup).status_code == 400

    for email in ["grace@example.com", "GRACE@example.com", "Grace@Example.com"]:
        r = client.post("/api/auth/login", json={"email": email, "password": "correct horse"})
        assert r.status_code == 200, email


def test_login_with_username(client):
    body = {"email": "katherine@example.com", "username": "KJohnson", "password": "correct horse"}
    assert client.post("/api/auth/register", json=body).status_code == 200
    taken = {**body, "email": "other@example.com", "username": "kjohnson"}
    assert client.post("/api/auth/register", json=taken).status_code == 400

    for name in ["KJohnson", "kjohnson", " kjohnson "]:
        r = client.post("/api/auth/login", json={"login": name, "password": "correct horse"})
        assert r.status_code == 200, name
    wrong = client.post("/api/auth/login", json={"login": "kjohnson", "password": "nope"})
    assert wrong.status_code == 401
    # Older app versions still send the field as "email"
    legacy = client.post("/api/auth/login", json={"email": "katherine@example.com", "password": "correct horse"})
    assert legacy.status_code == 200


def test_login_finds_mixed_case_accounts_created_before_lowercasing(client):
    from app.database import SessionLocal
    from app.models.models import User
    from app.services.auth import hash_password

    with SessionLocal() as db:
        db.add(User(email="Linus@example.com", username="linus", hashed_password=hash_password("correct horse")))
        db.commit()
    r = client.post("/api/auth/login", json={"email": "linus@example.com", "password": "correct horse"})
    assert r.status_code == 200


def test_requires_auth(client):
    assert client.get("/api/groups").status_code == 401
    assert client.get("/api/groups", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_create_and_join_group(client, make_user):
    owner, _, _ = make_user()
    friend, _, _ = make_user()

    group = client.post("/api/groups", json={"name": "Algorithms"}, headers=owner).json()
    joined = client.post("/api/groups/join", json={"invite_code": group["invite_code"]}, headers=friend)
    assert joined.status_code == 200 and joined.json()["member_count"] == 2

    again = client.post("/api/groups/join", json={"invite_code": group["invite_code"]}, headers=friend)
    assert again.status_code == 400
    assert client.post("/api/groups/join", json={"invite_code": "XXXXXXXX"}, headers=friend).status_code == 404


def test_group_data_is_private_to_members(client, make_user):
    owner, _, _ = make_user()
    outsider, _, _ = make_user()
    gid = client.post("/api/groups", json={"name": "Private"}, headers=owner).json()["id"]

    for path in (f"/api/messages/{gid}", f"/api/groups/{gid}/members", f"/api/schedule/group/{gid}"):
        assert client.get(path, headers=owner).status_code == 200, path
        assert client.get(path, headers=outsider).status_code == 403, path


def test_schedule_crud(client, make_user):
    me, _, _ = make_user()
    block = client.post("/api/schedule", headers=me, json={
        "label": "Lecture", "day_of_week": 0, "start_hour": 9, "duration": 2,
    }).json()
    assert [b["id"] for b in client.get("/api/schedule", headers=me).json()] == [block["id"]]
    assert client.delete(f"/api/schedule/{block['id']}", headers=me).status_code == 200
    assert client.get("/api/schedule", headers=me).json() == []


def test_schedule_minutes_and_edit(client, make_user):
    me, _, _ = make_user()
    block = client.post("/api/schedule", headers=me, json={
        "label": "Lab", "day_of_week": 2, "start_hour": 9, "start_minute": 30, "duration_minutes": 40, "color": "#12abEF",
    }).json()
    assert (block["start_hour"], block["start_minute"], block["duration_minutes"], block["duration"]) == (9, 30, 40, 1)

    edited = client.put(f"/api/schedule/{block['id']}", headers=me, json={
        "label": "Chem lab", "day_of_week": 3, "start_hour": 13, "start_minute": 15, "duration_minutes": 100, "color": "#000000",
    })
    assert edited.status_code == 200, edited.text
    e = edited.json()
    assert (e["label"], e["day_of_week"], e["start_hour"], e["start_minute"], e["duration_minutes"], e["duration"]) == ("Chem lab", 3, 13, 15, 100, 2)
    assert client.get("/api/schedule", headers=me).json()[0]["label"] == "Chem lab"

    # Someone else can't edit it, and bad edits are rejected
    other, _, _ = make_user()
    assert client.put(f"/api/schedule/{block['id']}", headers=other, json={**e, "label": "Mine"}).status_code == 404
    assert client.put(f"/api/schedule/{block['id']}", headers=me, json={**e, "start_hour": 23, "start_minute": 30, "duration_minutes": 45}).status_code == 422


def test_schedule_hours_still_work(client, make_user):
    me, _, _ = make_user()
    block = client.post("/api/schedule", headers=me, json={
        "label": "Lecture", "day_of_week": 0, "start_hour": 22, "duration": 2,
    }).json()
    assert (block["start_minute"], block["duration_minutes"]) == (0, 120)


def test_old_classes_without_minutes_are_read_as_whole_hours(client, make_user):
    from app.database import SessionLocal
    from app.models.models import Schedule
    me, _, uid = make_user()
    with SessionLocal() as db:
        db.add(Schedule(user_id=uid, label="Old", day_of_week=1, start_hour=8, duration=3, color="#FFC285"))
        db.commit()
    [b] = client.get("/api/schedule", headers=me).json()
    assert (b["start_minute"], b["duration_minutes"]) == (0, 180)


def test_ensure_columns_adds_missing_ones(tmp_path):
    from sqlalchemy import create_engine, inspect, text
    from app.database import ensure_columns
    eng = create_engine(f"sqlite:///{tmp_path / 'old.db'}")
    with eng.begin() as conn:
        conn.execute(text("CREATE TABLE schedules (id INTEGER PRIMARY KEY, start_hour INTEGER NOT NULL)"))
        conn.execute(text("INSERT INTO schedules (start_hour) VALUES (9)"))
    cols = {"start_minute": "INTEGER NOT NULL DEFAULT 0", "duration_minutes": "INTEGER"}
    assert ensure_columns(eng, "schedules", cols) == ["start_minute", "duration_minutes"]
    assert ensure_columns(eng, "schedules", cols) == []
    assert {c["name"] for c in inspect(eng).get_columns("schedules")} >= set(cols)
    with eng.connect() as conn:
        assert conn.execute(text("SELECT start_minute, duration_minutes FROM schedules")).one() == (0, None)
    assert ensure_columns(eng, "nope", cols) == []


def test_study_log_updates_streak(client, make_user):
    me, _, _ = make_user()
    assert client.post("/api/streaks/log", headers=me, json={"duration_minutes": 45}).status_code == 200
    streak = client.get("/api/streaks/me", headers=me).json()
    assert streak["current_streak"] == 1


def test_websocket_chat_broadcasts_and_persists(client, make_user):
    owner, token, _ = make_user()
    gid = client.post("/api/groups", json={"name": "Chat"}, headers=owner).json()["id"]

    with client.websocket_connect(f"/ws/chat/{gid}?token={token}") as ws:
        ws.send_text("not json")  # ignored, connection stays open
        ws.send_json({"content": "hello group"})
        assert ws.receive_json()["content"] == "hello group"

    history = client.get(f"/api/messages/{gid}", headers=owner).json()
    assert [m["content"] for m in history] == ["hello group"]


def test_websocket_rejects_non_members(client, make_user):
    owner, _, _ = make_user()
    _, outsider_token, _ = make_user()
    gid = client.post("/api/groups", json={"name": "Closed"}, headers=owner).json()["id"]

    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(f"/ws/chat/{gid}?token={outsider_token}") as ws:
            ws.receive_text()
    assert exc.value.code == 4003


@pytest.mark.parametrize("payload", [
    {"email": "a@example.com", "username": "", "password": "long-enough-1"},
    {"email": "b@example.com", "username": "has space", "password": "long-enough-1"},
    {"email": "c@example.com", "username": "x" * 31, "password": "long-enough-1"},
    {"email": "d@example.com", "username": "shortpw", "password": "short"},
])
def test_registration_validation(client, payload):
    assert client.post("/api/auth/register", json=payload).status_code == 422


def test_members_do_not_expose_email(client, make_user):
    owner, _, _ = make_user()
    friend, _, _ = make_user()
    group = client.post("/api/groups", json={"name": "Privacy"}, headers=owner).json()
    client.post("/api/groups/join", json={"invite_code": group["invite_code"].lower()}, headers=friend)

    listed = client.get("/api/groups", headers=friend).json()[0]["members"]
    members = client.get(f"/api/groups/{group['id']}/members", headers=friend).json()
    assert len(members) == 2  # lower-case invite code still worked
    assert all("email" not in m for m in listed + members)
    assert "email" in client.get("/api/auth/me", headers=friend).json()  # own profile still has it


@pytest.mark.parametrize("payload", [
    {"label": "X", "day_of_week": 7, "start_hour": 9, "duration": 1},
    {"label": "X", "day_of_week": 0, "start_hour": 24, "duration": 1},
    {"label": "X", "day_of_week": 0, "start_hour": 9, "duration": 0},
    {"label": "X", "day_of_week": 0, "start_hour": 22, "duration": 3},
    {"label": "  ", "day_of_week": 0, "start_hour": 9, "duration": 1},
    {"label": "X", "day_of_week": 0, "start_hour": 9, "duration": 1, "color": "red;x:y"},
    {"label": "X", "day_of_week": 0, "start_hour": 9, "start_minute": 60, "duration_minutes": 30},
    {"label": "X", "day_of_week": 0, "start_hour": 9, "duration_minutes": 0},
    {"label": "X", "day_of_week": 0, "start_hour": 23, "start_minute": 40, "duration_minutes": 30},
    {"label": "X", "day_of_week": 0, "start_hour": 9},
])
def test_schedule_validation(client, make_user, payload):
    me, _, _ = make_user()
    assert client.post("/api/schedule", headers=me, json=payload).status_code == 422


def test_group_and_log_validation(client, make_user):
    me, _, _ = make_user()
    assert client.post("/api/groups", json={"name": ""}, headers=me).status_code == 422
    assert client.post("/api/groups", json={"name": "x" * 101}, headers=me).status_code == 422
    assert client.post("/api/streaks/log", headers=me, json={"duration_minutes": -5}).status_code == 422
    assert client.post("/api/streaks/log", headers=me, json={"duration_minutes": 30, "logged_date": "2099-01-01"}).status_code == 422


def test_daily_study_time_is_capped(client, make_user):
    me, _, _ = make_user()
    for _ in range(3):
        client.post("/api/streaks/log", headers=me, json={"duration_minutes": 600})
    assert client.get("/api/streaks/me", headers=me).json()["this_week"][-1]["duration_minutes"] == 1440


def test_message_history_limit_is_bounded(client, make_user):
    me, _, _ = make_user()
    gid = client.post("/api/groups", json={"name": "Limits"}, headers=me).json()["id"]
    assert client.get(f"/api/messages/{gid}?limit=100000", headers=me).status_code == 422


def test_overlong_chat_messages_are_dropped(client, make_user):
    me, token, _ = make_user()
    gid = client.post("/api/groups", json={"name": "Long"}, headers=me).json()["id"]
    with client.websocket_connect(f"/ws/chat/{gid}?token={token}") as ws:
        ws.send_json({"content": "x" * 2001})
        ws.send_json({"content": "short"})
        assert ws.receive_json()["content"] == "short"

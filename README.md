# StudySync — Collaborative Study Planner

[![CI](https://github.com/franc13e/StudySync/actions/workflows/ci.yml/badge.svg)](https://github.com/franc13e/StudySync/actions/workflows/ci.yml)

A full-stack web app where university students create study groups, share timetables, and track study streaks with real-time group chat.

**Tech Stack:** React · Vite · Tailwind CSS · FastAPI · SQLAlchemy · PostgreSQL · WebSockets · JWT auth

---

## Features

- **Study groups**: create a group, share its invite code, and see who's in it
- **Real-time group chat**: WebSocket chat with persisted message history
- **Shared timetables**: add your classes, then see every member's schedule in one weekly grid
- **Study streaks**: log study sessions and track current / longest streaks
- **Focus tools**: Pomodoro timer and a quick task list on the home screen
- **Progress stats**: weekly study hours, time by subject, and achievements
- **Installable PWA**: works as a home-screen app with an offline-cached shell

Group data (chat, members, combined timetable) is only visible to members of that group.

## Project Structure

```
StudySync/
├── frontend/                # React (Vite + Tailwind)
│   └── src/
│       ├── pages/           # Home, Schedule, Groups, Group chat, Stats, Login, Register
│       ├── components/      # Layout & navigation
│       ├── hooks/           # useChat (history + WebSocket)
│       ├── context/         # Auth context
│       └── services/        # API client
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── main.py          # App, CORS, router registration
│   │   ├── config.py        # Settings from environment
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models/          # ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # auth, groups, schedule, streaks, chat
│   │   └── services/        # Password hashing, JWT, membership checks
│   └── tests/               # API + WebSocket tests (pytest)
└── docker-compose.yml       # PostgreSQL + backend for local development
```

## Running Locally

### 1. Database (PostgreSQL)

```bash
docker-compose up -d db
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env            # then set SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

Tables are created automatically on startup. API docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App at http://localhost:5173. The Vite dev server proxies `/api` and `/ws` to the backend.

### Tests

```bash
cd backend && pytest
```

Tests run against a temporary SQLite database, so no Postgres is needed. They run on every push via GitHub Actions together with the frontend build.

## Configuration

| Variable | Where | Description |
|---|---|---|
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `SECRET_KEY` | backend | Secret used to sign JWTs. Use a long random value in production |
| `CORS_ORIGINS` | backend | Comma-separated frontend origins allowed to call the API |
| `VITE_API_URL` | frontend | Backend URL when the API is hosted on a different domain |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/groups` | List user's groups |
| POST | `/api/groups` | Create a group |
| POST | `/api/groups/join` | Join a group with an invite code |
| GET | `/api/groups/{id}/members` | Group members *(members only)* |
| GET | `/api/schedule` | Get user's timetable |
| POST | `/api/schedule` | Add schedule block |
| DELETE | `/api/schedule/{id}` | Remove block |
| GET | `/api/schedule/group/{id}` | Combined group timetable *(members only)* |
| GET | `/api/streaks/me` | Get study streak |
| POST | `/api/streaks/log` | Log a study session |
| GET | `/api/messages/{group_id}` | Chat history *(members only)* |
| WS | `/ws/chat/{group_id}?token=…` | Real-time chat *(members only)* |

# StudySync — Collaborative Study Planner

A full-stack web app where university students create study groups, share timetables, and track study streaks with real-time group chat.

**Tech Stack:** React · FastAPI · PostgreSQL · WebSockets · Tailwind CSS

---

## Project Structure

```
studysync/
├── frontend/                # React (Vite + Tailwind)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route-level pages
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client functions
│   │   └── context/         # Auth & app context providers
│   ├── package.json
│   └── vite.config.js
├── backend/                 # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── main.py          # App entry, CORS, WebSocket
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── config.py        # Environment config
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/         # API route handlers
│   │   └── services/        # Business logic layer
│   ├── migrations/          # Alembic migrations
│   ├── requirements.txt
│   └── alembic.ini
├── docker-compose.yml       # PostgreSQL + app containers
└── README.md
```

## Quick Start

### 1. Database (PostgreSQL)

```bash
# Option A: Docker (recommended)
docker-compose up -d db

# Option B: Local PostgreSQL
createdb studysync
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set environment variables (or create .env)
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/studysync
export SECRET_KEY=your-secret-key-here

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

API docs at: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App at: http://localhost:5173

## Deployment

- **Frontend:** Vercel (`vercel deploy`)
- **Backend:** Railway or Render (connect GitHub repo, set env vars)
- **Database:** Railway PostgreSQL or Supabase (free tier)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/users/me` | Current user profile |
| GET | `/api/groups` | List user's groups |
| POST | `/api/groups` | Create a group |
| POST | `/api/groups/{id}/join` | Join a group |
| GET | `/api/groups/{id}/members` | Group members |
| GET | `/api/schedule` | Get user's timetable |
| POST | `/api/schedule` | Add schedule block |
| DELETE | `/api/schedule/{id}` | Remove block |
| GET | `/api/schedule/group/{id}` | Combined group timetable |
| GET | `/api/streaks/me` | Get study streak |
| POST | `/api/streaks/log` | Log a study session |
| GET | `/api/messages/{group_id}` | Chat history |
| WS | `/ws/chat/{group_id}` | Real-time chat |

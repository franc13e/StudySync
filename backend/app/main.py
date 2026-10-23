from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import auth, groups, schedule, streaks, chat

# Create tables (use Alembic migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StudySync API",
    description="Collaborative Study Planner — Backend API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(groups.router)
app.include_router(schedule.router)
app.include_router(streaks.router)
app.include_router(chat.router)


@app.get("/")
@app.get("/api/health")
def root():
    return {"app": "StudySync", "status": "running"}

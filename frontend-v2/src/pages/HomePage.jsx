import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { streaks as streaksApi } from "../services/api";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ── Streak Card ────────────────────────────────────────────
function StreakCard({ streak }) {
  const days = streak?.current_streak || 0;
  const xp = Math.min((days % 30) * 17, 500); // simulated XP
  return (
    <div className="bg-espresso rounded-3xl p-5 text-white">
      <p className="text-white/70 text-sm font-medium">Current Streak</p>
      <div className="flex items-center gap-4 mt-2">
        <span className="text-4xl">🐸</span>
        <div>
          <p className="font-display font-extrabold text-4xl leading-none">{days} <span className="text-lg font-semibold">days</span></p>
          <p className="text-white/70 text-sm mt-0.5">Ribbit! Keep it up! 🔥</p>
        </div>
      </div>
      {/* XP bar */}
      <div className="mt-4">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sage to-sunset rounded-full transition-all" style={{ width: `${(xp / 500) * 100}%` }} />
        </div>
        <p className="text-white/50 text-xs mt-1">{xp} / 500 XP to next level</p>
      </div>
    </div>
  );
}

// ── Weekly Check-in Dots ───────────────────────────────────
function WeeklyDots({ streak }) {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Mon=0
  const loggedDates = new Set(
    (streak?.this_week || []).map((l) => l.logged_date)
  );

  // Build this week's dates
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek);

  return (
    <div className="bg-butter border border-border rounded-3xl px-5 py-4 flex justify-between items-center">
      {DAYS.map((label, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        const logged = loggedDates.has(dateStr);
        const isToday = i === dayOfWeek;
        const isFuture = i > dayOfWeek;

        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                logged
                  ? "bg-sage/80 text-white"
                  : isToday
                  ? "bg-sunset/60 text-white"
                  : isFuture
                  ? "bg-inactive text-chocolate/40"
                  : "bg-inactive text-chocolate/60"
              }`}
            >
              {logged ? "✓" : isToday ? "★" : ""}
            </div>
            <span className="text-xs font-medium text-chocolate/70">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Pomodoro Timer ─────────────────────────────────────────
function PomodoroTimer({ onComplete }) {
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && totalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            onComplete?.();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, onComplete]);

  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const secs = String(totalSeconds % 60).padStart(2, "0");

  const reset = () => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setTotalSeconds(25 * 60);
  };

  return (
    <div className="bg-butter border border-border rounded-3xl p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-chocolate font-medium">Today's Focus</p>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-sage" />
          <span className="w-2 h-2 rounded-full bg-sage" />
          <span className="w-2 h-2 rounded-full bg-inactive" />
          <span className="w-2 h-2 rounded-full bg-inactive" />
        </div>
      </div>
      <h3 className="font-display font-bold text-xl">Pomodoro Timer</h3>

      <div className="flex items-center gap-5 mt-4">
        {/* Timer circle */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="35" fill="none" stroke="#EFE3CE" strokeWidth="5" />
            <circle
              cx="40" cy="40" r="35" fill="none"
              stroke="#A2C997" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 35}`}
              strokeDashoffset={`${2 * Math.PI * 35 * (1 - totalSeconds / (25 * 60))}`}
              className="transition-all duration-1000"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-lg">
            {mins}:{secs}
          </span>
        </div>

        <div>
          <p className="text-chocolate text-sm">
            {running ? "Stay focused…" : "Ready to focus?"}
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setRunning(!running)}
              className="bg-espresso text-white font-semibold rounded-full px-5 py-2 text-sm hover:opacity-90 transition flex items-center gap-1.5"
            >
              {running ? "⏸ Pause" : "▶ Start Focus"}
            </button>
            {totalSeconds < 25 * 60 && (
              <button onClick={reset} className="text-chocolate text-sm font-medium px-3">
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tasks (local) ──────────────────────────────────────────
function getStoredTasks() {
  try {
    return JSON.parse(localStorage.getItem("studysync_tasks") || "[]");
  } catch {
    return [];
  }
}

function TasksList() {
  const [tasks, setTasks] = useState(getStoredTasks);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [subject, setSubject] = useState("");

  const save = (t) => {
    setTasks(t);
    localStorage.setItem("studysync_tasks", JSON.stringify(t));
  };

  const addTask = () => {
    if (!label.trim()) return;
    const t = [...tasks, { id: Date.now(), label, subject, done: false }];
    save(t);
    setLabel("");
    setSubject("");
    setAdding(false);
  };

  const toggle = (id) => {
    save(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const pending = tasks.filter((t) => !t.done);
  const icons = { Math: "📐", Biology: "🧬", History: "📜", CS: "💻", default: "📝" };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-lg">Upcoming Tasks</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-chocolate">{pending.length} pending</span>
          <button
            onClick={() => setAdding(!adding)}
            className="w-7 h-7 rounded-full bg-espresso text-white flex items-center justify-center text-lg leading-none hover:opacity-90"
          >
            +
          </button>
        </div>
      </div>

      {adding && (
        <div className="bg-butter border border-border rounded-2xl p-4 mb-3 space-y-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Task name"
            className="w-full bg-canvas border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (optional)"
            className="w-full bg-canvas border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50" />
          <div className="flex gap-2">
            <button onClick={addTask} className="bg-sage text-white font-semibold rounded-full px-4 py-1.5 text-sm">Add</button>
            <button onClick={() => setAdding(false)} className="text-chocolate text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="bg-butter border border-border rounded-2xl p-6 text-center">
            <p className="text-3xl">📋</p>
            <p className="text-chocolate text-sm mt-2">No tasks yet — tap + to add one.</p>
          </div>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className={`bg-butter border border-border rounded-2xl p-4 flex items-center gap-3 transition ${t.done ? "opacity-50" : ""}`}
            >
              <div className="w-10 h-10 rounded-xl bg-sage/20 flex items-center justify-center text-lg">
                {icons[t.subject] || icons.default}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${t.done ? "line-through" : ""}`}>{t.label}</p>
                {t.subject && <p className="text-xs text-chocolate">{t.subject}</p>}
              </div>
              <button
                onClick={() => toggle(t.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                  t.done ? "bg-sage border-sage text-white" : "border-border"
                }`}
              >
                {t.done && <span className="text-xs">✓</span>}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Home Page ──────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    streaksApi.me().then(setStreak).catch(() => {});
  }, []);

  const handlePomodoroComplete = useCallback(() => {
    streaksApi.log({ duration_minutes: 25 }).then(setStreak).catch(() => {});
  }, []);

  return (
    <div className="py-6 space-y-5">
      {/* Header */}
      <div>
        <p className="text-sm text-chocolate">{formatDate()}</p>
        <h1 className="font-display font-extrabold text-2xl mt-0.5">
          {getGreeting()}, {user?.username}! 🌿
        </h1>
      </div>

      <StreakCard streak={streak} />
      <WeeklyDots streak={streak} />
      <PomodoroTimer onComplete={handlePomodoroComplete} />
      <TasksList />
    </div>
  );
}

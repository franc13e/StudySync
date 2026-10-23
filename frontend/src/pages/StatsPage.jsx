import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { streaks as streaksApi, schedule as scheduleApi } from "../services/api";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const ACHIEVEMENTS = [
  { emoji: "🔥", name: "Warrior", desc: "7 day streak", threshold: 7, field: "streak" },
  { emoji: "⏱️", name: "Marathon", desc: "50 tasks done", threshold: 50, field: "total" },
  { emoji: "🌟", name: "Rising Star", desc: "3 day streak", threshold: 3, field: "streak" },
  { emoji: "📚", name: "Bookworm", desc: "10 hours studied", threshold: 10, field: "hours" },
];

export default function StatsPage() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      streaksApi.me().catch(() => null),
      scheduleApi.mine().catch(() => []),
    ]).then(([s, b]) => {
      setStreak(s);
      setBlocks(b);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-center text-chocolate text-sm py-16">Loading…</p>;

  const currentStreak = streak?.current_streak || 0;
  const totalDays = streak?.total_days || 0;
  const weekLogs = streak?.this_week || [];
  const totalMinutes = weekLogs.reduce((s, l) => s + l.duration_minutes, 0);
  const totalHours = Math.round(totalMinutes / 60);

  // Weekly bar chart data — minutes per day
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek);

  const dailyMinutes = DAY_LABELS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const log = weekLogs.find((l) => l.logged_date === dateStr);
    return log?.duration_minutes || 0;
  });
  const maxMin = Math.max(...dailyMinutes, 60);

  // Subject breakdown from schedule blocks
  const subjectMap = {};
  blocks.forEach((b) => {
    subjectMap[b.label] = (subjectMap[b.label] || 0) + b.duration;
  });
  const totalSubjectHours = Object.values(subjectMap).reduce((a, b) => a + b, 0) || 1;
  const subjects = Object.entries(subjectMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, hours]) => ({ name, pct: Math.round((hours / totalSubjectHours) * 100) }));

  const SUBJECT_COLORS = ["bg-lavender", "bg-sunset", "bg-sage", "bg-petal"];
  const SUBJECT_ICONS = { Mathematics: "📐", "Computer Science": "💻", Biology: "🧬", History: "📜" };

  return (
    <div className="py-6 space-y-5">
      <div>
        <h1 className="font-display font-extrabold text-2xl">My Progress</h1>
        <p className="text-chocolate text-sm">You're doing amazing, {user?.username} ✨</p>
      </div>

      {/* Three stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-butter border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl">🔥</p>
          <p className="font-display font-extrabold text-2xl mt-1">{currentStreak}</p>
          <p className="text-xs text-chocolate">days</p>
        </div>
        <div className="bg-butter border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl">✅</p>
          <p className="font-display font-extrabold text-2xl mt-1">{totalDays}</p>
          <p className="text-xs text-chocolate">total</p>
        </div>
        <div className="bg-butter border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl">⏱️</p>
          <p className="font-display font-extrabold text-2xl mt-1">{totalHours}</p>
          <p className="text-xs text-chocolate">hours</p>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="bg-butter border border-border rounded-3xl p-5">
        <h3 className="font-display font-bold text-lg mb-4">Study Hours This Week</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {dailyMinutes.map((mins, i) => {
            const h = maxMin > 0 ? (mins / maxMin) * 100 : 0;
            const isToday = i === dayOfWeek;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center justify-end" style={{ height: "100px" }}>
                  <div
                    className={`w-full max-w-[28px] rounded-lg transition-all ${isToday ? "bg-sunset" : "bg-lavender"}`}
                    style={{ height: `${Math.max(h, 4)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-chocolate/70">{DAY_LABELS[i]}</span>
              </div>
            );
          })}
        </div>
        <p className="text-right text-xs text-chocolate mt-2">Total: {totalHours} hrs this week</p>
      </div>

      {/* Subject breakdown */}
      {subjects.length > 0 && (
        <div className="bg-butter border border-border rounded-3xl p-5">
          <h3 className="font-display font-bold text-lg mb-3">By Subject</h3>
          <div className="space-y-3">
            {subjects.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-lg w-6 text-center">{SUBJECT_ICONS[s.name] || "📖"}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold">{s.name}</span>
                    <span className="text-sm text-chocolate">{s.pct}%</span>
                  </div>
                  <div className="h-2 bg-canvas rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]}`}
                      style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div>
        <h3 className="font-display font-bold text-lg mb-3">Achievements</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {ACHIEVEMENTS.map((a) => {
            let val = 0;
            if (a.field === "streak") val = currentStreak;
            if (a.field === "total") val = totalDays;
            if (a.field === "hours") val = totalHours;
            const unlocked = val >= a.threshold;
            return (
              <div
                key={a.name}
                className={`flex-shrink-0 w-28 bg-butter border border-border rounded-2xl p-3 text-center transition ${
                  unlocked ? "" : "opacity-40 grayscale"
                }`}
              >
                <span className="text-3xl">{a.emoji}</span>
                <p className="text-xs font-bold mt-1">{a.name}</p>
                <p className="text-[10px] text-chocolate">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

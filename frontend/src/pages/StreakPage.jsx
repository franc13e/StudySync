import { useState, useEffect } from "react";
import { Flame, Clock, Trophy } from "lucide-react";
import { streaks as streaksApi } from "../services/api";

const MILESTONES = [
  { days: 3, mascot: "🌱", label: "Sprout" },
  { days: 7, mascot: "🐸", label: "Study Frog" },
  { days: 14, mascot: "🕯️", label: "Focus Candle" },
  { days: 30, mascot: "🍄", label: "Wisdom Shroom" },
  { days: 60, mascot: "☕", label: "Latte Legend" },
];

export default function StreakPage() {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [minutes, setMinutes] = useState(30);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    streaksApi
      .me()
      .then(setStreak)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const logSession = async () => {
    setLogging(true);
    try {
      const s = await streaksApi.log({ duration_minutes: minutes });
      setStreak(s);
      setLogged(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLogging(false);
    }
  };

  const current = streak?.current_streak || 0;
  const longest = streak?.longest_streak || 0;
  const currentMascot = [...MILESTONES].reverse().find((m) => current >= m.days);
  const nextMilestone = MILESTONES.find((m) => current < m.days);

  if (loading)
    return <p className="text-center text-chocolate text-sm py-16">Loading…</p>;

  return (
    <div className="py-6 space-y-6">
      <h2 className="font-display font-bold text-xl">Study Streaks</h2>

      {/* Big streak display */}
      <div className="bg-gradient-to-br from-sunset/30 via-petal/20 to-lavender/20 rounded-squircle-lg p-8 text-center">
        <span className="text-6xl">{currentMascot?.mascot || "🌿"}</span>
        <p className="font-display font-extrabold text-5xl mt-4">{current}</p>
        <p className="text-chocolate font-medium">
          {current === 1 ? "day streak" : "day streak"}
        </p>
        {currentMascot && (
          <span className="inline-block mt-2 bg-sage/20 text-sage text-xs font-bold rounded-full px-3 py-1">
            {currentMascot.label}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-butter border border-border rounded-squircle p-4 flex items-center gap-3">
          <Trophy size={20} className="text-sunset" />
          <div>
            <p className="font-display font-bold text-lg leading-none">{longest}</p>
            <p className="text-xs text-chocolate">Longest streak</p>
          </div>
        </div>
        <div className="bg-butter border border-border rounded-squircle p-4 flex items-center gap-3">
          <Flame size={20} className="text-petal" />
          <div>
            <p className="font-display font-bold text-lg leading-none">{current}</p>
            <p className="text-xs text-chocolate">Current streak</p>
          </div>
        </div>
      </div>

      {/* Next milestone */}
      {nextMilestone && (
        <div className="bg-butter border border-border rounded-squircle p-4">
          <p className="text-sm text-chocolate">
            <span className="text-lg mr-1">{nextMilestone.mascot}</span>
            <span className="font-semibold text-espresso">{nextMilestone.label}</span>
            {" "}— {nextMilestone.days - current} more {nextMilestone.days - current === 1 ? "day" : "days"} to go!
          </p>
          <div className="mt-2 h-2 bg-canvas rounded-full overflow-hidden">
            <div
              className="h-full bg-sage rounded-full transition-all"
              style={{
                width: `${Math.min((current / nextMilestone.days) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Log session */}
      <div className="bg-butter border border-border rounded-squircle-lg p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock size={16} className="text-chocolate" /> Log a study session
        </h3>
        {logged ? (
          <div className="text-center py-4">
            <span className="text-3xl">✨</span>
            <p className="font-semibold mt-1">Session logged!</p>
            <p className="text-sm text-chocolate">Keep up the cozy grind.</p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-chocolate mb-1.5">
                Duration (minutes)
              </label>
              <input
                type="number"
                min={5}
                max={480}
                value={minutes}
                onChange={(e) => setMinutes(+e.target.value)}
                className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
              />
            </div>
            <button
              onClick={logSession}
              disabled={logging}
              className="w-full bg-espresso text-white font-semibold rounded-full py-3 text-sm hover:opacity-90 transition disabled:opacity-60"
            >
              {logging ? "Logging…" : "Log Session"}
            </button>
          </>
        )}
      </div>

      {/* Milestones gallery */}
      <div>
        <h3 className="font-semibold text-sm text-chocolate mb-3">Mascot milestones</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {MILESTONES.map((m) => {
            const unlocked = current >= m.days;
            return (
              <div
                key={m.days}
                className={`flex-shrink-0 w-20 bg-butter border border-border rounded-squircle p-3 text-center transition ${
                  unlocked ? "" : "opacity-40 grayscale"
                }`}
              >
                <span className="text-2xl">{m.mascot}</span>
                <p className="text-[10px] font-semibold mt-1">{m.label}</p>
                <p className="text-[10px] text-chocolate">{m.days}d</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

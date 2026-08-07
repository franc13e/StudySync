import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, LogIn, Flame, Copy, Check } from "lucide-react";
import { groups as groupsApi, streaks as streaksApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

function StreakBanner({ streak }) {
  if (!streak) return null;
  const mascots = ["🐸", "🕯️", "🌱", "🍄", "☕"];
  const mascot = mascots[Math.min(Math.floor(streak.current_streak / 7), mascots.length - 1)];

  return (
    <div className="bg-gradient-to-r from-sunset/40 to-petal/40 rounded-squircle-lg p-5 flex items-center gap-4 mb-6">
      <span className="text-4xl">{mascot}</span>
      <div>
        <p className="font-display font-bold text-2xl leading-none">
          {streak.current_streak} day streak
        </p>
        <p className="text-chocolate text-sm mt-0.5">
          {streak.current_streak >= 7
            ? "You're on fire! Keep it going."
            : "Build your streak by logging study sessions."}
        </p>
      </div>
      <Flame className="ml-auto text-sunset" size={28} />
    </div>
  );
}

function GroupCard({ group }) {
  const [copied, setCopied] = useState(false);

  const copyCode = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Link
      to={`/groups/${group.id}`}
      className="block bg-butter border border-border rounded-squircle-lg p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sage/30 flex items-center justify-center">
            <Users size={18} className="text-sage" />
          </div>
          <div>
            <h3 className="font-semibold">{group.name}</h3>
            {group.description && (
              <p className="text-chocolate text-sm mt-0.5 line-clamp-1">
                {group.description}
              </p>
            )}
          </div>
        </div>
        {group.invite_code && (
          <button
            onClick={copyCode}
            className="text-xs text-chocolate bg-canvas border border-border rounded-full px-2.5 py-1 flex items-center gap-1 hover:bg-inactive transition"
            title="Copy invite code"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {group.invite_code}
          </button>
        )}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [groupsList, setGroups] = useState([]);
  const [streak, setStreak] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    groupsApi.list().then(setGroups).catch(console.error);
    streaksApi.me().then(setStreak).catch(() => {});
  }, []);

  const createGroup = async () => {
    setError("");
    try {
      const g = await groupsApi.create({ name, description: desc });
      setGroups((prev) => [...prev, g]);
      setShowCreate(false);
      setName("");
      setDesc("");
    } catch (err) {
      setError(err.message);
    }
  };

  const joinGroup = async () => {
    setError("");
    try {
      const g = await groupsApi.join(code);
      setGroups((prev) => [...prev, g]);
      setShowJoin(false);
      setCode("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl">
          Hey {user?.username} 👋
        </h2>
        <p className="text-chocolate text-sm">Ready for a cozy study sesh?</p>
      </div>

      <StreakBanner streak={streak} />

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => { setShowCreate(true); setShowJoin(false); }}
          className="flex-1 bg-espresso text-white font-semibold rounded-full py-2.5 text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
        >
          <Plus size={16} /> New Group
        </button>
        <button
          onClick={() => { setShowJoin(true); setShowCreate(false); }}
          className="flex-1 bg-canvas border border-border text-espresso font-semibold rounded-full py-2.5 text-sm flex items-center justify-center gap-2 hover:bg-inactive transition"
        >
          <LogIn size={16} /> Join Group
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="bg-butter border border-border rounded-squircle-lg p-5 space-y-3">
          <h3 className="font-semibold">Create a study group</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description (optional)"
            className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
          />
          <div className="flex gap-2">
            <button onClick={createGroup} className="bg-sage text-white font-semibold rounded-full px-5 py-2 text-sm hover:opacity-90 transition">
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="text-chocolate text-sm font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Join modal */}
      {showJoin && (
        <div className="bg-butter border border-border rounded-squircle-lg p-5 space-y-3">
          <h3 className="font-semibold">Join with invite code</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste invite code"
            className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
          />
          <div className="flex gap-2">
            <button onClick={joinGroup} className="bg-sage text-white font-semibold rounded-full px-5 py-2 text-sm hover:opacity-90 transition">
              Join
            </button>
            <button onClick={() => setShowJoin(false)} className="text-chocolate text-sm font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Groups list */}
      <div>
        <h3 className="font-display font-bold text-lg mb-3">Your Groups</h3>
        {groupsList.length === 0 ? (
          <div className="bg-butter border border-border rounded-squircle-lg p-8 text-center">
            <span className="text-4xl">🌿</span>
            <p className="text-chocolate mt-2 text-sm">
              No groups yet — create one or join with an invite code.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groupsList.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

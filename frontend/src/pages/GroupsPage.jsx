import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { groups as groupsApi } from "../services/api";

const SUBJECT_ICONS = {
  Mathematics: "📐", Math: "📐", Biology: "🧬", History: "📜",
  "Computer Science": "💻", CS: "💻", Physics: "⚛️", Chemistry: "🧪",
  General: "📚", default: "📖",
};

function AvatarStack({ members, max = 5 }) {
  const shown = members.slice(0, max);
  const extra = members.length - max;
  return (
    <div className="flex -space-x-2">
      {shown.map((m) => (
        <div
          key={m.id}
          className="w-7 h-7 rounded-full border-2 border-butter flex items-center justify-center text-[10px] font-bold text-white"
          style={{ backgroundColor: m.avatar_color }}
          title={m.username}
        >
          {m.username?.[0]?.toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full border-2 border-butter bg-inactive flex items-center justify-center text-[10px] font-bold text-chocolate">
          +{extra}
        </div>
      )}
    </div>
  );
}

function GroupCard({ group }) {
  const icon = SUBJECT_ICONS[group.subject] || SUBJECT_ICONS.default;
  return (
    <div className="bg-butter border border-border rounded-3xl p-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-sage/20 flex items-center justify-center text-xl">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold">{group.name}</h3>
          <p className="text-sm text-chocolate">{group.subject} · {group.member_count} member{group.member_count !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Invite code */}
      <div className="flex items-center gap-2 mt-3 bg-canvas/60 rounded-xl px-3 py-1.5">
        <span className="text-xs text-chocolate">Code:</span>
        <span className="text-xs font-mono font-bold text-espresso tracking-wider">{group.invite_code}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(group.invite_code);
            e.target.textContent = "Copied!";
            setTimeout(() => { e.target.textContent = "Copy"; }, 1500);
          }}
          className="ml-auto text-[10px] font-semibold text-sage hover:text-espresso transition"
        >
          Copy
        </button>
      </div>

      <div className="flex items-center justify-between mt-2">
        <AvatarStack members={group.members || []} />
        <Link
          to={`/groups/${group.id}/chat`}
          className="p-2 rounded-full hover:bg-sage/20 transition"
          title="Open chat"
        >
          <MessageCircle size={18} className="text-chocolate" />
        </Link>
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("General");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    groupsApi.list().then(setMyGroups).catch(console.error).finally(() => setLoading(false));
  }, []);

  const createGroup = async () => {
    if (!name.trim()) return;
    setError("");
    try {
      const g = await groupsApi.create({ name, subject });
      setMyGroups((prev) => [...prev, g]);
      setShowCreate(false);
      setName("");
      setSubject("General");
    } catch (err) {
      setError(err.message);
    }
  };

  const joinGroup = async () => {
    if (!code.trim()) return;
    setError("");
    try {
      const g = await groupsApi.join(code);
      setMyGroups((prev) => [...prev, g]);
      setShowJoin(false);
      setCode("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl italic">Study Groups</h1>
        <p className="text-chocolate text-sm">Study together, grow together 🌿</p>
      </div>

      {/* MY GROUPS */}
      <div>
        <p className="text-xs font-bold text-chocolate/60 tracking-wider uppercase mb-3">My Groups</p>
        {loading ? (
          <p className="text-center text-chocolate text-sm py-6">Loading…</p>
        ) : myGroups.length === 0 ? (
          <div className="bg-butter border border-border rounded-3xl p-8 text-center">
            <p className="text-3xl">🌿</p>
            <p className="text-chocolate text-sm mt-2">No groups yet — create or join one below.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myGroups.map((g) => (
              <GroupCard key={g.id} group={g} />
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
          className="bg-espresso text-white font-semibold rounded-full py-2.5 text-sm hover:opacity-90 transition"
        >
          + Create Group
        </button>
        <button
          onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
          className="bg-canvas border border-border text-espresso font-semibold rounded-full py-2.5 text-sm hover:bg-inactive transition"
        >
          Join Group
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-butter border border-border rounded-3xl p-5 space-y-3">
          <h3 className="font-semibold">Create a study group</h3>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name"
            className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50" />
          <select value={subject} onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-canvas border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50">
            {["General", "Mathematics", "Computer Science", "Biology", "History", "Physics", "Chemistry"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={createGroup} className="bg-sage text-white font-semibold rounded-full px-5 py-2 text-sm">Create</button>
            <button onClick={() => setShowCreate(false)} className="text-chocolate text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* Join form */}
      {showJoin && (
        <div className="bg-butter border border-border rounded-3xl p-5 space-y-3">
          <h3 className="font-semibold">Join with invite code</h3>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste invite code"
            className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50" />
          <div className="flex gap-2">
            <button onClick={joinGroup} className="bg-espresso text-white font-semibold rounded-full px-5 py-2 text-sm">Join</button>
            <button onClick={() => setShowJoin(false)} className="text-chocolate text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

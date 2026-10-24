import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Users, CalendarDays, MessageCircle } from "lucide-react";
import { groups as groupsApi, schedule as scheduleApi } from "../services/api";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "timetable", label: "Timetable", icon: CalendarDays },
  { id: "members", label: "Members", icon: Users },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

function ChatTab({ groupId }) {
  const { messages, loading, sendMessage } = useChat(groupId);
  const { user } = useAuth();
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {loading && (
          <p className="text-center text-chocolate text-sm py-8">Loading messages…</p>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center py-12">
            <span className="text-3xl">💬</span>
            <p className="text-chocolate text-sm mt-2">No messages yet — say hi!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.user_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-squircle px-4 py-2.5 text-sm ${
                  isMe ? "bg-espresso text-white" : "bg-canvas border border-border"
                }`}
              >
                {!isMe && (
                  <p className="text-xs font-semibold mb-0.5" style={{ color: msg.avatar_color }}>
                    {msg.username}
                  </p>
                )}
                <p className="break-words">{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-border flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          maxLength={2000}
          placeholder="Type a message…"
          className="flex-1 bg-canvas border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
        />
        <button
          onClick={handleSend}
          aria-label="Send message"
          className="w-10 h-10 rounded-full bg-espresso text-white flex items-center justify-center hover:opacity-90 transition"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function TimetableTab({ groupId }) {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scheduleApi
      .group(groupId)
      .then(setBlocks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <p className="text-center text-chocolate text-sm py-8">Loading…</p>;

  return (
    <div className="overflow-x-auto p-2">
      <div className="min-w-[600px] grid grid-cols-8 text-xs">
        <div className="p-2" />
        {DAYS.map((d) => (
          <div key={d} className="p-2 font-semibold text-center text-chocolate">{d}</div>
        ))}

        {HOURS.map((hour) => (
          <div key={hour} className="contents">
            <div className="p-2 text-right text-chocolate/60 font-medium">{hour}:00</div>
            {DAYS.map((d, dayIndex) => {
              const cell = blocks.filter(
                (b) => b.day_of_week === dayIndex && b.start_hour <= hour && b.start_hour + b.duration > hour
              );
              return (
                <div key={d} className="border border-border/40 min-h-[32px] p-0.5 space-y-0.5">
                  {cell.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-lg px-1.5 py-0.5 text-[10px] font-medium truncate text-espresso"
                      style={{ backgroundColor: `${b.color}55` }}
                      title={`${b.label} — ${b.username}`}
                    >
                      {b.label}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {blocks.length === 0 && (
        <p className="text-center text-chocolate text-sm py-6">
          No classes yet. Members can add theirs on the Schedule page.
        </p>
      )}
    </div>
  );
}

function MembersTab({ groupId }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    groupsApi.members(groupId).then(setMembers).catch(console.error);
  }, [groupId]);

  return (
    <div className="space-y-2 p-3">
      {members.map((m) => (
        <div key={m.id} className="flex items-center gap-3 bg-canvas border border-border rounded-squircle p-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: m.avatar_color }}
          >
            {m.username?.[0]?.toUpperCase()}
          </div>
          <p className="font-semibold text-sm">{m.username}</p>
        </div>
      ))}
      {members.length === 0 && (
        <p className="text-center text-chocolate text-sm py-6">No members found.</p>
      )}
    </div>
  );
}

export default function GroupChatPage() {
  const { groupId } = useParams();
  const [tab, setTab] = useState("chat");
  const [group, setGroup] = useState(null);

  useEffect(() => {
    groupsApi
      .list()
      .then((all) => setGroup(all.find((g) => String(g.id) === groupId) ?? null))
      .catch(console.error);
  }, [groupId]);

  return (
    <div className="py-4 space-y-4">
      <Link
        to="/groups"
        className="inline-flex items-center gap-1.5 text-chocolate text-sm font-medium hover:text-espresso transition"
      >
        <ArrowLeft size={16} /> Groups
      </Link>

      {group && (
        <div>
          <h1 className="font-display text-2xl font-bold">{group.name}</h1>
          <p className="text-chocolate text-sm">{group.subject} · {group.member_count} members</p>
        </div>
      )}

      <div className="flex gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${
              tab === id ? "bg-espresso text-white" : "bg-inactive text-chocolate hover:bg-border"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-butter border border-border rounded-squircle-lg overflow-hidden">
        {tab === "chat" && <ChatTab groupId={groupId} />}
        {tab === "timetable" && <TimetableTab groupId={groupId} />}
        {tab === "members" && <MembersTab groupId={groupId} />}
      </div>
    </div>
  );
}

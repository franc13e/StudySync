import { useState, useEffect } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { schedule as scheduleApi, groups as groupsApi } from "../services/api";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Theme colours a class can be tagged with (stored as hex on the block).
const COLORS = [
  { name: "Sunset", hex: "#FFC285" },
  { name: "Sage", hex: "#A2C997" },
  { name: "Petal", hex: "#FFD2D7" },
  { name: "Lavender", hex: "#C2C9EC" },
  { name: "Cocoa", hex: "#C9B3A6" },
];

export default function SchedulePage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState((new Date().getDay() + 6) % 7);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label: "", day_of_week: 0, start_hour: 9, duration: 1, color: COLORS[0].hex });
  const [myGroups, setMyGroups] = useState([]);
  const [viewGroup, setViewGroup] = useState(null); // null = my schedule

  useEffect(() => {
    scheduleApi.mine().then(setBlocks).catch(console.error).finally(() => setLoading(false));
    groupsApi.list().then(setMyGroups).catch(console.error);
  }, []);

  const switchView = async (groupId) => {
    setLoading(true);
    setViewGroup(groupId);
    try {
      if (groupId) {
        const gb = await scheduleApi.group(groupId);
        setBlocks(gb);
      } else {
        const mb = await scheduleApi.mine();
        setBlocks(mb);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const todayBlocks = blocks
    .filter((b) => b.day_of_week === activeDay)
    .sort((a, b) => a.start_hour - b.start_hour);

  const addBlock = async () => {
    if (!form.label.trim()) return;
    try {
      const b = await scheduleApi.add({ ...form, day_of_week: activeDay });
      setBlocks((prev) => [...prev, b]);
      setShowAdd(false);
      setForm({ label: "", day_of_week: 0, start_hour: 9, duration: 1, color: COLORS[0].hex });
    } catch (err) {
      console.error(err);
    }
  };

  const removeBlock = async (id) => {
    try {
      await scheduleApi.remove(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl">My Schedule</h1>
          <p className="text-chocolate text-sm">Autumn Semester</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="w-9 h-9 rounded-full bg-espresso text-white flex items-center justify-center hover:opacity-90 transition">
          <Plus size={18} />
        </button>
      </div>

      {/* View toggle: My Schedule vs Group */}
      {myGroups.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => switchView(null)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
              !viewGroup ? "bg-espresso text-white" : "bg-inactive text-chocolate"
            }`}>
            Mine
          </button>
          {myGroups.map((g) => (
            <button key={g.id} onClick={() => switchView(g.id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                viewGroup === g.id ? "bg-espresso text-white" : "bg-inactive text-chocolate"
              }`}>
              <Users size={12} /> {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Day tabs */}
      <div className="flex gap-2">
        {DAYS.map((d, i) => (
          <button
            key={d}
            onClick={() => setActiveDay(i)}
            className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
              activeDay === i
                ? "bg-espresso text-white"
                : "bg-inactive text-chocolate hover:bg-border"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-butter border border-border rounded-3xl p-5 space-y-3">
          <h3 className="font-semibold text-sm">Add a class</h3>
          <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} maxLength={100}
            placeholder="Subject name" className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.start_hour} onChange={(e) => { const start = +e.target.value; setForm({ ...form, start_hour: start, duration: Math.min(form.duration, 24 - start) }); }}
              className="bg-canvas border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50">
              {Array.from({ length: 15 }, (_, i) => i + 7).map((h) => (
                <option key={h} value={h}>{h}:00</option>
              ))}
            </select>
            <select value={form.duration} onChange={(e) => setForm({ ...form, duration: +e.target.value })}
              className="bg-canvas border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50">
              {[1, 2, 3, 4].filter((d) => form.start_hour + d <= 24).map((d) => (
                <option key={d} value={d}>{d} hr{d > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.name}
                aria-label={`${c.name} colour`}
                aria-pressed={form.color === c.hex}
                onClick={() => setForm({ ...form, color: c.hex })}
                className={`w-7 h-7 rounded-full border-2 transition ${
                  form.color === c.hex ? "border-espresso scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={addBlock} className="bg-sage text-white font-semibold rounded-full px-5 py-2 text-sm">Add</button>
            <button onClick={() => setShowAdd(false)} className="text-chocolate text-sm font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* Class cards */}
      {loading ? (
        <p className="text-center text-chocolate text-sm py-8">Loading…</p>
      ) : todayBlocks.length === 0 ? (
        <div className="bg-butter border border-border rounded-3xl p-10 text-center">
          <p className="text-3xl">📚</p>
          <p className="text-chocolate text-sm mt-2">No classes on {DAYS[activeDay]}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayBlocks.map((block) => {
            return (
              <div
                key={block.id}
                className="bg-butter border border-border border-l-4 rounded-2xl p-4 flex items-center justify-between"
                style={{ borderLeftColor: block.color }}
              >
                <div>
                  <h4 className="font-bold">{block.label}</h4>
                  <p className="text-sm text-chocolate">
                    {block.duration} hr{block.duration > 1 ? "s" : ""}
                    {viewGroup && block.username && <span className="ml-1">· {block.username}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-bold px-3 py-1 rounded-xl text-espresso"
                    style={{ backgroundColor: `${block.color}66` }}
                  >
                    {block.start_hour}:00
                  </span>
                  {!viewGroup && (
                    <button onClick={() => removeBlock(block.id)} aria-label={`Delete ${block.label}`}
                      className="p-1.5 rounded-full hover:bg-petal/30 transition">
                      <Trash2 size={14} className="text-chocolate" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

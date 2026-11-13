import { useState, useEffect } from "react";
import { Plus, Trash2, Users, BookOpen, Pencil } from "lucide-react";
import { schedule as scheduleApi, groups as groupsApi } from "../services/api";
import Glyph from "../components/Glyph";
import ColorPicker from "../components/ColorPicker";
import { PRESET_COLORS } from "../lib/colors";
import {
  QUICK_LENGTHS, checkTimes, endOf, formatClock, formatLength, fromTimeValue, lengthOf, startOf, toPayload, toTimeValue,
} from "../lib/classTime";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const blankForm = (day) => ({ label: "", day_of_week: day, start: "09:00", end: "10:00", color: PRESET_COLORS[0].hex });

const fieldClass = "w-full bg-canvas border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50";

export default function SchedulePage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState((new Date().getDay() + 6) % 7);
  // The add/edit form: null when closed; `id` is set when editing an existing class.
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [myGroups, setMyGroups] = useState([]);
  const [viewGroup, setViewGroup] = useState(null); // null = my schedule

  useEffect(() => {
    scheduleApi.mine().then(setBlocks).catch(console.error).finally(() => setLoading(false));
    groupsApi.list().then(setMyGroups).catch(console.error);
  }, []);

  const switchView = async (groupId) => {
    setLoading(true);
    setViewGroup(groupId);
    setForm(null);
    try {
      setBlocks(groupId ? await scheduleApi.group(groupId) : await scheduleApi.mine());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const todayBlocks = blocks
    .filter((b) => b.day_of_week === activeDay)
    .sort((a, b) => startOf(a) - startOf(b));

  const openAdd = () => { setError(""); setForm(form && !form.id ? null : blankForm(activeDay)); };
  const openEdit = (b) => {
    setError("");
    setForm({ id: b.id, label: b.label, day_of_week: b.day_of_week, start: toTimeValue(startOf(b)), end: toTimeValue(Math.min(endOf(b), 24 * 60 - 1)), color: b.color });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const start = form ? fromTimeValue(form.start) : null;
  const end = form ? fromTimeValue(form.end) : null;
  const timeError = form ? checkTimes(start, end) : null;
  const canSave = form && form.label.trim() && !timeError && !saving;

  // Changing the start keeps the class the same length.
  const setStart = (value) => {
    const s = fromTimeValue(value);
    const len = start != null && end != null && end > start ? end - start : 60;
    setForm({ ...form, start: value, end: s != null ? toTimeValue(Math.min(s + len, 24 * 60 - 1)) : form.end });
  };
  const setLength = (minutes) => {
    if (start == null) return;
    setForm({ ...form, end: toTimeValue(Math.min(start + minutes, 24 * 60 - 1)) });
  };

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const body = toPayload({ ...form, start, end });
      if (form.id) {
        const updated = await scheduleApi.update(form.id, body);
        setBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      } else {
        const created = await scheduleApi.add(body);
        setBlocks((prev) => [...prev, created]);
      }
      setActiveDay(form.day_of_week);
      setForm(null);
    } catch (err) {
      setError(err.message || "Couldn't save the class");
    } finally {
      setSaving(false);
    }
  };

  const removeBlock = async (id) => {
    try {
      await scheduleApi.remove(id);
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      if (form?.id === id) setForm(null);
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
        {!viewGroup && (
          <button onClick={openAdd} aria-label="Add a class" aria-expanded={!!form && !form.id}
            className="w-9 h-9 rounded-full bg-espresso text-white flex items-center justify-center hover:opacity-90 transition">
            <Plus size={18} />
          </button>
        )}
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

      {/* Add / edit form */}
      {form && (
        <div className="bg-butter border border-border rounded-3xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">{form.id ? "Edit class" : "Add a class"}</h3>

          <div>
            <label className="block text-xs font-semibold text-chocolate mb-1" htmlFor="class-name">Subject</label>
            <input id="class-name" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} maxLength={100}
              placeholder="Subject name" className={fieldClass} />
          </div>

          <div>
            <div className="block text-xs font-semibold text-chocolate mb-1" id="class-day">Day</div>
            <div className="flex gap-1.5" role="radiogroup" aria-labelledby="class-day">
              {DAYS.map((d, i) => (
                <button key={d} type="button" role="radio" aria-checked={form.day_of_week === i}
                  onClick={() => setForm({ ...form, day_of_week: i })}
                  className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition ${form.day_of_week === i ? "bg-espresso text-white" : "bg-canvas border border-border text-chocolate"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-chocolate mb-1" htmlFor="class-start">Starts</label>
                <input id="class-start" type="time" step={300} value={form.start} onChange={(e) => setStart(e.target.value)} className={`${fieldClass} time-field`} />
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-chocolate mb-1" htmlFor="class-end">Ends</label>
                <input id="class-end" type="time" step={300} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className={`${fieldClass} time-field`} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2" role="group" aria-label="Quick length">
              {QUICK_LENGTHS.map((m) => {
                const on = start != null && end != null && end - start === m;
                return (
                  <button key={m} type="button" aria-pressed={on} onClick={() => setLength(m)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${on ? "bg-sage text-white" : "bg-canvas border border-border text-chocolate"}`}>
                    {formatLength(m)}
                  </button>
                );
              })}
            </div>
            <p className={`text-xs mt-2 font-medium ${timeError ? "text-red-500" : "text-chocolate"}`}>
              {timeError || `${formatClock(start)} – ${formatClock(end)} · ${formatLength(end - start)}`}
            </p>
          </div>

          <div>
            <div className="block text-xs font-semibold text-chocolate mb-2">Colour</div>
            <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
          </div>

          {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={!canSave}
              className="bg-sage text-white font-semibold rounded-full px-5 py-2 text-sm disabled:opacity-50">
              {saving ? "Saving…" : form.id ? "Save changes" : "Add"}
            </button>
            <button onClick={() => setForm(null)} className="text-chocolate text-sm font-medium">Cancel</button>
            {form.id && (
              <button onClick={() => removeBlock(form.id)} className="ml-auto text-sm font-medium text-red-500 flex items-center gap-1">
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Class cards */}
      {loading ? (
        <p className="text-center text-chocolate text-sm py-8">Loading…</p>
      ) : todayBlocks.length === 0 ? (
        <div className="bg-butter border border-border rounded-3xl p-10 text-center">
          <Glyph icon={BookOpen} tone="lavender" size="lg" />
          <p className="text-chocolate text-sm mt-2">No classes on {DAYS[activeDay]}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayBlocks.map((block) => (
            <div
              key={block.id}
              className={`bg-butter border border-border border-l-4 rounded-2xl p-4 flex items-center justify-between gap-3 ${form?.id === block.id ? "ring-2 ring-sage/60" : ""}`}
              style={{ borderLeftColor: block.color }}
            >
              <div className="min-w-0">
                <h4 className="font-bold truncate">{block.label}</h4>
                <p className="text-sm text-chocolate">
                  <span className="whitespace-nowrap">{formatClock(startOf(block))} – {formatClock(endOf(block))}</span>{" "}
                  <span className="whitespace-nowrap">· {formatLength(lengthOf(block))}</span>
                  {viewGroup && block.username && <span className="ml-1 whitespace-nowrap">· {block.username}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span
                  className="text-sm font-bold px-3 py-1 rounded-xl text-espresso"
                  style={{ backgroundColor: `${block.color}66` }}
                >
                  {formatClock(startOf(block)).replace(" ", " ")}
                </span>
                {!viewGroup && (
                  <>
                    <button onClick={() => openEdit(block)} aria-label={`Edit ${block.label}`}
                      className="p-1.5 rounded-full hover:bg-sage/20 transition">
                      <Pencil size={14} className="text-chocolate" />
                    </button>
                    <button onClick={() => removeBlock(block.id)} aria-label={`Delete ${block.label}`}
                      className="p-1.5 rounded-full hover:bg-petal/30 transition">
                      <Trash2 size={14} className="text-chocolate" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { schedule as scheduleApi } from "../services/api";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SchedulePage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    day_of_week: "Monday",
    start_hour: 9,
    end_hour: 10,
  });

  useEffect(() => {
    scheduleApi
      .mine()
      .then(setBlocks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const addBlock = async () => {
    try {
      const b = await scheduleApi.add(form);
      setBlocks((prev) => [...prev, b]);
      setShowAdd(false);
      setForm({ subject: "", day_of_week: "Monday", start_hour: 9, end_hour: 10 });
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

  const grouped = DAYS.reduce((acc, day) => {
    acc[day] = blocks.filter((b) => b.day_of_week === day);
    return acc;
  }, {});

  return (
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl">My Schedule</h2>
          <p className="text-chocolate text-sm">Plan your study blocks for the week</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-espresso text-white rounded-full p-2.5 hover:opacity-90 transition"
        >
          <Plus size={18} />
        </button>
      </div>

      {showAdd && (
        <div className="bg-butter border border-border rounded-squircle-lg p-5 space-y-3">
          <h3 className="font-semibold text-sm">Add a block</h3>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Subject (e.g. Data Structures)"
            className="w-full bg-canvas border border-border rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={form.day_of_week}
              onChange={(e) => setForm({ ...form, day_of_week: e.target.value })}
              className="bg-canvas border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
            >
              {DAYS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <select
              value={form.start_hour}
              onChange={(e) => setForm({ ...form, start_hour: +e.target.value })}
              className="bg-canvas border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
            >
              {Array.from({ length: 16 }, (_, i) => i + 6).map((h) => (
                <option key={h} value={h}>{h}:00</option>
              ))}
            </select>
            <select
              value={form.end_hour}
              onChange={(e) => setForm({ ...form, end_hour: +e.target.value })}
              className="bg-canvas border border-border rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage/50"
            >
              {Array.from({ length: 16 }, (_, i) => i + 7).map((h) => (
                <option key={h} value={h}>{h}:00</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addBlock} className="bg-sage text-white font-semibold rounded-full px-5 py-2 text-sm hover:opacity-90 transition">
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="text-chocolate text-sm font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-chocolate text-sm py-8">Loading…</p>
      ) : blocks.length === 0 ? (
        <div className="bg-butter border border-border rounded-squircle-lg p-8 text-center">
          <span className="text-4xl">📚</span>
          <p className="text-chocolate mt-2 text-sm">
            No blocks yet — tap + to add your first study session.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.filter((d) => grouped[d].length > 0).map((day) => (
            <div key={day}>
              <h4 className="font-semibold text-sm text-chocolate mb-2">{day}</h4>
              <div className="space-y-2">
                {grouped[day]
                  .sort((a, b) => a.start_hour - b.start_hour)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="bg-butter border border-border rounded-squircle p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-sm">{b.subject}</p>
                        <p className="text-xs text-chocolate">
                          {b.start_hour}:00 – {b.end_hour}:00
                        </p>
                      </div>
                      <button
                        onClick={() => removeBlock(b.id)}
                        className="p-2 rounded-full hover:bg-petal/40 transition"
                      >
                        <Trash2 size={15} className="text-chocolate" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

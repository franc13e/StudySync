const API_URL = import.meta.env.VITE_API_URL || "";

function getToken() {
  return localStorage.getItem("studysync_token");
}

// FastAPI returns validation errors as a list of {loc, msg}; turn them into one readable line.
function formatError(detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail
      .map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : "";
        const msg = String(d.msg || "is invalid").replace(/^Value error, /, "");
        return field && field !== "body" ? `${String(field).replace(/_/g, " ")}: ${msg}` : msg;
      })
      .join(" · ");
  }
  return "Request failed";
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("studysync_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatError(err.detail));
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────
export const auth = {
  register: (data) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request("/api/auth/me"),
};

// ── Groups ────────────────────────────────────────────────────
export const groups = {
  list: () => request("/api/groups"),
  create: (data) =>
    request("/api/groups", { method: "POST", body: JSON.stringify(data) }),
  join: (invite_code) =>
    request("/api/groups/join", { method: "POST", body: JSON.stringify({ invite_code }) }),
  members: (groupId) => request(`/api/groups/${groupId}/members`),
};

// ── Schedule ──────────────────────────────────────────────────
export const schedule = {
  mine: () => request("/api/schedule"),
  add: (data) =>
    request("/api/schedule", { method: "POST", body: JSON.stringify(data) }),
  remove: (id) => request(`/api/schedule/${id}`, { method: "DELETE" }),
  group: (groupId) => request(`/api/schedule/group/${groupId}`),
};

// ── Streaks ───────────────────────────────────────────────────
export const streaks = {
  me: () => request("/api/streaks/me"),
  log: (data) =>
    request("/api/streaks/log", { method: "POST", body: JSON.stringify(data) }),
};

// ── Messages ──────────────────────────────────────────────────
export const messages = {
  history: (groupId, limit = 50) => request(`/api/messages/${groupId}?limit=${limit}`),
};

// ── WebSocket ─────────────────────────────────────────────────
export function connectChat(groupId, onMessage) {
  const token = getToken();
  const wsBase = API_URL
    ? API_URL.replace(/^http/, "ws")
    : `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;
  const ws = new WebSocket(`${wsBase}/ws/chat/${groupId}?token=${token}`);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (err) => console.error("WebSocket error:", err);

  return {
    send: (content) => ws.send(JSON.stringify({ content })),
    close: () => ws.close(),
  };
}

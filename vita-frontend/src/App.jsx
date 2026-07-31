import { useState, useEffect, useCallback } from "react";

// ── VITA brand tokens ─────────────────────────────
const colors = {
  cream: "#F2E9E4",
  indigo: "#0F0080",
  indigoDeep: "#26215C",
  lavender: "#B5B4D9",
  lavenderBg: "#DEDDF0",
  terracotta: "#E8845C",
  terracottaBg: "#F5DDD1",
  terracottaText: "#993C1D",
  ink: "#2C2C2A",
  muted: "#5F5E5A",
  faint: "#888780",
  border: "#E4DCD5",
};

const statusStyles = {
  saved: { bg: "#EEEDE5", text: colors.muted, label: "Saved" },
  applied: { bg: colors.lavenderBg, text: colors.indigoDeep, label: "Applied" },
  interviewing: { bg: colors.terracottaBg, text: colors.terracottaText, label: "Interviewing" },
  closed: { bg: "#F1EFE8", text: colors.faint, label: "Not this time" },
};

const API_BASE = "http://localhost:4000";

// ── Small building blocks ─────────────────────────
function Pill({ bg, color, children }) {
  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: 11,
        padding: "4px 10px",
        borderRadius: 20,
        fontFamily: "Inter, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "32px 20px",
        textAlign: "center",
      }}
    >
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: colors.indigo, margin: "0 0 4px" }}>
        {title}
      </p>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: colors.faint, margin: 0 }}>
        {subtitle}
      </p>
    </div>
  );
}

// ── Tracker view ──────────────────────────────────
function Tracker({ userId }) {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error | ready
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/applications?user_id=${userId}`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setApplications(data);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!userId) {
    return <EmptyState title="Paste a user ID above" subtitle="We need to know whose applications to load." />;
  }

  if (status === "loading" || status === "idle") {
    return <EmptyState title="Loading your applications…" subtitle="Just a moment." />;
  }

  if (status === "error") {
    return (
      <EmptyState
        title="Couldn't reach the server"
        subtitle={`Make sure your backend is running on localhost:4000. (${errorMsg})`}
      />
    );
  }

  if (applications.length === 0) {
    return <EmptyState title="Nothing tracked yet" subtitle="Applications you save will show up here." />;
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}>
      {applications.map((app, i) => {
        const s = statusStyles[app.status] || statusStyles.saved;
        const dimmed = app.status === "closed";
        return (
          <div
            key={app.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: i < applications.length - 1 ? `0.5px solid ${colors.border}` : "none",
              opacity: dimmed ? 0.5 : 1,
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 2, minWidth: 140 }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: colors.ink, margin: 0 }}>
                {app.company}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, margin: 0 }}>
                {app.role_title}
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 90 }}>
              <Pill bg={s.bg} color={s.text}>{s.label}</Pill>
            </div>
            <div style={{ flex: 1, minWidth: 80 }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.muted, margin: 0 }}>
                {app.match_score != null ? `${app.match_score}% match` : "Not scanned"}
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 100, textAlign: "right" }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, margin: 0 }}>
                {new Date(app.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Portfolio view ────────────────────────────────
function Portfolio({ userId }) {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/projects?user_id=${userId}`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setProjects(data);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!userId) {
    return <EmptyState title="Paste a user ID above" subtitle="We need to know whose portfolio to load." />;
  }
  if (status === "loading" || status === "idle") {
    return <EmptyState title="Loading your projects…" subtitle="Just a moment." />;
  }
  if (status === "error") {
    return (
      <EmptyState
        title="Couldn't reach the server"
        subtitle={`Make sure your backend is running on localhost:4000. (${errorMsg})`}
      />
    );
  }
  if (projects.length === 0) {
    return <EmptyState title="No projects yet" subtitle="Add a project to start building your portfolio." />;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {projects.map((p) => (
        <div key={p.id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ height: 90, background: p.thumbnail_url ? undefined : colors.lavender }} />
          <div style={{ padding: "12px 14px" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: colors.ink, margin: "0 0 4px" }}>
              {p.title}
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, margin: "0 0 8px" }}>
              {p.description}
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(p.tags || []).map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: "#EEEDE5",
                    color: colors.muted,
                    fontSize: 10,
                    padding: "3px 8px",
                    borderRadius: 20,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── App shell ──────────────────────────────────────
export default function VitaApp() {
  const [userId, setUserId] = useState("");
  const [tab, setTab] = useState("tracker");

  return (
    <div style={{ background: colors.cream, minHeight: 500, padding: 24, borderRadius: 16 }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Fraunces:wght@500&display=swap" rel="stylesheet" />

      <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, color: colors.indigo, margin: "0 0 16px" }}>
        Vita
      </p>

      <input
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        placeholder="Paste your user ID"
        style={{
          width: "100%",
          border: `0.5px solid ${colors.border}`,
          borderRadius: 10,
          padding: "10px 14px",
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          marginBottom: 16,
          outline: "none",
          boxSizing: "border-box",
          background: "#fff",
          color: colors.ink,
        }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { key: "tracker", label: "Tracker" },
          { key: "portfolio", label: "Portfolio" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? colors.indigo : "#fff",
              color: tab === t.key ? colors.cream : colors.muted,
              border: tab === t.key ? "none" : `0.5px solid ${colors.border}`,
              borderRadius: 20,
              padding: "6px 16px",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tracker" ? <Tracker userId={userId} /> : <Portfolio userId={userId} />}
    </div>
  );
}

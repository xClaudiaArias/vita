import { useState, useEffect, useCallback } from "react";

// VITA brand tokens
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

// Small building blocks 
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

// Tracker view ─────────
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

// Portfolio view 
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

// Resume Scanner view
function Scanner({ userId }) {
  const [step, setStep] = useState("input"); // input | scanning | results | error
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scan, setScan] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/resumes?user_id=${userId}`)
      .then((r) => r.json())
      .then(setResumes)
      .catch(() => {});
  }, [userId]);

  const runScan = async () => {
    setStep("scanning");
    setErrorMsg("");
    try {
      // First store the job posting
      const jobRes = await fetch(`${API_BASE}/job-postings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role_title: roleTitle, raw_description: description }),
      });
      const job = await jobRes.json();
      if (!jobRes.ok) throw new Error(job.error || "Couldn't save job posting");

      // Then run the scan against the selected resume
      const scanRes = await fetch(`${API_BASE}/scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_id: selectedResumeId, job_posting_id: job.id }),
      });
      const scanData = await scanRes.json();
      if (!scanRes.ok) throw new Error(scanData.error || "Scan failed");

      setScan(scanData);
      setStep("results");
    } catch (err) {
      setErrorMsg(err.message);
      setStep("error");
    }
  };

  const handleSuggestion = async (suggestionId, action) => {
    await fetch(`${API_BASE}/scans/suggestions/${suggestionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setScan((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map((s) =>
        s.id === suggestionId ? { ...s, status: action === "accept" ? "accepted" : "skipped" } : s
      ),
    }));
  };

  if (!userId) {
    return <EmptyState title="Paste a user ID above" subtitle="We need to know whose resume to scan." />;
  }

  // Job input step ──
  if (step === "input" || step === "scanning") {
    return (
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px" }}>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: "0 0 4px" }}>
          What are we applying to?
        </p>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: "0 0 16px" }}>
          Paste the job details below.
        </p>

        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company"
          style={inputStyle}
        />
        <input
          value={roleTitle}
          onChange={(e) => setRoleTitle(e.target.value)}
          placeholder="Role title"
          style={inputStyle}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Paste the full job description..."
          rows={5}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, color: colors.indigo, margin: "12px 0 8px" }}>
          Which resume?
        </p>
        <select
          value={selectedResumeId}
          onChange={(e) => setSelectedResumeId(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select a resume…</option>
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>

        <button
          onClick={runScan}
          disabled={!company || !roleTitle || !description || !selectedResumeId || step === "scanning"}
          style={{
            marginTop: 14,
            background: colors.indigo,
            color: colors.cream,
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            opacity: (!company || !roleTitle || !description || !selectedResumeId) ? 0.5 : 1,
          }}
        >
          {step === "scanning" ? "Scanning…" : "Scan match"}
        </button>
      </div>
    );
  }

  // Error step (e.g. AI credits not available yet) ──
  if (step === "error") {
    return (
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px" }}>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 16, color: colors.terracottaText, margin: "0 0 6px" }}>
          Couldn't complete the scan
        </p>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: "0 0 16px" }}>
          {errorMsg}
        </p>
        <button
          onClick={() => setStep("input")}
          style={{ background: "transparent", border: `0.5px solid ${colors.border}`, borderRadius: 10, padding: "8px 16px", fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.muted, cursor: "pointer" }}
        >
          Try again
        </button>
      </div>
    );
  }

  // Results step ──
  return (
    <div style={{ background: colors.cream, borderRadius: 12, padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: "0 0 2px" }}>
            Nice fit, with room to shine
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: 0 }}>
            {company} · {roleTitle}
          </p>
        </div>
        <div style={{ textAlign: "center", background: colors.lavender, borderRadius: 12, padding: "8px 14px" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 500, color: colors.indigoDeep, margin: 0 }}>
            {scan.match_score}%
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: colors.indigoDeep, margin: 0 }}>match</p>
        </div>
      </div>

      {scan.strengths && scan.strengths.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 12, padding: "12px 14px", marginBottom: 10, borderLeft: `3px solid ${colors.indigo}` }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, color: colors.indigo, margin: "0 0 4px" }}>
            Already strong
          </p>
          {scan.strengths.map((s, i) => (
            <p key={i} style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.muted, margin: 0 }}>{s}</p>
          ))}
        </div>
      )}

      {scan.suggestions.map((s) => (
        <div
          key={s.id}
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 10,
            borderLeft: `3px solid ${colors.terracotta}`,
            opacity: s.status === "skipped" ? 0.5 : 1,
          }}
        >
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.terracottaText, margin: "0 0 8px" }}>
            {s.reason}
          </p>
          <div style={{ background: colors.terracottaBg, borderRadius: 8, padding: "8px 10px" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#4A1B0C", margin: 0 }}>
              {s.suggested_text}
            </p>
          </div>
          {s.status === "pending" && (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                onClick={() => handleSuggestion(s.id, "accept")}
                style={{ background: colors.indigo, color: colors.cream, border: "none", borderRadius: 8, padding: "6px 14px", fontFamily: "Inter, sans-serif", fontSize: 12, cursor: "pointer" }}
              >
                Accept
              </button>
              <button
                onClick={() => handleSuggestion(s.id, "skip")}
                style={{ background: "transparent", border: "none", padding: "6px 14px", fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, cursor: "pointer" }}
              >
                Skip
              </button>
            </div>
          )}
          {s.status !== "pending" && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, margin: "8px 0 0" }}>
              {s.status === "accepted" ? "Accepted" : "Skipped"}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  border: `0.5px solid ${colors.border}`,
  borderRadius: 10,
  padding: "10px 14px",
  fontFamily: "Inter, sans-serif",
  fontSize: 13,
  marginBottom: 10,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
  color: colors.ink,
  display: "block",
};

// App shell
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
          { key: "scanner", label: "Scanner" },
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

      {tab === "scanner" && <Scanner userId={userId} />}
      {tab === "tracker" && <Tracker userId={userId} />}
      {tab === "portfolio" && <Portfolio userId={userId} />}
    </div>
  );
}

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

// Small building block
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

// Tracker view──
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

// Resume Scanner view─────────────────────────
function Scanner({ userId }) {
  const [step, setStep] = useState("input"); // input | scanning | results | confirmation | editor | error
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scan, setScan] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [resumeDetail, setResumeDetail] = useState(null);
  const [resumeStatus, setResumeStatus] = useState("idle");
  const [editingBulletId, setEditingBulletId] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [openReasonId, setOpenReasonId] = useState(null);

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

  const loadResume = async (resumeId) => {
    setResumeStatus("loading");
    try {
      const res = await fetch(`${API_BASE}/resumes/${resumeId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load resume");
      setResumeDetail(data);
      setResumeStatus("ready");
    } catch (err) {
      setResumeStatus("error");
    }
  };

  const saveBulletEdit = async (bulletId) => {
    await fetch(`${API_BASE}/resumes/bullets/${bulletId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draftText }),
    });
    setEditingBulletId(null);
    loadResume(selectedResumeId);
  };

  if (!userId) {
    return <EmptyState title="Paste a user ID above" subtitle="We need to know whose resume to scan." />;
  }

  // Job input step
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

  // Error step (e.g. AI credits not available yet)
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

  // Confirmation step
  if (step === "confirmation") {
    return (
      <ScannerConfirmation
        scan={scan}
        company={company}
        roleTitle={roleTitle}
        onViewResume={() => {
          setStep("editor");
          loadResume(selectedResumeId);
        }}
      />
    );
  }

  // Editor step
  if (step === "editor") {
    return (
      <ResumeEditor
        resumeDetail={resumeDetail}
        status={resumeStatus}
        editingBulletId={editingBulletId}
        draftText={draftText}
        openReasonId={openReasonId}
        onStartEdit={(bullet) => { setEditingBulletId(bullet.id); setDraftText(bullet.content); }}
        onDraftChange={setDraftText}
        onSave={saveBulletEdit}
        onToggleReason={(id) => setOpenReasonId((prev) => (prev === id ? null : id))}
      />
    );
  }

  // Results step
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

      <button
        onClick={() => setStep("confirmation")}
        style={{ marginTop: 4, background: colors.indigo, color: colors.cream, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
      >
        Continue
      </button>
    </div>
  );
}

function ScannerConfirmation({ scan, company, roleTitle, onViewResume }) {
  const accepted = scan.suggestions.filter((s) => s.status === "accepted");

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: colors.indigo, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: colors.cream, fontSize: 14 }}>✓</span>
        </div>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: 0 }}>
          Your resume is updated
        </p>
      </div>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: "0 0 16px 42px" }}>
        {accepted.length} edit{accepted.length === 1 ? "" : "s"} applied for {company} · {roleTitle}.
      </p>

      {accepted.length > 0 && (
        <div style={{ background: colors.terracottaBg, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: colors.terracottaText, margin: "0 0 10px" }}>
            What changed
          </p>
          {accepted.map((s) => (
            <p key={s.id} style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#4A1B0C", margin: "0 0 6px" }}>
              • {s.reason}
            </p>
          ))}
        </div>
      )}

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, margin: "0 0 16px" }}>
        Want an updated match score? Run a new scan any time — it'll reflect these changes.
      </p>

      <button
        onClick={onViewResume}
        style={{ background: colors.indigo, color: colors.cream, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
      >
        View full resume
      </button>
    </div>
  );
}

function ResumeEditor({ resumeDetail, status, editingBulletId, draftText, openReasonId, onStartEdit, onDraftChange, onSave, onToggleReason }) {
  if (status === "loading" || !resumeDetail) {
    return <EmptyState title="Loading your resume…" subtitle="Just a moment." />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: 0 }}>
          {resumeDetail.label} resume
        </p>
        <span style={{ background: colors.lavenderBg, color: colors.indigoDeep, fontSize: 11, padding: "4px 10px", borderRadius: 20, fontFamily: "Inter, sans-serif" }}>
          Autosaved
        </span>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px" }}>
        {resumeDetail.sections.map((section) => (
          <div key={section.id} style={{ marginBottom: 18 }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 500, color: colors.indigo, letterSpacing: "0.02em", margin: "0 0 8px" }}>
              {section.type.toUpperCase()}
            </p>
            {section.bullets.map((bullet) => {
              const wasEdited = !!bullet.reason;
              const isEditing = editingBulletId === bullet.id;
              return (
                <div key={bullet.id} style={{ marginBottom: 6 }}>
                  {isEditing ? (
                    <div>
                      <textarea
                        value={draftText}
                        onChange={(e) => onDraftChange(e.target.value)}
                        rows={2}
                        style={{ width: "100%", fontFamily: "Inter, sans-serif", fontSize: 13, padding: 8, borderRadius: 6, border: `0.5px solid ${colors.border}`, boxSizing: "border-box" }}
                      />
                      <button
                        onClick={() => onSave(bullet.id)}
                        style={{ marginTop: 4, background: colors.indigo, color: colors.cream, border: "none", borderRadius: 6, padding: "4px 12px", fontFamily: "Inter, sans-serif", fontSize: 11, cursor: "pointer" }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => onStartEdit(bullet)}
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 13,
                        color: colors.ink,
                        lineHeight: 1.6,
                        background: wasEdited ? colors.terracottaBg : "transparent",
                        borderRadius: 6,
                        padding: wasEdited ? "8px 10px" : "2px 0",
                        marginLeft: wasEdited ? -10 : 0,
                        cursor: "pointer",
                      }}
                    >
                      {bullet.content}
                      {wasEdited && (
                        <span
                          onClick={(e) => { e.stopPropagation(); onToggleReason(bullet.id); }}
                          style={{ marginLeft: 8, fontSize: 11, color: colors.terracottaText, cursor: "pointer" }}
                        >
                          ⓘ
                        </span>
                      )}
                    </div>
                  )}
                  {wasEdited && openReasonId === bullet.id && (
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, margin: "4px 0 0", fontStyle: "italic" }}>
                      {bullet.reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, margin: "12px 0 0" }}>
        Tap any line to edit. Tinted lines were updated during a scan — tap the ⓘ to see why.
      </p>
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

// Dashboard view─
function Dashboard({ userId }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!userId) return;
    setStatus("loading");
    fetch(`${API_BASE}/dashboard?user_id=${userId}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error || "Failed to load dashboard");
        setData(body);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, [userId]);

  if (!userId) {
    return <EmptyState title="Paste a user ID above" subtitle="We need to know whose dashboard to load." />;
  }
  if (status === "loading" || status === "idle") {
    return <EmptyState title="Loading your dashboard…" subtitle="Just a moment." />;
  }
  if (status === "error") {
    return (
      <EmptyState
        title="Couldn't reach the server"
        subtitle={`Make sure your backend is running on localhost:4000. (${errorMsg})`}
      />
    );
  }

  const firstName = (data.user.name || "there").split(" ")[0];
  const goalPct = Math.min(100, Math.round((data.weekly_progress / (data.user.weekly_goal || 1)) * 100));

  return (
    <div>
      <div style={{ background: colors.indigo, borderRadius: 16, padding: "1.5rem", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: colors.cream, margin: "0 0 4px" }}>
              Good to see you, {firstName}
            </p>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: colors.lavender, margin: 0 }}>
              {data.user.current_streak > 0
                ? `${data.user.current_streak}-day streak · you're on a roll`
                : "Let's get your streak going"}
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: colors.terracotta, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0 4px" }}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, color: "#4A1B0C", margin: 0 }}>
                {firstName.slice(0, 2).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
        <div style={{ background: "rgba(242,233,228,0.12)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.cream, margin: 0 }}>
            Weekly goal: {data.user.weekly_goal} applications
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, color: colors.cream, margin: 0 }}>
            {data.weekly_progress} / {data.user.weekly_goal}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220, background: "#fff", borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: colors.indigo, margin: "0 0 10px" }}>
            Coming up
          </p>
          {data.upcoming.length === 0 ? (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: 0 }}>Nothing on the horizon.</p>
          ) : (
            data.upcoming.map((item, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.ink, margin: 0 }}>
                  {item.type === "interview" ? "Interview" : "Deadline"} · {item.company}
                </p>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, margin: 0 }}>
                  {new Date(item.date).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        <div style={{ flex: 1, minWidth: 220, background: "#fff", borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: colors.indigo, margin: "0 0 10px" }}>
            New matches
          </p>
          {data.new_matches.length === 0 ? (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: 0 }}>None saved yet.</p>
          ) : (
            data.new_matches.map((m) => (
              <div key={m.id} style={{ marginBottom: 8 }}>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.ink, margin: 0 }}>
                  {m.role_title} · {m.company}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px" }}>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: colors.indigo, margin: "0 0 10px" }}>
          Recent activity
        </p>
        {data.recent_activity.length === 0 ? (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: 0 }}>Nothing yet.</p>
        ) : (
          data.recent_activity.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.lavender, display: "inline-block" }} />
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.muted, margin: 0 }}>
                {a.type === "application" ? "Applied to " : ""}{a.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// App shell──────
export default function VitaApp() {
  const [userId, setUserId] = useState("");
  const [tab, setTab] = useState("dashboard");

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
          { key: "dashboard", label: "Dashboard" },
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

      {tab === "dashboard" && <Dashboard userId={userId} />}
      {tab === "scanner" && <Scanner userId={userId} />}
      {tab === "tracker" && <Tracker userId={userId} />}
      {tab === "portfolio" && <Portfolio userId={userId} />}
    </div>
  );
}

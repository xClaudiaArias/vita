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

// Reads the saved token and calls the API with it attached automatically,
// so individual components never have to think about auth headers.
// Throws on any non-2xx response so callers can catch() a single error path.
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("vita_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

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
function CreateApplicationForm({ onCreated, onCancel }) {
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("saved");
  const [resumes, setResumes] = useState([]);
  const [resumeId, setResumeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    apiFetch("/resumes").then(setResumes).catch(() => {});
  }, []);

  const submit = async () => {
    setErrorMsg("");
    if (!company.trim() || !roleTitle.trim()) {
      setErrorMsg("Company and role are required.");
      return;
    }
    setSubmitting(true);
    try {
      const job = await apiFetch("/job-postings", {
        method: "POST",
        body: JSON.stringify({
          company: company.trim(),
          role_title: roleTitle.trim(),
          raw_description: description.trim() || `${roleTitle} at ${company}`,
        }),
      });
      await apiFetch("/applications", {
        method: "POST",
        body: JSON.stringify({ job_posting_id: job.id, resume_id: resumeId || null, status }),
      });
      onCreated();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px" }}>
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: "0 0 4px" }}>
        Add an application
      </p>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: "0 0 16px" }}>
        Track a job you've found, applied to, or want to keep an eye on.
      </p>

      <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" style={inputStyle} />
      <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Role title" style={inputStyle} />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Job description (optional, but needed if you want to scan it later)"
        rows={3}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
        <option value="saved">Saved</option>
        <option value="applied">Applied</option>
        <option value="interviewing">Interviewing</option>
        <option value="closed">Not this time</option>
      </select>

      <select value={resumeId} onChange={(e) => setResumeId(e.target.value)} style={inputStyle}>
        <option value="">No resume linked yet</option>
        {resumes.map((r) => (
          <option key={r.id} value={r.id}>{r.label}</option>
        ))}
      </select>

      {errorMsg && (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.terracottaText, margin: "0 0 10px" }}>
          {errorMsg}
        </p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={submit}
          disabled={submitting}
          style={{ background: colors.indigo, color: colors.cream, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Saving…" : "Add to tracker"}
        </button>
        <button
          onClick={onCancel}
          style={{ background: "transparent", border: "none", padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 13, color: colors.faint, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Tracker() {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | error | ready
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await apiFetch("/applications");
      setApplications(data);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (appId, newStatus) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a)));
    try {
      await apiFetch(`/applications/${appId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      load();
    }
  };

  if (showForm) {
    return (
      <CreateApplicationForm
        onCreated={() => { setShowForm(false); load(); }}
        onCancel={() => setShowForm(false)}
      />
    );
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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: 0 }}>
          Your applications
        </p>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: colors.indigo, color: colors.cream, border: "none", borderRadius: 10, padding: "8px 16px", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
        >
          + New application
        </button>
      </div>

      {applications.length === 0 ? (
        <EmptyState title="Nothing tracked yet" subtitle="Applications you save will show up here." />
      ) : (
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
                <div style={{ flex: 1, minWidth: 110 }}>
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value)}
                    style={{
                      background: s.bg,
                      color: s.text,
                      fontSize: 11,
                      padding: "4px 8px",
                      borderRadius: 20,
                      fontFamily: "Inter, sans-serif",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="saved">Saved</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="closed">Not this time</option>
                  </select>
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
      )}
    </div>
  );
}

// ── Portfolio view ────────────────────────────────
function Portfolio() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await apiFetch("/projects");
      setProjects(data);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

// ── Resume Scanner view ───────────────────────────
function Scanner() {
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
    apiFetch("/resumes").then(setResumes).catch(() => {});
  }, []);

  const runScan = async () => {
    setStep("scanning");
    setErrorMsg("");
    try {
      // First store the job posting
      const job = await apiFetch("/job-postings", {
        method: "POST",
        body: JSON.stringify({ company, role_title: roleTitle, raw_description: description }),
      });

      // Then run the scan against the selected resume
      const scanData = await apiFetch("/scans", {
        method: "POST",
        body: JSON.stringify({ resume_id: selectedResumeId, job_posting_id: job.id }),
      });

      setScan(scanData);
      setStep("results");
    } catch (err) {
      setErrorMsg(err.message);
      setStep("error");
    }
  };

  const handleSuggestion = async (suggestionId, action) => {
    await apiFetch(`/scans/suggestions/${suggestionId}`, {
      method: "PATCH",
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
      const data = await apiFetch(`/resumes/${resumeId}`);
      setResumeDetail(data);
      setResumeStatus("ready");
    } catch (err) {
      setResumeStatus("error");
    }
  };

  const saveBulletEdit = async (bulletId) => {
    await apiFetch(`/resumes/bullets/${bulletId}`, {
      method: "PATCH",
      body: JSON.stringify({ content: draftText }),
    });
    setEditingBulletId(null);
    loadResume(selectedResumeId);
  };

  // ── Job input step ──
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

  // ── Error step (e.g. AI credits not available yet) ──
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

  // ── Confirmation step ──
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

  // ── Editor step ──
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

  // ── Results step ──
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

// ── Dashboard view ─────────────────────────────────
function Dashboard() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setStatus("loading");
    apiFetch("/dashboard")
      .then((body) => {
        setData(body);
        setStatus("ready");
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setStatus("error");
      });
  }, []);

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
            {data.user.avatar_url ? (
              <img
                src={data.user.avatar_url}
                alt=""
                style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", margin: "0 0 4px" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: colors.terracotta, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 0 4px" }}>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, color: "#4A1B0C", margin: 0 }}>
                  {firstName.slice(0, 2).toUpperCase()}
                </p>
              </div>
            )}
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
          data.recent_activity.map((a, i) => {
            const dotColor = { application: colors.lavender, resume: colors.terracotta, suggestion: colors.terracotta, interview: colors.indigo }[a.type] || colors.lavender;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, display: "inline-block", flexShrink: 0 }} />
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.muted, margin: 0 }}>
                  {a.type === "application" ? "Applied to " : ""}{a.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Interview Chatbot view ────────────────────────
function InterviewChat() {
  const [applications, setApplications] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    apiFetch("/applications").then(setApplications).catch(() => {});
  }, []);

  const startSession = async () => {
    setErrorMsg("");
    try {
      const data = await apiFetch("/interview-sessions", {
        method: "POST",
        body: JSON.stringify({ application_id: selectedAppId || null }),
      });
      setSessionId(data.id);
      setMessages([]);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setErrorMsg("");

    // Show the user's message right away, before the server confirms —
    // makes the chat feel responsive instead of waiting on a round trip.
    setMessages((prev) => [...prev, { sender: "user", content: text, id: `pending-${Date.now()}` }]);
    setSending(true);

    try {
      const data = await apiFetch(`/interview-sessions/${sessionId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });
      setMessages((prev) => [...prev, data.vita_message]);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSending(false);
    }
  };

  // ── Pre-session setup ──
  if (!sessionId) {
    const selectedApp = applications.find((a) => a.id === selectedAppId);
    return (
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px" }}>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: "0 0 4px" }}>
          Let's get you ready
        </p>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: "0 0 16px" }}>
          Pick an application to prep for, or start a general practice session.
        </p>

        <select value={selectedAppId} onChange={(e) => setSelectedAppId(e.target.value)} style={inputStyle}>
          <option value="">General practice (no specific job)</option>
          {applications.map((a) => (
            <option key={a.id} value={a.id}>{a.company} — {a.role_title}</option>
          ))}
        </select>

        {errorMsg && (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.terracottaText, margin: "0 0 10px" }}>
            {errorMsg}
          </p>
        )}

        <button
          onClick={startSession}
          style={{ background: colors.indigo, color: colors.cream, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
        >
          Start practicing
        </button>
      </div>
    );
  }

  // ── Chat view ──
  return (
    <div style={{ background: colors.cream, borderRadius: 12, padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: "0 0 2px" }}>
            Practice session
          </p>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: 0 }}>
            {selectedAppId
              ? applications.find((a) => a.id === selectedAppId)?.company + " — " + applications.find((a) => a.id === selectedAppId)?.role_title
              : "General practice"}
          </p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: colors.terracotta, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 16 }}>💬</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16, minHeight: 120 }}>
        {messages.length === 0 && (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: 0 }}>
            Say hello, or ask VITA to start with a question.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              background: m.sender === "user" ? colors.indigo : "#fff",
              borderRadius: 12,
              borderBottomRightRadius: m.sender === "user" ? 4 : 12,
              borderBottomLeftRadius: m.sender === "user" ? 12 : 4,
              padding: "10px 14px",
            }}
          >
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: m.sender === "user" ? colors.cream : colors.ink, lineHeight: 1.5, margin: 0 }}>
              {m.content}
            </p>
          </div>
        ))}
        {errorMsg && (
          <div style={{ alignSelf: "flex-start", maxWidth: "80%", background: colors.terracottaBg, borderRadius: 12, padding: "10px 14px" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.terracottaText, margin: 0 }}>
              Couldn't get a reply: {errorMsg}
            </p>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your answer..."
          style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          style={{ background: colors.indigo, color: colors.cream, border: "none", borderRadius: 10, padding: "0 18px", fontFamily: "Inter, sans-serif", fontSize: 13, cursor: "pointer", opacity: sending || !input.trim() ? 0.5 : 1 }}
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

// ── Auth screen (login / signup) ──────────────────
function AuthScreen({ onAuthenticated, initialMode = "login", onBack }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setErrorMsg("");
    setSubmitting(true);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/signup";
      const body = mode === "login" ? { email, password } : { email, password, name };
      const data = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
      localStorage.setItem("vita_token", data.token);
      onAuthenticated(data.user);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: colors.cream, minHeight: 500, padding: 24, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Fraunces:wght@500&display=swap" rel="stylesheet" />
      <div style={{ background: "#fff", borderRadius: 12, padding: "28px 26px", width: "100%", maxWidth: 340 }}>
        {onBack && (
          <p onClick={onBack} style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: "0 0 14px", cursor: "pointer" }}>
            ← Back
          </p>
        )}
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: colors.indigo, margin: "0 0 4px" }}>Vita</p>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: colors.faint, margin: "0 0 20px" }}>
          {mode === "login" ? "Welcome back." : "Let's get you set up."}
        </p>

        {mode === "signup" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" style={inputStyle} />

        {errorMsg && (
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.terracottaText, margin: "0 0 10px" }}>
            {errorMsg}
          </p>
        )}

        <button
          onClick={submit}
          disabled={submitting || !email || !password || (mode === "signup" && !name)}
          style={{
            width: "100%",
            background: colors.indigo,
            color: colors.cream,
            border: "none",
            borderRadius: 10,
            padding: "10px 0",
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            marginBottom: 12,
            opacity: submitting ? 0.6 : 1,
          }}
        >
          {submitting ? "…" : mode === "login" ? "Log in" : "Create account"}
        </button>

        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: 0, textAlign: "center" }}>
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <span
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrorMsg(""); }}
            style={{ color: colors.indigo, cursor: "pointer", fontWeight: 500 }}
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ── Resumes view (list + create) ──────────────────
const SECTION_TYPES = ["summary", "experience", "skills", "education"];

function CreateResumeForm({ onCreated, onCancel }) {
  const [label, setLabel] = useState("");
  const [sections, setSections] = useState([
    { type: "summary", bullets: [""] },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const updateBullet = (sIdx, bIdx, value) => {
    setSections((prev) => {
      const next = [...prev];
      next[sIdx] = { ...next[sIdx], bullets: [...next[sIdx].bullets] };
      next[sIdx].bullets[bIdx] = value;
      return next;
    });
  };

  const addBullet = (sIdx) => {
    setSections((prev) => {
      const next = [...prev];
      next[sIdx] = { ...next[sIdx], bullets: [...next[sIdx].bullets, ""] };
      return next;
    });
  };

  const removeBullet = (sIdx, bIdx) => {
    setSections((prev) => {
      const next = [...prev];
      next[sIdx] = { ...next[sIdx], bullets: next[sIdx].bullets.filter((_, i) => i !== bIdx) };
      return next;
    });
  };

  const updateSectionType = (sIdx, type) => {
    setSections((prev) => {
      const next = [...prev];
      next[sIdx] = { ...next[sIdx], type };
      return next;
    });
  };

  const addSection = () => {
    setSections((prev) => [...prev, { type: "experience", bullets: [""] }]);
  };

  const removeSection = (sIdx) => {
    setSections((prev) => prev.filter((_, i) => i !== sIdx));
  };

  const submit = async () => {
    setErrorMsg("");
    if (!label.trim()) {
      setErrorMsg("Give this resume a name first.");
      return;
    }
    setSubmitting(true);
    try {
      // Drop empty bullet lines before sending — no reason to store blanks
      const cleanedSections = sections
        .map((s) => ({ ...s, bullets: s.bullets.map((b) => b.trim()).filter(Boolean) }))
        .filter((s) => s.bullets.length > 0);

      await apiFetch("/resumes", {
        method: "POST",
        body: JSON.stringify({ label: label.trim(), sections: cleanedSections }),
      });
      onCreated();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px" }}>
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: "0 0 4px" }}>
        New resume
      </p>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: "0 0 16px" }}>
        Give it a name and add your sections — you can always edit lines later.
      </p>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Resume name, e.g. Product Design"
        style={inputStyle}
      />

      {sections.map((section, sIdx) => (
        <div key={sIdx} style={{ background: colors.cream, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <select
              value={section.type}
              onChange={(e) => updateSectionType(sIdx, e.target.value)}
              style={{ ...inputStyle, marginBottom: 0, width: "auto", padding: "6px 10px", fontSize: 12 }}
            >
              {SECTION_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            {sections.length > 1 && (
              <span
                onClick={() => removeSection(sIdx)}
                style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, cursor: "pointer" }}
              >
                Remove section
              </span>
            )}
          </div>

          {section.bullets.map((bullet, bIdx) => (
            <div key={bIdx} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input
                value={bullet}
                onChange={(e) => updateBullet(sIdx, bIdx, e.target.value)}
                placeholder="Add a line..."
                style={{ ...inputStyle, marginBottom: 0, flex: 1, background: "#fff" }}
              />
              {section.bullets.length > 1 && (
                <span
                  onClick={() => removeBullet(sIdx, bIdx)}
                  style={{ fontFamily: "Inter, sans-serif", fontSize: 16, color: colors.faint, cursor: "pointer", padding: "0 6px" }}
                >
                  ×
                </span>
              )}
            </div>
          ))}

          <span
            onClick={() => addBullet(sIdx)}
            style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.indigo, cursor: "pointer" }}
          >
            + Add line
          </span>
        </div>
      ))}

      <span
        onClick={addSection}
        style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.indigo, cursor: "pointer", marginBottom: 16 }}
      >
        + Add another section
      </span>

      {errorMsg && (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.terracottaText, margin: "0 0 10px" }}>
          {errorMsg}
        </p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={submit}
          disabled={submitting}
          style={{ background: colors.indigo, color: colors.cream, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Saving…" : "Save resume"}
        </button>
        <button
          onClick={onCancel}
          style={{ background: "transparent", border: "none", padding: "10px 12px", fontFamily: "Inter, sans-serif", fontSize: 13, color: colors.faint, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await apiFetch("/resumes");
      setResumes(data);
      setStatus("ready");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startRename = (resume) => {
    setEditingId(resume.id);
    setDraftLabel(resume.label);
  };

  const saveRename = async (id) => {
    if (!draftLabel.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await apiFetch(`/resumes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ label: draftLabel.trim() }),
      });
      setEditingId(null);
      load();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const confirmDelete = async (id) => {
    try {
      await apiFetch(`/resumes/${id}`, { method: "DELETE" });
      setConfirmDeleteId(null);
      load();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  if (showForm) {
    return (
      <CreateResumeForm
        onCreated={() => { setShowForm(false); load(); }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: 0 }}>
          Your resumes
        </p>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: colors.indigo, color: colors.cream, border: "none", borderRadius: 10, padding: "8px 16px", fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
        >
          + New resume
        </button>
      </div>

      {status === "loading" || status === "idle" ? (
        <EmptyState title="Loading…" subtitle="Just a moment." />
      ) : status === "error" ? (
        <EmptyState title="Couldn't reach the server" subtitle={errorMsg} />
      ) : resumes.length === 0 ? (
        <EmptyState title="No resumes yet" subtitle="Create one to start scanning it against job postings." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {resumes.map((r) => (
            <div key={r.id} style={{ background: "#fff", borderRadius: 12, padding: "14px 16px" }}>
              {editingId === r.id ? (
                <div style={{ marginBottom: 4 }}>
                  <input
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveRename(r.id)}
                    autoFocus
                    style={{ ...inputStyle, marginBottom: 6, fontSize: 13, padding: "6px 10px" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <span onClick={() => saveRename(r.id)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.indigo, cursor: "pointer" }}>Save</span>
                    <span onClick={() => setEditingId(null)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, cursor: "pointer" }}>Cancel</span>
                  </div>
                </div>
              ) : (
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: colors.ink, margin: "0 0 4px" }}>
                  {r.label}
                </p>
              )}

              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, margin: "0 0 10px" }}>
                Updated {new Date(r.updated_at).toLocaleDateString()}
              </p>

              {editingId !== r.id && (
                confirmDeleteId === r.id ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.terracottaText }}>Delete this resume?</span>
                    <span onClick={() => confirmDelete(r.id)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.terracottaText, fontWeight: 500, cursor: "pointer" }}>Yes</span>
                    <span onClick={() => setConfirmDeleteId(null)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, cursor: "pointer" }}>Cancel</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10 }}>
                    <span onClick={() => startRename(r)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.indigo, cursor: "pointer" }}>Rename</span>
                    <span onClick={() => setConfirmDeleteId(r.id)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, cursor: "pointer" }}>Delete</span>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Landing page ───────────────────────────────────
const features = [
  {
    icon: "📝",
    title: "Resume Scanner",
    description: "Paste any job posting and get specific, encouraging suggestions to tailor your resume — with the reasoning behind every change.",
  },
  {
    icon: "🏠",
    title: "Dashboard",
    description: "One calm home base for your streak, weekly goals, upcoming interviews, and what's new — no overwhelming metric walls.",
  },
  {
    icon: "📋",
    title: "Application Tracker",
    description: "Track every application's status without it feeling like a spreadsheet. Closed applications quietly fade so you can move on.",
  },
  {
    icon: "💬",
    title: "Interview Prep",
    description: "Practice real questions with a coach that leads with what worked, then offers one specific way to improve — never a wall of criticism.",
  },
  {
    icon: "✨",
    title: "Portfolio",
    description: "A shareable profile that showcases your projects and story, ready to send alongside any application.",
  },
];

function LandingPage({ onGetStarted, onLogin }) {
  return (
    <div style={{ background: colors.cream, borderRadius: 16, overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fraunces:wght@500;600&display=swap" rel="stylesheet" />

      {/* Nav bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px" }}>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600, color: colors.indigo, margin: 0 }}>
          Vita
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            onClick={onLogin}
            style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: colors.muted, cursor: "pointer" }}
          >
            Log in
          </span>
          <button
            onClick={onGetStarted}
            style={{
              background: colors.indigo,
              color: colors.cream,
              border: "none",
              borderRadius: 20,
              padding: "8px 18px",
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Get started
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "48px 28px 56px" }}>
        <p
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: 38,
            fontWeight: 600,
            color: colors.indigo,
            lineHeight: 1.15,
            margin: "0 auto 16px",
            maxWidth: 560,
          }}
        >
          Your calm companion for the job search
        </p>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 15,
            color: colors.muted,
            lineHeight: 1.6,
            margin: "0 auto 28px",
            maxWidth: 460,
          }}
        >
          Tailor your resume, track every application, prep for interviews, and showcase your work —
          all in one place that feels like it's actually on your side.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={onGetStarted}
            style={{
              background: colors.indigo,
              color: colors.cream,
              border: "none",
              borderRadius: 10,
              padding: "12px 26px",
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Get started — it's free
          </button>
          <button
            onClick={onLogin}
            style={{
              background: "#fff",
              color: colors.indigo,
              border: `0.5px solid ${colors.border}`,
              borderRadius: 10,
              padding: "12px 26px",
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            I already have an account
          </button>
        </div>
      </div>

      {/* Features */}
      <div style={{ background: "#fff", padding: "44px 28px" }}>
        <p
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: 22,
            fontWeight: 600,
            color: colors.indigo,
            textAlign: "center",
            margin: "0 0 8px",
          }}
        >
          Everything the job hunt actually needs
        </p>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            color: colors.faint,
            textAlign: "center",
            margin: "0 auto 32px",
            maxWidth: 420,
          }}
        >
          Five tools, one consistent, encouraging experience — nothing here is designed to make you feel behind.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: colors.cream,
                borderRadius: 12,
                padding: "20px 18px",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: colors.lavenderBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  marginBottom: 12,
                }}
              >
                {f.icon}
              </div>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 600, color: colors.ink, margin: "0 0 6px" }}>
                {f.title}
              </p>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.muted, lineHeight: 1.55, margin: 0 }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Closing CTA */}
      <div style={{ textAlign: "center", padding: "40px 28px" }}>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: colors.indigo, margin: "0 0 16px" }}>
          Ready to feel a little less alone in this?
        </p>
        <button
          onClick={onGetStarted}
          style={{
            background: colors.indigo,
            color: colors.cream,
            border: "none",
            borderRadius: 10,
            padding: "12px 28px",
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Get started — it's free
        </button>
      </div>
    </div>
  );
}

// ── Settings view ──────────────────────────────────
function Settings({ user, onUpdated }) {
  const [name, setName] = useState(user.name || "");
  const [weeklyGoal, setWeeklyGoal] = useState(user.weekly_goal || 5);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const save = async () => {
    setSaving(true);
    setErrorMsg("");
    setSavedMsg("");
    try {
      const updated = await apiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim() || undefined,
          weekly_goal: Number(weeklyGoal),
          avatar_url: avatarUrl.trim() || undefined,
        }),
      });
      onUpdated(updated);
      setSavedMsg("Saved.");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", maxWidth: 420 }}>
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: "0 0 16px" }}>
        Settings
      </p>

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 500, color: colors.muted, margin: "0 0 6px" }}>
        Name
      </p>
      <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 500, color: colors.muted, margin: "0 0 6px" }}>
        Weekly application goal
      </p>
      <input
        type="number"
        min={1}
        value={weeklyGoal}
        onChange={(e) => setWeeklyGoal(e.target.value)}
        style={inputStyle}
      />

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 500, color: colors.muted, margin: "0 0 6px" }}>
        Avatar image URL
      </p>
      <input
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        placeholder="https://... (optional — we'll use your initials otherwise)"
        style={inputStyle}
      />

      {errorMsg && (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.terracottaText, margin: "0 0 10px" }}>
          {errorMsg}
        </p>
      )}
      {savedMsg && (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.indigo, margin: "0 0 10px" }}>
          {savedMsg}
        </p>
      )}

      <button
        onClick={save}
        disabled={saving}
        style={{ background: colors.indigo, color: colors.cream, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

// ── App shell ──────────────────────────────────────
export default function VitaApp() {
  const [tab, setTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authView, setAuthView] = useState("landing"); // landing | login | signup

  // On load, check if a saved token still works — keeps you logged in
  // across page refreshes instead of forcing a fresh login every time.
  useEffect(() => {
    const token = localStorage.getItem("vita_token");
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    apiFetch("/auth/me")
      .then(setUser)
      .catch(() => localStorage.removeItem("vita_token"))
      .finally(() => setCheckingAuth(false));
  }, []);

  const logout = () => {
    localStorage.removeItem("vita_token");
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div style={{ background: colors.cream, minHeight: 500, padding: 24, borderRadius: 16 }}>
        <EmptyState title="Loading…" subtitle="Just a moment." />
      </div>
    );
  }

  if (!user) {
    if (authView === "landing") {
      return (
        <LandingPage
          onGetStarted={() => setAuthView("signup")}
          onLogin={() => setAuthView("login")}
        />
      );
    }
    return (
      <AuthScreen
        initialMode={authView}
        onAuthenticated={setUser}
        onBack={() => setAuthView("landing")}
      />
    );
  }

  return (
    <div style={{ background: colors.cream, minHeight: 500, padding: 24, borderRadius: 16 }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Fraunces:wght@500&display=swap" rel="stylesheet" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, fontWeight: 500, color: colors.indigo, margin: 0 }}>
          Vita
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.muted }}>{user.name}</span>
          <button
            onClick={logout}
            style={{ background: "transparent", border: `0.5px solid ${colors.border}`, borderRadius: 20, padding: "4px 12px", fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, cursor: "pointer" }}
          >
            Log out
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "dashboard", label: "Dashboard" },
          { key: "resumes", label: "Resumes" },
          { key: "scanner", label: "Scanner" },
          { key: "tracker", label: "Tracker" },
          { key: "chat", label: "Interview Prep" },
          { key: "portfolio", label: "Portfolio" },
          { key: "settings", label: "Settings" },
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

      {tab === "dashboard" && <Dashboard />}
      {tab === "resumes" && <Resumes />}
      {tab === "scanner" && <Scanner />}
      {tab === "tracker" && <Tracker />}
      {tab === "chat" && <InterviewChat />}
      {tab === "portfolio" && <Portfolio />}
      {tab === "settings" && <Settings user={user} onUpdated={setUser} />}
    </div>
  );
}


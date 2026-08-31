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

// ── Design system: spacing & typography scales ────
// A shared scale means every gap/padding/margin pulls from the same
// set of values instead of one-off numbers, which is what gives a UI
// visual rhythm instead of feeling arbitrary.
const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

const type = {
  display: { fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: 28, lineHeight: 1.2 },
  heading: { fontFamily: "Fraunces, serif", fontWeight: 500, fontSize: 19, lineHeight: 1.3 },
  subheading: { fontFamily: "Fraunces, serif", fontWeight: 500, fontSize: 16, lineHeight: 1.35 },
  body: { fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 13, lineHeight: 1.55 },
  bodyMedium: { fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 13, lineHeight: 1.5 },
  label: { fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 11.5, lineHeight: 1.4 },
  caption: { fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 11, lineHeight: 1.5 },
};

// Content width system — constrains the reading/working area on wide
// viewports instead of letting cards and text stretch edge to edge.
const contentMaxWidth = 880;

// ── Shared motion styles ───────────────────────────
// Inline styles can't do hover states or keyframes, so this small
// stylesheet gets injected once per top-level screen (via <style>)
// and applied through className alongside the existing inline styles.
const globalStyles = `
  @keyframes vitaFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes vitaPop {
    0% { transform: scale(0.96); }
    60% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
  @keyframes vitaPulseRing {
    0% { box-shadow: 0 0 0 0 rgba(232, 132, 92, 0.45); }
    100% { box-shadow: 0 0 0 10px rgba(232, 132, 92, 0); }
  }
  .vita-fade-in {
    animation: vitaFadeIn 0.28s ease both;
  }
  .vita-card {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .vita-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(15, 0, 128, 0.08);
  }
  .vita-btn {
    transition: transform 0.12s ease, opacity 0.12s ease, box-shadow 0.12s ease;
  }
  .vita-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(15, 0, 128, 0.18);
  }
  .vita-btn:active {
    transform: scale(0.97);
  }
  .vita-tab-btn {
    transition: transform 0.12s ease, background 0.15s ease, color 0.15s ease;
  }
  .vita-tab-btn:hover {
    transform: translateY(-1px);
  }
  .vita-progress-fill {
    transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .vita-suggestion-card {
    transition: opacity 0.35s ease, transform 0.25s ease;
  }
  .vita-goal-met {
    animation: vitaPop 0.4s ease;
  }
  .vita-avatar-pulse {
    animation: vitaPulseRing 1.6s ease-out infinite;
  }

  /* ── Design system additions ── */

  /* Focus states — every field and interactive control gets a visible,
     on-brand focus ring instead of relying on inconsistent browser defaults. */
  .vita-field {
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .vita-field:focus {
    border-color: #0F0080;
    box-shadow: 0 0 0 3px rgba(15, 0, 128, 0.12);
  }
  .vita-btn:focus-visible,
  .vita-tab-btn:focus-visible,
  .vita-text-link:focus-visible {
    outline: 2px solid #0F0080;
    outline-offset: 2px;
  }

  /* Interactive text states — Rename/Edit/Delete/Cancel-style text
     actions get real hover feedback instead of looking like static labels. */
  .vita-text-link {
    transition: opacity 0.12s ease;
    text-decoration: none;
  }
  .vita-text-link:hover {
    text-decoration: underline;
    opacity: 0.75;
  }

  /* Card hierarchy — two elevation tiers instead of one flat look
     everywhere. "raised" cards (things you act on) get a resting shadow
     and lift further on hover; "surface" cards (containers, forms,
     list wrappers) stay flat with just a quiet border. */
  .vita-card {
    border: 1px solid rgba(15, 0, 128, 0.06);
    box-shadow: 0 1px 3px rgba(15, 0, 128, 0.05);
  }
  .vita-surface {
    border: 1px solid #E4DCD5;
  }

  /* Responsive grids — auto-fit so multi-column layouts reflow on
     narrow viewports instead of staying locked at a fixed column count. */
  .vita-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }

  /* Scanner-specific motion — only where it reinforces a real state
     change (job recognized, resume selected, scan in progress). */
  @keyframes vitaBreathe {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
  }
  .vita-breathe {
    animation: vitaBreathe 1.6s ease-in-out infinite;
  }
  .vita-check-pop {
    animation: vitaPop 0.35s ease;
  }
  .vita-resume-option {
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.12s ease;
    cursor: pointer;
  }
  .vita-resume-option:hover {
    transform: translateY(-1px);
  }

  /* Dashboard's two-column layout — a real breakpoint rather than
     flex-wrap guesswork, so the columns only split once there's
     genuinely enough width for both to breathe. */
  .vita-dashboard-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    align-items: start;
  }
  @media (min-width: 760px) {
    .vita-dashboard-grid {
      grid-template-columns: minmax(0, 2fr) minmax(220px, 1fr);
    }
  }

  /* Flat list rows (Coming up, Recent activity) — divider lines
     instead of nested cards, since these are informational lists,
     not individually actionable content. */
  .vita-list-row {
    padding: 10px 0;
    border-bottom: 1px solid #E4DCD5;
  }
  .vita-list-row:last-child {
    border-bottom: none;
  }
`;

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
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      // FormData sets its own Content-Type (with the multipart boundary) —
      // setting it manually here would break file uploads.
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
      className="vita-surface"
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: `${space.xxl}px ${space.lg}px`,
        textAlign: "center",
      }}
    >
      <p style={{ ...type.subheading, color: colors.indigo, margin: "0 0 4px" }}>
        {title}
      </p>
      <p style={{ ...type.caption, color: colors.faint, margin: 0 }}>
        {subtitle}
      </p>
    </div>
  );
}

// ── Design system: reusable primitives ────────────
// A small, consistent set of building blocks so spacing, type, and
// interaction states don't have to be re-invented (and inevitably drift)
// every time a new screen needs a button, a form field, or a card.

function Button({ variant = "primary", size = "md", children, style, className = "", ...props }) {
  const sizePadding = size === "sm" ? "6px 14px" : "10px 20px";
  const sizeFontSize = size === "sm" ? 12 : 13;

  const variantStyle = {
    primary: { background: colors.indigo, color: colors.cream, border: "none" },
    secondary: { background: "#fff", color: colors.indigo, border: `1px solid ${colors.border}` },
    destructive: { background: "#fff", color: colors.terracottaText, border: `1px solid ${colors.terracottaBg}` },
  }[variant];

  const isButtonVariant = variant !== "ghost";

  return (
    <button
      className={`${isButtonVariant ? "vita-btn" : "vita-text-link"} ${className}`}
      style={{
        ...(isButtonVariant
          ? {
              ...variantStyle,
              borderRadius: 10,
              padding: sizePadding,
              fontFamily: "Inter, sans-serif",
              fontSize: sizeFontSize,
              fontWeight: 500,
              cursor: "pointer",
            }
          : {
              background: "transparent",
              border: "none",
              padding: 0,
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              color: colors.faint,
              cursor: "pointer",
            }),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// A small clickable text action (Rename, Delete, Edit, View project…).
// Distinct from Button's ghost variant in that it's an inline <span>,
// matching how these are used inline within cards rather than as
// standalone controls.
function TextLink({ tone = "default", children, style, ...props }) {
  const toneColor = { default: colors.indigo, muted: colors.faint, destructive: colors.terracottaText }[tone];
  return (
    <span
      className="vita-text-link"
      style={{
        ...type.caption,
        color: toneColor,
        fontWeight: tone === "destructive" ? 500 : 400,
        cursor: "pointer",
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}

// Label + control pairing for forms, so every field gets a consistent
// label style and spacing without repeating it by hand each time.
function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: space.md }}>
      {label && (
        <p style={{ ...type.label, color: colors.muted, margin: "0 0 6px" }}>{label}</p>
      )}
      {children}
    </div>
  );
}

// The title + primary-action row repeated at the top of Tracker,
// Resumes, and Portfolio — now a single implementation.
function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg }}>
      <p style={{ ...type.heading, color: colors.indigo, margin: 0 }}>{title}</p>
      {actionLabel && (
        <Button size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}

// The "Delete this X? Yes / Cancel" inline confirm pattern, previously
// hand-duplicated in both Resumes and Portfolio.
function ConfirmInline({ label, onConfirm, onCancel }) {
  return (
    <div style={{ display: "flex", gap: space.sm, alignItems: "center" }}>
      <span style={{ ...type.caption, color: colors.terracottaText }}>{label}</span>
      <TextLink tone="destructive" onClick={onConfirm}>Yes</TextLink>
      <TextLink tone="muted" onClick={onCancel}>Cancel</TextLink>
    </div>
  );
}

// A raised, actionable content card (resume cards, project cards,
// dashboard panels) vs. a flat "surface" container (forms, list
// wrappers) — see the .vita-card / .vita-surface CSS for the tiers.
function Card({ elevation = "raised", children, style, className = "", ...props }) {
  return (
    <div
      className={`${elevation === "raised" ? "vita-card" : "vita-surface"} ${className}`}
      style={{ background: "#fff", borderRadius: 12, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}

// Auto-fit responsive grid — replaces fixed "1fr 1fr" columns that
// don't reflow gracefully on narrow viewports.
function Grid({ children, style }) {
  return <div className="vita-grid" style={style}>{children}</div>;
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

      <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className="vita-field" style={inputStyle} />
      <input value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="Role title" className="vita-field" style={inputStyle} />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Job description (optional, but needed if you want to scan it later)"
        rows={3}
        className="vita-field" style={{ ...inputStyle, resize: "vertical" }}
      />

      <select value={status} onChange={(e) => setStatus(e.target.value)} className="vita-field" style={inputStyle}>
        <option value="saved">Saved</option>
        <option value="applied">Applied</option>
        <option value="interviewing">Interviewing</option>
        <option value="closed">Not this time</option>
      </select>

      <select value={resumeId} onChange={(e) => setResumeId(e.target.value)} className="vita-field" style={inputStyle}>
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
        <button className="vita-btn"
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
      <SectionHeader title="Your applications" actionLabel="+ New application" onAction={() => setShowForm(true)} />

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
function ProjectForm({ initial, onSaved, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnail_url || "");
  const [linkUrl, setLinkUrl] = useState(initial?.link_url || "");
  const [tagsInput, setTagsInput] = useState((initial?.tags || []).join(", "));
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isEditing = !!initial;

  const submit = async () => {
    setErrorMsg("");
    if (!title.trim()) {
      setErrorMsg("Give the project a title.");
      return;
    }
    setSubmitting(true);
    try {
      const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
        link_url: linkUrl.trim() || null,
        tags,
      };
      if (isEditing) {
        await apiFetch(`/projects/${initial.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch("/projects", { method: "POST", body: JSON.stringify(body) });
      }
      onSaved();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px" }}>
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.indigo, margin: "0 0 4px" }}>
        {isEditing ? "Edit project" : "New project"}
      </p>
      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.faint, margin: "0 0 16px" }}>
        Show off something you're proud of.
      </p>

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" className="vita-field" style={inputStyle} />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="One or two lines on what it is and the impact it had"
        rows={3}
        className="vita-field" style={{ ...inputStyle, resize: "vertical" }}
      />
      <input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="Thumbnail image URL (optional)" className="vita-field" style={inputStyle} />
      <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Link to the project (optional)" className="vita-field" style={inputStyle} />
      <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Tags, comma separated — e.g. Figma, Systems" className="vita-field" style={inputStyle} />

      {errorMsg && (
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: colors.terracottaText, margin: "0 0 10px" }}>
          {errorMsg}
        </p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="vita-btn"
          onClick={submit}
          disabled={submitting}
          style={{ background: colors.indigo, color: colors.cream, border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Saving…" : isEditing ? "Save changes" : "Add project"}
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

function Portfolio() {
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [formMode, setFormMode] = useState(null); // null | "create" | project object being edited
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

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

  const deleteProject = async (id) => {
    try {
      await apiFetch(`/projects/${id}`, { method: "DELETE" });
      setConfirmDeleteId(null);
      load();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  if (formMode === "create") {
    return <ProjectForm onSaved={() => { setFormMode(null); load(); }} onCancel={() => setFormMode(null)} />;
  }
  if (formMode && formMode !== "create") {
    return <ProjectForm initial={formMode} onSaved={() => { setFormMode(null); load(); }} onCancel={() => setFormMode(null)} />;
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

  return (
    <div>
      <SectionHeader title="Your portfolio" actionLabel="+ New project" onAction={() => setFormMode("create")} />

      {projects.length === 0 ? (
        <EmptyState title="No projects yet" subtitle="Add a project to start building your portfolio." />
      ) : (
        <div className="vita-grid">
          {projects.map((p) => (
            <Card key={p.id} style={{ overflow: "hidden" }}>
              <div
                style={{
                  height: 90,
                  background: p.thumbnail_url ? `center / cover no-repeat url(${p.thumbnail_url})` : colors.lavender,
                }}
              />
              <div style={{ padding: "12px 14px" }}>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 500, color: colors.ink, margin: "0 0 4px" }}>
                  {p.title}
                </p>
                {p.description && (
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, margin: "0 0 8px" }}>
                    {p.description}
                  </p>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
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

                {p.link_url && (
                  <a
                    href={p.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vita-text-link"
                    style={{ display: "block", fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.indigo, marginBottom: 8, textDecoration: "none" }}
                  >
                    View project →
                  </a>
                )}

                {confirmDeleteId === p.id ? (
                  <ConfirmInline
                    label="Delete this project?"
                    onConfirm={() => deleteProject(p.id)}
                    onCancel={() => setConfirmDeleteId(null)}
                  />
                ) : (
                  <div style={{ display: "flex", gap: 10 }}>
                    <TextLink onClick={() => setFormMode(p)}>Edit</TextLink>
                    <TextLink tone="muted" onClick={() => setConfirmDeleteId(p.id)}>Delete</TextLink>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Resume Scanner view ───────────────────────────
function Scanner({ onNavigateToResumes }) {
  // Journey: capture (paste the job) → recognize (confirm company/role) →
  // resume (pick which resume) → scanning → results → confirmation → editor
  const [step, setStep] = useState("capture");
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [captureText, setCaptureText] = useState("");
  const [urlSavedNotice, setUrlSavedNotice] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [scan, setScan] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [resumeDetail, setResumeDetail] = useState(null);
  const [resumeStatus, setResumeStatus] = useState("idle");
  const [editingBulletId, setEditingBulletId] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [openReasonId, setOpenReasonId] = useState(null);
  const [editingSuggestionId, setEditingSuggestionId] = useState(null);
  const [suggestionDraft, setSuggestionDraft] = useState("");

  useEffect(() => {
    apiFetch("/resumes").then(setResumes).catch(() => {});
  }, []);

  // A bare URL (no spaces, starts with http) can't actually be fetched from
  // here — there's no backend URL-parsing capability. So we save it as a
  // reference (source_url, which the job-postings API already accepts) and
  // ask for the real text, rather than pretending we can read the page.
  const handleCaptureContinue = () => {
    const trimmed = captureText.trim();
    if (!trimmed) return;
    const isBareUrl = /^https?:\/\/\S+$/.test(trimmed);
    if (isBareUrl) {
      setSourceUrl(trimmed);
      setCaptureText("");
      setUrlSavedNotice(true);
      return;
    }
    setDescription(trimmed);
    setUrlSavedNotice(false);
    setStep("recognize");
  };

  const runScan = async () => {
    setStep("scanning");
    setErrorMsg("");
    try {
      const job = await apiFetch("/job-postings", {
        method: "POST",
        body: JSON.stringify({ company, role_title: roleTitle, source_url: sourceUrl || null, raw_description: description }),
      });
      setJobId(job.id);

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

  // editedText is optional — when provided (from the inline "Edit" flow),
  // the backend applies that wording instead of its own suggested_text.
  const handleSuggestion = async (suggestionId, action, editedText) => {
    const body = editedText ? { action, edited_text: editedText } : { action };
    const result = await apiFetch(`/scans/suggestions/${suggestionId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    setScan((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map((s) =>
        s.id === suggestionId
          ? { ...s, status: action === "accept" ? "accepted" : "skipped", suggested_text: result.suggested_text || s.suggested_text }
          : s
      ),
    }));
    setEditingSuggestionId(null);
  };

  const startEditSuggestion = (s) => {
    setEditingSuggestionId(s.id);
    setSuggestionDraft(s.suggested_text);
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

  // ── Step 1: Capture — the job posting itself is the primary interaction ──
  if (step === "capture") {
    return (
      <Card elevation="surface" style={{ padding: "24px 26px" }}>
        <p style={{ ...type.display, fontSize: 24, color: colors.indigo, margin: "0 0 6px" }}>
          Let's see how you match.
        </p>
        <p style={{ ...type.body, color: colors.muted, margin: "0 0 18px", maxWidth: 440 }}>
          Paste a job you're interested in — a link or the full description works. VITA will help you see where you stand and how to approach it.
        </p>

        {urlSavedNotice && (
          <div className="vita-fade-in" style={{ background: colors.lavenderBg, borderRadius: 8, padding: "8px 12px", marginBottom: space.md }}>
            <p style={{ ...type.caption, color: colors.indigoDeep, margin: 0 }}>
              🔗 Link saved. Paste the job description text below so VITA can actually read it.
            </p>
          </div>
        )}

        <textarea
          value={captureText}
          onChange={(e) => setCaptureText(e.target.value)}
          placeholder="Paste a job posting URL, or the full job description…"
          rows={7}
          className="vita-field"
          style={{ ...inputStyle, resize: "vertical", marginBottom: space.md, fontSize: 14 }}
        />

        <Button onClick={handleCaptureContinue} style={{ opacity: captureText.trim() ? 1 : 0.5 }}>
          Continue
        </Button>
      </Card>
    );
  }

  // ── Step 2: Recognition — confirm the basics without re-asking for the description ──
  if (step === "recognize") {
    return (
      <Card elevation="surface" style={{ padding: "24px 26px" }}>
        <TextLink tone="muted" onClick={() => setStep("capture")}>← Back</TextLink>
        <p style={{ ...type.heading, color: colors.indigo, margin: "10px 0 4px" }}>
          Tell us about this role
        </p>
        <p style={{ ...type.caption, color: colors.faint, margin: "0 0 16px" }}>
          Just the basics — VITA works from the description you already pasted.
        </p>

        <div style={{ background: "#fff", borderRadius: 10, border: `1px solid ${colors.border}`, padding: "10px 12px", marginBottom: space.lg }}>
          <p style={{ ...type.label, color: colors.muted, margin: "0 0 4px" }}>What you pasted</p>
          <p style={{ ...type.caption, color: colors.muted, fontStyle: "italic", margin: 0 }}>
            {description.slice(0, 160)}{description.length > 160 ? "…" : ""}
          </p>
        </div>

        <FormField label="Company">
          <input className="vita-field" style={inputStyle} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Notion" />
        </FormField>
        <FormField label="Role title">
          <input className="vita-field" style={inputStyle} value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g. Senior Product Designer" />
        </FormField>

        <Button onClick={() => setStep("resume")} style={{ opacity: (!company.trim() || !roleTitle.trim()) ? 0.5 : 1 }}>
          Continue
        </Button>
      </Card>
    );
  }

  // ── Step 3: Resume selection — visual cards instead of a <select> ──
  if (step === "resume") {
    return (
      <div>
        <TextLink tone="muted" onClick={() => setStep("recognize")}>← Back</TextLink>
        <p style={{ ...type.heading, color: colors.indigo, margin: "10px 0 4px" }}>
          Which resume should we compare?
        </p>
        <p style={{ ...type.caption, color: colors.faint, margin: "0 0 16px" }}>
          Pick the version that fits this kind of role best.
        </p>

        {resumes.length === 0 ? (
          <Card elevation="surface" style={{ padding: "20px 22px", textAlign: "center", marginBottom: space.lg }}>
            <p style={{ ...type.body, color: colors.muted, margin: "0 0 10px" }}>
              You don't have a resume yet.
            </p>
            <TextLink onClick={onNavigateToResumes}>Go create one in Resumes →</TextLink>
          </Card>
        ) : (
          <div className="vita-grid" style={{ marginBottom: space.lg }}>
            {resumes.map((r) => {
              const selected = r.id === selectedResumeId;
              return (
                <div
                  key={r.id}
                  className="vita-resume-option"
                  onClick={() => setSelectedResumeId(r.id)}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    padding: "14px 16px",
                    border: selected ? `2px solid ${colors.indigo}` : `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ ...type.bodyMedium, color: colors.ink, margin: 0 }}>{r.label}</p>
                    {selected && <span className="vita-check-pop" style={{ color: colors.indigo, fontSize: 14 }}>✓</span>}
                  </div>
                  <p style={{ ...type.caption, color: colors.faint, margin: "4px 0 0" }}>
                    Updated {new Date(r.updated_at).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <Button onClick={runScan} disabled={!selectedResumeId} style={{ opacity: selectedResumeId ? 1 : 0.5 }}>
          Analyze my match
        </Button>
      </div>
    );
  }

  // ── Scanning — a calm holding state, not a spinner ──
  if (step === "scanning") {
    return (
      <Card elevation="surface" style={{ padding: "36px 26px", textAlign: "center" }}>
        <p className="vita-breathe" style={{ ...type.heading, color: colors.indigo, margin: "0 0 6px" }}>
          Reading between the lines…
        </p>
        <p style={{ ...type.caption, color: colors.faint, margin: 0 }}>
          Comparing your resume against the posting.
        </p>
      </Card>
    );
  }

  // ── Error step (e.g. AI credits not available) ──
  if (step === "error") {
    return (
      <Card elevation="surface" style={{ padding: "20px 22px" }}>
        <p style={{ ...type.subheading, color: colors.terracottaText, margin: "0 0 6px" }}>
          Couldn't complete the scan
        </p>
        <p style={{ ...type.caption, color: colors.faint, margin: "0 0 16px" }}>
          {errorMsg}
        </p>
        <Button variant="secondary" onClick={() => setStep("capture")}>Try again</Button>
      </Card>
    );
  }

  // ── Confirmation step ──
  if (step === "confirmation") {
    return (
      <ScannerConfirmation
        scan={scan}
        company={company}
        roleTitle={roleTitle}
        jobId={jobId}
        resumeId={selectedResumeId}
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

  // ── Results step — lead with the encouraging read before the number ──
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.lg }}>
        <div>
          <p style={{ ...type.heading, fontSize: 22, color: colors.indigo, margin: "0 0 2px" }}>
            Nice fit. There's room to shine.
          </p>
          <p style={{ ...type.caption, color: colors.faint, margin: 0 }}>
            {company} · {roleTitle}
          </p>
        </div>
        <div className="vita-check-pop" style={{ textAlign: "right" }}>
          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 30, fontWeight: 600, color: colors.indigoDeep, margin: 0, lineHeight: 1 }}>
            {scan.match_score}%
          </p>
          <p style={{ ...type.caption, color: colors.indigoDeep, margin: 0 }}>match</p>
        </div>
      </div>

      {scan.strengths && scan.strengths.length > 0 && (
        <div style={{ marginBottom: space.lg }}>
          <p style={{ ...type.label, color: colors.indigo, margin: "0 0 8px" }}>Already strong</p>
          <Card style={{ padding: "12px 14px", borderLeft: `3px solid ${colors.indigo}` }}>
            {scan.strengths.map((s, i) => (
              <p key={i} style={{ ...type.body, color: colors.muted, margin: i < scan.strengths.length - 1 ? "0 0 6px" : 0 }}>{s}</p>
            ))}
          </Card>
        </div>
      )}

      <p style={{ ...type.label, color: colors.terracottaText, margin: "0 0 8px" }}>Worth adding</p>
      {scan.suggestions.map((s, i) => (
        <Card
          key={s.id}
          className="vita-fade-in vita-suggestion-card"
          style={{
            padding: "12px 14px",
            marginBottom: 10,
            borderLeft: `3px solid ${colors.terracotta}`,
            opacity: s.status === "skipped" ? 0.5 : 1,
            animationDelay: `${i * 60}ms`,
          }}
        >
          <p style={{ ...type.caption, color: colors.terracottaText, fontWeight: 500, margin: "0 0 4px" }}>
            Why this helps
          </p>
          <p style={{ ...type.body, color: colors.muted, margin: "0 0 10px" }}>
            {s.reason}
          </p>

          <p style={{ ...type.caption, color: colors.terracottaText, fontWeight: 500, margin: "0 0 4px" }}>
            Proposed change
          </p>

          {editingSuggestionId === s.id ? (
            <div>
              <textarea
                className="vita-field"
                value={suggestionDraft}
                onChange={(e) => setSuggestionDraft(e.target.value)}
                rows={3}
                style={{ ...inputStyle, marginBottom: space.sm }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="sm" onClick={() => handleSuggestion(s.id, "accept", suggestionDraft)}>Save &amp; accept</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditingSuggestionId(null)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ background: colors.terracottaBg, borderRadius: 8, padding: "8px 10px", marginBottom: s.status === "pending" ? 10 : 0 }}>
                <p style={{ ...type.body, color: "#4A1B0C", margin: 0 }}>
                  {s.suggested_text}
                </p>
              </div>
              {s.status === "pending" && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <Button size="sm" onClick={() => handleSuggestion(s.id, "accept")}>Accept</Button>
                  <Button size="sm" variant="secondary" onClick={() => startEditSuggestion(s)}>Edit</Button>
                  <Button variant="ghost" onClick={() => handleSuggestion(s.id, "skip")}>Skip</Button>
                </div>
              )}
              {s.status !== "pending" && (
                <div className="vita-check-pop" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                  <span style={{ width: 16, height: 16, borderRadius: "50%", background: s.status === "accepted" ? colors.indigo : colors.faint, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#fff", fontSize: 10 }}>{s.status === "accepted" ? "✓" : "–"}</span>
                  </span>
                  <p style={{ ...type.caption, color: colors.faint, margin: 0 }}>{s.status === "accepted" ? "Accepted" : "Skipped"}</p>
                </div>
              )}
            </>
          )}
        </Card>
      ))}

      <Button onClick={() => setStep("confirmation")} style={{ marginTop: space.xs }}>
        Continue
      </Button>
    </div>
  );
}

function ScannerConfirmation({ scan, company, roleTitle, jobId, resumeId, onViewResume }) {
  const accepted = scan.suggestions.filter((s) => s.status === "accepted");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState("");

  const addToTracker = async () => {
    setAdding(true);
    setAddError("");
    try {
      await apiFetch("/applications", {
        method: "POST",
        body: JSON.stringify({ job_posting_id: jobId, resume_id: resumeId, status: "applied" }),
      });
      setAdded(true);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card elevation="surface" style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div className="vita-check-pop" style={{ width: 32, height: 32, borderRadius: "50%", background: colors.indigo, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: colors.cream, fontSize: 14 }}>✓</span>
        </div>
        <p style={{ ...type.heading, color: colors.indigo, margin: 0 }}>
          Your resume is updated
        </p>
      </div>
      <p style={{ ...type.caption, color: colors.faint, margin: "0 0 16px 42px" }}>
        {accepted.length} edit{accepted.length === 1 ? "" : "s"} applied for {company} · {roleTitle}.
      </p>

      {accepted.length > 0 && (
        <div style={{ background: colors.terracottaBg, borderRadius: 12, padding: "14px 16px", marginBottom: space.lg }}>
          <p style={{ ...type.bodyMedium, color: colors.terracottaText, margin: "0 0 10px" }}>
            What changed
          </p>
          {accepted.map((s) => (
            <p key={s.id} style={{ ...type.body, fontSize: 12, color: "#4A1B0C", margin: "0 0 6px" }}>
              • {s.reason}
            </p>
          ))}
        </div>
      )}

      <p style={{ ...type.caption, color: colors.faint, margin: "0 0 16px" }}>
        Want an updated match score? Run a new scan any time — it'll reflect these changes.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Button onClick={onViewResume}>View full resume</Button>
        {jobId && resumeId && (
          added ? (
            <span style={{ ...type.caption, color: colors.indigo }}>✓ Added to your tracker</span>
          ) : (
            <Button variant="secondary" onClick={addToTracker} disabled={adding}>
              {adding ? "Adding…" : "Add to tracker"}
            </Button>
          )
        )}
      </div>
      {addError && (
        <p style={{ ...type.caption, color: colors.terracottaText, margin: "8px 0 0" }}>{addError}</p>
      )}
    </Card>
  );
}

function ResumeEditor({ resumeDetail, status, editingBulletId, draftText, openReasonId, onStartEdit, onDraftChange, onSave, onToggleReason }) {
  if (status === "loading" || !resumeDetail) {
    return <EmptyState title="Loading your resume…" subtitle="Just a moment." />;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <p style={{ ...type.heading, color: colors.indigo, margin: 0 }}>
          {resumeDetail.label} resume
        </p>
        <span style={{ background: colors.lavenderBg, color: colors.indigoDeep, fontSize: 11, padding: "4px 10px", borderRadius: 20, fontFamily: "Inter, sans-serif" }}>
          Autosaved
        </span>
      </div>

      <Card elevation="surface" style={{ padding: "20px 22px" }}>
        {resumeDetail.sections.map((section) => (
          <div key={section.id} style={{ marginBottom: 18 }}>
            <p style={{ ...type.label, color: colors.indigo, margin: "0 0 8px" }}>
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
                        className="vita-field"
                        style={{ width: "100%", fontFamily: "Inter, sans-serif", fontSize: 13, padding: 8, borderRadius: 6, border: `1px solid ${colors.border}`, boxSizing: "border-box" }}
                      />
                      <Button size="sm" onClick={() => onSave(bullet.id)} style={{ marginTop: 4 }}>
                        Save
                      </Button>
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
                          className="vita-text-link"
                          onClick={(e) => { e.stopPropagation(); onToggleReason(bullet.id); }}
                          style={{ marginLeft: 8, fontSize: 11, color: colors.terracottaText, cursor: "pointer" }}
                        >
                          ⓘ
                        </span>
                      )}
                    </div>
                  )}
                  {wasEdited && openReasonId === bullet.id && (
                    <p style={{ ...type.caption, color: colors.faint, margin: "4px 0 0", fontStyle: "italic" }}>
                      {bullet.reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </Card>

      <p style={{ ...type.caption, color: colors.faint, margin: "12px 0 0" }}>
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
  const goal = data.user.weekly_goal || 1;
  const progress = data.weekly_progress;
  const goalPct = Math.min(100, Math.round((progress / goal) * 100));
  const goalMet = goalPct >= 100;
  const useSegments = goal <= 10; // beyond that, discrete segments get too thin to read

  // A single, quiet "what's next" line — derived entirely from data we
  // already have, never a fabricated suggestion. Priority order: an
  // imminent interview outranks everything else, then goal progress,
  // then unexplored matches. If none of these apply, nothing is shown —
  // manufacturing a nudge when there's genuinely nothing to say would
  // undercut the ones that matter.
  const nextInterview = data.upcoming.find((u) => u.type === "interview");
  let nextAction = null;
  if (nextInterview) {
    const hoursAway = (new Date(nextInterview.date) - new Date()) / 36e5;
    if (hoursAway <= 72) {
      nextAction = `Your interview with ${nextInterview.company} is coming up — might be worth a practice round.`;
    }
  }
  if (!nextAction && goalMet) {
    nextAction = "You've hit your goal this week — nice work. A saved match below could be next.";
  } else if (!nextAction && goal - progress === 1) {
    nextAction = "One more application this week and you'll hit your goal.";
  } else if (!nextAction && data.new_matches.length > 0) {
    nextAction = `You have ${data.new_matches.length} saved job${data.new_matches.length === 1 ? "" : "s"} waiting for a closer look.`;
  }

  return (
    <div>
      {/* ── Header: personal, hierarchy-forward ── */}
      <div style={{ background: colors.indigo, borderRadius: 16, padding: "1.5rem", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
          {data.user.avatar_url ? (
            <img
              src={data.user.avatar_url}
              alt=""
              className={data.user.current_streak > 0 ? "vita-avatar-pulse" : ""}
              style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : (
            <div
              className={data.user.current_streak > 0 ? "vita-avatar-pulse" : ""}
              style={{ width: 52, height: 52, borderRadius: "50%", background: colors.terracotta, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 500, color: "#4A1B0C", margin: 0 }}>
                {firstName.slice(0, 2).toUpperCase()}
              </p>
            </div>
          )}
          <div>
            <p style={{ ...type.display, fontSize: 24, color: colors.cream, margin: "0 0 6px" }}>
              Good to see you, {firstName}
            </p>
            {data.user.current_streak > 0 ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(242,233,228,0.14)", borderRadius: 20, padding: "3px 10px" }}>
                <span style={{ fontSize: 12 }}>🔥</span>
                <span style={{ ...type.caption, color: colors.cream }}>{data.user.current_streak}-day streak · you're on a roll</span>
              </span>
            ) : (
              <span style={{ ...type.caption, color: colors.lavender }}>Let's get your streak going</span>
            )}
          </div>
        </div>

        {/* ── Weekly goal: discrete segments so progress reads as "3 of 5 done" at a glance ── */}
        <div className={goalMet ? "vita-goal-met" : ""}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <p style={{ ...type.caption, color: colors.cream, margin: 0 }}>
              {goalMet ? "Weekly goal reached! 🎉" : `Weekly goal: ${goal} application${goal === 1 ? "" : "s"}`}
            </p>
            <p style={{ ...type.caption, fontWeight: 500, color: colors.cream, margin: 0 }}>
              {progress} / {goal}
            </p>
          </div>
          {useSegments ? (
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: goal }).map((_, i) => (
                <div
                  key={i}
                  className="vita-progress-fill"
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    background: i < progress ? (goalMet ? colors.terracotta : colors.lavender) : "rgba(242,233,228,0.18)",
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ background: "rgba(242,233,228,0.18)", borderRadius: 20, height: 8, overflow: "hidden" }}>
              <div className="vita-progress-fill" style={{ background: goalMet ? colors.terracotta : colors.lavender, height: "100%", width: `${goalPct}%`, borderRadius: 20 }} />
            </div>
          )}
        </div>
      </div>

      {/* ── What's next: a thin banner, not another card ── */}
      {nextAction && (
        <div className="vita-fade-in" style={{ background: colors.terracottaBg, borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>💡</span>
          <p style={{ ...type.caption, color: colors.terracottaText, margin: 0 }}>{nextAction}</p>
        </div>
      )}

      {/* ── Two-column body: real breakpoint, not flex-wrap ── */}
      <div className="vita-dashboard-grid">
        <div>
          {/* Coming up — flat list, not a card, since it's purely informational */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ ...type.label, color: colors.indigo, margin: "0 0 8px" }}>Coming up</p>
            {data.upcoming.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <span style={{ fontSize: 14, opacity: 0.6 }}>🗓️</span>
                <p style={{ ...type.caption, color: colors.faint, margin: 0 }}>
                  Nothing on the calendar — interviews and deadlines will show up here.
                </p>
              </div>
            ) : (
              <div>
                {data.upcoming.map((item, i) => (
                  <div key={i} className="vita-list-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <p style={{ ...type.body, color: colors.ink, margin: 0 }}>
                      {item.type === "interview" ? "Interview" : "Deadline"} · {item.company}
                    </p>
                    <p style={{ ...type.caption, color: colors.faint, margin: 0, whiteSpace: "nowrap" }}>
                      {new Date(item.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity — same flat-list treatment, lower visual weight than Coming up via smaller label */}
          <div>
            <p style={{ ...type.label, color: colors.muted, margin: "0 0 8px" }}>Recent activity</p>
            {data.recent_activity.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <span style={{ fontSize: 14, opacity: 0.6 }}>〰️</span>
                <p style={{ ...type.caption, color: colors.faint, margin: 0 }}>
                  Nothing yet — your activity will start showing up as you go.
                </p>
              </div>
            ) : (
              <div>
                {data.recent_activity.map((a, i) => {
                  const dotColor = { application: colors.lavender, resume: colors.terracotta, suggestion: colors.terracotta, interview: colors.indigo }[a.type] || colors.lavender;
                  return (
                    <div key={i} className="vita-list-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, display: "inline-block", flexShrink: 0 }} />
                      <p style={{ ...type.caption, color: colors.muted, margin: 0 }}>
                        {a.type === "application" ? "Applied to " : ""}{a.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* New matches — the one section that gets raised-card treatment, since these are the most actionable/inviting items on the page */}
        <div>
          <p style={{ ...type.label, color: colors.indigo, margin: "0 0 8px" }}>New matches</p>
          {data.new_matches.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <span style={{ fontSize: 14, opacity: 0.6 }}>✨</span>
              <p style={{ ...type.caption, color: colors.faint, margin: 0 }}>
                No saved matches yet — jobs you save will land here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.new_matches.map((m, i) => (
                <Card key={m.id} style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: i % 2 === 0 ? colors.lavenderBg : colors.terracottaBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ ...type.caption, fontWeight: 600, color: i % 2 === 0 ? colors.indigoDeep : colors.terracottaText, margin: 0 }}>
                      {m.company.slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ ...type.caption, fontWeight: 500, color: colors.ink, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.role_title}
                    </p>
                    <p style={{ ...type.caption, color: colors.faint, margin: 0 }}>{m.company}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
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

        <select value={selectedAppId} onChange={(e) => setSelectedAppId(e.target.value)} className="vita-field" style={inputStyle}>
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

        <button className="vita-btn"
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
            className="vita-fade-in"
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
          className="vita-field" style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
        />
        <button className="vita-btn"
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
      <style>{globalStyles}</style>
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
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="vita-field" style={inputStyle} />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="vita-field" style={inputStyle} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="vita-field" style={inputStyle} />

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

// Paste raw resume text or upload a PDF/DOCX/TXT file — VITA reads it
// and structures it into sections/bullets automatically, rather than
// making the person rebuild their resume by hand line by line.
function ParseResumeForm({ onCreated, onCancel }) {
  const [label, setLabel] = useState("");
  const [mode, setMode] = useState("paste"); // paste | upload
  const [pastedText, setPastedText] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | parsing | error
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async () => {
    setErrorMsg("");
    if (!label.trim()) {
      setErrorMsg("Give this resume a name first.");
      return;
    }
    if (mode === "paste" && !pastedText.trim()) {
      setErrorMsg("Paste your resume text first.");
      return;
    }
    if (mode === "upload" && !file) {
      setErrorMsg("Choose a file first.");
      return;
    }

    setStatus("parsing");
    try {
      let body;
      if (mode === "upload") {
        const formData = new FormData();
        formData.append("label", label.trim());
        formData.append("file", file);
        body = formData;
      } else {
        body = JSON.stringify({ label: label.trim(), text: pastedText.trim() });
      }
      await apiFetch("/resumes/parse", { method: "POST", body });
      onCreated();
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("idle");
    }
  };

  if (status === "parsing") {
    return (
      <Card elevation="surface" style={{ padding: "36px 26px", textAlign: "center" }}>
        <p className="vita-breathe" style={{ ...type.heading, color: colors.indigo, margin: "0 0 6px" }}>
          Reading your resume…
        </p>
        <p style={{ ...type.caption, color: colors.faint, margin: 0 }}>
          Sorting it into sections VITA can work with.
        </p>
      </Card>
    );
  }

  return (
    <Card elevation="surface" style={{ padding: "20px 22px" }}>
      <p style={{ ...type.heading, color: colors.indigo, margin: "0 0 4px" }}>
        Add from an existing resume
      </p>
      <p style={{ ...type.caption, color: colors.faint, margin: "0 0 16px" }}>
        Paste the text or upload a file — VITA will sort it into sections for you.
      </p>

      <FormField label="Resume name">
        <input
          className="vita-field"
          style={inputStyle}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Product Design"
        />
      </FormField>

      <div style={{ display: "flex", gap: space.sm, marginBottom: space.md }}>
        {[{ key: "paste", label: "Paste text" }, { key: "upload", label: "Upload file" }].map((m) => (
          <button
            key={m.key}
            className="vita-tab-btn"
            onClick={() => setMode(m.key)}
            style={{
              background: mode === m.key ? colors.indigo : "#fff",
              color: mode === m.key ? colors.cream : colors.muted,
              border: mode === m.key ? "none" : `1px solid ${colors.border}`,
              borderRadius: 20,
              padding: "6px 14px",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "paste" ? (
        <textarea
          className="vita-field"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
          placeholder="Paste your resume text here…"
          rows={9}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      ) : (
        <div style={{ marginBottom: space.md }}>
          <input
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: colors.muted }}
          />
          <p style={{ ...type.caption, color: colors.faint, margin: "6px 0 0" }}>
            PDF, DOCX, or TXT — up to 5MB.
          </p>
        </div>
      )}

      {errorMsg && (
        <p style={{ ...type.caption, color: colors.terracottaText, margin: "0 0 10px" }}>
          {errorMsg}
        </p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <Button onClick={submit}>Parse &amp; create</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}

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
        className="vita-field" style={inputStyle}
      />

      {sections.map((section, sIdx) => (
        <div key={sIdx} style={{ background: colors.cream, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <select
              value={section.type}
              onChange={(e) => updateSectionType(sIdx, e.target.value)}
              className="vita-field" style={{ ...inputStyle, marginBottom: 0, width: "auto", padding: "6px 10px", fontSize: 12 }}
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
                className="vita-field" style={{ ...inputStyle, marginBottom: 0, flex: 1, background: "#fff" }}
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
        <button className="vita-btn"
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
  const [formMode, setFormMode] = useState(null); // null | "choose" | "manual" | "parse"
  const [editingId, setEditingId] = useState(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [resumeDetail, setResumeDetail] = useState(null);
  const [resumeDetailStatus, setResumeDetailStatus] = useState("idle");
  const [editingBulletId, setEditingBulletId] = useState(null);
  const [draftBulletText, setDraftBulletText] = useState("");
  const [openReasonId, setOpenReasonId] = useState(null);

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

  const openResume = async (id) => {
    setViewingId(id);
    setResumeDetailStatus("loading");
    try {
      const data = await apiFetch(`/resumes/${id}`);
      setResumeDetail(data);
      setResumeDetailStatus("ready");
    } catch (err) {
      setResumeDetailStatus("error");
    }
  };

  const saveBulletEdit = async (bulletId) => {
    await apiFetch(`/resumes/bullets/${bulletId}`, {
      method: "PATCH",
      body: JSON.stringify({ content: draftBulletText }),
    });
    setEditingBulletId(null);
    openResume(viewingId);
  };

  if (formMode === "choose") {
    return (
      <Card elevation="surface" style={{ padding: "20px 22px" }}>
        <p style={{ ...type.heading, color: colors.indigo, margin: "0 0 4px" }}>
          New resume
        </p>
        <p style={{ ...type.caption, color: colors.faint, margin: "0 0 18px" }}>
          Start from an existing resume, or build one from scratch.
        </p>
        <div style={{ display: "flex", gap: space.md, flexWrap: "wrap", marginBottom: space.md }}>
          <div
            className="vita-card vita-resume-option"
            onClick={() => setFormMode("parse")}
            style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", flex: 1, minWidth: 200 }}
          >
            <p style={{ ...type.bodyMedium, color: colors.ink, margin: "0 0 4px" }}>Paste or upload</p>
            <p style={{ ...type.caption, color: colors.faint, margin: 0 }}>
              Have a resume already? VITA will read it and sort it into sections.
            </p>
          </div>
          <div
            className="vita-card vita-resume-option"
            onClick={() => setFormMode("manual")}
            style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", flex: 1, minWidth: 200 }}
          >
            <p style={{ ...type.bodyMedium, color: colors.ink, margin: "0 0 4px" }}>Build from scratch</p>
            <p style={{ ...type.caption, color: colors.faint, margin: 0 }}>
              Add sections and lines yourself, one at a time.
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setFormMode(null)}>Cancel</Button>
      </Card>
    );
  }

  if (formMode === "parse") {
    return (
      <ParseResumeForm
        onCreated={() => { setFormMode(null); load(); }}
        onCancel={() => setFormMode(null)}
      />
    );
  }

  if (formMode === "manual") {
    return (
      <CreateResumeForm
        onCreated={() => { setFormMode(null); load(); }}
        onCancel={() => setFormMode(null)}
      />
    );
  }

  if (viewingId) {
    return (
      <div>
        <TextLink tone="muted" onClick={() => { setViewingId(null); setResumeDetail(null); }}>← Back to resumes</TextLink>
        <div style={{ marginTop: 10 }}>
          <ResumeEditor
            resumeDetail={resumeDetail}
            status={resumeDetailStatus}
            editingBulletId={editingBulletId}
            draftText={draftBulletText}
            openReasonId={openReasonId}
            onStartEdit={(bullet) => { setEditingBulletId(bullet.id); setDraftBulletText(bullet.content); }}
            onDraftChange={setDraftBulletText}
            onSave={saveBulletEdit}
            onToggleReason={(id) => setOpenReasonId((prev) => (prev === id ? null : id))}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Your resumes" actionLabel="+ New resume" onAction={() => setFormMode("choose")} />

      {status === "loading" || status === "idle" ? (
        <EmptyState title="Loading…" subtitle="Just a moment." />
      ) : status === "error" ? (
        <EmptyState title="Couldn't reach the server" subtitle={errorMsg} />
      ) : resumes.length === 0 ? (
        <EmptyState title="No resumes yet" subtitle="Create one to start scanning it against job postings." />
      ) : (
        <div className="vita-grid">
          {resumes.map((r) => (
            <div
              key={r.id}
              className="vita-card"
              onClick={() => editingId !== r.id && openResume(r.id)}
              style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", cursor: editingId === r.id ? "default" : "pointer" }}
            >
              {editingId === r.id ? (
                <div style={{ marginBottom: 4 }} onClick={(e) => e.stopPropagation()}>
                  <input
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveRename(r.id)}
                    autoFocus
                    className="vita-field" style={{ ...inputStyle, marginBottom: 6, fontSize: 13, padding: "6px 10px" }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className="vita-text-link" onClick={() => saveRename(r.id)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.indigo, cursor: "pointer" }}>Save</span>
                    <span className="vita-text-link" onClick={() => setEditingId(null)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, cursor: "pointer" }}>Cancel</span>
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
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.terracottaText }}>Delete this resume?</span>
                    <span className="vita-text-link" onClick={() => confirmDelete(r.id)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.terracottaText, fontWeight: 500, cursor: "pointer" }}>Yes</span>
                    <span className="vita-text-link" onClick={() => setConfirmDeleteId(null)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, cursor: "pointer" }}>Cancel</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 10 }} onClick={(e) => e.stopPropagation()}>
                    <span className="vita-text-link" onClick={() => startRename(r)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.indigo, cursor: "pointer" }}>Rename</span>
                    <span className="vita-text-link" onClick={() => setConfirmDeleteId(r.id)} style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, cursor: "pointer" }}>Delete</span>
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
      <style>{globalStyles}</style>

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
      <input value={name} onChange={(e) => setName(e.target.value)} className="vita-field" style={inputStyle} />

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 500, color: colors.muted, margin: "0 0 6px" }}>
        Weekly application goal
      </p>
      <input
        type="number"
        min={1}
        value={weeklyGoal}
        onChange={(e) => setWeeklyGoal(e.target.value)}
        className="vita-field" style={inputStyle}
      />

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, fontWeight: 500, color: colors.muted, margin: "0 0 6px" }}>
        Avatar image URL
      </p>
      <input
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        placeholder="https://... (optional — we'll use your initials otherwise)"
        className="vita-field" style={inputStyle}
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

      <button className="vita-btn"
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
    <div style={{ background: colors.cream, minHeight: 500, padding: space.lg, borderRadius: 16 }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Fraunces:wght@500&display=swap" rel="stylesheet" />
      <style>{globalStyles}</style>

      <div style={{ maxWidth: contentMaxWidth, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: space.lg }}>
          <p style={{ ...type.heading, fontSize: 22, color: colors.indigo, margin: 0 }}>
            Vita
          </p>
          {/* Account cluster: name, Settings, and Log out grouped together and
              visually distinct from the core-tool tabs below — Settings is an
              account-level action, not a daily tool, so it doesn't compete
              with Dashboard/Scanner/Tracker for attention. */}
          <div style={{ display: "flex", alignItems: "center", gap: space.md }}>
            <span style={{ ...type.caption, color: colors.muted }}>{user.name}</span>
            <TextLink tone="muted" onClick={() => setTab("settings")}>Settings</TextLink>
            <button
              onClick={logout}
              style={{ background: "transparent", border: `1px solid ${colors.border}`, borderRadius: 20, padding: "4px 12px", fontFamily: "Inter, sans-serif", fontSize: 11, color: colors.faint, cursor: "pointer" }}
            >
              Log out
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: space.sm, marginBottom: space.lg, flexWrap: "wrap" }}>
          {[
            { key: "dashboard", label: "Dashboard" },
            { key: "resumes", label: "Resumes" },
            { key: "scanner", label: "Scanner" },
            { key: "tracker", label: "Tracker" },
            { key: "chat", label: "Interview Prep" },
            { key: "portfolio", label: "Portfolio" },
          ].map((t) => (
            <button
              key={t.key}
              className="vita-tab-btn"
              onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? colors.indigo : "#fff",
                color: tab === t.key ? colors.cream : colors.muted,
                border: tab === t.key ? "none" : `1px solid ${colors.border}`,
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

        <div key={tab} className="vita-fade-in">
          {tab === "dashboard" && <Dashboard />}
          {tab === "resumes" && <Resumes />}
          {tab === "scanner" && <Scanner onNavigateToResumes={() => setTab("resumes")} />}
          {tab === "tracker" && <Tracker />}
          {tab === "chat" && <InterviewChat />}
          {tab === "portfolio" && <Portfolio />}
          {tab === "settings" && <Settings user={user} onUpdated={setUser} />}
        </div>
      </div>
    </div>
  );
}

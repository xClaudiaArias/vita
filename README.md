# VITA

A personal job-search companion — resume tailoring, application tracking, interview prep, and a portfolio, wrapped in one calm, encouraging tool. Built as a full-stack learning project: Node/Express/PostgreSQL backend, React/Vite frontend, real AI integration via the Anthropic API.

VITA is built around one core loop:

```
🔎 Find a job → Scan the posting → Improve resume → Apply → Track application → Prepare for interview
```

---

## Features

- **Resume Scanner** — paste a job posting (link and/or description), VITA auto-detects the company and role, compares it against a chosen resume via Claude, and returns a match score with specific, editable suggestions. Accepted suggestions actually rewrite the resume.
- **Resumes** — create resumes manually, or paste/upload an existing one (PDF, DOCX, TXT) and have VITA parse it into structured sections automatically. Every resume is click-to-edit, line by line.
- **Dashboard** — a home base: streak, weekly goal progress, upcoming interviews/deadlines, saved matches, and a recent-activity feed.
- **Tracker** — every application, its status, and its match score in one place.
- **Interview Prep** — a chat-based practice partner that asks realistic questions and gives encouraging, specific feedback.
- **Portfolio** — a shareable page for showcasing projects.
- **Auth** — real accounts: hashed passwords, JWT sessions, and per-user data isolation on every route.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| AI | Anthropic API (Claude) — resume scanning, resume parsing, interview chat |
| File parsing | `multer` (uploads), `pdf-parse` (PDF), `mammoth` (DOCX) |

No CSS framework — a small hand-rolled design system (tokens + a handful of reusable components) lives directly in `App.jsx`.

## Project structure

```
vita-backend/
├── migrations/           # SQL migrations, run in order
├── src/
│   ├── db.js              # Postgres connection pool
│   ├── index.js            # Express app entry point, route mounting
│   ├── middleware/
│   │   └── auth.js         # JWT verification, attaches req.userId
│   └── routes/
│       ├── auth.js         # signup, login, /me, settings
│       ├── resumes.js      # CRUD + AI parsing
│       ├── jobPostings.js  # create/fetch + AI company/role extraction
│       ├── scans.js        # AI resume-vs-posting comparison, suggestions
│       ├── applications.js # tracker CRUD
│       ├── projects.js     # portfolio CRUD
│       ├── interviewSessions.js
│       └── dashboard.js    # aggregated dashboard data
└── package.json

vita-frontend/
├── index.html
├── src/
│   ├── main.jsx
│   └── App.jsx            # entire frontend — all components, design tokens, styles
└── package.json
```

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com)) for the AI-powered features

### Backend setup

```bash
cd vita-backend
npm install
```

Create your database and run the migrations in order:

```bash
createdb vita
psql vita < migrations/001_init.sql
psql vita < migrations/002_scan_suggestions_bullet_link.sql
```

Create `.env` in `vita-backend/`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/vita
PORT=4000
JWT_SECRET=some-long-random-string-only-you-know
ANTHROPIC_API_KEY=sk-ant-...
```

Start the server:

```bash
npm run dev
```

Confirm it's running: `curl http://localhost:4000/health` should return `{"status":"ok"}`, and `curl http://localhost:4000/health/db` confirms the database connection.

### Frontend setup

```bash
cd vita-frontend
npm install
npm run dev
```

Opens at `http://localhost:5173` by default. Both the frontend and backend need to be running simultaneously — the frontend calls `http://localhost:4000` directly.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | Postgres connection string |
| `PORT` | backend | API server port (default 4000) |
| `JWT_SECRET` | backend | Signs and verifies auth tokens — keep this secret and random |
| `ANTHROPIC_API_KEY` | backend | Powers resume scanning, resume parsing, job extraction, and interview chat |

Never commit `.env` — it's already covered by `.gitignore`.

## Database schema (overview)

| Table | Purpose |
|---|---|
| `users` | account info, weekly goal, streak |
| `resumes` → `resume_sections` → `resume_bullets` | structured resume content (not a flat file — this is what makes line-by-line editing possible) |
| `job_postings` | scanned job postings |
| `scans` → `scan_suggestions` | a resume/posting comparison and its AI-generated suggestions |
| `applications` | the tracker — links a posting + resume + status + dates |
| `interview_sessions` → `interview_messages` | chat history for interview practice |
| `projects` | portfolio items |

Full definitions live in `vita-backend/migrations/001_init.sql`.

## API overview

All routes except `/auth/*` and `/health*` require `Authorization: Bearer <token>`.

| Route | Purpose |
|---|---|
| `POST /auth/signup`, `/login`, `GET /auth/me`, `PATCH /auth/me` | account creation, login, settings |
| `GET/POST/PATCH/DELETE /resumes`, `POST /resumes/parse` | resume CRUD + AI parsing from text/file |
| `POST /job-postings`, `POST /job-postings/extract` | store a posting, AI-extract company/role from text |
| `POST /scans`, `PATCH /scans/suggestions/:id` | run a scan, accept/skip/edit a suggestion |
| `GET/POST/PATCH /applications` | the tracker |
| `GET/POST/PATCH/DELETE /projects` | the portfolio |
| `POST /interview-sessions`, `POST /interview-sessions/:id/messages` | interview chat |
| `GET /dashboard` | aggregated dashboard data |

## Design system

| Token | Value |
|---|---|
| Cream (background) | `#F2E9E4` |
| Indigo (primary) | `#0F0080` |
| Lavender (secondary) | `#B5B4D9` |
| Terracotta (accent) | `#E8845C` |
| Display/heading font | Fraunces |
| Body/UI font | Inter |

Tone: calm, encouraging, never clinical — gaps are framed as opportunities, closed applications fade quietly rather than flashing red, and empty states always suggest a next step where one exists.

## Known limitations

- Runs locally only — not yet deployed anywhere
- No password reset flow
- Avatar is a pasted image URL, not a real upload
- "New matches" on the dashboard means saved-but-not-applied postings, not an automated job search — there's no job-board integration
- No automated tests yet

## License

Personal project — no license specified.
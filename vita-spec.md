# VITA — Product Spec

A personal job-search companion. Where Simplify and Jobright.ai feel like clinical dashboards, VITA aims to feel like a calm, encouraging companion through the job hunt — same core tools (resume tailoring, application tracking, interview prep, portfolio), warmer delivery.

---

## 1. Brand & design system

**Name:** VITA

**Tone:** Calm personal companion. Warm, encouraging, plain language. Leads with what's working before naming gaps. Frames setbacks softly ("Not this time" instead of "Rejected"). Never guilt-driven (streaks celebrate momentum, not punish gaps).

**Colors**

| Role | Hex | Notes |
|---|---|---|
| Base / cream | `#F2E9E4` | Primary background, warm and soft |
| Primary / indigo | `#0F0080` | Buttons, links, active states, headers |
| Secondary / lavender | `#B5B4D9` | Supporting accents, calm badges |
| Accent / terracotta | `#E8845C` | Highlights, "what changed" markers, celebratory moments — replaced an original red-orange (`#F03A22`) which read as alarm/error rather than warmth |

Reserve true red only for genuine error/warning states (e.g. failed save) — not for job rejections or negative-feeling states.

**Typography**

- **Fraunces** (serif) — wordmark, screen headers, moments that need personality/warmth
- **Inter** (sans) — all UI text, body copy, buttons, labels

**UI patterns established across mockups**

- Soft rounded cards (12px radius), white surfaces on cream background
- Status/info shown as colored pill badges, never harsh red/green traffic lights
- Edited or newly-added content gets a terracotta-tinted highlight
- "Closed" or inactive items (e.g. past applications) are visually dimmed (reduced opacity across the whole row) rather than marked with a stark rejection color

---

## 2. Core data model

- **User** — profile info (name, photo, bio, links), streak/goal settings, auth credentials
- **Resume** — versioned and structured (sections + bullets, not a flat blob/PDF), so individual lines can be edited and linked to specific edits. Each version has a user-assigned label (e.g. "Product Design") rather than a filename.
- **JobPosting** — raw source (URL or pasted text), parsed requirements/keywords
- **Scan** — a comparison between one Resume version and one JobPosting: match score, "already strong" points, gap list, suggested edits (each with accept/edit/skip state)
- **Application** — links a JobPosting + Resume version + status (Saved / Applied / Interviewing / Closed) + key dates (applied date, deadlines, interview dates) + notes. This is the central connective entity — dashboard, tracker, and chatbot all read from it.
- **InterviewSession** — chatbot conversation log, optionally tied to an Application for context
- **Project** — portfolio items: title, description, thumbnail, tags, external link, tied to User

---

## 3. Screens & feature specs

### 3.1 Resume Scanner (hero feature)

**Flow:** Job input → Scan results → Accept/edit suggestions → Confirmation → Editable resume

- **Job input:** paste a URL or raw job text; pick a resume from named cards (not filenames); inline "add resume" option for first-time users
- **Scan results:** leads with a soft headline ("Nice fit, with room to shine") before the numeric score; "Already strong" section shown before gaps; gaps framed as "worth adding," each with a specific rewrite suggestion and Accept / Edit / Skip actions
- **Confirmation:** shows match score before → after, a short plain-language change log, options to view full resume or export PDF
- **Resume editor:** hybrid view — reads like a real document (not a form), but every line is click-to-edit. Recently changed lines get a terracotta highlight with a small clue icon; hovering/tapping reveals a one-line reason why that edit was suggested (e.g. "Added because this posting mentions '0-to-1' twice"). Requires resumes to be stored as structured content, not flat text/PDF, to support this.

### 3.2 Dashboard (home base)

- Warm greeting header (indigo background) with streak framed positively ("4-day streak · you're on a roll"), weekly goal progress bar, and a personal profile block (avatar/initials + name + "View profile" link into the portfolio)
- "Coming up" card — interview dates, application deadlines
- "New matches" card — newly found postings with match scores
- "Recent activity" — a short, quiet feed (not a full log)
- No separate notification inbox — notifications are folded into the above sections rather than presented as a badge/alert system

### 3.3 Application Tracker

- Spreadsheet-like list, softened: rounded card rows instead of a dense grid
- Status shown as colored pills: Saved (neutral), Applied (lavender), Interviewing (terracotta), Not this time (muted gray, entire row dimmed to ~50% opacity so closed applications visually recede)
- Filter pills at the top (All / Active / Interviewing / Closed) instead of multi-column spreadsheet filters
- Each row shows company, role, status, match score, and next relevant date
- Rows are click-to-expand for a detail view (notes, status timeline, linked resume version, shortcut into interview prep for that specific application)

### 3.4 Interview Prep Chatbot

- Opens already contextualized to a specific Application (job + interview date), launchable directly from a tracker row
- Feedback pattern matches the scanner: affirm what worked first, then one specific, actionable note
- Quick-reply chips for common actions (Try again / Next question) plus an explicit low-pressure option: "I'm nervous, help me prep differently" — this should meaningfully change the bot's approach (pacing, difficulty, tone), not just offer generic reassurance
- Terracotta message-bubble icon (not a robot icon) to keep the "companion" feeling

### 3.5 Portfolio / Public Profile

- Public-facing page, shareable outside the app
- Header: photo/avatar, name, role, short personal bio (not just a title), social/site links as soft pills
- Project grid: thumbnail, title, one-line impact statement, skill tags; tapping opens a fuller project detail (not designed yet)
- Reachable from the dashboard's profile block

---

## 4. Suggested build order

1. **Auth + core data model** — User, Resume, JobPosting foundation
2. **Resume Scanner** — end-to-end hero feature first
3. **Application Tracker** — mostly CRUD once Application entity exists
4. **Dashboard** — pulls from Tracker/Scanner data, so comes after they're populated
5. **Portfolio** — independent, can slot in anytime as a lower-risk build
6. **Interview Chatbot** — last, benefits from real Application context to feel personalized

## 5. Open decisions for later

- Project detail view (full case study layout) not yet designed
- Notification delivery mechanism (in-app only vs. email/push) not yet decided
- Exact LLM prompting strategy for scan suggestions and chatbot tone not yet specified
- Auth provider / hosting stack not yet chosen

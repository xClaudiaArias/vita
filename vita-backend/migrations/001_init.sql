-- VITA database schema
-- Run this once against a fresh database to create all tables.

-- Turns on UUID generation (uuid_generate_v4()) — nicer than auto-increment
-- ints for public-facing IDs (e.g. portfolio URLs) since they aren't guessable.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  weekly_goal INT DEFAULT 5,          -- e.g. "5 applications a week"
  current_streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- RESUMES (versioned, structured — not a flat file)
-- ─────────────────────────────────────────
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,                -- e.g. "Product Design", not a filename
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Each resume is made of sections (Summary, Experience, Skills...)
CREATE TABLE resume_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                 -- 'summary' | 'experience' | 'skills' | 'education'
  sort_order INT NOT NULL DEFAULT 0
);

-- Each section is made of lines/bullets — this is what makes lines individually editable
CREATE TABLE resume_bullets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES resume_sections(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  last_edited_reason TEXT,            -- powers the "why was this changed" clue icon
  last_edited_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────
-- JOB POSTINGS
-- ─────────────────────────────────────────
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company TEXT NOT NULL,
  role_title TEXT NOT NULL,
  source_url TEXT,
  raw_description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- SCANS (a resume-vs-posting comparison)
-- ─────────────────────────────────────────
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  match_score INT,                    -- 0-100
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE scan_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  suggested_text TEXT NOT NULL,
  reason TEXT,                        -- "they mention '0-to-1' twice"
  status TEXT NOT NULL DEFAULT 'pending' -- 'pending' | 'accepted' | 'skipped'
);

-- ─────────────────────────────────────────
-- APPLICATIONS (the connective tissue of the whole app)
-- ─────────────────────────────────────────
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'saved', -- 'saved' | 'applied' | 'interviewing' | 'closed'
  applied_at TIMESTAMPTZ,
  interview_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- INTERVIEW PREP CHAT
-- ─────────────────────────────────────────
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE interview_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,               -- 'user' | 'vita'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- PORTFOLIO
-- ─────────────────────────────────────────
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  link_url TEXT,
  tags TEXT[],                        -- Postgres array type — no join table needed for simple tags
  sort_order INT DEFAULT 0
);

-- Helpful indexes for the queries the dashboard/tracker will run constantly
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_resumes_user ON resumes(user_id);

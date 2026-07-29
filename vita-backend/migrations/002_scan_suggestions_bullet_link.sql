-- Links a suggestion to the specific bullet it would replace.
-- NULL means the suggestion proposes a brand new bullet, not an edit to an existing one.
ALTER TABLE scan_suggestions
  ADD COLUMN bullet_id UUID REFERENCES resume_bullets(id) ON DELETE SET NULL,
  ADD COLUMN section_type TEXT; -- needed when bullet_id is null, to know which section a new bullet belongs to

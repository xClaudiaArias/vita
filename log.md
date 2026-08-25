# MVP STATUS

- [x] Landing page + nav
- [x] Auth (signup/login, JWT, per-user data isolation)
- [x] Resumes — create, list, rename, delete, scan
- [x] Resume Scanner — complete flow, live AI
- [x] Dashboard — real data, animated goal bar, richer activity feed
- [x] Tracker — create, list, live status updates
- [x] Portfolio — create, edit, delete, real thumbnails and links
- [x] Interview Chatbot — complete, live AI
- [x] Settings — name, weekly goal, avatar
- [x] Motion pass — hover states, fades, progress animation

---

## What is next?

**Vita 1.1.0:**

- [ ] valid emails
- [ ] easier sign up
- [ ] parse resume
- [ ] scan jobs
- [ ] restructure VITA to be calm productivity app + editorial portfolio + personal career journal
- [ ] *too much manual data entry*
- [ ] resume page needs WAY more personality -> could be pdf preview

## update visuals

- large typography
- intentional whitespace
- asymmetric layouts
- small pieces of visual personality
- subtle illustrations
- meaningful empty states
- little moments of motion
- stronger section hierarchy
- cards that actually do different things
- hand-drawn illustrations
  - tiny flower
  - little star
  - paper/document illustrations
  - hand-drawn arrows
  - subtle organic shapes
  - little terracotta accents
  - abstract career-growth illustrations

## Animate meaningful actions

For example:
Accept suggestion
    *The suggestion slides away.*
    **The resume line becomes highlighted.**
A tiny:
    *✓ Added to your resume*
Then:
    *78% → 84% animates.*

There isn't enough hierarchy.

---

## LATER

### Organizing user flow

**Your job search**
Instead of "Recent activity."
**Maybe**:
> A little recap
And show 3–4 meaningful things.
**Not**:
Updated Test2 resume
**bu**t:
You tailored your Product Design resume
for Rogo.

**VITA should constantly answer**:
> What should I do next?

Imagine the dashboard opening and saying:
> You're all caught up. 
> Your next interview is Thursday at 2:00 PM.
Or:
> You've got one thing worth checking out.
> Your Product Design resume is a strong match for a new role.
Or:
> Want to make some progress?
> You haven't applied anywhere this week. Browse your saved jobs or scan a new posting.

## The scanner should become the beginning of the entire workflow

### user flow

**Step 1**
Paste job URL.
    *VITA fetches/parses the job.*
Then:
    *Looks like a Product Designer role at Rogo.*
    `Product Design
    New York / Remote
    Full-time`
Then:
    *Choose resume*
    → Product Design
Then:
    *Scan*
    *VITA generates the analysis.*

Then after the user accepts changes:
    *Ready to apply?*
Add to tracker →
    *And VITA automatically creates:*

    ```
        { 
        "Company": "Rogo",
        "Role": "Product Designer",
        "Resume: "Product Design",
        "Status: "Saved",
        "Match": "87%",
        "Job URL": "..."
    }
    ```

The user shouldn't have to enter that again

---

VITA should handle:
> Job → company → role → description → keywords → resume → scan → tracker

Before scanning
Huge:
What are you applying to?
Drop a job posting here and I'll help you figure out where you stand.
Then:
Paste a job link
or
Paste job description
And perhaps a visually interesting upload/drop area.
Then:
*Your resume*
Show actual resume cards rather than a `<select>`.
And after scanning...
Before scanning
Huge:
What are you applying to?
Drop a job posting here and I'll help you figure out where you stand.
Then:
Paste a job link
or
Paste job description
And perhaps a visually interesting upload/drop area.
Then:
Your resume
Show actual resume cards rather than a `<select>`.
And after scanning...
This is where VITA can shine.
[Accept] [Edit] [Skip]

**note to ask for user flow:**

- What happens when I hover?
- What happens when I click?
- What happens when there's nothing here?
- What happens after I complete something?
- What happens when something changes?
- What happens if something goes wrong?
- What happens when I return tomorrow?

 ---

## Empty states are currently a HUGE opportunity

Instead of:
    Nothing on the horizon.
    Give VITA personality.
For example:
    Coming up
    *Nothing scheduled yet.*
    **Your calendar is quiet for now. That's okay.**
    Browse applications →
    [New matches]
    [No saved matches yet.]
    *When you find something promising, we'll keep it here.*

Scan a job →
    Empty portfolio
Instead of a blank page:
    > *Show people what you can build.*
    *Your projects don't have to be perfect. Start with one.*
    Add your first project →

---

## lightweight job-search insights

Not a giant analytics dashboard.
Just little insights generated from existing data.

### For example

- You've applied to 8 product roles this month.
- Your Product Design resume is your most successful version.
- Your average match score is 82%.
- You've got 2 interviews coming up.

---

## PASSES

### PASS 1 — Visual foundation

Don't touch functionality.

**Establish:**
    spacing system
    typography hierarchy
    card hierarchy
    button hierarchy
    shadows/borders
    hover states
    page widths
    responsive behavior
    navigation
    empty states
    consistent component styles
**Goal:**
    Make the existing app look intentionally designed.

### PASS 2 — Dashboard redesign

**We'll redesign:**
    greeting
    goal
    streak
    upcoming
    matches
    activity
    empty states
**next-action suggestions**
    small progress/insight moments
**Goal:**
    When I open VITA, I immediately understand what matters.

### PASS 3 — Resume experience

**Redesign:**

- resume cards
- resume preview
- resume editor

**Version metadata:**
> empty state -> creation flow -> -> Then reduce manual entry wherever possible.

### PASS 4 — Scanner experience

This is the hero redesign.

Improve:
> Job URL → parsing → resume selection → scanning → results → changes → tracker
    And we make it feel like one cohesive journey

### PASS 5 — Tracker

Make the tracker feel less like a spreadsheet.
> application cards + timeline + next action
instead of:
database rows
For example:
> Rogo
    Product Designer
    Interviewing
    87% match
    Next: Interview Thursday
    That feels much more useful

### PASS 6 — Portfolio

This should probably be your prettiest screen.
Because it's public-facing.

**Things to improve and flex:**

- typography
- layout
- artwork
- project imagery
- interactions
- responsive design

### PASS 7 — Automation / reduced manual work

Only after the visual redesign.

**Prioritize:**

High value:
> Job URL parsing -> Automatic company/role extraction -> Automatically create tracker entry after scan -> Automatically associate resume -> Reuse profile information -> Generate application metadata

**Later Potentially:**

- browser extension/bookmarklet
- job-board import
- email integration
- calendar integration
- application deadline extraction


# Tiny Task Dashboard - Prioritized Tasks

1. Add task completion (mark tasks done) — backend + frontend checkbox, show completed tasks visually and sort them last. — DONE
2. Add due dates and sort/filter by due date. — DONE
   - Frontend: date inputs on create & edit, due date display, overdue highlight, filters (Due soon/Overdue/No due).
   - Backend: accepts dueDate, now migrated to SQLite storage.
   - Commits: a0142c7 (frontend due-date inputs), 03ffc83 (marked DONE and notes).
3. Add tags and simple filtering UI. — TODO
4. Improve edit flow (inline save/cancel, validation). — PARTIAL (existing edit flow present; can polish)
5. Add search box to filter tasks client-side. — DONE (search + highlighting + "/" focus)
6. Organize project structure: move CSS to public/css, front-end JS to public/js, and tidy directories. — TODO
7. Prototype emergent mechanic: pick one mechanic and prototype a small emergent interaction loop; rapid playtests and gather feedback. — TODO

Recent actions (2026-02-13):
- Migrated existing tasks.json into SQLite (tasks.db) on startup; tasks.json left as backup. Migration logged: "Migrated 5 tasks from tasks.json into SQLite".
- Server now sorts tasks before returning them to the client: incomplete → dueDate (earliest) → createdAt (newest last for tie-breaker).
- Added client-side search box and highlighting; debounce and keyboard shortcut implemented.
- Server is running at http://187.77.4.202:3000 for testing.

What I need from you:
- Confirm whether to keep tasks.json backup or delete it after backing up elsewhere.
- Approve starting task #3 (tags + UI) so I can implement and wire filters.

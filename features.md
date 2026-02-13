# Features

Proposed features for Tiny Task Dashboard

- Task completion (mark tasks done)
- Edit task text in-place
- Due dates and sorting by due date (implemented)
- Tags and filtering
- Search tasks (client-side search + highlighting implemented)
- Simple user sessions (no auth) to remember view prefs
- Drag to reorder (priority)
- Desktop notifications for overdue tasks
- Database support (SQLite implemented) — replace file-based storage with a small SQLite DB for safer persistence
- Migration & backups: keep tasks.json as a backup after migration; consider automated DB snapshots
- JWT-based auth (optional)
- Realtime idea-voting (prototype)

Chosen subset to start with (status updated):
1. Task completion (mark tasks done) — DONE
2. Edit task text in-place — IN PROGRESS / usable
3. Due dates and sorting by due date — DONE (frontend + server filters)
4. Tags and basic filtering — TODO
5. Search tasks — DONE (client-side search, debounced, with highlighting and "/" focus shortcut)
6. Database support — DONE (migrated tasks.json into SQLite tasks.db)
7. JWT-based auth (optional) — TODO
8. Realtime idea-voting (prototype) — TODO

Notes / recent work (2026-02-13):
- Implemented due-date UI (create/edit), display, overdue highlighting, and frontend filters (Due soon / Overdue / No due).
- Added client-side search box with debounced input, client-side highlighting of matched text, and keyboard shortcut ("/") to focus search.
- Switched persistence from tasks.json file to SQLite (better-sqlite3). On startup the app migrates existing tasks.json into tasks.db if DB is empty and keeps tasks.json as a backup.
- Server now returns tasks sorted server-side: incomplete first, then by dueDate (earliest first), then by newest createdAt.
- Commits related: frontend due-date change (a0142c7), due-date marked DONE commit (03ffc83). Server restarted and running on port 3000 at http://187.77.4.202:3000.

Next recommended tasks:
- Add tags + UI filter (task #3).
- Add automated DB snapshot rotation (retain last N backups).
- Replace tasks.json backup with controlled snapshotting once migration is verified.

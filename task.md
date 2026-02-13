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

---

Repository/hardening & backend best-practices (new backlog items requested by Roger on 2026-02-13)

A. Robust input validation & centralized error handling — TODO
   - Validate request payloads (text length, dueDate format).
   - Centralize JSON error responses { error, code } and catch unexpected exceptions.

B. Add explicit migrations/versioning — TODO
   - Add schema_version/migrations table and runner for idempotent migrations.

C. Ensure transactional guarantees where needed — TODO
   - Wrap multi-statement operations in db.transaction where appropriate.

D. Automated backups & durability — TODO
   - Add automated DB snapshots (rotate last N backups) and possibly a /backup endpoint.

E. Logging & observability — TODO
   - Add structured logging (pino/winston), request logging (morgan), and /health endpoint.

F. Multi-instance readiness / scalability plan — TODO
   - Evaluate moving to Postgres or hosted DB if horizontal scaling is needed.

G. Security & hardening — TODO
   - Helmet/secure headers, CORS policy, rate limiting, optional JWT/basic auth, sanitize outputs.

H. Tests & CI — TODO
   - Add unit/integration tests (jest/supertest) and GitHub Actions to run tests on push.

I. Configuration & secrets management — TODO
   - Use env vars (PORT, DB_PATH), add .env.example, and avoid hard-coded paths.

J. Code layout & maintainability — TODO
   - Split server into modules (db.js, routes/tasks.js), add linting, prettier, and package scripts.

Notes:
- These items were added to the backlog per your request and can be implemented in priority order; I recommend starting with A (validation + centralized errors), then B (migrations), then D (backups), then H (tests/CI).
- Tell me which item to pick first or if you want me to break any item into smaller tickets with estimated time.

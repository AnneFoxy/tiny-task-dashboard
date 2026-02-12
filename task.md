# Tiny Task Dashboard - Prioritized Tasks

1. Add task completion (mark tasks done) — backend + frontend checkbox, show completed tasks visually and sort them last. — DONE
2. Add due dates and sort/filter by due date.
3. Add tags and simple filtering UI.
4. Improve edit flow (inline save/cancel, validation).
5. Add search box to filter tasks client-side.
6. Organize project structure: move CSS to public/css, front-end JS to public/js, and tidy directories.
7. Prototype emergent mechanic: pick one mechanic and prototype a small emergent interaction loop; rapid playtests and gather feedback.

Notes:
- Task completion was already implemented in the backend (completed flag + PUT /tasks/:id) and frontend (checkbox, line-through, and update flow). Verified code paths and tasks.json contain completed entries. No server changes required.
- Next action: implement due dates (item #2).

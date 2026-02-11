Realtime Idea Voting - Prototype

This feature adds a simple realtime idea-voting dashboard to the Tiny Task Dashboard project.

Files:
- server.js — minimal Socket.io server to broadcast ideas and votes
- public/realtime/index.html — demo UI for voting
- public/realtime/js/voting.js — frontend Socket.io client

Run (dev):
- node features/realtime-voting/server.js
- Open http://localhost:3000/realtime/index.html (or serve from the main app)

Notes:
- This is a lightweight prototype for brainstorming and collaboration; we can integrate it into the main app with route mounting (e.g., /realtime) and expand with persistence and auth later.

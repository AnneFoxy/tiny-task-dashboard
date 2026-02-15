const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const DB_PATH = path.join(__dirname, 'tasks.db');
const JSON_PATH = path.join(__dirname, 'tasks.json');

// Initialize SQLite DB and table
const db = new Database(DB_PATH);
db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY,
  text TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  dueDate INTEGER
);
`);

// Ensure tags column exists (for older DBs)
(function ensureTagsColumn() {
  try {
    const info = db.prepare("PRAGMA table_info('tasks')").all();
    const hasTags = info.some(r => r.name === 'tags');
    if (!hasTags) {
      db.exec("ALTER TABLE tasks ADD COLUMN tags TEXT;");
      console.log('Added tags column to tasks table');
    }
  } catch (e) {
    console.warn('Failed to ensure tags column:', e.message);
  }
})();

function migrateJsonIfNeeded() {
  if (!fs.existsSync(JSON_PATH)) return;
  try {
    const raw = fs.readFileSync(JSON_PATH, 'utf8');
    const arr = JSON.parse(raw || '[]');
    if (!Array.isArray(arr) || arr.length === 0) return;

    // Check whether DB already has rows
    const row = db.prepare('SELECT COUNT(1) as c FROM tasks').get();
    if (row && row.c > 0) return; // assume already migrated

    const insert = db.prepare('INSERT INTO tasks (id, text, createdAt, updatedAt, completed, dueDate, tags) VALUES (@id, @text, @createdAt, @updatedAt, @completed, @dueDate, @tags)');
    const now = Date.now();
    const txn = db.transaction((items) => {
      for (const it of items) {
        const task = {
          id: Number(it.id) || null,
          text: String(it.text || '').trim() || 'Untitled',
          createdAt: Number(it.createdAt) || now,
          updatedAt: Number(it.updatedAt) || Number(it.createdAt) || now,
          completed: it.completed ? 1 : 0,
          dueDate: it.dueDate ? Number(it.dueDate) : null,
          tags: it.tags ? JSON.stringify(it.tags) : null
        };
        insert.run(task);
      }
    });
    txn(arr);
    console.log('Migrated', arr.length, 'tasks from tasks.json into SQLite');
    // keep JSON as backup; do not delete
  } catch (e) {
    console.error('Migration failed:', e);
  }
}

migrateJsonIfNeeded();

// helpers
const getAllStmt = db.prepare('SELECT id, text, createdAt, updatedAt, completed, dueDate, tags FROM tasks');
const getAllSortedStmt = db.prepare('SELECT id, text, createdAt, updatedAt, completed, dueDate, tags FROM tasks ORDER BY completed ASC, COALESCE(dueDate, 9999999999999) ASC, createdAt DESC');
const getById = db.prepare('SELECT id, text, createdAt, updatedAt, completed, dueDate, tags FROM tasks WHERE id = ?');
const insertStmt = db.prepare('INSERT INTO tasks (text, createdAt, updatedAt, completed, dueDate, tags) VALUES (?, ?, ?, ?, ?, ?)');
const updateStmt = db.prepare('UPDATE tasks SET text = ?, updatedAt = ?, completed = ?, dueDate = ?, tags = ? WHERE id = ?');
const deleteStmt = db.prepare('DELETE FROM tasks WHERE id = ?');

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/tasks', (req, res) => {
  // fetch all and apply ordering on server: incomplete first, then by dueDate (earliest), then newest createdAt
  const rows = getAllSortedStmt.all();
  const tasks = rows.map(r => ({
    id: r.id,
    text: r.text,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    completed: Boolean(r.completed),
    dueDate: r.dueDate === null ? null : r.dueDate,
    tags: r.tags ? JSON.parse(r.tags) : []
  }));

  res.json(tasks);
});

app.post('/tasks', (req, res) => {
  const text = String(req.body?.text ?? '').trim();
  if (!text) return res.status(400).json({ error: 'Task text is required' });

  const due = req.body?.dueDate ? Number(new Date(req.body.dueDate)) : null;
  const tags = Array.isArray(req.body?.tags) ? JSON.stringify(req.body.tags.filter(Boolean)) : null;
  const now = Date.now();
  const info = insertStmt.run(text, now, now, 0, due, tags);
  const id = info.lastInsertRowid;
  const task = getById.get(id);
  res.json({ id: task.id, text: task.text, createdAt: task.createdAt, updatedAt: task.updatedAt, completed: Boolean(task.completed), dueDate: task.dueDate, tags: task.tags ? JSON.parse(task.tags) : [] });
});

app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const existing = getById.get(id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  // Allow partial updates
  const text = req.body?.text !== undefined ? String(req.body.text ?? '').trim() : existing.text;
  if (text === '') return res.status(400).json({ error: 'Task text is required' });

  const completed = req.body?.completed !== undefined ? (req.body.completed ? 1 : 0) : (existing.completed ? 1 : 0);
  const dueDate = req.body?.dueDate !== undefined ? (req.body.dueDate ? Number(new Date(req.body.dueDate)) : null) : existing.dueDate;
  const tags = req.body?.tags !== undefined ? (Array.isArray(req.body.tags) ? JSON.stringify(req.body.tags.filter(Boolean)) : null) : existing.tags;
  const now = Date.now();

  updateStmt.run(text, now, completed, dueDate, tags, id);
  const task = getById.get(id);
  res.json({ id: task.id, text: task.text, createdAt: task.createdAt, updatedAt: task.updatedAt, completed: Boolean(task.completed), dueDate: task.dueDate, tags: task.tags ? JSON.parse(task.tags) : [] });
});

app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const info = deleteStmt.run(id);
  if (info.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.sendStatus(204);
});

const listener = app.listen(3000, () => {
  console.log('Server running on port 3000');
});

// graceful shutdown: close DB
process.on('SIGINT', () => {
  try { db.close(); } catch (e) {}
  listener.close(() => process.exit(0));
});

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const TASKS_PATH = path.join(__dirname, 'tasks.json');

let tasks = [];
let nextId = 1;

function loadTasks() {
  try {
    tasks = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8')) || [];
    const maxId = tasks.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0);
    nextId = maxId + 1;
  } catch (e) {
    tasks = [];
    nextId = 1;
  }
}

function saveTasks() {
  fs.writeFileSync(TASKS_PATH, JSON.stringify(tasks, null, 2) + '\n', 'utf8');
}

loadTasks();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/tasks', (req, res) => {
  // Default: incomplete first, then newest
  const sorted = [...tasks].sort((a, b) => {
    const ac = a.completed ? 1 : 0;
    const bc = b.completed ? 1 : 0;
    if (ac !== bc) return ac - bc;
    return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
  });
  res.json(sorted);
});

app.post('/tasks', (req, res) => {
  const text = String(req.body?.text ?? '').trim();
  if (!text) return res.status(400).json({ error: 'Task text is required' });

  const task = { id: nextId++, text, createdAt: Date.now(), updatedAt: Date.now(), completed: false };
  tasks.push(task);
  saveTasks();
  res.json(task);
});

app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Allow partial updates: text and/or completed
  if (req.body?.text !== undefined) {
    const text = String(req.body.text ?? '').trim();
    if (!text) return res.status(400).json({ error: 'Task text is required' });
    task.text = text;
  }

  if (req.body?.completed !== undefined) {
    task.completed = Boolean(req.body.completed);
  }

  task.updatedAt = Date.now();
  saveTasks();
  res.json(task);
});

app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const before = tasks.length;
  tasks = tasks.filter(t => t.id !== id);
  if (tasks.length === before) return res.status(404).json({ error: 'Task not found' });

  saveTasks();
  res.sendStatus(204);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
app.use(express.json());
app.use(express.static('public'));
let tasks = [];
try {
  tasks = JSON.parse(fs.readFileSync('tasks.json', 'utf8'));
} catch (e) {}
function saveTasks() {
  fs.writeFileSync('tasks.json', JSON.stringify(tasks), 'utf8');
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/tasks', (req, res) => {
  const task = req.body;
  task.id = tasks.length + 1;
  tasks.push(task);
  saveTasks();
  res.json(task);
});

app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  res.sendStatus(204);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

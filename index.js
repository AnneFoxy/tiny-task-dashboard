const express = require('express');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static('public'));
let tasks = [];

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
  res.json(task);
});

app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  tasks = tasks.filter(t => t.id !== id);
  res.sendStatus(204);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

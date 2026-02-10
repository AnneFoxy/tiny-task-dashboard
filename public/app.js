/* tiny-task-dashboard frontend */

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const c of children) {
    if (c == null) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

async function loadTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = '';

  let tasks = [];
  try {
    tasks = await fetchJson('/tasks');
  } catch (e) {
    list.appendChild(el('li', { className: 'error' }, `Failed to load tasks: ${e.message}`));
    return;
  }

  if (!tasks.length) {
    list.appendChild(el('li', { className: 'empty' }, 'No tasks yet.'));
    return;
  }

  for (const task of tasks) {
    const text = (task && (task.text ?? task.title ?? task.name)) ?? '';

    const delBtn = el('button', { className: 'deleteBtn', type: 'button' }, 'Delete');
    delBtn.addEventListener('click', async () => {
      try {
        await fetchJson(`/tasks/${task.id}`, { method: 'DELETE' });
        await loadTasks();
      } catch (e) {
        alert(`Delete failed: ${e.message}`);
      }
    });

    const li = el('li', {}, `${text} `, delBtn);
    list.appendChild(li);
  }
}

async function addTask() {
  const input = document.getElementById('newTask');
  const text = (input.value || '').trim();
  if (!text) return;

  try {
    await fetchJson('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    input.value = '';
    await loadTasks();
  } catch (e) {
    alert(`Add failed: ${e.message}`);
  }
}

window.addTask = addTask;

document.addEventListener('DOMContentLoaded', () => {
  loadTasks();

  const input = document.getElementById('newTask');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });
});

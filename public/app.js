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

function getTaskText(task) {
  return (task && (task.text ?? task.title ?? task.name)) ?? '';
}

function formatTime(ts) {
  const n = Number(ts);
  if (!n) return '';
  try {
    return new Date(n).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

let toastTimer;
function toast(message, type = 'ok') {
  const t = document.getElementById('toast');
  if (!t) return;

  clearTimeout(toastTimer);
  t.textContent = message;
  t.classList.remove('ok', 'err', 'show');
  t.classList.add(type);
  // force reflow to restart animation
  void t.offsetWidth;
  t.classList.add('show');

  toastTimer = setTimeout(() => t.classList.remove('show'), 1400);
}

function setBusy(btn, busy, textWhenBusy) {
  if (!btn) return;
  if (busy) {
    btn.dataset.prevText = btn.textContent;
    btn.textContent = textWhenBusy || '...';
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.prevText || btn.textContent;
    btn.disabled = false;
  }
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
    list.appendChild(renderTaskRow(task));
  }
}

function renderTaskRow(task) {
  const li = el('li', { className: 'taskRow' });

  const left = el('div', { className: 'taskLeft' });
  const textSpan = el('div', { className: 'taskText' }, getTaskText(task));
  const meta = el('div', { className: 'taskMeta' }, formatTime(task.updatedAt || task.createdAt));
  left.append(textSpan, meta);

  const actions = el('div', { className: 'actions' });

  const editBtn = el('button', { className: 'btn btnEdit', type: 'button' }, 'Edit');
  const delBtn = el('button', { className: 'btn btnDelete', type: 'button' }, 'Delete');

  delBtn.addEventListener('click', async () => {
    setBusy(delBtn, true, 'Deleting…');
    try {
      await fetchJson(`/tasks/${task.id}`, { method: 'DELETE' });
      toast('Deleted', 'ok');
      await loadTasks();
    } catch (e) {
      toast('Delete failed', 'err');
      alert(`Delete failed: ${e.message}`);
    } finally {
      setBusy(delBtn, false);
    }
  });

  editBtn.addEventListener('click', () => enterEditMode(li, task));

  actions.append(editBtn, delBtn);
  li.append(left, actions);

  return li;
}

function enterEditMode(li, task) {
  li.innerHTML = '';

  const input = el('input', {
    value: getTaskText(task),
    className: 'taskEditInput'
  });

  const actions = el('div', { className: 'actions' });

  const saveBtn = el('button', { className: 'btn btnSave', type: 'button' }, 'Save');
  const cancelBtn = el('button', { className: 'btn btnCancel', type: 'button' }, 'Cancel');

  async function save() {
    const text = (input.value || '').trim();
    if (!text) return;

    setBusy(saveBtn, true, 'Saving…');
    try {
      await fetchJson(`/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      toast('Saved', 'ok');
      await loadTasks();
    } catch (e) {
      toast('Edit failed', 'err');
      alert(`Edit failed: ${e.message}`);
    } finally {
      setBusy(saveBtn, false);
    }
  }

  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', () => loadTasks());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') loadTasks();
  });

  actions.append(saveBtn, cancelBtn);
  li.append(input, actions);
  input.focus();
  input.select();
}

async function addTask() {
  const input = document.getElementById('newTask');
  const addBtn = document.getElementById('addBtn');
  const text = (input.value || '').trim();
  if (!text) return;

  setBusy(addBtn, true, 'Adding…');
  try {
    await fetchJson('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    input.value = '';
    toast('Added', 'ok');
    await loadTasks();
  } catch (e) {
    toast('Add failed', 'err');
    alert(`Add failed: ${e.message}`);
  } finally {
    setBusy(addBtn, false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadTasks();

  const input = document.getElementById('newTask');
  const addBtn = document.getElementById('addBtn');

  addBtn.addEventListener('click', addTask);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });
});

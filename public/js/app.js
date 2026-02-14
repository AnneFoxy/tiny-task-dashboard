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

function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(q, 'ig');
  return escapeHtml(text).replace(re, m => `<mark>${m}</mark>`);
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

  const search = (document.getElementById('searchBox')?.value || '').trim().toLowerCase();
  const filterSelect = document.getElementById('filterSelect');
  const filter = filterSelect ? String(filterSelect.value || 'all') : 'all';

  // apply server-side style filters locally (we already fetched all tasks)
  const now = Date.now();
  let listToRender = tasks.slice();

  if (filter === 'due_soon') {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    listToRender = listToRender.filter(t => t.dueDate && !t.completed && (Number(t.dueDate) - now) <= weekMs && (Number(t.dueDate) - now) >= 0);
  } else if (filter === 'overdue') {
    listToRender = listToRender.filter(t => t.dueDate && !t.completed && Number(t.dueDate) < now);
  } else if (filter === 'no_due') {
    listToRender = listToRender.filter(t => !t.dueDate);
  }

  if (search) {
    listToRender = listToRender.filter(t => getTaskText(t).toLowerCase().includes(search));
  }

  if (!listToRender.length) {
    list.appendChild(el('li', { className: 'empty' }, 'No tasks match.'));
    return;
  }

  for (const task of listToRender) {
    list.appendChild(renderTaskRow(task, search));
  }
}

function renderTaskRow(task, search = '') {
  const li = el('li', { className: 'taskRow' });

  const left = el('div', { className: 'taskLeft' });
  const checkbox = el('input', { type: 'checkbox', className: 'taskCheck', checked: Boolean(task.completed) });

  const textSpan = el('div', { className: 'taskText' });
  // insert highlighted HTML
  const txt = getTaskText(task);
  if (search && txt.toLowerCase().includes(search)) {
    textSpan.innerHTML = highlight(txt, search);
  } else {
    textSpan.textContent = txt;
  }

  if (task.completed) textSpan.style.textDecoration = 'line-through';
  const meta = el('div', { className: 'taskMeta' }, formatTime(task.updatedAt || task.createdAt));
  // due date display
  const dueSpan = el('div', { className: 'taskDue' }, task.dueDate ? new Date(Number(task.dueDate)).toLocaleDateString() : '');
  // overdue styling
  if (task.dueDate && !task.completed && Number(task.dueDate) < Date.now()) {
    dueSpan.style.color = '#ff6b6b';
    dueSpan.textContent += ' • Overdue';
    li.style.boxShadow = '0 0 0 2px rgba(255,107,107,0.06)';
  }
  left.append(checkbox, textSpan, meta, dueSpan);

  const actions = el('div', { className: 'actions' });

  const editBtn = el('button', { className: 'btn btnEdit', type: 'button' }, 'Edit');
  const delBtn = el('button', { className: 'btn btnDelete', type: 'button' }, 'Delete');

  checkbox.addEventListener('change', async () => {
    try {
      await fetchJson(`/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: checkbox.checked })
      });
      toast(checkbox.checked ? 'Completed' : 'Marked active', 'ok');
      await loadTasks();
    } catch (e) {
      toast('Update failed', 'err');
      alert(`Update failed: ${e.message}`);
      checkbox.checked = !checkbox.checked;
    }
  });

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

  const dueInput = el('input', {
    type: 'date',
    value: task.dueDate ? new Date(Number(task.dueDate)).toISOString().slice(0,10) : '' ,
    className: 'taskDueInput',
    style: 'margin-left:8px'
  });

  const actions = el('div', { className: 'actions' });

  const saveBtn = el('button', { className: 'btn btnSave', type: 'button' }, 'Save');
  const cancelBtn = el('button', { className: 'btn btnCancel', type: 'button' }, 'Cancel');

  async function save() {
    const text = (input.value || '').trim();
    if (!text) return;

    const due = dueInput.value ? new Date(dueInput.value).toISOString() : null;

    setBusy(saveBtn, true, 'Saving…');
    try {
      await fetchJson(`/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, dueDate: due })
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
  li.append(input, dueInput, actions);
  input.focus();
  input.select();
}

async function addTask() {
  const input = document.getElementById('newTask');
  const addBtn = document.getElementById('addBtn');
  const dueEl = document.getElementById('newDue');
  const text = (input.value || '').trim();
  if (!text) return;

  const due = dueEl.value ? new Date(dueEl.value).toISOString() : null;

  setBusy(addBtn, true, 'Adding…');
  try {
    await fetchJson('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, dueDate: due })
    });
    input.value = '';
    dueEl.value = '';
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

  const filter = document.getElementById('filterSelect');
  if (filter) filter.addEventListener('change', () => loadTasks());

  const search = document.getElementById('searchBox');
  if (search) search.addEventListener('input', debounce(() => loadTasks(), 150));

  // keyboard shortcut: '/' focuses search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName.toLowerCase() !== 'input') {
      e.preventDefault();
      const s = document.getElementById('searchBox');
      if (s) s.focus();
    }
  });
});

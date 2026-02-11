const socket = io();
let ideas = [];

const ideaList = document.getElementById('ideaList');
const ideaInput = document.getElementById('ideaInput');
const addBtn = document.getElementById('addBtn');

socket.on('update', (updated) => {
  ideas = updated || [];
  render();
});

addBtn.addEventListener('click', () => {
  const text = ideaInput.value.trim();
  if (!text) return;
  socket.emit('addIdea', { text });
  ideaInput.value = '';
});

function vote(i){
  socket.emit('vote', i);
}

function render(){
  ideaList.innerHTML = '';
  ideas.forEach((idea, i) =>{
    const div = document.createElement('div');
    div.innerHTML = `<strong>${escapeHtml(idea.text)}</strong> — Votes: ${idea.votes} <button onclick="vote(${i})">Vote</button>`;
    ideaList.appendChild(div);
  });
}

function escapeHtml(str){
  return String(str).replace(/[&<>"]/g, s=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'
  })[s]);
}

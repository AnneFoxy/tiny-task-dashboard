const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let ideas = [];

io.on('connection', (socket) => {
  console.log('client connected');
  socket.emit('update', ideas);

  socket.on('addIdea', (idea) => {
    ideas.push({ text: idea.text || '', votes: 0 });
    io.emit('update', ideas);
  });

  socket.on('vote', (index) => {
    if (ideas[index]) {
      ideas[index].votes = (ideas[index].votes || 0) + 1;
      io.emit('update', ideas);
    }
  });

  socket.on('disconnect', () => console.log('client disconnected'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Realtime voting server listening on ${PORT}`));

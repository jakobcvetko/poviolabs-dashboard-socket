'use strict';

const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET || 'local';
const INDEX = '/index.html';

var app = express();
app.use(express.json());

app.post('/channels/:id', function(request, response) {

  // Security check
  if(request.headers.authorization != API_SECRET) {
    response.writeHead(401, {'Content-Type': 'text/json'});
    response.end(null);
    return;
  }

  // Emit to everyone who listens on this channel
  io.to(request.params.id).emit('update', request.body)

  // Response
  response.writeHead(200, {'Content-Type': 'text/json'});
  response.end();
});

// Server start
const server = app.use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));




//
// Socket.io logic
//

const io = socketIO(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

io.sockets.on('connection', function(socket) {
  // once a client has connected, we expect to get a ping from them saying what room they want to join
  socket.on('room', function(room) {
      console.log("Client joined room", room)
      socket.join(room);
  });
});

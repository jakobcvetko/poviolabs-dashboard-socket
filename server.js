"use strict";

const express = require("express");
const cors = require("cors");
const socketIO = require("socket.io");

const PORT = process.env.PORT || 3000;
const API_SECRET = process.env.API_SECRET || "local";
const INDEX = "/index.html";

// App start
var app = express();
app.use(cors());
app.use(express.json({ limit: "100mb" }));

// Server start
const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

//
// Socket.io logic
//

const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

io.sockets.on("connection", function (socket) {
  // once a client has connected, we expect to get a ping from them saying what room they want to join
  socket.on("room", function (room) {
    console.log("Client joined room", room);
    socket.join("" + room);
  });
});

app.get("/channels/:id/alive", function (request, response) {
  // Security check
  if (request.headers.authorization != API_SECRET) {
    response.writeHead(401, { "Content-Type": "text/json" });
    response.end(null);
    return;
  }
  var room = io.sockets.adapter.rooms.get("" + request.params.id);
  if (!room || room.length === 0) {
    response.writeHead(422, { "Content-Type": "text/json" });
    response.end(null);
    return;
  }
  // Response
  response.writeHead(204, { "Content-Type": "text/json" });
  response.end();
});

app.post("/channels/:id", function (request, response) {
  console.log(`Message request room: ${request.params.id}`);
  // Security check
  if (request.headers.authorization != API_SECRET) {
    response.writeHead(401, { "Content-Type": "text/json" });
    response.end(null);
    return;
  }
  var room = io.sockets.adapter.rooms.get("" + request.params.id);
  console.log(room);
  console.log(io.sockets.adapter.rooms);
  if (!room || room.length === 0) {
    response.writeHead(422, { "Content-Type": "text/json" });
    response.end(null);
    return;
  }
  console.log(`Message sent to room: ${request.params.id}`);
  // Emit to everyone who listens on this channel
  io.to(request.params.id).emit("update", request.body);

  // Response
  response.writeHead(200, { "Content-Type": "text/json" });
  response.end();
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static('public'));

const users = new Map();
const typingUsers = new Set();

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);
  
  // Handle new user
  socket.on('new user', (user) => {
    users.set(socket.id, user);
    socket.broadcast.emit('user joined', user.name);
  });
  
  // Handle chat messages
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
  
  // Handle typing indicator
  socket.on('typing', (username) => {
    typingUsers.add(username);
    io.emit('typing update', Array.from(typingUsers));
  });
  
  socket.on('stop typing', () => {
    const user = users.get(socket.id);
    if (user) typingUsers.delete(user.name);
    io.emit('typing update', Array.from(typingUsers));
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      typingUsers.delete(user.name);
      socket.broadcast.emit('user left', user.name);
      io.emit('typing update', Array.from(typingUsers));
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const http = require('http');
const { Server } = require('socket.io');

const app = require('./server/app');
const connectDB = require('./server/config/db');
const initSocketHandler = require('./server/sockets/socketHandler');

const PORT = process.env.PORT || 3000;

// ── Create HTTP server ─────────────────────────────────────────────────────────
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Shared map of online users: userId (string) → socketId
const onlineUsers = new Map();

// Make io and onlineUsers available to controllers via app.get()
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// Register all Socket.IO event handlers
initSocketHandler(io, onlineUsers);

// ── Connect to DB then start server ───────────────────────────────────────────
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 PlayCircle server running on http://localhost:${PORT}`);
  });
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n⛔ Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

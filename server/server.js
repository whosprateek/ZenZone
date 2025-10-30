const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:3000', 'http://localhost:3001'], methods: ['GET', 'POST'] },
});

// Middleware
app.use(express.json({ limit: '1mb' }));

// In development, allow CORS from common local ports (3000, 3001)
if (process.env.NODE_ENV !== 'production') {
  const cors = require('cors');
  app.use(
    cors({
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: false,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    })
  );
  // Ensure OPTIONS preflights succeed for any route
  app.options('*', cors());
}

// Validate environment
const requiredEnv = ['MONGO_URI', 'JWT_SECRET'];
const missing = requiredEnv.filter((k) => !process.env[k]);
if (missing.length) {
  console.warn('Warning: Missing required env vars:', missing.join(', '));
}

// DB connect
(async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('No MONGO_URI provided. API will run but DB operations will fail.');
    } else {
      await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('MongoDB connected');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
})();

// Routes
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const appointmentRoutes = require('./routes/appointments');
const aiChatRoutes = require('./routes/ai-chat');
const analyticsRoutes = require('./routes/analytics');
const uploadRoutes = require('./routes/upload');
const sentimentRoutes = require('./routes/sentiment');

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    node: process.version,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'development',
      hasMongoUri: Boolean(process.env.MONGO_URI),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      hasOpenAI: Boolean(process.env.OPENAI_API_KEY),
      hasGroq: Boolean(process.env.GROQ_API_KEY),
groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sentiment', sentimentRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve client build if it exists (works in any NODE_ENV)
try {
  const fs = require('fs');
  const clientBuild = path.join(__dirname, '..', 'client', 'build');
  if (fs.existsSync(clientBuild)) {
    app.use(express.static(clientBuild));
    app.get('*', (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
  }
} catch (_) {}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', ({ appointmentId, userId }) => {
    if (appointmentId && userId) {
      socket.join(`${appointmentId}-${userId}`);
      console.log(`User ${userId} joined room ${appointmentId}-${userId}`);
    }
  });

  socket.on('sendMessage', (message) => {
    const { appointmentId, senderId, recipientId } = message || {};
    if (appointmentId && senderId && recipientId) {
      // Emit to both user-specific rooms and the shared appointment room.
      io
        .to(`${appointmentId}-${senderId}`)
        .to(`${appointmentId}-${recipientId}`)
        .to(`${appointmentId}`)
        .emit('receiveMessage', message);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 404 + error handler for clarity
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

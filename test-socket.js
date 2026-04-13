const { io } = require('socket.io-client');

const SOCKET_URL = 'http://localhost:3000'; // change if needed
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZGQ3YTg4ZC1hMDlmLTRlMGQtOWQ4MS0zMDkwZDBjNGM0NzkiLCJ1c2VybmFtZSI6ImtyaXNoMTIzIiwiaWF0IjoxNzc2MDgxMDYxLCJleHAiOjE3NzY2ODU4NjF9.eIbDvFN1DImUn1pV5cshQBrIpfEIVDJwX2eAiu5K0dw';
const CONVERSATION_ID = '5cc1efa9-94c8-4222-9f8c-6867fb54aa2b';

const socket = io(SOCKET_URL, {
  auth: {
    token: TOKEN,
  },
  transports: ['websocket'],
});

// ================= CONNECTION =================

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);

  // 🔥 STEP 1: JOIN FIRST
  console.log('➡️ Joining conversation...');
  socket.emit('join', { conversationId: CONVERSATION_ID });

  // 🔥 STEP 2: WAIT THEN SEND MESSAGE
  setTimeout(() => {
    console.log('➡️ Sending message...');
    socket.emit('message', {
      message: 'Hello from virat kohli',
    });
  }, 500);
});

// ================= EVENTS =================

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected');
});

socket.on('error', (err) => {
  console.error('❌ Server error:', err);
});

socket.on('user_joined', (data) => {
  console.log('👤 User joined:', data);
});

socket.on('message', (data) => {
  console.log('💬 Message received:', data);
});

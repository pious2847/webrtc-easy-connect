const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

// Create an Express app
const app = express();
app.use(express.static('public'));

// Create an HTTP server
const server = http.createServer(app);

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

// Store rooms and clients
const rooms = new Map();
const clients = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const clientId = uuidv4();
  clients.set(ws, { id: clientId, room: null });

  console.log(`Client connected: ${clientId}`);

  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    const client = clients.get(ws);
    if (client && client.room) {
      leaveRoom(ws, client.room);
    }
    clients.delete(ws);
    console.log(`Client disconnected: ${clientId}`);
  });

  // Send client their ID
  ws.send(JSON.stringify({
    type: 'connection',
    payload: { id: clientId }
  }));
});

// Handle different message types
function handleMessage(ws, data) {
  const client = clients.get(ws);
  
  switch (data.type) {
    case 'join':
      joinRoom(ws, data.room);
      break;
    case 'leave':
      leaveRoom(ws, client.room);
      break;
    case 'offer':
    case 'answer':
    case 'ice-candidate':
      forwardMessage(ws, data);
      break;
    default:
      console.warn(`Unknown message type: ${data.type}`);
  }
}

// Join a room
function joinRoom(ws, roomId) {
  const client = clients.get(ws);
  
  // Leave current room if in one
  if (client.room) {
    leaveRoom(ws, client.room);
  }
  
  // Create room if it doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  
  // Add client to room
  const room = rooms.get(roomId);
  room.add(ws);
  client.room = roomId;
  
  // Notify client they joined the room
  ws.send(JSON.stringify({
    type: 'room-joined',
    payload: { room: roomId }
  }));
  
  // Notify other clients in the room
  broadcastToRoom(roomId, ws, {
    type: 'peer-joined',
    payload: { peerId: client.id }
  });
  
  console.log(`Client ${client.id} joined room ${roomId}`);
}

// Leave a room
function leaveRoom(ws, roomId) {
  if (!roomId || !rooms.has(roomId)) return;
  
  const client = clients.get(ws);
  const room = rooms.get(roomId);
  
  // Remove client from room
  room.delete(ws);
  client.room = null;
  
  // Delete room if empty
  if (room.size === 0) {
    rooms.delete(roomId);
    console.log(`Room ${roomId} deleted (empty)`);
  } else {
    // Notify other clients in the room
    broadcastToRoom(roomId, ws, {
      type: 'peer-left',
      payload: { peerId: client.id }
    });
  }
  
  console.log(`Client ${client.id} left room ${roomId}`);
}

// Forward a message to other clients in the room
function forwardMessage(ws, data) {
  const client = clients.get(ws);
  if (!client.room) return;
  
  // Add sender ID to the message
  data.sender = client.id;
  
  // Forward to specific peer if target is specified
  if (data.target) {
    const targetWs = findClientById(data.target);
    if (targetWs) {
      targetWs.send(JSON.stringify(data));
    }
  } else {
    // Broadcast to all peers in the room
    broadcastToRoom(client.room, ws, data);
  }
}

// Broadcast a message to all clients in a room except the sender
function broadcastToRoom(roomId, sender, data) {
  if (!rooms.has(roomId)) return;
  
  const room = rooms.get(roomId);
  room.forEach(client => {
    if (client !== sender) {
      client.send(JSON.stringify(data));
    }
  });
}

// Find a client by ID
function findClientById(clientId) {
  for (const [ws, client] of clients.entries()) {
    if (client.id === clientId) {
      return ws;
    }
  }
  return null;
}

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});

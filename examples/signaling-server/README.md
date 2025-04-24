# WebRTC Signaling Server Example

This is a simple WebRTC signaling server implementation using WebSockets. It allows clients to:

- Connect to the server
- Join and leave rooms
- Exchange WebRTC signaling messages (offers, answers, ICE candidates)
- Establish peer-to-peer connections

## Features

- Room-based signaling
- Peer discovery
- WebRTC signaling message forwarding
- Simple web client for testing

## Installation

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will run on port 3000 by default. You can change this by setting the `PORT` environment variable.

## Usage

1. Start the server
2. Open `http://localhost:3000` in two different browser tabs or devices
3. Enter the same room ID in both tabs and click "Join Room"
4. Click "Start Call" in one of the tabs
5. The WebRTC connection should be established, and video should appear in both tabs

## API

The signaling server uses a simple JSON-based protocol over WebSockets:

### Client to Server Messages

- **Join Room**
  ```json
  {
    "type": "join",
    "room": "room-id"
  }
  ```

- **Leave Room**
  ```json
  {
    "type": "leave"
  }
  ```

- **WebRTC Offer**
  ```json
  {
    "type": "offer",
    "payload": { /* RTCSessionDescription */ },
    "target": "optional-peer-id"
  }
  ```

- **WebRTC Answer**
  ```json
  {
    "type": "answer",
    "payload": { /* RTCSessionDescription */ },
    "target": "optional-peer-id"
  }
  ```

- **ICE Candidate**
  ```json
  {
    "type": "ice-candidate",
    "payload": { /* RTCIceCandidate */ },
    "target": "optional-peer-id"
  }
  ```

### Server to Client Messages

- **Connection Established**
  ```json
  {
    "type": "connection",
    "payload": {
      "id": "client-id"
    }
  }
  ```

- **Room Joined**
  ```json
  {
    "type": "room-joined",
    "payload": {
      "room": "room-id"
    }
  }
  ```

- **Peer Joined**
  ```json
  {
    "type": "peer-joined",
    "payload": {
      "peerId": "peer-id"
    }
  }
  ```

- **Peer Left**
  ```json
  {
    "type": "peer-left",
    "payload": {
      "peerId": "peer-id"
    }
  }
  ```

## Integration with webrtc-easy

This signaling server can be used with the `webrtc-easy` library. Here's an example:

```javascript
import { RTCConnection, WebSocketSignaling } from 'webrtc-easy';

// Create a signaling connection
const signaling = new WebSocketSignaling({
  url: 'ws://localhost:3000',
  room: 'test-room'
});

// Create a WebRTC connection
const connection = new RTCConnection({
  configuration: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }
});

// Set up signaling
signaling.onMessage(async (message) => {
  switch (message.type) {
    case 'offer':
      const answer = await connection.createAnswer(message.payload);
      signaling.send({ type: 'answer', payload: answer });
      break;
    case 'answer':
      await connection.handleAnswer(message.payload);
      break;
    case 'ice-candidate':
      await connection.addIceCandidate(message.payload);
      break;
  }
});

// Get user media
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});

// Add stream to connection
connection.addStream(stream);

// Create and send offer
const offer = await connection.createOffer();
signaling.send({ type: 'offer', payload: offer });
```

## License

MIT

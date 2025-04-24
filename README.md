# WebRTC Easy

A simple, flexible WebRTC library for multiple frontend frameworks.

## Features

- 🔄 Easy WebRTC connection management
- 🎥 Media stream handling (camera, microphone, screen sharing)
- 📊 Network quality monitoring and adaptation
- 🔌 Data channel support
- 🛠️ Framework integrations:
  - React
  - Vue
  - Angular
  - Svelte

## Installation

```bash
npm install webrtc-easy
```

## Basic Usage

### Core API

```typescript
import { RTCConnection, WebSocketSignaling } from 'webrtc-easy';

// Create a signaling connection
const signaling = new WebSocketSignaling({
  url: 'wss://your-signaling-server.com',
  room: 'test-room'
});

// Create a WebRTC connection
const connection = new RTCConnection({
  configuration: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }
});

// Get user media
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});

// Add stream to connection
connection.addStream(stream);

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

// Create and send offer
const offer = await connection.createOffer();
signaling.send({ type: 'offer', payload: offer });
```

### React Integration

```tsx
import React, { useRef, useEffect } from 'react';
import { useWebRTC } from 'webrtc-easy/react';
import { WebSocketSignaling } from 'webrtc-easy/core';

const VideoChat = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const { 
    localStream, 
    remoteStream, 
    connection,
    connectionState,
    error,
    initConnection, 
    startScreenShare 
  } = useWebRTC({
    configuration: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  });

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleStart = async () => {
    const conn = await initConnection();
    
    const signaling = new WebSocketSignaling({
      url: 'wss://your-signaling-server.com',
      room: 'test-room'
    });

    signaling.onMessage(async (message) => {
      switch (message.type) {
        case 'offer':
          const answer = await conn.createAnswer(message.payload);
          signaling.send({ type: 'answer', payload: answer });
          break;
        case 'answer':
          await conn.handleAnswer(message.payload);
          break;
        case 'ice-candidate':
          await conn.addIceCandidate(message.payload);
          break;
      }
    });

    const offer = await conn.createOffer();
    signaling.send({ type: 'offer', payload: offer });
  };

  return (
    <div>
      <button onClick={handleStart}>Start Call</button>
      <button onClick={startScreenShare}>Share Screen</button>
      
      <div>
        <h3>Local Video</h3>
        <video ref={localVideoRef} autoPlay muted playsInline />
      </div>
      
      <div>
        <h3>Remote Video</h3>
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
    </div>
  );
};
```

### Vue Integration

```vue
<template>
  <div>
    <button @click="handleStart">Start Call</button>
    <button @click="startScreenShare">Share Screen</button>
    
    <div>
      <h3>Local Video</h3>
      <video ref="localVideo" autoplay muted playsinline />
    </div>
    
    <div>
      <h3>Remote Video</h3>
      <video ref="remoteVideo" autoplay playsinline />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useWebRTC } from 'webrtc-easy/vue';
import { WebSocketSignaling } from 'webrtc-easy/core';

const localVideo = ref(null);
const remoteVideo = ref(null);

const {
  localStream,
  remoteStream,
  connection,
  connectionState,
  error,
  initConnection,
  startScreenShare
} = useWebRTC({
  configuration: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }
});

watch(localStream, (stream) => {
  if (localVideo.value && stream) {
    localVideo.value.srcObject = stream;
  }
});

watch(remoteStream, (stream) => {
  if (remoteVideo.value && stream) {
    remoteVideo.value.srcObject = stream;
  }
});

const handleStart = async () => {
  const conn = await initConnection();
  
  const signaling = new WebSocketSignaling({
    url: 'wss://your-signaling-server.com',
    room: 'test-room'
  });

  signaling.onMessage(async (message) => {
    switch (message.type) {
      case 'offer':
        const answer = await conn.createAnswer(message.payload);
        signaling.send({ type: 'answer', payload: answer });
        break;
      case 'answer':
        await conn.handleAnswer(message.payload);
        break;
      case 'ice-candidate':
        await conn.addIceCandidate(message.payload);
        break;
    }
  });

  const offer = await conn.createOffer();
  signaling.send({ type: 'offer', payload: offer });
};
</script>
```

## Advanced Features

### Network Quality Monitoring

```typescript
import { RTCConnection } from 'webrtc-easy';

const connection = new RTCConnection({
  networkQuality: {
    enabled: true,
    onQualityChange: (metrics) => {
      console.log('Network quality:', metrics.quality);
      console.log('Score:', metrics.score);
      console.log('Round trip time:', metrics.roundTripTime, 'ms');
      console.log('Packet loss:', metrics.packetLoss, '%');
    }
  }
});
```

### Adaptive Streaming

```typescript
import { RTCConnection } from 'webrtc-easy';

const connection = new RTCConnection({
  adaptiveStreaming: {
    enabled: true,
    config: {
      maxBitrate: 2500, // kbps
      minBitrate: 100,  // kbps
      targetQuality: 0.8 // 0-1 scale
    }
  }
});

// Start adaptive streaming
connection.startAdaptiveStreaming();
```

### Data Channels

```typescript
import { RTCConnection } from 'webrtc-easy';

const connection = new RTCConnection();

// Create a data channel
const channel = connection.createDataChannel('chat');

// Send data
connection.sendData('chat', 'Hello, world!');

// Receive data
connection.onDataChannelMessage('chat', (data) => {
  console.log('Received:', data);
});
```

## API Reference

For detailed API documentation, see the [API Reference](./docs/api.md).

## Examples

Check out the [examples](./examples) directory for complete working examples.

## License

MIT

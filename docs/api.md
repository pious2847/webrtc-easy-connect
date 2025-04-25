# WebRTC Easy Connect API Reference

This document provides detailed information about the API of the WebRTC Easy Connect library.

## Table of Contents

- [Core API](#core-api)
  - [RTCConnection](#rtcconnection)
  - [MediaHelper](#mediahelper)
  - [WebSocketSignaling](#websocketsignaling)
- [Framework Integrations](#framework-integrations)
  - [React](#react)
  - [Vue](#vue)

## Core API

### RTCConnection

The `RTCConnection` class is the main class for managing WebRTC connections.

#### Constructor

```typescript
constructor(options?: {
  configuration?: RTCConfiguration;
  stream?: MediaStream;
  onTrack?: (event: RTCTrackEvent) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onDataChannel?: (event: RTCDataChannelEvent) => void;
  onError?: (error: Error) => void;
})
```

#### Methods

##### createOffer

Creates an offer for establishing a WebRTC connection.

```typescript
async createOffer(): Promise<RTCSessionDescriptionInit>
```

##### createAnswer

Creates an answer in response to an offer.

```typescript
async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>
```

##### handleAnswer

Handles an answer from a remote peer.

```typescript
async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void>
```

##### addIceCandidate

Adds an ICE candidate from a remote peer.

```typescript
async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>
```

##### addStream

Adds a media stream to the connection.

```typescript
addStream(stream: MediaStream): void
```

##### createDataChannel

Creates a data channel for sending and receiving data.

```typescript
createDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel
```

##### sendData

Sends data through a data channel.

```typescript
sendData(channelLabel: string, data: string | ArrayBuffer | Blob): void
```

##### getConnectionState

Gets the current connection state.

```typescript
getConnectionState(): RTCPeerConnectionState
```

##### close

Closes the connection.

```typescript
close(): void
```

### MediaHelper

The `MediaHelper` class provides utility methods for working with media streams.

#### Methods

##### getUserMedia

Gets a media stream from the user's camera and microphone.

```typescript
static async getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>
```

##### getDisplayMedia

Gets a media stream from the user's screen.

```typescript
static async getDisplayMedia(options?: any): Promise<MediaStream>
```

##### stopMediaStream

Stops all tracks in a media stream.

```typescript
static stopMediaStream(stream: MediaStream): void
```

### WebSocketSignaling

The `WebSocketSignaling` class provides a simple implementation of a signaling server using WebSockets.

#### Constructor

```typescript
constructor(options: {
  url: string;
  room?: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  onOpen?: () => void;
  onMessage?: (message: any) => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
})
```

#### Methods

##### send

Sends a message to the signaling server.

```typescript
send(message: any): void
```

##### onMessage

Registers a callback for handling incoming messages.

```typescript
onMessage(callback: (message: any) => void): void
```

##### connect

Connects to the signaling server.

```typescript
connect(): void
```

##### disconnect

Disconnects from the signaling server.

```typescript
disconnect(): void
```

## Framework Integrations

### React

#### useWebRTCReact

A React hook for using WebRTC in React components.

```typescript
function useWebRTCReact(options?: any): {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connection: RTCConnection | null;
  connectionState: RTCPeerConnectionState;
  error: Error | null;
  initConnection(videoEnabled?: boolean, audioEnabled?: boolean): Promise<RTCConnection>;
  startScreenShare(): Promise<MediaStream>;
}
```

### Vue

#### useWebRTCVue

A Vue composable for using WebRTC in Vue components.

```typescript
function useWebRTCVue(options?: any): {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connection: RTCConnection | null;
  connectionState: RTCPeerConnectionState;
  error: Error | null;
  initConnection(videoEnabled?: boolean, audioEnabled?: boolean): Promise<RTCConnection>;
  startScreenShare(): Promise<MediaStream>;
}
```

## Advanced Features

### Network Quality Monitoring

The `RTCConnection` class supports network quality monitoring through the `networkQuality` option.

```typescript
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

The `RTCConnection` class supports adaptive streaming through the `adaptiveStreaming` option.

```typescript
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

The `RTCConnection` class supports data channels for sending and receiving data.

```typescript
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

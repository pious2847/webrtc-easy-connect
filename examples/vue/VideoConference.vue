<template>
  <div class="video-conference">
    <div class="controls">
      <button 
        @click="handleStart"
        :disabled="!!signaling"
      >
        Start Call
      </button>
      <button 
        @click="handleScreenShare"
        :disabled="!signaling"
      >
        Share Screen
      </button>
      <button 
        @click="handleDisconnect"
        :disabled="!signaling"
      >
        End Call
      </button>
    </div>

    <div v-if="error" class="error-message">
      Error: {{ error.message }}
    </div>

    <div class="connection-status">
      Connection: {{ connectionState }}
    </div>

    <div class="video-streams">
      <div class="local-stream">
        <h3>Local Stream</h3>
        <video
          v-if="localStream"
          ref="localVideo"
          autoplay
          playsinline
          muted
        />
      </div>

      <div class="remote-stream">
        <h3>Remote Stream</h3>
        <video
          v-if="remoteStream"
          ref="remoteVideo"
          autoplay
          playsinline
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useWebRTC } from 'webrtc-easy/vue';
import { WebSocketSignaling } from 'webrtc-easy/core';

const localVideo = ref<HTMLVideoElement | null>(null);
const remoteVideo = ref<HTMLVideoElement | null>(null);
const signaling = ref<WebSocketSignaling | null>(null);

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
  try {
    const conn = await initConnection();
    
    const ws = new WebSocketSignaling({
      url: 'wss://your-signaling-server.com',
      room: 'test-room',
      autoReconnect: true
    });

    ws.onMessage(async (message) => {
      switch (message.type) {
        case 'offer':
          const answer = await conn.createAnswer(message.payload);
          ws.send({ type: 'answer', payload: answer });
          break;
        case 'answer':
          await conn.handleAnswer(message.payload);
          break;
        case 'ice-candidate':
          await conn.addIceCandidate(message.payload);
          break;
      }
    });

    signaling.value = ws;

    // Create and send offer
    const offer = await conn.createOffer();
    ws.send({ type: 'offer', payload: offer });
  } catch (err) {
    console.error('Failed to start call:', err);
  }
};

const handleScreenShare = async () => {
  try {
    await startScreenShare();
  } catch (err) {
    console.error('Failed to share screen:', err);
  }
};

const handleDisconnect = () => {
  signaling.value?.disconnect();
  signaling.value = null;
};
</script>

<style scoped>
.video-conference {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.controls {
  margin-bottom: 20px;
}

.error-message {
  color: red;
  margin: 10px 0;
}

.video-streams {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

video {
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
  background: #000;
}
</style>
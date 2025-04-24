<script lang="ts">
  import { onDestroy } from 'svelte';
  import { createWebRTCStore } from 'webrtc-easy/svelte';
  import { WebSocketSignaling } from 'webrtc-easy/core';

  let localVideo: HTMLVideoElement;
  let remoteVideo: HTMLVideoElement;
  let signaling: WebSocketSignaling | null = null;

  const webrtc = createWebRTCStore({
    configuration: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  });

  $: if (localVideo && $webrtc.localStream) {
    localVideo.srcObject = $webrtc.localStream;
  }

  $: if (remoteVideo && $webrtc.remoteStream) {
    remoteVideo.srcObject = $webrtc.remoteStream;
  }

  async function handleStart() {
    try {
      const conn = await webrtc.initConnection();
      
      signaling = new WebSocketSignaling({
        url: 'wss://your-signaling-server.com',
        room: 'test-room',
        autoReconnect: true
      });

      signaling.onMessage(async (message) => {
        switch (message.type) {
          case 'offer':
            const answer = await conn.createAnswer(message.payload);
            signaling?.send({ type: 'answer', payload: answer });
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
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  }

  async function handleScreenShare() {
    try {
      await webrtc.startScreenShare();
    } catch (err) {
      console.error('Failed to share screen:', err);
    }
  }

  function handleDisconnect() {
    signaling?.disconnect();
    signaling = null;
  }

  onDestroy(() => {
    handleDisconnect();
    webrtc.cleanup();
  });
</script>

<div class="video-conference">
  <div class="controls">
    <button 
      on:click={handleStart}
      disabled={!!signaling}
    >
      Start Call
    </button>
    <button 
      on:click={handleScreenShare}
      disabled={!signaling}
    >
      Share Screen
    </button>
    <button 
      on:click={handleDisconnect}
      disabled={!signaling}
    >
      End Call
    </button>
  </div>

  {#if $webrtc.error}
    <div class="error-message">
      Error: {$webrtc.error.message}
    </div>
  {/if}

  <div class="connection-status">
    Connection: {$webrtc.connectionState}
  </div>

  <div class="video-streams">
    <div class="local-stream">
      <h3>Local Stream</h3>
      <video
        bind:this={localVideo}
        autoplay
        playsinline
        muted
      />
    </div>
    <div class="remote-stream">
      <h3>Remote Stream</h3>
      <video
        bind:this={remoteVideo}
        autoplay
        playsinline
      />
    </div>
  </div>
</div>

<style>
  .video-conference {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .controls {
    display: flex;
    gap: 0.5rem;
  }

  .video-streams {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }

  video {
    width: 100%;
    background: #000;
    border-radius: 4px;
  }

  .error-message {
    color: red;
    padding: 0.5rem;
    border: 1px solid red;
    border-radius: 4px;
  }
</style>
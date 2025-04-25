
// WebRTC Easy - Simplified build
// This is a temporary build with limited functionality

// Core WebRTC connection class
class RTCConnection {
  constructor(options = {}) {
    this.options = options;
    this.peerConnection = new RTCPeerConnection(options.configuration || {});
    this.setupEventListeners();

    // Add stream if provided
    if (options.stream) {
      this.addStream(options.stream);
    }
  }

  setupEventListeners() {
    // Handle tracks
    this.peerConnection.addEventListener('track', (event) => {
      try {
        this.options.onTrack?.(event);
      } catch (error) {
        this.handleError(error);
      }
    });

    // Handle connection state changes
    this.peerConnection.addEventListener('connectionstatechange', () => {
      const state = this.peerConnection.connectionState;
      this.options.onConnectionStateChange?.(state);
    });

    // Handle data channels
    this.peerConnection.addEventListener('datachannel', (event) => {
      try {
        this.options.onDataChannel?.(event);
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  handleError(error) {
    console.error('WebRTC Error:', error);
    this.options.onError?.(error);
  }

  async createOffer() {
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async createAnswer(offer) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async handleAnswer(answer) {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async addIceCandidate(candidate) {
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  addStream(stream) {
    try {
      stream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, stream);
      });
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  createDataChannel(label, options = {}) {
    return this.peerConnection.createDataChannel(label, options);
  }

  sendData(channelLabel, data) {
    const channel = this.peerConnection.createDataChannel(channelLabel);
    if (channel.readyState === 'open') {
      channel.send(data);
    } else {
      channel.onopen = () => {
        channel.send(data);
      };
    }
  }

  getConnectionState() {
    return this.peerConnection.connectionState;
  }

  close() {
    this.peerConnection.close();
  }
}

// Media helper
class MediaHelper {
  static async getUserMedia(constraints = { video: true, audio: true }) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }
  }

  static async getDisplayMedia(options = { video: true }) {
    try {
      return await navigator.mediaDevices.getDisplayMedia(options);
    } catch (error) {
      console.error('Error getting display media:', error);
      throw error;
    }
  }

  static stopMediaStream(stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}

// Simple WebSocket signaling
class WebSocketSignaling {
  constructor(options) {
    this.options = options;
    this.ws = new WebSocket(options.url);
    this.messageListeners = [];

    this.ws.onopen = () => {
      if (options.room) {
        this.send({ type: 'join', room: options.room });
      }
      options.onOpen?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.messageListeners.forEach(listener => listener(message));
        options.onMessage?.(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    this.ws.onclose = () => {
      options.onClose?.();
      if (options.autoReconnect) {
        setTimeout(() => {
          this.connect();
        }, options.reconnectDelay || 3000);
      }
    };

    this.ws.onerror = (error) => {
      options.onError?.(error);
    };
  }

  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.ws.onopen = () => {
        this.ws.send(JSON.stringify(message));
      };
    }
  }

  onMessage(callback) {
    this.messageListeners.push(callback);
  }

  connect() {
    if (this.ws.readyState === WebSocket.CLOSED) {
      this.ws = new WebSocket(this.options.url);
    }
  }

  disconnect() {
    this.ws.close();
  }
}

// React hook (simplified)
function useWebRTCReact(options = {}) {
  return {
    localStream: null,
    remoteStream: null,
    connection: null,
    connectionState: 'new',
    error: null,
    initConnection: async (videoEnabled = true, audioEnabled = true) => {
      // Simplified implementation
      console.log('initConnection called with', { videoEnabled, audioEnabled });
      return new RTCConnection(options);
    },
    startScreenShare: async () => {
      // Simplified implementation
      console.log('startScreenShare called');
      return await MediaHelper.getDisplayMedia();
    }
  };
}

// Vue composable (simplified)
function useWebRTCVue(options = {}) {
  return {
    localStream: null,
    remoteStream: null,
    connection: null,
    connectionState: 'new',
    error: null,
    initConnection: async (videoEnabled = true, audioEnabled = true) => {
      // Simplified implementation
      console.log('initConnection called with', { videoEnabled, audioEnabled });
      return new RTCConnection(options);
    },
    startScreenShare: async () => {
      // Simplified implementation
      console.log('startScreenShare called');
      return await MediaHelper.getDisplayMedia();
    }
  };
}

// Export all components
module.exports = {
  RTCConnection,
  MediaHelper,
  WebSocketSignaling,
  useWebRTC: useWebRTCReact,
  useWebRTCReact,
  useWebRTCVue
};

// For browser usage
if (typeof window !== 'undefined') {
  window.WebRTCEasy = module.exports;
}

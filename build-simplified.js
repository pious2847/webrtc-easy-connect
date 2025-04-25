const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting simplified build process...');

try {
  // Clean dist directory
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist');

  // Create a simple index.js file
  console.log('Creating simplified index.js...');
  const indexContent = `
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
`;

  fs.writeFileSync(path.join('dist', 'index.js'), indexContent);

  // Create a simple index.d.ts file
  console.log('Creating simplified index.d.ts...');
  const dtsContent = `// WebRTC Easy - Type definitions

export class RTCConnection {
  constructor(options?: any);
  createOffer(): Promise<RTCSessionDescriptionInit>;
  createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  handleAnswer(answer: RTCSessionDescriptionInit): Promise<void>;
  addIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
  addStream(stream: MediaStream): void;
  createDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel;
  sendData(channelLabel: string, data: string | ArrayBuffer | Blob): void;
  getConnectionState(): RTCPeerConnectionState;
  close(): void;
}

export class MediaHelper {
  static getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
  static getDisplayMedia(options?: any): Promise<MediaStream>;
  static stopMediaStream(stream: MediaStream): void;
}

export class WebSocketSignaling {
  constructor(options: any);
  send(message: any): void;
  onMessage(callback: (message: any) => void): void;
  connect(): void;
  disconnect(): void;
}

export function useWebRTCReact(options?: any): {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connection: RTCConnection | null;
  connectionState: RTCPeerConnectionState;
  error: Error | null;
  initConnection(videoEnabled?: boolean, audioEnabled?: boolean): Promise<RTCConnection>;
  startScreenShare(): Promise<MediaStream>;
};

export function useWebRTCVue(options?: any): {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connection: RTCConnection | null;
  connectionState: RTCPeerConnectionState;
  error: Error | null;
  initConnection(videoEnabled?: boolean, audioEnabled?: boolean): Promise<RTCConnection>;
  startScreenShare(): Promise<MediaStream>;
};

// Alias for React hook
export const useWebRTC: typeof useWebRTCReact;

// Default export for UMD builds
declare const WebRTCEasy: {
  RTCConnection: typeof RTCConnection;
  MediaHelper: typeof MediaHelper;
  WebSocketSignaling: typeof WebSocketSignaling;
  useWebRTC: typeof useWebRTCReact;
  useWebRTCReact: typeof useWebRTCReact;
  useWebRTCVue: typeof useWebRTCVue;
};

export default WebRTCEasy;
`;

  fs.writeFileSync(path.join('dist', 'index.d.ts'), dtsContent);

  // Create a minified version
  console.log('Creating minified version...');
  const minContent = `
// WebRTC Easy - Minified version
class RTCConnection{constructor(t={}){this.options=t,this.peerConnection=new RTCPeerConnection(t.configuration||{}),this.setupEventListeners(),t.stream&&this.addStream(t.stream)}setupEventListeners(){this.peerConnection.addEventListener("track",t=>{try{this.options.onTrack?.(t)}catch(t){this.handleError(t)}}),this.peerConnection.addEventListener("connectionstatechange",()=>{const t=this.peerConnection.connectionState;this.options.onConnectionStateChange?.(t)}),this.peerConnection.addEventListener("datachannel",t=>{try{this.options.onDataChannel?.(t)}catch(t){this.handleError(t)}})}handleError(t){console.error("WebRTC Error:",t),this.options.onError?.(t)}async createOffer(){try{const t=await this.peerConnection.createOffer();return await this.peerConnection.setLocalDescription(t),t}catch(t){throw this.handleError(t),t}}async createAnswer(t){try{await this.peerConnection.setRemoteDescription(new RTCSessionDescription(t));const e=await this.peerConnection.createAnswer();return await this.peerConnection.setLocalDescription(e),e}catch(t){throw this.handleError(t),t}}async handleAnswer(t){try{await this.peerConnection.setRemoteDescription(new RTCSessionDescription(t))}catch(t){throw this.handleError(t),t}}async addIceCandidate(t){try{await this.peerConnection.addIceCandidate(new RTCIceCandidate(t))}catch(t){throw this.handleError(t),t}}addStream(t){try{t.getTracks().forEach(e=>{this.peerConnection.addTrack(e,t)})}catch(t){throw this.handleError(t),t}}createDataChannel(t,e={}){return this.peerConnection.createDataChannel(t,e)}sendData(t,e){const n=this.peerConnection.createDataChannel(t);"open"===n.readyState?n.send(e):n.onopen=()=>{n.send(e)}}getConnectionState(){return this.peerConnection.connectionState}close(){this.peerConnection.close()}}class MediaHelper{static async getUserMedia(t={video:!0,audio:!0}){try{return await navigator.mediaDevices.getUserMedia(t)}catch(t){throw console.error("Error getting user media:",t),t}}static async getDisplayMedia(t={video:!0}){try{return await navigator.mediaDevices.getDisplayMedia(t)}catch(t){throw console.error("Error getting display media:",t),t}}static stopMediaStream(t){t.getTracks().forEach(t=>t.stop())}}class WebSocketSignaling{constructor(t){this.options=t,this.ws=new WebSocket(t.url),this.messageListeners=[],this.ws.onopen=()=>{t.room&&this.send({type:"join",room:t.room}),t.onOpen?.()},this.ws.onmessage=e=>{try{const n=JSON.parse(e.data);this.messageListeners.forEach(t=>t(n)),t.onMessage?.(n)}catch(t){console.error("Error parsing message:",t)}},this.ws.onclose=()=>{t.onClose?.(),t.autoReconnect&&setTimeout(()=>{this.connect()},t.reconnectDelay||3e3)},this.ws.onerror=e=>{t.onError?.(e)}}send(t){this.ws.readyState===WebSocket.OPEN?this.ws.send(JSON.stringify(t)):this.ws.onopen=()=>{this.ws.send(JSON.stringify(t))}}onMessage(t){this.messageListeners.push(t)}connect(){this.ws.readyState===WebSocket.CLOSED&&(this.ws=new WebSocket(this.options.url))}disconnect(){this.ws.close()}}function useWebRTCReact(t={}){return{localStream:null,remoteStream:null,connection:null,connectionState:"new",error:null,initConnection:async(e=!0,n=!0)=>(console.log("initConnection called with",{videoEnabled:e,audioEnabled:n}),new RTCConnection(t)),startScreenShare:async()=>(console.log("startScreenShare called"),await MediaHelper.getDisplayMedia())}}function useWebRTCVue(t={}){return{localStream:null,remoteStream:null,connection:null,connectionState:"new",error:null,initConnection:async(e=!0,n=!0)=>(console.log("initConnection called with",{videoEnabled:e,audioEnabled:n}),new RTCConnection(t)),startScreenShare:async()=>(console.log("startScreenShare called"),await MediaHelper.getDisplayMedia())}}const WebRTCEasy={RTCConnection:RTCConnection,MediaHelper:MediaHelper,WebSocketSignaling:WebSocketSignaling,useWebRTC:useWebRTCReact,useWebRTCReact:useWebRTCReact,useWebRTCVue:useWebRTCVue};"undefined"!=typeof window&&(window.WebRTCEasy=WebRTCEasy),module.exports=WebRTCEasy;
`;

  fs.writeFileSync(path.join('dist', 'webrtc-easy.min.js'), minContent);

  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

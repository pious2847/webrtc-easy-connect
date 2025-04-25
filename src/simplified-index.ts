// Export a simplified version of the library with just the core functionality
// This is a temporary solution until all TypeScript errors are fixed

// Basic WebRTC functionality
export class RTCConnection {
  private peerConnection: RTCPeerConnection;
  private options: any;

  constructor(options: any = {}) {
    this.options = options;
    this.peerConnection = new RTCPeerConnection(options.configuration || {});
    this.setupEventListeners();
    
    // Add stream if provided
    if (options.stream) {
      this.addStream(options.stream);
    }
  }

  private setupEventListeners() {
    // Handle tracks
    this.peerConnection.addEventListener('track', (event) => {
      try {
        this.options.onTrack?.(event);
      } catch (error) {
        this.handleError(error as Error);
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
        this.handleError(error as Error);
      }
    });
  }

  private handleError(error: Error) {
    console.error('WebRTC Error:', error);
    this.options.onError?.(error);
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  public async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  public addStream(stream: MediaStream): void {
    try {
      stream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, stream);
      });
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  public createDataChannel(label: string, options: RTCDataChannelInit = {}): RTCDataChannel {
    return this.peerConnection.createDataChannel(label, options);
  }

  public sendData(channelLabel: string, data: string | ArrayBuffer | Blob): void {
    const channel = this.peerConnection.createDataChannel(channelLabel);
    if (channel.readyState === 'open') {
      channel.send(data);
    } else {
      channel.onopen = () => {
        channel.send(data);
      };
    }
  }

  public getConnectionState(): RTCPeerConnectionState {
    return this.peerConnection.connectionState;
  }

  public close(): void {
    this.peerConnection.close();
  }
}

// Media helper
export class MediaHelper {
  static async getUserMedia(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }
  }

  static async getDisplayMedia(options: any = { video: true }): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getDisplayMedia(options);
    } catch (error) {
      console.error('Error getting display media:', error);
      throw error;
    }
  }

  static stopMediaStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => track.stop());
  }
}

// Simple WebSocket signaling
export class WebSocketSignaling {
  private ws: WebSocket;
  private options: any;
  private messageListeners: ((message: any) => void)[] = [];

  constructor(options: any) {
    this.options = options;
    this.ws = new WebSocket(options.url);
    
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

  public send(message: any): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.ws.onopen = () => {
        this.ws.send(JSON.stringify(message));
      };
    }
  }

  public onMessage(callback: (message: any) => void): void {
    this.messageListeners.push(callback);
  }

  public connect(): void {
    if (this.ws.readyState === WebSocket.CLOSED) {
      this.ws = new WebSocket(this.options.url);
    }
  }

  public disconnect(): void {
    this.ws.close();
  }
}

// React hook (simplified)
export const useWebRTCReact = (options: any = {}) => {
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
};

// Vue composable (simplified)
export const useWebRTCVue = (options: any = {}) => {
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
};

// Export a default object for UMD builds
const WebRTCEasy = {
  RTCConnection,
  MediaHelper,
  WebSocketSignaling,
  useWebRTCReact,
  useWebRTCVue
};

export default WebRTCEasy;

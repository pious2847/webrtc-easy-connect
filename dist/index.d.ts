// WebRTC Easy - Type definitions

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

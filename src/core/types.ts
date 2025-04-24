export interface RTCConfiguration {
  iceServers?: RTCIceServer[];
  iceTransportPolicy?: RTCIceTransportPolicy;
  bundlePolicy?: RTCBundlePolicy;
}

export interface ConnectionOptions {
  configuration?: RTCConfiguration;
  stream?: MediaStream;
  onTrack?: (event: RTCTrackEvent) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onDataChannel?: (event: RTCDataChannelEvent) => void;
  onError?: (error: Error) => void;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: any;
}

export enum WebRTCErrorCode {
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  MEDIA_ACCESS_ERROR = 'MEDIA_ACCESS_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  SIGNALING_ERROR = 'SIGNALING_ERROR',
  SCREEN_SHARE_ERROR = 'SCREEN_SHARE_ERROR',
  PEER_CONNECTION_ERROR = 'PEER_CONNECTION_ERROR'
}

export class WebRTCError extends Error {
  constructor(
    message: string,
    public code: WebRTCErrorCode,
    public originalError?: Error,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WebRTCError';
  }
}

export interface WebRTCHookOptions extends ConnectionOptions {
  autoInitialize?: boolean;
  defaultMediaConstraints?: {
    video?: boolean | MediaTrackConstraints;
    audio?: boolean | MediaTrackConstraints;
  };
}

export interface WebRTCHookResult {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connection: RTCConnection | null;
  connectionState: RTCPeerConnectionState;
  error: Error | null;
  initConnection: (videoEnabled?: boolean, audioEnabled?: boolean) => Promise<RTCConnection>;
  startScreenShare: () => Promise<MediaStream>;
  stopStream: () => void;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
}


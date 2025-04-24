// Core exports
export { RTCConnection } from './core/connection';
export { MediaHelper } from './core/media';
export { WebSocketSignaling } from './core/websocket-signaling';
export type { 
  ConnectionOptions,
  RTCConfiguration,
  SignalingMessage,
  WebRTCError
} from './core/types';

// React exports
export { useWebRTC as useWebRTCReact } from './frameworks/react/hooks';

// Vue exports
export { useWebRTC as useWebRTCVue } from './frameworks/vue/composables';
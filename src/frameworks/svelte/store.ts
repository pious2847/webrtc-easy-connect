import { writable, derived } from 'svelte/store';
import { RTCConnection } from '../../core/connection';
import { MediaHelper } from '../../core/media';
import { ConnectionOptions, WebRTCError } from '../../core/types';

export function createWebRTCStore(options: ConnectionOptions = {}) {
  const localStream = writable<MediaStream | null>(null);
  const remoteStream = writable<MediaStream | null>(null);
  const connection = writable<RTCConnection | null>(null);
  const connectionState = writable<RTCPeerConnectionState>('new');
  const error = writable<Error | null>(null);

  const handleError = (err: Error) => {
    error.set(err);
    options.onError?.(err);
  };

  const initConnection = async (videoEnabled = true, audioEnabled = true) => {
    try {
      error.set(null);
      const stream = await MediaHelper.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      
      localStream.set(stream);
      
      const conn = new RTCConnection({
        ...options,
        stream,
        onTrack: (event) => {
          remoteStream.set(new MediaStream(event.streams[0].getTracks()));
        },
        onConnectionStateChange: (state) => {
          connectionState.set(state);
          options.onConnectionStateChange?.(state);
        },
        onError: handleError
      });

      connection.set(conn);
      return conn;
    } catch (err) {
      const webRTCError = new WebRTCError(
        'Failed to initialize connection',
        'INIT_CONNECTION_ERROR',
        err as Error
      );
      handleError(webRTCError);
      throw webRTCError;
    }
  };

  const startScreenShare = async () => {
    try {
      error.set(null);
      const stream = await MediaHelper.getDisplayMedia();
      connection.subscribe(conn => conn?.addStream(stream));
      return stream;
    } catch (err) {
      const webRTCError = new WebRTCError(
        'Failed to start screen sharing',
        'SCREEN_SHARE_ERROR',
        err as Error
      );
      handleError(webRTCError);
      throw webRTCError;
    }
  };

  const cleanup = () => {
    connection.subscribe(conn => conn?.close());
    localStream.subscribe(stream => {
      if (stream) {
        MediaHelper.stopMediaStream(stream);
      }
    });
  };

  return {
    localStream: { subscribe: localStream.subscribe },
    remoteStream: { subscribe: remoteStream.subscribe },
    connection: { subscribe: connection.subscribe },
    connectionState: { subscribe: connectionState.subscribe },
    error: { subscribe: error.subscribe },
    initConnection,
    startScreenShare,
    cleanup
  };
}
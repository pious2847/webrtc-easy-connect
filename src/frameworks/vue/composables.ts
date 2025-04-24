import { ref, onUnmounted, watch } from 'vue';
import { RTCConnection } from '../../core/connection';
import { MediaHelper } from '../../core/media';
import { ConnectionOptions, WebRTCError } from '../../core/types';

export function useWebRTC(options: ConnectionOptions = {}) {
  const localStream = ref<MediaStream | null>(null);
  const remoteStream = ref<MediaStream | null>(null);
  const connection = ref<RTCConnection | null>(null);
  const connectionState = ref<RTCPeerConnectionState>('new');
  const error = ref<Error | null>(null);

  const handleError = (err: Error) => {
    error.value = err;
    options.onError?.(err);
  };

  onUnmounted(() => {
    connection.value?.close();
    if (localStream.value) {
      MediaHelper.stopMediaStream(localStream.value);
    }
  });

  const initConnection = async (videoEnabled = true, audioEnabled = true) => {
    try {
      error.value = null;
      const stream = await MediaHelper.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      
      localStream.value = stream;
      
      connection.value = new RTCConnection({
        ...options,
        stream,
        onTrack: (event) => {
          remoteStream.value = new MediaStream(event.streams[0].getTracks());
        },
        onConnectionStateChange: (state) => {
          connectionState.value = state;
          options.onConnectionStateChange?.(state);
        },
        onError: handleError
      });

      return connection.value;
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
      error.value = null;
      const stream = await MediaHelper.getDisplayMedia();
      connection.value?.addStream(stream);
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

  return {
    localStream,
    remoteStream,
    connection,
    connectionState,
    error,
    initConnection,
    startScreenShare
  };
}

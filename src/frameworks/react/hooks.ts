import { useEffect, useRef, useState, useCallback } from 'react';
import { RTCConnection } from '../../core/connection';
import { MediaHelper } from '../../core/media';
import { ConnectionOptions, WebRTCError } from '../../core/types';

export function useWebRTC(options: ConnectionOptions = {}) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [error, setError] = useState<Error | null>(null);
  const connectionRef = useRef<RTCConnection | null>(null);

  const handleError = useCallback((error: Error) => {
    setError(error);
    options.onError?.(error);
  }, [options.onError]);

  useEffect(() => {
    return () => {
      connectionRef.current?.close();
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const initConnection = async (videoEnabled = true, audioEnabled = true) => {
    try {
      setError(null);
      const stream = await MediaHelper.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      
      setLocalStream(stream);
      
      connectionRef.current = new RTCConnection({
        ...options,
        stream,
        onTrack: (event) => {
          setRemoteStream(new MediaStream(event.streams[0].getTracks()));
        },
        onConnectionStateChange: (state) => {
          setConnectionState(state);
          options.onConnectionStateChange?.(state);
        },
        onError: handleError
      });

      return connectionRef.current;
    } catch (error) {
      const webRTCError = new WebRTCError(
        'Failed to initialize connection',
        'INIT_CONNECTION_ERROR',
        error as Error
      );
      handleError(webRTCError);
      throw webRTCError;
    }
  };

  const startScreenShare = async () => {
    try {
      setError(null);
      const stream = await MediaHelper.getDisplayMedia();
      connectionRef.current?.addStream(stream);
      return stream;
    } catch (error) {
      const webRTCError = new WebRTCError(
        'Failed to start screen sharing',
        'SCREEN_SHARE_ERROR',
        error as Error
      );
      handleError(webRTCError);
      throw webRTCError;
    }
  };

  return {
    localStream,
    remoteStream,
    connection: connectionRef.current,
    connectionState,
    error,
    initConnection,
    startScreenShare
  };
}

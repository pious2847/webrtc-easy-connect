import React, { useCallback, useState } from 'react';
import { useWebRTC } from 'webrtc-easy/react';
import { WebSocketSignaling } from 'webrtc-easy/core';

const VideoConference: React.FC = () => {
  const [signaling, setSignaling] = useState<WebSocketSignaling | null>(null);
  const { 
    localStream, 
    remoteStream, 
    connection,
    connectionState,
    error,
    initConnection, 
    startScreenShare 
  } = useWebRTC({
    configuration: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  });

  const handleStart = async () => {
    try {
      const conn = await initConnection();
      
      const ws = new WebSocketSignaling({
        url: 'wss://your-signaling-server.com',
        room: 'test-room',
        autoReconnect: true
      });

      ws.onMessage(async (message) => {
        switch (message.type) {
          case 'offer':
            const answer = await conn.createAnswer(message.payload);
            ws.send({ type: 'answer', payload: answer });
            break;
          case 'answer':
            await conn.handleAnswer(message.payload);
            break;
          case 'ice-candidate':
            await conn.addIceCandidate(message.payload);
            break;
        }
      });

      setSignaling(ws);

      // Create and send offer
      const offer = await conn.createOffer();
      ws.send({ type: 'offer', payload: offer });
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  };

  const handleScreenShare = async () => {
    try {
      await startScreenShare();
    } catch (err) {
      console.error('Failed to share screen:', err);
    }
  };

  const handleDisconnect = useCallback(() => {
    signaling?.disconnect();
    setSignaling(null);
  }, [signaling]);

  return (
    <div className="video-conference">
      <div className="controls">
        <button 
          onClick={handleStart}
          disabled={!!signaling}
        >
          Start Call
        </button>
        <button 
          onClick={handleScreenShare}
          disabled={!signaling}
        >
          Share Screen
        </button>
        <button 
          onClick={handleDisconnect}
          disabled={!signaling}
        >
          End Call
        </button>
      </div>

      {error && (
        <div className="error-message">
          Error: {error.message}
        </div>
      )}

      <div className="connection-status">
        Connection: {connectionState}
      </div>

      <div className="video-streams">
        <div className="local-stream">
          <h3>Local Stream</h3>
          {localStream && (
            <video
              autoPlay
              playsInline
              muted
              ref={video => {
                if (video) video.srcObject = localStream;
              }}
            />
          )}
        </div>

        <div className="remote-stream">
          <h3>Remote Stream</h3>
          {remoteStream && (
            <video
              autoPlay
              playsInline
              ref={video => {
                if (video) video.srcObject = remoteStream;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoConference;
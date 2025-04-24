import React from 'react';
import { useWebRTC } from 'webrtc-easy/react';

const VideoChat: React.FC = () => {
  const { 
    localStream, 
    remoteStream, 
    initConnection, 
    startScreenShare 
  } = useWebRTC({
    configuration: {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    }
  });

  const handleStart = async () => {
    const connection = await initConnection();
    // Connect to signaling server and establish connection
  };

  const handleScreenShare = async () => {
    await startScreenShare();
  };

  return (
    <div>
      <button onClick={handleStart}>Start Call</button>
      <button onClick={handleScreenShare}>Share Screen</button>
      
      <div>
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

      <div>
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
  );
};

export default VideoChat;
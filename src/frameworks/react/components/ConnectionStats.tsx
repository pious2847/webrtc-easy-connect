import React, { useState, useEffect } from 'react';
import { RTCStatsReport } from '../../../core/stats-manager';

interface ConnectionStatsProps {
  connection: RTCConnection;
  interval?: number;
}

export const ConnectionStats: React.FC<ConnectionStatsProps> = ({
  connection,
  interval = 1000
}) => {
  const [stats, setStats] = useState<RTCStatsReport | null>(null);

  useEffect(() => {
    connection.startStatsMonitoring(interval, setStats);
    return () => connection.stopStatsMonitoring();
  }, [connection, interval]);

  if (!stats) return null;

  const formatBitrate = (bytes: number) => {
    return `${((bytes * 8) / 1000000).toFixed(2)} Mbps`;
  };

  return (
    <div className="connection-stats">
      <h3>Connection Statistics</h3>
      
      <div className="stats-grid">
        {stats.video && (
          <div className="stats-section">
            <h4>Video</h4>
            <p>Received: {formatBitrate(stats.video.bytesReceived)}</p>
            <p>Sent: {formatBitrate(stats.video.bytesSent)}</p>
            <p>Packets Lost: {stats.video.packetsLost}</p>
            {stats.video.frameRate && (
              <p>Frame Rate: {stats.video.frameRate} fps</p>
            )}
            {stats.video.resolution && (
              <p>Resolution: {stats.video.resolution.width}x{stats.video.resolution.height}</p>
            )}
          </div>
        )}

        {stats.audio && (
          <div className="stats-section">
            <h4>Audio</h4>
            <p>Received: {formatBitrate(stats.audio.bytesReceived)}</p>
            <p>Sent: {formatBitrate(stats.audio.bytesSent)}</p>
            <p>Packets Lost: {stats.audio.packetsLost}</p>
          </div>
        )}

        <div className="stats-section">
          <h4>Connection</h4>
          <p>Local: {stats.connection.localCandidateType}</p>
          <p>Remote: {stats.connection.remoteCandidateType}</p>
          {stats.connection.currentRoundTripTime && (
            <p>RTT: {(stats.connection.currentRoundTripTime * 1000).toFixed(2)} ms</p>
          )}
          {stats.connection.availableOutgoingBitrate && (
            <p>Available Outgoing: {formatBitrate(stats.connection.availableOutgoingBitrate)}</p>
          )}
          {stats.connection.availableIncomingBitrate && (
            <p>Available Incoming: {formatBitrate(stats.connection.availableIncomingBitrate)}</p>
          )}
        </div>
      </div>

      <style jsx>{`
        .connection-stats {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .stats-section {
          background: white;
          padding: 1rem;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        h3, h4 {
          margin: 0 0 1rem 0;
        }

        p {
          margin: 0.5rem 0;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { NetworkQualityMetrics } from '../../../core/network-quality';

interface NetworkQualityIndicatorProps {
  connection: RTCConnection;
}

export const NetworkQualityIndicator: React.FC<NetworkQualityIndicatorProps> = ({
  connection
}) => {
  const [metrics, setMetrics] = useState<NetworkQualityMetrics | null>(null);

  useEffect(() => {
    connection.startNetworkMonitoring(setMetrics);
    return () => connection.stopNetworkMonitoring();
  }, [connection]);

  if (!metrics) return null;

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'fair': return '#FFC107';
      case 'poor': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const formatBitrate = (bps: number) => {
    return `${(bps / 1000000).toFixed(1)} Mbps`;
  };

  return (
    <div className="network-quality">
      <div className="quality-indicator">
        <div 
          className="quality-dot"
          style={{ backgroundColor: getQualityColor(metrics.quality) }}
        />
        <span className="quality-label">
          {metrics.quality.charAt(0).toUpperCase() + metrics.quality.slice(1)}
        </span>
      </div>

      <div className="metrics-details">
        <div className="metric">
          <span>Score:</span>
          <span>{metrics.score}/100</span>
        </div>
        <div className="metric">
          <span>RTT:</span>
          <span>{Math.round(metrics.roundTripTime)}ms</span>
        </div>
        <div className="metric">
          <span>Packet Loss:</span>
          <span>{metrics.packetLoss.toFixed(1)}%</span>
        </div>
        <div className="metric">
          <span>Bitrate:</span>
          <span>{formatBitrate(metrics.bandwidth.current)}</span>
        </div>
      </div>

      <style jsx>{`
        .network-quality {
          background: #f5f5f5;
          padding: 1rem;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .quality-indicator {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }

        .quality-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 8px;
        }

        .quality-label {
          font-weight: 500;
        }

        .metrics-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
        }

        .metric {
          display: flex;
          flex-direction: column;
          font-size: 0.9rem;
        }

        .metric span:first-child {
          color: #666;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
};
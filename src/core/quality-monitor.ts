export interface QualityMetrics {
  jitter: number;
  packetsLost: number;
  roundTripTime: number;
  bandwidth: number;
  frameRate?: number;
  resolution?: {
    width: number;
    height: number;
  };
}

export class QualityMonitor {
  private connection: RTCPeerConnection;
  private interval: NodeJS.Timeout | null = null;
  private metrics: QualityMetrics = {
    jitter: 0,
    packetsLost: 0,
    roundTripTime: 0,
    bandwidth: 0
  };

  constructor(connection: RTCPeerConnection) {
    this.connection = connection;
  }

  startMonitoring(callback: (metrics: QualityMetrics) => void): void {
    this.interval = setInterval(async () => {
      const stats = await this.connection.getStats();
      this.updateMetrics(stats);
      callback(this.metrics);
    }, 1000);
  }

  private updateMetrics(stats: RTCStatsReport): void {
    stats.forEach(report => {
      if (report.type === 'inbound-rtp') {
        this.metrics.jitter = report.jitter || 0;
        this.metrics.packetsLost = report.packetsLost || 0;
        
        if (report.kind === 'video') {
          this.metrics.frameRate = report.framesPerSecond;
          this.metrics.resolution = {
            width: report.frameWidth,
            height: report.frameHeight
          };
        }
      } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        this.metrics.roundTripTime = report.currentRoundTripTime || 0;
        this.metrics.bandwidth = report.availableOutgoingBitrate || 0;
      }
    });
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
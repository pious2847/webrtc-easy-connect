// Use number type for timeout IDs instead of NodeJS.Timeout

export interface ConnectionQuality {
  score: number;  // 0-1
  level: 'excellent' | 'good' | 'fair' | 'poor';
  metrics: {
    rtt: number;
    packetLoss: number;
    jitter: number;
    bandwidth: number;
    frameRate?: number;
  };
}

export class QualityAnalyzer {
  private connection: RTCPeerConnection;
  private readonly SAMPLE_INTERVAL = 2000;
  private readonly SAMPLE_SIZE = 5;
  private samples: ConnectionQuality[] = [];

  constructor(connection: RTCPeerConnection) {
    this.connection = connection;
  }

  async analyzeQuality(): Promise<ConnectionQuality> {
    const stats = await this.connection.getStats();
    const metrics = this.extractMetrics(stats);
    const quality = this.calculateQuality(metrics);

    this.samples.push(quality);
    if (this.samples.length > this.SAMPLE_SIZE) {
      this.samples.shift();
    }

    return this.getAverageQuality();
  }

  private extractMetrics(stats: RTCStatsReport) {
    const metrics = {
      rtt: 0,
      packetLoss: 0,
      jitter: 0,
      bandwidth: 0,
      frameRate: 0
    };

    stats.forEach(report => {
      if (report.type === 'remote-inbound-rtp') {
        metrics.rtt = report.roundTripTime || 0;
        metrics.packetLoss = report.packetsLost || 0;
        metrics.jitter = report.jitter || 0;
      } else if (report.type === 'media-source' && report.kind === 'video') {
        metrics.frameRate = report.framesPerSecond || 0;
      }
    });

    return metrics;
  }

  private calculateQuality(metrics: any): ConnectionQuality {
    const rttScore = Math.max(0, 1 - (metrics.rtt / 300));
    const lossScore = Math.max(0, 1 - (metrics.packetLoss / 100));
    const jitterScore = Math.max(0, 1 - (metrics.jitter / 50));

    const score = (rttScore + lossScore + jitterScore) / 3;

    return {
      score,
      level: this.getQualityLevel(score),
      metrics
    };
  }

  private getQualityLevel(score: number): ConnectionQuality['level'] {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  }

  private getAverageQuality(): ConnectionQuality {
    const avgScore = this.samples.reduce((sum, q) => sum + q.score, 0) / this.samples.length;

    return {
      score: avgScore,
      level: this.getQualityLevel(avgScore),
      metrics: this.samples[this.samples.length - 1].metrics
    };
  }

  private monitorInterval: number | null = null;

  startMonitoring(callback: (quality: ConnectionQuality) => void): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    this.monitorInterval = setInterval(async () => {
      const quality = await this.analyzeQuality();
      callback(quality);
    }, this.SAMPLE_INTERVAL);
  }

  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
  }
}
export interface AdaptiveStreamingConfig {
  maxBitrate: number;
  minBitrate: number;
  targetQuality: number;  // 0-1
  adaptationInterval: number;
}

export class AdaptiveStreaming {
  private qualityMonitor: QualityMonitor;
  private bandwidthManager: BandwidthManager;
  private config: AdaptiveStreamingConfig;
  private interval: NodeJS.Timeout | null = null;

  constructor(
    connection: RTCPeerConnection,
    config: Partial<AdaptiveStreamingConfig> = {}
  ) {
    this.qualityMonitor = new QualityMonitor(connection);
    this.bandwidthManager = new BandwidthManager(connection);
    this.config = {
      maxBitrate: config.maxBitrate || 2500,
      minBitrate: config.minBitrate || 100,
      targetQuality: config.targetQuality || 0.8,
      adaptationInterval: config.adaptationInterval || 2000
    };
  }

  start(): void {
    this.qualityMonitor.startMonitoring(metrics => {
      this.adaptStreaming(metrics);
    });

    this.interval = setInterval(() => {
      this.checkAndAdjustQuality();
    }, this.config.adaptationInterval);
  }

  private async adaptStreaming(metrics: QualityMetrics): Promise<void> {
    const quality = this.calculateQualityScore(metrics);
    
    if (quality < this.config.targetQuality) {
      const newBitrate = Math.max(
        this.config.minBitrate,
        metrics.bandwidth * 0.8
      );

      await this.bandwidthManager.setBandwidthConstraints({
        video: newBitrate,
        audio: 64  // Keep audio bitrate constant
      });
    } else if (quality > this.config.targetQuality + 0.1) {
      const newBitrate = Math.min(
        this.config.maxBitrate,
        metrics.bandwidth * 1.2
      );

      await this.bandwidthManager.setBandwidthConstraints({
        video: newBitrate,
        audio: 64
      });
    }
  }

  private calculateQualityScore(metrics: QualityMetrics): number {
    const jitterScore = Math.max(0, 1 - metrics.jitter / 50);
    const lossScore = Math.max(0, 1 - metrics.packetsLost / 100);
    const rttScore = Math.max(0, 1 - metrics.roundTripTime / 300);

    return (jitterScore + lossScore + rttScore) / 3;
  }

  stop(): void {
    this.qualityMonitor.stop();
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
export interface NetworkQualityMetrics {
  roundTripTime: number;
  packetLoss: number;
  bandwidth: {
    available: number;
    current: number;
  };
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number; // 0-100
}

export interface NetworkAdaptationConfig {
  minBitrate: number;
  maxBitrate: number;
  targetPacketLoss: number;
  rttThreshold: number;
  adaptationInterval: number;
}

export class NetworkQualityMonitor {
  private peerConnection: RTCPeerConnection;
  private config: NetworkAdaptationConfig;
  private metrics: NetworkQualityMetrics;
  private adaptationInterval: NodeJS.Timeout | null = null;
  private onQualityChange?: (metrics: NetworkQualityMetrics) => void;

  constructor(
    peerConnection: RTCPeerConnection,
    config: Partial<NetworkAdaptationConfig> = {}
  ) {
    this.peerConnection = peerConnection;
    this.config = {
      minBitrate: 100000,    // 100 kbps
      maxBitrate: 2500000,   // 2.5 Mbps
      targetPacketLoss: 2,   // 2%
      rttThreshold: 300,     // 300ms
      adaptationInterval: 2000, // 2 seconds
      ...config
    };

    this.metrics = {
      roundTripTime: 0,
      packetLoss: 0,
      bandwidth: {
        available: this.config.maxBitrate,
        current: this.config.maxBitrate
      },
      quality: 'excellent',
      score: 100
    };
  }

  startMonitoring(callback?: (metrics: NetworkQualityMetrics) => void) {
    this.onQualityChange = callback;
    this.adaptationInterval = setInterval(
      () => this.updateMetrics(),
      this.config.adaptationInterval
    );
  }

  stopMonitoring() {
    if (this.adaptationInterval) {
      clearInterval(this.adaptationInterval);
      this.adaptationInterval = null;
    }
  }

  private async updateMetrics() {
    const stats = await this.peerConnection.getStats();
    let totalPackets = 0;
    let lostPackets = 0;
    let rtt = 0;

    stats.forEach(stat => {
      if (stat.type === 'inbound-rtp') {
        totalPackets += stat.packetsReceived || 0;
        lostPackets += stat.packetsLost || 0;
      } else if (stat.type === 'candidate-pair' && stat.nominated) {
        rtt = (stat.currentRoundTripTime || 0) * 1000;
      }
    });

    this.metrics.roundTripTime = rtt;
    this.metrics.packetLoss = totalPackets > 0 
      ? (lostPackets / totalPackets) * 100 
      : 0;

    this.updateQualityScore();
    this.adaptBitrate();
    this.onQualityChange?.(this.metrics);
  }

  private updateQualityScore(): void {
    const rttScore = Math.max(0, 100 - (this.metrics.roundTripTime / this.config.rttThreshold) * 100);
    const lossScore = Math.max(0, 100 - (this.metrics.packetLoss / this.config.targetPacketLoss) * 100);
    const bandwidthScore = (this.metrics.bandwidth.current / this.config.maxBitrate) * 100;

    this.metrics.score = Math.round((rttScore + lossScore + bandwidthScore) / 3);

    this.metrics.quality = 
      this.metrics.score >= 80 ? 'excellent' :
      this.metrics.score >= 60 ? 'good' :
      this.metrics.score >= 40 ? 'fair' : 'poor';
  }

  private adaptBitrate(): void {
    const sender = this.peerConnection
      .getSenders()
      .find(s => s.track?.kind === 'video');

    if (!sender) return;

    const parameters = sender.getParameters();
    if (!parameters.encodings?.length) return;

    let newBitrate = this.metrics.bandwidth.current;

    if (this.metrics.packetLoss > this.config.targetPacketLoss || 
        this.metrics.roundTripTime > this.config.rttThreshold) {
      newBitrate = Math.max(
        this.config.minBitrate,
        newBitrate * 0.8
      );
    } else if (this.metrics.quality === 'excellent') {
      newBitrate = Math.min(
        this.config.maxBitrate,
        newBitrate * 1.2
      );
    }

    parameters.encodings[0].maxBitrate = newBitrate;
    sender.setParameters(parameters);
    
    this.metrics.bandwidth.current = newBitrate;
  }

  getMetrics(): NetworkQualityMetrics {
    return { ...this.metrics };
  }
}

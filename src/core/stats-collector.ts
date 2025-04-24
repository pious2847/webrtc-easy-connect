export interface DetailedStats {
  video: {
    inbound: {
      framesReceived: number;
      framesDropped: number;
      frameRate: number;
      bytesReceived: number;
      packetsLost: number;
      jitter: number;
    };
    outbound: {
      framesSent: number;
      bytesSent: number;
      qualityLimitationReason: string;
      encoderImplementation: string;
    };
  };
  audio: {
    inbound: {
      bytesReceived: number;
      packetsLost: number;
      jitter: number;
      audioLevel: number;
    };
    outbound: {
      bytesSent: number;
      audioLevel: number;
    };
  };
  connection: {
    currentRoundTripTime: number;
    availableOutgoingBitrate: number;
    availableIncomingBitrate: number;
    networkType: string;
    transportType: string;
  };
}

export class StatsCollector {
  private lastStats?: DetailedStats;
  private intervalId?: NodeJS.Timeout;

  constructor(private peerConnection: RTCPeerConnection) {}

  async collectStats(): Promise<DetailedStats> {
    const stats = await this.peerConnection.getStats();
    const detailed: DetailedStats = this.initializeDetailedStats();

    stats.forEach(stat => {
      switch (stat.type) {
        case 'inbound-rtp':
          this.processInboundStats(stat, detailed);
          break;
        case 'outbound-rtp':
          this.processOutboundStats(stat, detailed);
          break;
        case 'transport':
          this.processTransportStats(stat, detailed);
          break;
        case 'media-source':
          this.processMediaSourceStats(stat, detailed);
          break;
      }
    });

    this.lastStats = detailed;
    return detailed;
  }

  private processInboundStats(stat: RTCInboundRtpStreamStats, detailed: DetailedStats) {
    if (stat.kind === 'video') {
      detailed.video.inbound = {
        framesReceived: stat.framesReceived,
        framesDropped: stat.framesDropped,
        frameRate: stat.framesPerSecond,
        bytesReceived: stat.bytesReceived,
        packetsLost: stat.packetsLost,
        jitter: stat.jitter
      };
    } else if (stat.kind === 'audio') {
      detailed.audio.inbound = {
        bytesReceived: stat.bytesReceived,
        packetsLost: stat.packetsLost,
        jitter: stat.jitter,
        audioLevel: stat.audioLevel
      };
    }
  }

  startCollecting(interval: number, callback: (stats: DetailedStats) => void) {
    this.intervalId = setInterval(async () => {
      const stats = await this.collectStats();
      callback(stats);
    }, interval);
  }

  stopCollecting() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }
}
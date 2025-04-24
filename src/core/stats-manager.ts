export interface RTCStatsReport {
  timestamp: number;
  audio?: {
    bytesReceived: number;
    bytesSent: number;
    packetsLost: number;
    roundTripTime?: number;
  };
  video?: {
    bytesReceived: number;
    bytesSent: number;
    packetsLost: number;
    frameRate?: number;
    resolution?: {
      width: number;
      height: number;
    };
  };
  connection: {
    localCandidateType?: string;
    remoteCandidateType?: string;
    currentRoundTripTime?: number;
    availableOutgoingBitrate?: number;
    availableIncomingBitrate?: number;
  };
}

export class StatsManager {
  private peerConnection: RTCPeerConnection;
  private statsInterval: NodeJS.Timeout | null = null;
  private onStats?: (stats: RTCStatsReport) => void;

  constructor(peerConnection: RTCPeerConnection) {
    this.peerConnection = peerConnection;
  }

  startMonitoring(interval: number = 1000, callback?: (stats: RTCStatsReport) => void) {
    this.onStats = callback;
    this.statsInterval = setInterval(() => this.gatherStats(), interval);
  }

  stopMonitoring() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private async gatherStats(): Promise<void> {
    const stats = await this.peerConnection.getStats();
    const report: RTCStatsReport = {
      timestamp: Date.now(),
      connection: {}
    };

    stats.forEach(stat => {
      switch (stat.type) {
        case 'inbound-rtp':
          this.processInboundRTP(stat, report);
          break;
        case 'outbound-rtp':
          this.processOutboundRTP(stat, report);
          break;
        case 'candidate-pair':
          if (stat.nominated) {
            this.processCandidatePair(stat, report);
          }
          break;
        case 'local-candidate':
        case 'remote-candidate':
          this.processCandidate(stat, report);
          break;
      }
    });

    this.onStats?.(report);
  }

  private processInboundRTP(stat: RTCInboundRtpStreamStats, report: RTCStatsReport) {
    const mediaType = stat.mediaType as 'audio' | 'video';
    if (!report[mediaType]) {
      report[mediaType] = {
        bytesReceived: 0,
        bytesSent: 0,
        packetsLost: 0
      };
    }

    report[mediaType]!.bytesReceived = stat.bytesReceived;
    report[mediaType]!.packetsLost = stat.packetsLost;

    if (mediaType === 'video' && stat.frameWidth && stat.frameHeight) {
      report.video!.resolution = {
        width: stat.frameWidth,
        height: stat.frameHeight
      };
      report.video!.frameRate = stat.framesPerSecond;
    }
  }

  private processOutboundRTP(stat: RTCOutboundRtpStreamStats, report: RTCStatsReport) {
    const mediaType = stat.mediaType as 'audio' | 'video';
    if (!report[mediaType]) {
      report[mediaType] = {
        bytesReceived: 0,
        bytesSent: 0,
        packetsLost: 0
      };
    }

    report[mediaType]!.bytesSent = stat.bytesSent;
  }

  private processCandidatePair(stat: RTCIceCandidatePairStats, report: RTCStatsReport) {
    report.connection.currentRoundTripTime = stat.currentRoundTripTime;
    report.connection.availableOutgoingBitrate = stat.availableOutgoingBitrate;
    report.connection.availableIncomingBitrate = stat.availableIncomingBitrate;
  }

  private processCandidate(stat: RTCIceCandidateStats, report: RTCStatsReport) {
    const candidateType = stat.candidateType;
    if (stat.type === 'local-candidate') {
      report.connection.localCandidateType = candidateType;
    } else if (stat.type === 'remote-candidate') {
      report.connection.remoteCandidateType = candidateType;
    }
  }
}
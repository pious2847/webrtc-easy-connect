export interface BandwidthConstraints {
  audio?: number;  // kbps
  video?: number;  // kbps
  total?: number;  // kbps
}

export class BandwidthManager {
  private connection: RTCPeerConnection;
  private currentConstraints?: BandwidthConstraints;

  constructor(connection: RTCPeerConnection) {
    this.connection = connection;
  }

  async setBandwidthConstraints(constraints: BandwidthConstraints): Promise<void> {
    this.currentConstraints = constraints;
    
    const senders = this.connection.getSenders();
    for (const sender of senders) {
      const params = sender.getParameters();
      if (!params.encodings) {
        params.encodings = [{}];
      }

      const encoding = params.encodings[0];
      const track = sender.track;

      if (track?.kind === 'audio' && constraints.audio) {
        encoding.maxBitrate = constraints.audio * 1000;
      } else if (track?.kind === 'video' && constraints.video) {
        encoding.maxBitrate = constraints.video * 1000;
      }

      await sender.setParameters(params);
    }
  }

  async enableSimulcast(videoTrack: MediaStreamTrack): Promise<void> {
    const sender = this.connection.getSenders()
      .find(s => s.track === videoTrack);

    if (sender) {
      const params = sender.getParameters();
      params.encodings = [
        { rid: 'low', maxBitrate: 150000, scaleResolutionDownBy: 4 },
        { rid: 'medium', maxBitrate: 500000, scaleResolutionDownBy: 2 },
        { rid: 'high', maxBitrate: 1500000 }
      ];
      await sender.setParameters(params);
    }
  }
}
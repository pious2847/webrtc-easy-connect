export interface DebugEvent {
  timestamp: number;
  type: 'ice' | 'signaling' | 'media' | 'data' | 'error';
  category: string;
  message: string;
  data?: any;
}

export class WebRTCDebugger {
  private events: DebugEvent[] = [];
  private maxEvents: number;
  private connection: RTCPeerConnection;
  private isEnabled: boolean = false;

  constructor(connection: RTCPeerConnection, maxEvents: number = 1000) {
    this.connection = connection;
    this.maxEvents = maxEvents;
  }

  enable(): void {
    this.isEnabled = true;
    this.attachConnectionListeners();
  }

  disable(): void {
    this.isEnabled = false;
    this.detachConnectionListeners();
  }

  private attachConnectionListeners(): void {
    this.connection.addEventListener('icecandidate', this.handleICEEvent);
    this.connection.addEventListener('icecandidateerror', this.handleICEError);
    this.connection.addEventListener('connectionstatechange', this.handleStateChange);
    this.connection.addEventListener('negotiationneeded', this.handleNegotiation);
    this.connection.addEventListener('track', this.handleTrack);
  }

  private handleICEEvent = (event: RTCPeerConnectionIceEvent): void => {
    this.logEvent({
      type: 'ice',
      category: 'candidate',
      message: 'New ICE candidate',
      data: {
        candidate: event.candidate?.toJSON(),
        url: event.candidate?.address
      }
    });
  };

  private handleICEError = (event: RTCPeerConnectionIceErrorEvent): void => {
    this.logEvent({
      type: 'ice',
      category: 'error',
      message: `ICE error: ${event.errorText}`,
      data: {
        url: event.url,
        errorCode: event.errorCode
      }
    });
  };

  async getDebugReport(): Promise<{events: DebugEvent[], stats: RTCStatsReport}> {
    const stats = await this.connection.getStats();
    return {
      events: [...this.events],
      stats
    };
  }

  private logEvent(event: Omit<DebugEvent, 'timestamp'>): void {
    if (!this.isEnabled) return;

    this.events.push({
      ...event,
      timestamp: Date.now()
    });

    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  clearEvents(): void {
    this.events = [];
  }
}
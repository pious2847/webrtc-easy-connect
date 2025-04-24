export interface ResilienceConfig {
  maxReconnectAttempts: number;
  reconnectInterval: number;
  peerTimeoutMs: number;
  iceCandidateTimeout: number;
  fallbackIceServers: RTCIceServer[];
}

export class ResilienceManager {
  private connection: RTCPeerConnection;
  private config: ResilienceConfig;
  private reconnectAttempts: number = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private isReconnecting: boolean = false;

  constructor(
    connection: RTCPeerConnection,
    config: Partial<ResilienceConfig> = {}
  ) {
    this.connection = connection;
    this.config = {
      maxReconnectAttempts: config.maxReconnectAttempts || 3,
      reconnectInterval: config.reconnectInterval || 2000,
      peerTimeoutMs: config.peerTimeoutMs || 10000,
      iceCandidateTimeout: config.iceCandidateTimeout || 5000,
      fallbackIceServers: config.fallbackIceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
  }

  async handleConnectionFailure(): Promise<void> {
    if (this.isReconnecting || 
        this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      throw new Error('Connection recovery failed');
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    try {
      // Try reconnecting with current configuration
      await this.attemptReconnect();
    } catch (error) {
      // If primary reconnection fails, try fallback servers
      await this.attemptFallbackServers();
    } finally {
      this.isReconnecting = false;
    }
  }

  private async attemptReconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Reconnection attempt timed out'));
      }, this.config.peerTimeoutMs);

      this.connection.addEventListener('connectionstatechange', () => {
        if (this.connection.connectionState === 'connected') {
          clearTimeout(timeout);
          resolve();
        }
      }, { once: true });

      this.connection.restartIce();
    });
  }

  private async attemptFallbackServers(): Promise<void> {
    for (const iceServer of this.config.fallbackIceServers) {
      try {
        const configuration = this.connection.getConfiguration();
        configuration.iceServers = [iceServer];
        this.connection.setConfiguration(configuration);

        await this.attemptReconnect();
        return;
      } catch (error) {
        continue;
      }
    }

    throw new Error('All fallback servers failed');
  }

  async waitForIceCandidates(): Promise<void> {
    return new Promise((resolve, reject) => {
      const candidates: RTCIceCandidate[] = [];
      const timeout = setTimeout(() => {
        reject(new Error('ICE gathering timed out'));
      }, this.config.iceCandidateTimeout);

      this.connection.addEventListener('icecandidate', event => {
        if (event.candidate) {
          candidates.push(event.candidate);
        } else {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }
}
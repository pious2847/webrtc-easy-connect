export class ConnectionManager {
  private connections: Map<string, RTCConnection> = new Map();
  private mediaDeviceManager?: MediaDeviceManager;
  private statsCollector?: StatsCollector;

  constructor(private options: ConnectionManagerOptions = {}) {
    this.setupMediaDevices();
  }

  private async setupMediaDevices() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      this.mediaDeviceManager = new MediaDeviceManager(this.peerConnection);
    } catch (error) {
      console.warn('Media devices initialization failed:', error);
    }
  }

  async createConnection(peerId: string): Promise<RTCConnection> {
    if (this.connections.has(peerId)) {
      throw new Error(`Connection with peer ${peerId} already exists`);
    }

    const connection = new RTCConnection({
      ...this.options,
      peerId,
      onClose: () => this.handleConnectionClose(peerId)
    });

    this.connections.set(peerId, connection);
    
    if (this.options.enableStats) {
      this.statsCollector = new StatsCollector(connection.getPeerConnection());
      this.statsCollector.startCollecting(
        this.options.statsInterval || 1000,
        this.options.onStats
      );
    }

    return connection;
  }

  private handleConnectionClose(peerId: string) {
    const connection = this.connections.get(peerId);
    if (connection) {
      connection.close();
      this.connections.delete(peerId);
    }
  }

  async switchAudioDevice(deviceId: string): Promise<void> {
    if (!this.mediaDeviceManager) {
      throw new Error('Media device manager not initialized');
    }
    await this.mediaDeviceManager.switchAudioInput(deviceId);
  }

  async switchVideoDevice(deviceId: string): Promise<void> {
    if (!this.mediaDeviceManager) {
      throw new Error('Media device manager not initialized');
    }
    await this.mediaDeviceManager.switchVideoInput(deviceId);
  }

  closeAll() {
    this.connections.forEach(connection => connection.close());
    this.connections.clear();
    this.statsCollector?.stopCollecting();
  }
}
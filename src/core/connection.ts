import { ConnectionOptions, WebRTCError } from './types';
import { DataChannelManager } from './data-channel';
import { ConnectionStateManager } from './connection-state';
import { ConfigManager } from './config';
import { StatsManager, RTCStatsReport } from './stats-manager';
import { NetworkQualityMonitor, NetworkQualityMetrics, NetworkAdaptationConfig } from './network-quality';
import { BandwidthManager } from './bandwidth-manager';
import { QualityMonitor } from './quality-monitor';
import { AdaptiveStreaming } from './adaptive-streaming';
import { WebRTCDebugger } from './debug/webrtc-debugger';
import { ResilienceManager } from './network/resilience-manager';
import { QualityAnalyzer } from './network/quality-analyzer';

export interface RTCConnectionOptions extends RTCConfiguration {
  debug?: boolean;
  resilience?: Partial<ResilienceConfig>;
  onQualityUpdate?: (quality: ConnectionQuality) => void;
}

export class RTCConnection {
  private peerConnection: RTCPeerConnection;
  private dataChannels: DataChannelManager;
  private stateManager: ConnectionStateManager;
  private options: RTCConnectionOptions;
  private statsManager: StatsManager;
  private networkMonitor: NetworkQualityMonitor | null = null;
  private bandwidthManager: BandwidthManager;
  private qualityMonitor: QualityMonitor;
  private adaptiveStreaming?: AdaptiveStreaming;
  private debugger?: WebRTCDebugger;
  private resilienceManager: ResilienceManager;
  private qualityAnalyzer: QualityAnalyzer;
  private qualityInterval?: NodeJS.Timeout;

  constructor(options: RTCConnectionOptions = {}) {
    this.options = {
      ...ConfigManager.getInstance().getConfig(),
      ...options
    };

    this.initializePeerConnection();
    this.dataChannels = new DataChannelManager(this.peerConnection);
    this.stateManager = new ConnectionStateManager(this.peerConnection, {
      maxReconnectAttempts: this.options.maxReconnectAttempts,
      reconnectDelay: this.options.reconnectInterval,
      onStateChange: this.options.onConnectionStateChange,
      onError: this.options.onError
    });
    this.statsManager = new StatsManager(this.peerConnection);
    
    if (options.onStats) {
      this.statsManager.startMonitoring(
        options.statsInterval || 1000,
        options.onStats
      );
    }

    if (options.networkQuality?.enabled) {
      this.networkMonitor = new NetworkQualityMonitor(
        this.peerConnection,
        options.networkQuality.config
      );
      
      if (options.networkQuality.onQualityChange) {
        this.networkMonitor.startMonitoring(options.networkQuality.onQualityChange);
      }
    }

    this.bandwidthManager = new BandwidthManager(this.peerConnection);
    this.qualityMonitor = new QualityMonitor(this.peerConnection);

    if (options.adaptiveStreaming?.enabled) {
      this.adaptiveStreaming = new AdaptiveStreaming(
        this.peerConnection,
        options.adaptiveStreaming.config
      );
    }

    if (options.bandwidth) {
      this.bandwidthManager.setBandwidthConstraints(options.bandwidth);
    }

    if (options.onQualityChange) {
      this.qualityMonitor.startMonitoring(options.onQualityChange);
    }

    if (options.debug) {
      this.debugger = new WebRTCDebugger(this.peerConnection);
      this.debugger.enable();
    }

    this.resilienceManager = new ResilienceManager(
      this.peerConnection,
      options.resilience
    );

    this.qualityAnalyzer = new QualityAnalyzer(this.peerConnection);

    if (options.onQualityUpdate) {
      this.startQualityMonitoring(options.onQualityUpdate);
    }

    this.peerConnection.addEventListener('connectionstatechange', async () => {
      if (this.peerConnection.connectionState === 'failed') {
        try {
          await this.resilienceManager.handleConnectionFailure();
        } catch (error) {
          this.handleError(error as Error);
        }
      }
    });
  }

  private initializePeerConnection() {
    try {
      this.peerConnection = new RTCPeerConnection(this.options.configuration);
      this.setupEventListeners();
      
      if (this.options.stream) {
        this.addStream(this.options.stream);
      }
    } catch (error) {
      this.handleError(new WebRTCError(
        'Failed to initialize peer connection',
        'INITIALIZATION_ERROR',
        error as Error
      ));
    }
  }

  private setupEventListeners() {
    this.peerConnection.ontrack = (event) => {
      try {
        this.options.onTrack?.(event);
      } catch (error) {
        this.handleError(new WebRTCError(
          'Error handling track event',
          'TRACK_EVENT_ERROR',
          error as Error
        ));
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection.connectionState;
      this.options.onConnectionStateChange?.(state);

      if (state === 'failed' || state === 'disconnected') {
        this.handleDisconnection();
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      try {
        this.options.onDataChannel?.(event);
      } catch (error) {
        this.handleError(new WebRTCError(
          'Error handling data channel event',
          'DATA_CHANNEL_ERROR',
          error as Error
        ));
      }
    };
  }

  private handleDisconnection() {
    if (!this.options.autoReconnect) return;

    if (this.reconnectAttempts < (this.options.maxReconnectAttempts || 3)) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnect();
      }, this.options.reconnectInterval);
    } else {
      this.handleError(new WebRTCError(
        'Maximum reconnection attempts reached',
        'MAX_RECONNECT_ATTEMPTS'
      ));
    }
  }

  private async reconnect() {
    try {
      this.reconnectAttempts++;
      this.peerConnection.close();
      this.initializePeerConnection();
      
      // Recreate the connection using the existing stream
      if (this.options.stream) {
        this.addStream(this.options.stream);
      }
      
      // Emit reconnection event or callback if needed
    } catch (error) {
      this.handleError(new WebRTCError(
        'Failed to reconnect',
        'RECONNECTION_ERROR',
        error as Error
      ));
    }
  }

  private handleError(error: WebRTCError) {
    this.options.onError?.(error);
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      throw new WebRTCError(
        'Failed to create offer',
        'CREATE_OFFER_ERROR',
        error as Error
      );
    }
  }

  public async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      throw new WebRTCError(
        'Failed to create answer',
        'CREATE_ANSWER_ERROR',
        error as Error
      );
    }
  }

  public async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.peerConnection.setRemoteDescription(answer);
    } catch (error) {
      throw new WebRTCError(
        'Failed to handle answer',
        'HANDLE_ANSWER_ERROR',
        error as Error
      );
    }
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      throw new WebRTCError(
        'Failed to add ICE candidate',
        'ICE_CANDIDATE_ERROR',
        error as Error
      );
    }
  }

  public addStream(stream: MediaStream) {
    try {
      stream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, stream);
      });
    } catch (error) {
      throw new WebRTCError(
        'Failed to add stream',
        'ADD_STREAM_ERROR',
        error as Error
      );
    }
  }

  public createDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel {
    return this.dataChannels.createChannel(label, options);
  }

  public sendData(label: string, data: string | Blob | ArrayBuffer): boolean {
    return this.dataChannels.send(label, data);
  }

  public onDataChannelMessage(label: string, callback: (data: any) => void): void {
    this.dataChannels.onMessage(label, callback);
  }

  public getConnectionState(): RTCPeerConnectionState {
    return this.stateManager.getState();
  }

  public startStatsMonitoring(
    interval: number = 1000,
    callback: (stats: RTCStatsReport) => void
  ) {
    this.statsManager.startMonitoring(interval, callback);
  }

  public stopStatsMonitoring() {
    this.statsManager.stopMonitoring();
  }

  public startNetworkMonitoring(
    callback: (metrics: NetworkQualityMetrics) => void
  ) {
    if (!this.networkMonitor) {
      this.networkMonitor = new NetworkQualityMonitor(this.peerConnection);
    }
    this.networkMonitor.startMonitoring(callback);
  }

  public stopNetworkMonitoring() {
    this.networkMonitor?.stopMonitoring();
  }

  public getNetworkMetrics(): NetworkQualityMetrics | null {
    return this.networkMonitor?.getMetrics() || null;
  }

  public close() {
    this.statsManager.stopMonitoring();
    this.networkMonitor?.stopMonitoring();
    this.dataChannels.closeChannel('*');
    this.stateManager.destroy();
    this.peerConnection.close();
  }

  private async handleConnectionFailure() {
    if (!this.options.autoReconnect) return;

    try {
      await this.peerConnection.restartIce();
      
      // Create new offer if we're the initiator
      if (this.isInitiator) {
        const offer = await this.peerConnection.createOffer({ iceRestart: true });
        await this.peerConnection.setLocalDescription(offer);
        
        // Signal the new offer
        if (this.options.onNegotiationNeeded) {
          this.options.onNegotiationNeeded(offer);
        }
      }
    } catch (error) {
      this.handleError(new WebRTCError(
        'Failed to recover connection',
        'CONNECTION_RECOVERY_ERROR',
        error as Error
      ));
    }
  }

  public async replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack): Promise<void> {
    const sender = this.peerConnection
      .getSenders()
      .find(s => s.track === oldTrack);

    if (!sender) {
      throw new WebRTCError(
        'Track not found',
        'TRACK_REPLACEMENT_ERROR'
      );
    }

    await sender.replaceTrack(newTrack);
  }

  async enableSimulcast(videoTrack: MediaStreamTrack): Promise<void> {
    await this.bandwidthManager.enableSimulcast(videoTrack);
  }

  async setBandwidthConstraints(constraints: BandwidthConstraints): Promise<void> {
    await this.bandwidthManager.setBandwidthConstraints(constraints);
  }

  startAdaptiveStreaming(): void {
    this.adaptiveStreaming?.start();
  }

  stopAdaptiveStreaming(): void {
    this.adaptiveStreaming?.stop();
  }

  private startQualityMonitoring(callback: (quality: ConnectionQuality) => void): void {
    this.qualityInterval = setInterval(async () => {
      const quality = await this.qualityAnalyzer.analyzeQuality();
      callback(quality);
    }, 2000);
  }

  async getDebugReport(): Promise<any> {
    return this.debugger?.getDebugReport();
  }

  override close(): void {
    this.debugger?.disable();
    if (this.qualityInterval) {
      clearInterval(this.qualityInterval);
    }
    super.close();
  }
}




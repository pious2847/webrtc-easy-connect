import { EventEmitter } from './event-emitter';
import { WebRTCError, WebRTCErrorCode } from './types';

export type ConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

export interface ConnectionStateOptions {
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: WebRTCError) => void;
}

export class ConnectionStateManager {
  private state: ConnectionState = 'new';
  private reconnectAttempts = 0;
  private events = new EventEmitter();
  private reconnectTimeout?: NodeJS.Timeout;

  constructor(
    private peerConnection: RTCPeerConnection,
    private options: ConnectionStateOptions = {}
  ) {
    this.setupConnectionStateHandling();
  }

  private setupConnectionStateHandling() {
    this.peerConnection.onconnectionstatechange = () => {
      const newState = this.peerConnection.connectionState as ConnectionState;
      this.handleStateChange(newState);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection.iceConnectionState === 'failed') {
        this.handleIceFailure();
      }
    };
  }

  private handleStateChange(newState: ConnectionState) {
    this.state = newState;
    this.events.emit('stateChange', newState);
    this.options.onStateChange?.(newState);

    switch (newState) {
      case 'connected':
        this.reconnectAttempts = 0;
        break;
      case 'disconnected':
        this.handleDisconnection();
        break;
      case 'failed':
        this.handleFailure();
        break;
    }
  }

  private handleDisconnection() {
    const maxAttempts = this.options.maxReconnectAttempts ?? 3;
    const delay = this.options.reconnectDelay ?? 2000;

    if (this.reconnectAttempts < maxAttempts) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.attemptReconnection();
      }, delay);
    } else {
      this.handleFailure();
    }
  }

  private async attemptReconnection() {
    try {
      await this.peerConnection.restartIce();
      this.events.emit('reconnectAttempt', this.reconnectAttempts);
    } catch (error) {
      this.handleFailure(error as Error);
    }
  }

  private handleIceFailure() {
    const error = new WebRTCError(
      'ICE connection failed',
      WebRTCErrorCode.CONNECTION_ERROR
    );
    this.handleFailure(error);
  }

  private handleFailure(error?: Error) {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const webRTCError = error instanceof WebRTCError ? error : new WebRTCError(
      'Connection failed',
      WebRTCErrorCode.CONNECTION_ERROR,
      error
    );

    this.events.emit('error', webRTCError);
    this.options.onError?.(webRTCError);
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public onStateChange(callback: (state: ConnectionState) => void): void {
    this.events.on('stateChange', callback);
  }

  public onError(callback: (error: WebRTCError) => void): void {
    this.events.on('error', callback);
  }

  public onReconnectAttempt(callback: (attempt: number) => void): void {
    this.events.on('reconnectAttempt', callback);
  }

  public destroy(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.events.removeAllListeners();
  }
}
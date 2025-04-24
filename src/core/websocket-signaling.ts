import { SignalingAdapter, SignalingMessage } from './types';

export interface WebSocketSignalingOptions {
  url: string;
  room?: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

export class WebSocketSignaling implements SignalingAdapter {
  private ws: WebSocket | null = null;
  private messageCallback: ((message: SignalingMessage) => void) | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout?: NodeJS.Timeout;

  constructor(private options: WebSocketSignalingOptions) {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.options.url);
      this.setupWebSocket();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private setupWebSocket() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      if (this.options.room) {
        this.ws?.send(JSON.stringify({ type: 'join', room: this.options.room }));
      }
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as SignalingMessage;
        this.messageCallback?.(message);
      } catch (error) {
        this.handleError(error as Error);
      }
    };

    this.ws.onclose = () => {
      this.handleDisconnection();
    };

    this.ws.onerror = (error) => {
      this.handleError(error as Error);
    };
  }

  private handleDisconnection() {
    if (!this.options.autoReconnect) return;

    if (this.reconnectAttempts < (this.options.maxReconnectAttempts || 3)) {
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.options.reconnectInterval || 2000);
    }
  }

  private handleError(error: Error) {
    console.error('WebSocket Signaling Error:', error);
  }

  public send(message: SignalingMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  public onMessage(callback: (message: SignalingMessage) => void): void {
    this.messageCallback = callback;
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.ws?.close();
    this.ws = null;
  }
}
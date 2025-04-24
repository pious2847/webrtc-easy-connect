import { EventEmitter } from './event-emitter';

export interface DataChannelOptions {
  ordered?: boolean;
  maxRetransmits?: number;
  maxPacketLifeTime?: number;
  protocol?: string;
  negotiated?: boolean;
  id?: number;
}

export class DataChannelManager {
  private channels = new Map<string, RTCDataChannel>();
  private messageHandlers = new Map<string, Set<(data: any) => void>>();
  private events = new EventEmitter();

  constructor(private peerConnection: RTCPeerConnection) {
    peerConnection.ondatachannel = this.handleDataChannel.bind(this);
  }

  createChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel {
    if (this.channels.has(label)) {
      throw new Error(`Data channel "${label}" already exists`);
    }

    const channel = this.peerConnection.createDataChannel(label, options);
    this.setupChannel(channel);
    this.channels.set(label, channel);
    return channel;
  }

  private handleDataChannel(event: RTCDataChannelEvent) {
    this.setupChannel(event.channel);
    this.channels.set(event.channel.label, event.channel);
    this.events.emit('channel', event.channel);
  }

  private setupChannel(channel: RTCDataChannel) {
    channel.onopen = () => this.events.emit(`${channel.label}:open`);
    channel.onclose = () => this.events.emit(`${channel.label}:close`);
    channel.onmessage = (event) => {
      this.events.emit(`${channel.label}:message`, event.data);

      // Also notify any registered message handlers
      const handlers = this.messageHandlers.get(channel.label);
      if (handlers) {
        handlers.forEach(handler => handler(event.data));
      }
    };
    channel.onerror = (event) => this.events.emit(`${channel.label}:error`, event);
  }

  send(label: string, data: string | Blob | ArrayBuffer | ArrayBufferView): boolean {
    const channel = this.channels.get(label);
    if (!channel || channel.readyState !== 'open') return false;

    try {
      channel.send(data as any);
      return true;
    } catch (error) {
      console.error(`Error sending data on channel ${label}:`, error);
      return false;
    }
  }

  closeChannel(label: string): void {
    const channel = this.channels.get(label);
    if (channel) {
      channel.close();
      this.channels.delete(label);
    }
  }

  onMessage(label: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(label)) {
      this.messageHandlers.set(label, new Set());
    }
    this.messageHandlers.get(label)!.add(handler);

    return () => {
      this.messageHandlers.get(label)?.delete(handler);
    };
  }

  broadcast(data: any): void {
    this.channels.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify(data));
      }
    });
  }

  closeAll(): void {
    this.channels.forEach(channel => channel.close());
    this.channels.clear();
    this.messageHandlers.clear();
  }

  onOpen(label: string, callback: () => void): void {
    this.events.on(`${label}:open`, callback);
  }

  onClose(label: string, callback: () => void): void {
    this.events.on(`${label}:close`, callback);
  }

  onError(label: string, callback: (error: Event) => void): void {
    this.events.on(`${label}:error`, callback);
  }
}

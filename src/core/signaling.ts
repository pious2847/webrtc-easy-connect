import { SignalingMessage } from './types';

export interface SignalingAdapter {
  send(message: SignalingMessage): void;
  onMessage(callback: (message: SignalingMessage) => void): void;
  disconnect(): void;
}

export class WebRTCManager {
  private connection: RTCPeerConnection;
  private signalingAdapter: SignalingAdapter;

  constructor(signalingAdapter: SignalingAdapter, configuration?: RTCConfiguration) {
    this.signalingAdapter = signalingAdapter;
    this.connection = new RTCPeerConnection(configuration);
    this.setupSignaling();
  }

  private setupSignaling() {
    this.signalingAdapter.onMessage((message: SignalingMessage) => {
      switch (message.type) {
        case 'offer':
          this.handleOffer(message.payload);
          break;
        case 'answer':
          this.handleAnswer(message.payload);
          break;
        case 'ice-candidate':
          this.handleIceCandidate(message.payload);
          break;
      }
    });

    this.connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingAdapter.send({
          type: 'ice-candidate',
          payload: event.candidate
        });
      }
    };
  }

  private async handleOffer(offer: RTCSessionDescriptionInit) {
    await this.connection.setRemoteDescription(offer);
    const answer = await this.connection.createAnswer();
    await this.connection.setLocalDescription(answer);
    this.signalingAdapter.send({
      type: 'answer',
      payload: answer
    });
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit) {
    await this.connection.setRemoteDescription(answer);
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit) {
    await this.connection.addIceCandidate(candidate);
  }
}
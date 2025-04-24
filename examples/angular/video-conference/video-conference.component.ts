import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { WebRTCService } from 'webrtc-easy/angular';
import { WebSocketSignaling } from 'webrtc-easy/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-video-conference',
  template: `
    <div class="video-conference">
      <div class="controls">
        <button 
          (click)="handleStart()"
          [disabled]="!!signaling"
        >
          Start Call
        </button>
        <button 
          (click)="handleScreenShare()"
          [disabled]="!signaling"
        >
          Share Screen
        </button>
        <button 
          (click)="handleDisconnect()"
          [disabled]="!signaling"
        >
          End Call
        </button>
      </div>

      <div *ngIf="error$ | async as error" class="error-message">
        Error: {{ error.message }}
      </div>

      <div class="connection-status">
        Connection: {{ connectionState$ | async }}
      </div>

      <div class="video-streams">
        <div class="local-stream">
          <h3>Local Stream</h3>
          <video #localVideo autoplay playsinline muted></video>
        </div>
        <div class="remote-stream">
          <h3>Remote Stream</h3>
          <video #remoteVideo autoplay playsinline></video>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./video-conference.component.scss']
})
export class VideoConferenceComponent implements OnDestroy {
  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  private signaling: WebSocketSignaling | null = null;
  private subscriptions: Subscription[] = [];

  constructor(private webRTCService: WebRTCService) {
    this.setupStreamSubscriptions();
  }

  private setupStreamSubscriptions(): void {
    this.subscriptions.push(
      this.webRTCService.localStream$.subscribe(stream => {
        if (this.localVideo?.nativeElement && stream) {
          this.localVideo.nativeElement.srcObject = stream;
        }
      }),

      this.webRTCService.remoteStream$.subscribe(stream => {
        if (this.remoteVideo?.nativeElement && stream) {
          this.remoteVideo.nativeElement.srcObject = stream;
        }
      })
    );
  }

  async handleStart(): Promise<void> {
    try {
      const conn = await this.webRTCService.initConnection();
      
      this.signaling = new WebSocketSignaling({
        url: 'wss://your-signaling-server.com',
        room: 'test-room',
        autoReconnect: true
      });

      this.signaling.onMessage(async (message) => {
        switch (message.type) {
          case 'offer':
            const answer = await conn.createAnswer(message.payload);
            this.signaling?.send({ type: 'answer', payload: answer });
            break;
          case 'answer':
            await conn.handleAnswer(message.payload);
            break;
          case 'ice-candidate':
            await conn.addIceCandidate(message.payload);
            break;
        }
      });

      const offer = await conn.createOffer();
      this.signaling.send({ type: 'offer', payload: offer });
    } catch (err) {
      console.error('Failed to start call:', err);
    }
  }

  async handleScreenShare(): Promise<void> {
    try {
      await this.webRTCService.startScreenShare();
    } catch (err) {
      console.error('Failed to share screen:', err);
    }
  }

  handleDisconnect(): void {
    this.signaling?.disconnect();
    this.signaling = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.handleDisconnect();
  }

  get error$() { return this.webRTCService.error$; }
  get connectionState$() { return this.webRTCService.connectionState$; }
}
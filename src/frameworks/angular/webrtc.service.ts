import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RTCConnection } from '../../core/connection';
import { MediaHelper } from '../../core/media';
import { ConnectionOptions, WebRTCError } from '../../core/types';

@Injectable({
  providedIn: 'root'
})
export class WebRTCService implements OnDestroy {
  private connection: RTCConnection | null = null;
  private localStreamSubject = new BehaviorSubject<MediaStream | null>(null);
  private remoteStreamSubject = new BehaviorSubject<MediaStream | null>(null);
  private connectionStateSubject = new BehaviorSubject<RTCPeerConnectionState>('new');
  private errorSubject = new BehaviorSubject<Error | null>(null);

  public readonly localStream$ = this.localStreamSubject.asObservable();
  public readonly remoteStream$ = this.remoteStreamSubject.asObservable();
  public readonly connectionState$ = this.connectionStateSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  constructor(private options: ConnectionOptions = {}) {}

  async initConnection(videoEnabled = true, audioEnabled = true): Promise<RTCConnection> {
    try {
      this.errorSubject.next(null);
      const stream = await MediaHelper.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      
      this.localStreamSubject.next(stream);
      
      this.connection = new RTCConnection({
        ...this.options,
        stream,
        onTrack: (event) => {
          this.remoteStreamSubject.next(
            new MediaStream(event.streams[0].getTracks())
          );
        },
        onConnectionStateChange: (state) => {
          this.connectionStateSubject.next(state);
          this.options.onConnectionStateChange?.(state);
        },
        onError: this.handleError.bind(this)
      });

      return this.connection;
    } catch (err) {
      const webRTCError = new WebRTCError(
        'Failed to initialize connection',
        'INIT_CONNECTION_ERROR',
        err as Error
      );
      this.handleError(webRTCError);
      throw webRTCError;
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      this.errorSubject.next(null);
      const stream = await MediaHelper.getDisplayMedia();
      this.connection?.addStream(stream);
      return stream;
    } catch (err) {
      const webRTCError = new WebRTCError(
        'Failed to start screen sharing',
        'SCREEN_SHARE_ERROR',
        err as Error
      );
      this.handleError(webRTCError);
      throw webRTCError;
    }
  }

  private handleError(error: Error): void {
    this.errorSubject.next(error);
    this.options.onError?.(error);
  }

  ngOnDestroy(): void {
    this.connection?.close();
    const localStream = this.localStreamSubject.value;
    if (localStream) {
      MediaHelper.stopMediaStream(localStream);
    }
  }
}
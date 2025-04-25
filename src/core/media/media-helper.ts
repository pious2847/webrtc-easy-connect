import { AudioEffect, AudioProcessor } from "./audio-processor";
import { VideoFilter, VideoProcessor } from "./video-processor";

export class MediaHelper {
  private audioProcessor: AudioProcessor;
  private videoProcessor: VideoProcessor;

  constructor() {
    this.audioProcessor = new AudioProcessor();
    this.videoProcessor = new VideoProcessor();
  }

  async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return this.processStream(stream);
  }

  async getDisplayMedia(options?: DisplayMediaStreamOptions): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getDisplayMedia(options);
    return this.processStream(stream);
  }

  private async processStream(stream: MediaStream): Promise<MediaStream> {
    const processedTracks: MediaStreamTrack[] = [];

    for (const track of stream.getTracks()) {
      if (track.kind === 'audio') {
        const processedStream = await this.audioProcessor.process(new MediaStream([track]));
        processedTracks.push(processedStream.getAudioTracks()[0]);
      } else if (track.kind === 'video') {
        const processedStream = await this.videoProcessor.process(new MediaStream([track]));
        processedTracks.push(processedStream.getVideoTracks()[0]);
      }
    }

    return new MediaStream(processedTracks);
  }

  async addAudioEffect(id: string, effect: AudioEffect): Promise<void> {
    await this.audioProcessor.addEffect(id, effect);
  }

  async addVideoFilter(id: string, filter: VideoFilter): Promise<void> {
    await this.videoProcessor.addFilter(id, filter);
  }

  stopProcessing(): void {
    this.audioProcessor.stop();
    this.videoProcessor.stop();
  }
}
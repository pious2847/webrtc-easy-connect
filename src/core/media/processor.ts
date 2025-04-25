import { AudioProcessor } from "./audio-processor";

export interface MediaProcessorOptions {
  enabled: boolean;
  processingMode: 'real-time' | 'quality';
  maxLatency?: number;
}

export abstract class MediaProcessor {
  protected context: AudioContext | OffscreenCanvas | undefined;
  protected options: MediaProcessorOptions;
  protected isProcessing: boolean = false;

  constructor(options: Partial<MediaProcessorOptions> = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      processingMode: options.processingMode ?? 'real-time',
      maxLatency: options.maxLatency ?? 100
    };
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract process(input: MediaStream): Promise<MediaStream>;
  abstract release(): void;

  protected async createProcessingContext(): Promise<void> {
    if (this instanceof AudioProcessor) {
      this.context = new AudioContext({
        latencyHint: (this as MediaProcessor).options.processingMode === 'real-time' ? 'interactive' : 'playback'
      });
    } else {
      this.context = new OffscreenCanvas(1920, 1080);
    }
  }
}

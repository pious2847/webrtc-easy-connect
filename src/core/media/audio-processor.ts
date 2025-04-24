import { MediaProcessor } from './processor';

export interface AudioEffect {
  type: 'gain' | 'filter' | 'compressor' | 'reverb' | 'noiseSuppression' | 'delay' | 'distortion' | 'equalizer' | 'panner' | 'pitchShift';
  params: Record<string, number | string>;
}

export class AudioProcessor extends MediaProcessor {
  private audioContext!: AudioContext;
  private effects: Map<string, AudioNode> = new Map();
  private inputNode?: MediaStreamAudioSourceNode;
  private outputNode?: MediaStreamAudioDestinationNode;
  protected options = { enabled: true, processingMode: 'real-time' as const };

  constructor() {
    super();
    this.audioContext = new AudioContext();
  }

  async start(): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    this.outputNode = this.audioContext.createMediaStreamDestination();
  }

  async process(stream: MediaStream): Promise<MediaStream> {
    if (!this.options.enabled) return stream;

    this.inputNode = this.audioContext.createMediaStreamSource(stream);
    let currentNode: AudioNode = this.inputNode;

    // Connect all active effects
    for (const [_, effect] of this.effects) {
      currentNode.connect(effect);
      currentNode = effect;
    }

    // Connect to output
    currentNode.connect(this.outputNode!);
    return this.outputNode!.stream;
  }

  async addEffect(id: string, effect: AudioEffect): Promise<void> {
    let node: AudioNode;

    switch (effect.type) {
      case 'gain':
        node = this.createGainEffect(effect.params as Record<string, number>);
        break;
      case 'filter':
        node = this.createFilterEffect(effect.params as Record<string, number>);
        break;
      case 'compressor':
        node = this.createCompressorEffect(effect.params as Record<string, number>);
        break;
      case 'reverb':
        node = await this.createReverbEffect(effect.params as Record<string, number>);
        break;
      case 'noiseSuppression':
        node = await this.createNoiseSuppressionEffect(effect.params as Record<string, number>);
        break;
      case 'delay':
        node = this.createDelayEffect(effect.params as Record<string, number>);
        break;
      case 'distortion':
        node = this.createDistortionEffect(effect.params as Record<string, number>);
        break;
      case 'equalizer':
        node = this.createEqualizerEffect(effect.params as Record<string, number>);
        break;
      case 'panner':
        node = this.createPannerEffect(effect.params as Record<string, number>);
        break;
      case 'pitchShift':
        node = await this.createPitchShiftEffect(effect.params as Record<string, number>);
        break;
      default:
        throw new Error(`Unsupported effect type: ${effect.type}`);
    }

    this.effects.set(id, node);
    await this.reconnectEffectChain();
  }

  private async reconnectEffectChain(): Promise<void> {
    if (!this.inputNode || !this.outputNode) return;

    // Disconnect all nodes
    this.inputNode.disconnect();
    for (const node of this.effects.values()) {
      node.disconnect();
    }

    // Reconnect in order
    let currentNode: AudioNode = this.inputNode;

    for (const node of this.effects.values()) {
      currentNode.connect(node);
      currentNode = node;
    }

    // Connect to output
    currentNode.connect(this.outputNode);
  }

  private createGainEffect(params: Record<string, number>): GainNode {
    const gain = this.audioContext.createGain();
    gain.gain.value = params.gain ?? 1.0;
    return gain;
  }

  private createFilterEffect(params: Record<string, number>): BiquadFilterNode {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = params.frequency ?? 1000;
    filter.Q.value = params.Q ?? 1;
    return filter;
  }

  private createCompressorEffect(params: Record<string, number>): DynamicsCompressorNode {
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = params.threshold ?? -24;
    compressor.knee.value = params.knee ?? 30;
    compressor.ratio.value = params.ratio ?? 12;
    compressor.attack.value = params.attack ?? 0.003;
    compressor.release.value = params.release ?? 0.25;
    return compressor;
  }

  private async createReverbEffect(params: Record<string, number>): Promise<ConvolverNode> {
    const convolver = this.audioContext.createConvolver();
    const response = await this.generateImpulseResponse(params);
    convolver.buffer = response;
    return convolver;
  }

  private async createNoiseSuppressionEffect(params: Record<string, number>): Promise<AudioWorkletNode> {
    try {
      // Try to load from the worklets directory relative to the base URL
      const baseUrl = window.location.origin;
      const workletUrl = `${baseUrl}/node_modules/webrtc-easy/dist/worklets/noise-suppression-processor.js`;
      await this.audioContext.audioWorklet.addModule(workletUrl);
    } catch (error) {
      console.warn('Failed to load noise suppression worklet from relative path:', error);

      // Fallback to CDN or absolute path
      try {
        const cdnUrl = 'https://cdn.jsdelivr.net/npm/webrtc-easy@latest/dist/worklets/noise-suppression-processor.js';
        await this.audioContext.audioWorklet.addModule(cdnUrl);
      } catch (cdnError) {
        console.error('Failed to load noise suppression worklet:', cdnError);
        throw new Error('Could not load noise suppression worklet');
      }
    }

    return new AudioWorkletNode(this.audioContext, 'noise-suppression', {
      parameterData: params
    });
  }

  private createDelayEffect(params: Record<string, number>): DelayNode {
    const delay = this.audioContext.createDelay();
    delay.delayTime.value = params.time ?? 0.5;

    // Create a feedback loop if feedback parameter is provided
    if (params.feedback && params.feedback > 0) {
      const feedback = this.audioContext.createGain();
      feedback.gain.value = Math.min(params.feedback, 0.9); // Limit to avoid infinite feedback

      delay.connect(feedback);
      feedback.connect(delay);
    }

    return delay;
  }

  private createDistortionEffect(params: Record<string, number>): WaveShaperNode {
    const distortion = this.audioContext.createWaveShaper();
    const amount = params.amount ?? 50;

    // Create distortion curve
    const curve = new Float32Array(this.audioContext.sampleRate);
    const deg = Math.PI / 180;

    for (let i = 0; i < curve.length; i++) {
      const x = (i * 2) / curve.length - 1;
      curve[i] = (3 + amount) * x * 20 * deg / (Math.PI + amount * Math.abs(x));
    }

    distortion.curve = curve;
    distortion.oversample = 'none';

    return distortion;
  }

  private createEqualizerEffect(params: Record<string, number>): AudioNode {
    // Create a container node (GainNode with gain = 1.0)
    const container = this.audioContext.createGain();
    container.gain.value = 1.0;

    // Create three-band EQ (low, mid, high)
    const lowFilter = this.audioContext.createBiquadFilter();
    lowFilter.type = 'lowshelf';
    lowFilter.frequency.value = params.lowFrequency ?? 320;
    lowFilter.gain.value = params.lowGain ?? 0;

    const midFilter = this.audioContext.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = params.midFrequency ?? 1000;
    midFilter.Q.value = params.midQ ?? 1;
    midFilter.gain.value = params.midGain ?? 0;

    const highFilter = this.audioContext.createBiquadFilter();
    highFilter.type = 'highshelf';
    highFilter.frequency.value = params.highFrequency ?? 3200;
    highFilter.gain.value = params.highGain ?? 0;

    // Connect the filters in series
    container.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);

    // The last filter is the output of our equalizer
    return highFilter;
  }

  private createPannerEffect(params: Record<string, number>): StereoPannerNode {
    const panner = this.audioContext.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, params.pan ?? 0));
    return panner;
  }

  private async createPitchShiftEffect(params: Record<string, number>): Promise<AudioWorkletNode> {
    try {
      // Try to load from the worklets directory relative to the base URL
      const baseUrl = window.location.origin;
      const workletUrl = `${baseUrl}/node_modules/webrtc-easy/dist/worklets/pitch-shift-processor.js`;
      await this.audioContext.audioWorklet.addModule(workletUrl);
    } catch (error) {
      console.warn('Failed to load pitch shift worklet from relative path:', error);

      // Fallback to CDN or absolute path
      try {
        const cdnUrl = 'https://cdn.jsdelivr.net/npm/webrtc-easy@latest/dist/worklets/pitch-shift-processor.js';
        await this.audioContext.audioWorklet.addModule(cdnUrl);
      } catch (cdnError) {
        console.error('Failed to load pitch shift worklet:', cdnError);
        throw new Error('Could not load pitch shift worklet');
      }
    }

    return new AudioWorkletNode(this.audioContext, 'pitch-shift', {
      parameterData: {
        pitch: params.pitch ?? 1.0,
        grainSize: params.grainSize ?? 0.1
      }
    });
  }

  private async generateImpulseResponse(params: Record<string, number>): Promise<AudioBuffer> {
    const duration = params.duration ?? 2.0;
    const decay = params.decay ?? 0.5;
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }

    return impulse;
  }

  async stop(): Promise<void> {
    this.effects.clear();
    if (this.audioContext.state !== 'closed') {
      await this.audioContext.close();
    }
  }

  release(): void {
    this.stop();
  }
}
export interface AudioEffect {
  type: 'gain' | 'filter' | 'compressor' | 'reverb' | 'noiseSuppression';
  params: Record<string, number>;
}

export class AudioProcessor extends MediaProcessor {
  private audioContext: AudioContext;
  private effects: Map<string, AudioNode> = new Map();
  private inputNode?: MediaStreamAudioSourceNode;
  private outputNode?: MediaStreamDestinationNode;

  async start(): Promise<void> {
    await this.createProcessingContext();
    this.audioContext = this.context as AudioContext;
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
        node = this.createGainEffect(effect.params);
        break;
      case 'filter':
        node = this.createFilterEffect(effect.params);
        break;
      case 'compressor':
        node = this.createCompressorEffect(effect.params);
        break;
      case 'reverb':
        node = await this.createReverbEffect(effect.params);
        break;
      case 'noiseSuppression':
        node = await this.createNoiseSuppressionEffect(effect.params);
        break;
      default:
        throw new Error(`Unsupported effect type: ${effect.type}`);
    }

    this.effects.set(id, node);
    await this.reconnectEffectChain();
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
    await this.audioContext.audioWorklet.addModule('noise-suppression-processor.js');
    return new AudioWorkletNode(this.audioContext, 'noise-suppression', {
      parameterData: params
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
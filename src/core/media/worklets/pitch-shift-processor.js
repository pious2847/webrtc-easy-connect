// pitch-shift-processor.js
// A simple pitch shifting audio worklet processor using a basic time-domain algorithm

class PitchShifter extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'pitch',
        defaultValue: 1.0,
        minValue: 0.5,
        maxValue: 2.0,
        automationRate: 'k-rate'
      },
      {
        name: 'grainSize',
        defaultValue: 0.1,
        minValue: 0.01,
        maxValue: 0.5,
        automationRate: 'k-rate'
      }
    ];
  }

  constructor() {
    super();
    this.sampleRate = 44100; // Default, will be overridden by actual sample rate
    this.bufferSize = 4096;
    this.inputBuffer = new Float32Array(this.bufferSize * 2);
    this.outputBuffer = new Float32Array(this.bufferSize);
    this.grainWindow = this.createGrainWindow(this.bufferSize);
    this.inputBufferIndex = 0;
    this.outputBufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input.length) return true;
    
    const pitch = parameters.pitch[0];
    const grainSize = Math.floor(parameters.grainSize[0] * this.sampleRate);
    
    // Process each channel
    for (let channel = 0; channel < Math.min(input.length, output.length); channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      
      // Store input samples in buffer
      for (let i = 0; i < inputChannel.length; i++) {
        this.inputBuffer[this.inputBufferIndex] = inputChannel[i];
        this.inputBufferIndex = (this.inputBufferIndex + 1) % this.inputBuffer.length;
      }
      
      // Process pitch shifting
      for (let i = 0; i < outputChannel.length; i++) {
        // Calculate grain position
        const grainPosition = (this.outputBufferIndex * pitch) % this.inputBuffer.length;
        
        // Apply windowing and overlap-add
        let sample = 0;
        for (let j = 0; j < grainSize; j++) {
          const windowPos = j / grainSize;
          const windowValue = this.grainWindow[Math.floor(windowPos * this.grainWindow.length)];
          const bufferPos = (grainPosition + j) % this.inputBuffer.length;
          sample += this.inputBuffer[bufferPos] * windowValue;
        }
        
        outputChannel[i] = sample;
        this.outputBufferIndex = (this.outputBufferIndex + 1) % this.outputBuffer.length;
      }
    }
    
    return true;
  }
  
  createGrainWindow(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      // Hann window function
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / size));
    }
    return window;
  }
}

registerProcessor('pitch-shift', PitchShifter);

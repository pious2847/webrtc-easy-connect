// noise-suppression-processor.js
// A simple noise suppression audio worklet processor

class NoiseSuppressor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'threshold',
        defaultValue: -50,
        minValue: -100,
        maxValue: 0,
        automationRate: 'k-rate'
      },
      {
        name: 'reduction',
        defaultValue: 20,
        minValue: 0,
        maxValue: 40,
        automationRate: 'k-rate'
      }
    ];
  }

  constructor() {
    super();
    this.bufferSize = 2048;
    this.smoothingFactor = 0.2;
    this.noiseLevel = 0;
    this.initialized = false;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input.length) return true;
    
    const threshold = parameters.threshold[0];
    const reduction = parameters.reduction[0];
    
    // Process each channel
    for (let channel = 0; channel < input.length; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      
      if (!this.initialized) {
        // Initialize noise level estimation with first buffer
        this.noiseLevel = this.calculateRMS(inputChannel);
        this.initialized = true;
      } else {
        // Update noise level with smoothing
        const currentRMS = this.calculateRMS(inputChannel);
        if (currentRMS < this.noiseLevel) {
          this.noiseLevel = this.noiseLevel * (1 - this.smoothingFactor) + currentRMS * this.smoothingFactor;
        }
      }
      
      // Apply noise suppression
      for (let i = 0; i < inputChannel.length; i++) {
        const inputLevel = 20 * Math.log10(Math.abs(inputChannel[i]) + 1e-10);
        
        if (inputLevel < threshold) {
          // Apply reduction to samples below threshold
          const reductionFactor = Math.pow(10, -reduction / 20);
          outputChannel[i] = inputChannel[i] * reductionFactor;
        } else {
          // Pass through samples above threshold
          outputChannel[i] = inputChannel[i];
        }
      }
    }
    
    return true;
  }
  
  calculateRMS(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }
}

registerProcessor('noise-suppression', NoiseSuppressor);

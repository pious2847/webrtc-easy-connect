# WebRTC Audio Effects Example

This example demonstrates how to use the `webrtc-easy` library to apply various audio effects to a WebRTC stream. It showcases the `AudioProcessor` class and its ability to add different types of audio effects.

## Features

- Capture local audio and video
- Apply various audio effects in real-time:
  - Gain control
  - Frequency filters
  - Compression
  - Reverb
  - Delay with feedback
  - Distortion
  - 3-band equalizer
  - Stereo panning
- Interactive controls for each effect
- Side-by-side comparison of original and processed streams

## How It Works

1. **Stream Capture**:
   - Captures local audio and video using `getUserMedia`
   - Displays the original stream in one video element

2. **Audio Processing**:
   - Creates an instance of `AudioProcessor` from the `webrtc-easy` library
   - Processes the original stream through the audio processor
   - Displays the processed stream in a second video element

3. **Effect Application**:
   - Each effect button activates a different audio effect
   - Sliders control the parameters of the active effect
   - Changes are applied in real-time

## Audio Effects

### Gain
Adjusts the volume of the audio signal.

### Filter
A low-pass filter that removes frequencies above the cutoff frequency.

### Compressor
Reduces the dynamic range of the audio signal, making loud parts quieter and quiet parts louder.

### Reverb
Simulates sound reflections in a space, creating a sense of ambience.

### Delay
Creates echo effects with adjustable delay time and feedback.

### Distortion
Adds harmonic distortion to the audio signal, creating a "fuzzy" or "gritty" sound.

### Equalizer
A 3-band equalizer that allows adjustment of low, mid, and high frequencies.

### Panner
Controls the stereo positioning of the audio signal.

## Usage

1. Open the example in a web browser
2. Click "Start Camera" to begin capturing audio and video
3. Click on an effect button to activate it
4. Adjust the sliders to control the effect parameters
5. Click "Stop Camera" when finished

## Integration with webrtc-easy

This example uses the following components from the `webrtc-easy` library:

- `AudioProcessor`: Processes audio streams and applies effects
- Various audio effect implementations:
  - `createGainEffect`
  - `createFilterEffect`
  - `createCompressorEffect`
  - `createReverbEffect`
  - `createDelayEffect`
  - `createDistortionEffect`
  - `createEqualizerEffect`
  - `createPannerEffect`

## Notes

- For best results, use headphones to avoid feedback
- Some effects (like reverb) may have a slight processing delay
- The example uses the Web Audio API, which is supported in all modern browsers

## License

MIT

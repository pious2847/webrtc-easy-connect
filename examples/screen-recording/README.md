# WebRTC Screen Recording Example

This example demonstrates how to use WebRTC and the MediaRecorder API to capture and record screen content. It provides a complete screen recording solution with various options and controls.

## Features

- Record screen, window, or application
- Option to include system audio
- Option to include camera video alongside screen capture
- Pause and resume recording
- Configurable recording quality (bitrate, frame rate)
- Multiple output formats (WebM, MP4)
- Recording timer display
- Save recordings for download
- Preview recordings before download
- Manage multiple recordings

## How It Works

1. **Screen Capture**:
   - Uses `navigator.mediaDevices.getDisplayMedia()` to capture screen content
   - Optionally combines with camera video using `getUserMedia()`

2. **Recording**:
   - Uses the MediaRecorder API to record the captured stream
   - Stores recorded data in chunks for efficient memory usage
   - Supports different MIME types and encoding options

3. **Playback and Download**:
   - Creates downloadable files from recorded data
   - Provides playback functionality for preview
   - Manages a list of recordings with metadata

## Usage

1. Open the example in a web browser
2. Select the desired recording source:
   - Screen Only: Just the screen content
   - Application Window: A specific window or application
   - Screen with Audio: Screen content with system audio
   - Camera + Screen: Picture-in-picture with your camera
3. Configure recording settings:
   - Format: WebM or MP4 (based on browser support)
   - Bitrate: Higher values for better quality
   - Frame Rate: Higher values for smoother video
   - Filename: Custom name for the recording
4. Click "Start Recording" and select what to share
5. Use the Pause/Resume/Stop buttons to control the recording
6. When finished, the recording will appear in the list below
7. Play, download, or delete recordings as needed

## Technical Details

### MediaRecorder API

The example uses the MediaRecorder API to record media streams:

```javascript
const mediaRecorder = new MediaRecorder(stream, options);
mediaRecorder.ondataavailable = handleDataAvailable;
mediaRecorder.start(1000); // Collect data in 1-second chunks
```

### Stream Handling

Different types of streams are handled based on user selection:

```javascript
// Screen only
stream = await navigator.mediaDevices.getDisplayMedia({ video: true });

// Screen with audio
stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });

// Camera + Screen
const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
const tracks = [...screenStream.getTracks(), ...cameraStream.getTracks()];
stream = new MediaStream(tracks);
```

### MIME Type Detection

The example automatically detects supported MIME types:

```javascript
function getSupportedMimeTypes() {
  const types = [
    'video/webm',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/mp4',
    'video/mp4;codecs=h264'
  ];
  
  return types.filter(type => MediaRecorder.isTypeSupported(type));
}
```

## Browser Compatibility

- Chrome: Full support
- Firefox: Full support (MP4 may not be available)
- Edge: Full support
- Safari: Limited support (screen capture supported in recent versions)

## Integration with webrtc-easy

While this example primarily uses the browser's built-in WebRTC and MediaRecorder APIs, it can be enhanced with the `webrtc-easy` library for additional features:

- Use `MediaHelper` for more advanced media handling
- Apply video filters from `VideoProcessor` to the recording
- Apply audio effects from `AudioProcessor` to the recording
- Use connection quality monitoring during recording

## License

MIT

# WebRTC File Sharing Example

This example demonstrates how to use WebRTC data channels to share files between peers. It uses the `webrtc-easy` library to simplify the WebRTC implementation.

## Features

- Create or join a room for peer-to-peer connection
- Send files of any type to connected peers
- Display progress for both sending and receiving files
- List received files with download links
- Connection status and logging

## How It Works

1. **Connection Setup**:
   - One peer creates a room (initiator)
   - Another peer joins the room
   - WebRTC connection is established through a signaling server

2. **File Transfer**:
   - Files are sent in chunks (16KB by default) to avoid memory issues with large files
   - Metadata is sent first (filename, size, type)
   - Progress is tracked and displayed for both sending and receiving
   - Received file chunks are combined into a complete file when transfer is complete

3. **Data Channel Usage**:
   - A dedicated data channel named 'file-transfer' is used for file data
   - JSON strings are used for metadata
   - ArrayBuffers are used for binary file data

## Usage

1. Open the example in a web browser
2. Enter a room ID
3. Click "Create Room" on one device and "Join Room" on another
4. Once connected, select a file and click "Send File"
5. The file will be transferred to the other peer
6. Received files appear in the "Received Files" section with download links

## Integration with webrtc-easy

This example uses the following components from the `webrtc-easy` library:

- `RTCConnection`: Manages the WebRTC peer connection
- `WebSocketSignaling`: Handles signaling through a WebSocket server
- Data channel methods for sending and receiving data

## Customization

- **Chunk Size**: Modify the `CHUNK_SIZE` constant to adjust the size of file chunks
- **Signaling Server**: Replace the WebSocket URL with your own signaling server
- **ICE Servers**: Add additional STUN/TURN servers for better connectivity

## Notes

- For large files, consider implementing pause/resume functionality
- Add file type validation if needed
- For production use, implement proper error handling and retries
- Consider adding encryption for sensitive files

## License

MIT

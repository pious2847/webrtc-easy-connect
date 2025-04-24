import { RTCConnection } from '../../src/core/connection';
import { WebRTCError } from '../../src/core/types';

describe('RTCConnection', () => {
  let connection: RTCConnection;

  beforeEach(() => {
    connection = new RTCConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
  });

  afterEach(() => {
    connection.close();
  });

  test('should initialize with default options', () => {
    expect(connection).toBeDefined();
    expect(connection.getConnectionState()).toBe('new');
  });

  test('should create offer successfully', async () => {
    const offer = await connection.createOffer();
    expect(offer).toBeDefined();
    expect(typeof offer.sdp).toBe('string');
  });

  test('should handle connection failure', async () => {
    const errorHandler = jest.fn();
    connection = new RTCConnection({
      onError: errorHandler,
      autoReconnect: true
    });

    // Simulate connection failure
    const peerConnection = connection['peerConnection'];
    peerConnection.iceConnectionState = 'failed';
    peerConnection.dispatchEvent(new Event('iceconnectionstatechange'));

    expect(errorHandler).toHaveBeenCalledWith(
      expect.any(WebRTCError)
    );
  });
});
import { RTCConnection } from '../connection';
import { WebRTCError } from '../types';

describe('RTCConnection', () => {
  let connection: RTCConnection;

  beforeEach(() => {
    connection = new RTCConnection();
  });

  afterEach(() => {
    connection.close();
  });

  it('should initialize with default options', () => {
    expect(connection).toBeTruthy();
    expect(connection.getConnectionState()).toBe('new');
  });

  it('should handle createOffer', async () => {
    const offer = await connection.createOffer();
    expect(offer).toBeTruthy();
  });

  it('should handle createAnswer', async () => {
    const answer = await connection.createAnswer({
      type: 'offer',
      sdp: 'mock-sdp'
    });
    expect(answer).toBeTruthy();
  });

  it('should handle data channel creation', () => {
    const channel = connection.createDataChannel('test');
    expect(channel).toBeTruthy();
  });

  it('should handle errors appropriately', async () => {
    const mockError = new Error('Mock error');
    jest.spyOn(RTCPeerConnection.prototype, 'createOffer')
      .mockRejectedValueOnce(mockError);

    await expect(connection.createOffer())
      .rejects
      .toThrow(WebRTCError);
  });
});
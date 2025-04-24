import { AdaptiveStreaming } from '../../src/core/adaptive-streaming';
import { QualityMetrics } from '../../src/core/quality-monitor';

describe('AdaptiveStreaming', () => {
  let connection: RTCPeerConnection;
  let adaptive: AdaptiveStreaming;

  beforeEach(() => {
    connection = new RTCPeerConnection();
    adaptive = new AdaptiveStreaming(connection, {
      maxBitrate: 2000,
      minBitrate: 200,
      targetQuality: 0.8
    });
  });

  afterEach(() => {
    adaptive.stop();
    connection.close();
  });

  test('should adapt bitrate based on quality metrics', async () => {
    const mockMetrics: QualityMetrics = {
      jitter: 20,
      packetsLost: 30,
      roundTripTime: 150,
      bandwidth: 1000,
      frameRate: 30
    };

    // Mock the quality monitor callback
    adaptive['qualityMonitor'].startMonitoring = jest.fn((callback) => {
      callback(mockMetrics);
    });

    adaptive.start();

    // Verify that bandwidth was adjusted
    expect(adaptive['bandwidthManager'].setBandwidthConstraints)
      .toHaveBeenCalledWith(expect.objectContaining({
        video: expect.any(Number),
        audio: 64
      }));
  });
});
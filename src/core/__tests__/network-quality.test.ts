import { NetworkQualityMonitor } from '../network-quality';

describe('NetworkQualityMonitor', () => {
  let mockPeerConnection: any;
  let monitor: NetworkQualityMonitor;

  beforeEach(() => {
    mockPeerConnection = {
      getStats: jest.fn(),
      getSenders: jest.fn().mockReturnValue([{
        getParameters: jest.fn().mockReturnValue({ encodings: [{}] }),
        setParameters: jest.fn()
      }])
    };
    monitor = new NetworkQualityMonitor(mockPeerConnection);
  });

  afterEach(() => {
    monitor.stopMonitoring();
    jest.clearAllMocks();
  });

  it('should calculate quality score correctly', async () => {
    const mockStats = new Map([
      ['inbound-1', {
        type: 'inbound-rtp',
        packetsReceived: 1000,
        packetsLost: 10
      }],
      ['candidate-pair-1', {
        type: 'candidate-pair',
        nominated: true,
        currentRoundTripTime: 0.1 // 100ms
      }]
    ]);

    mockPeerConnection.getStats.mockResolvedValueOnce(mockStats);

    const callback = jest.fn();
    monitor.startMonitoring(callback);
    await monitor['updateMetrics']();

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      quality: 'excellent',
      score: expect.any(Number),
      packetLoss: 1, // (10/1000) * 100
      roundTripTime: 100
    }));
  });

  it('should adapt bitrate based on network conditions', async () => {
    const mockStats = new Map([
      ['inbound-1', {
        type: 'inbound-rtp',
        packetsReceived: 1000,
        packetsLost: 50 // 5% packet loss
      }],
      ['candidate-pair-1', {
        type: 'candidate-pair',
        nominated: true,
        currentRoundTripTime: 0.4 // 400ms
      }]
    ]);

    mockPeerConnection.getStats.mockResolvedValueOnce(mockStats);

    await monitor['updateMetrics']();
    
    const sender = mockPeerConnection.getSenders()[0];
    expect(sender.setParameters).toHaveBeenCalled();
    
    const params = sender.setParameters.mock.calls[0][0];
    expect(params.encodings[0].maxBitrate).toBeLessThan(2500000); // Should reduce bitrate
  });

  it('should handle stats gathering errors gracefully', async () => {
    mockPeerConnection.getStats.mockRejectedValueOnce(new Error('Stats error'));

    const callback = jest.fn();
    monitor.startMonitoring(callback);
    await monitor['updateMetrics']();

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      quality: expect.any(String),
      score: expect.any(Number)
    }));
  });
});
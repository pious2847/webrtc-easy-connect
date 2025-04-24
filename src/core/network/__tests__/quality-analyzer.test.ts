import { QualityAnalyzer, ConnectionQuality } from '../quality-analyzer';

describe('QualityAnalyzer', () => {
  let connection: RTCPeerConnection;
  let analyzer: QualityAnalyzer;

  beforeEach(() => {
    connection = new RTCPeerConnection();
    analyzer = new QualityAnalyzer(connection);
  });

  afterEach(() => {
    connection.close();
  });

  it('should analyze quality correctly', async () => {
    // Mock the getStats method
    const mockStats = new Map();
    mockStats.set('remote-inbound-rtp', {
      type: 'remote-inbound-rtp',
      roundTripTime: 0.05, // 50ms
      packetsLost: 5,
      jitter: 10
    });
    mockStats.set('media-source', {
      type: 'media-source',
      kind: 'video',
      framesPerSecond: 30
    });

    connection.getStats = jest.fn().mockResolvedValue(mockStats);

    const quality = await analyzer.analyzeQuality();

    expect(quality).toBeDefined();
    expect(quality.score).toBeGreaterThan(0);
    expect(quality.score).toBeLessThanOrEqual(1);
    expect(['excellent', 'good', 'fair', 'poor']).toContain(quality.level);
    expect(quality.metrics).toBeDefined();
    expect(quality.metrics.rtt).toBe(0.05);
    expect(quality.metrics.packetLoss).toBe(5);
    expect(quality.metrics.jitter).toBe(10);
    expect(quality.metrics.frameRate).toBe(30);
  });

  it('should start and stop monitoring', () => {
    const callback = jest.fn();
    
    // Mock setInterval and clearInterval
    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    
    global.setInterval = jest.fn().mockReturnValue(123);
    global.clearInterval = jest.fn();
    
    analyzer.startMonitoring(callback);
    expect(global.setInterval).toHaveBeenCalled();
    
    analyzer.stopMonitoring();
    expect(global.clearInterval).toHaveBeenCalledWith(123);
    
    // Restore original functions
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  });

  it('should calculate quality level correctly', () => {
    // Access private method using type assertion
    const getQualityLevel = (analyzer as any).getQualityLevel.bind(analyzer);
    
    expect(getQualityLevel(0.9)).toBe('excellent');
    expect(getQualityLevel(0.7)).toBe('good');
    expect(getQualityLevel(0.5)).toBe('fair');
    expect(getQualityLevel(0.3)).toBe('poor');
  });
});

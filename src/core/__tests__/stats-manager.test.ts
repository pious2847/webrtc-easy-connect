import { StatsManager } from '../stats-manager';

describe('StatsManager', () => {
  let mockPeerConnection: any;
  let statsManager: StatsManager;

  beforeEach(() => {
    mockPeerConnection = {
      getStats: jest.fn()
    };
    statsManager = new StatsManager(mockPeerConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
    statsManager.stopMonitoring();
  });

  it('should start and stop monitoring', () => {
    const callback = jest.fn();
    jest.useFakeTimers();

    statsManager.startMonitoring(1000, callback);
    expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);

    statsManager.stopMonitoring();
    expect(clearInterval).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should process inbound RTP stats correctly', async () => {
    const mockStats = new Map([
      ['inbound-1', {
        type: 'inbound-rtp',
        mediaType: 'video',
        bytesReceived: 1000,
        packetsLost: 5,
        frameWidth: 1280,
        frameHeight: 720,
        framesPerSecond: 30
      }]
    ]);

    mockPeerConnection.getStats.mockResolvedValueOnce(mockStats);

    const callback = jest.fn();
    await statsManager['gatherStats']();

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      video: {
        bytesReceived: 1000,
        packetsLost: 5,
        resolution: {
          width: 1280,
          height: 720
        },
        frameRate: 30
      }
    }));
  });

  it('should process candidate pair stats correctly', async () => {
    const mockStats = new Map([
      ['candidate-pair-1', {
        type: 'candidate-pair',
        nominated: true,
        currentRoundTripTime: 0.05,
        availableOutgoingBitrate: 1000000,
        availableIncomingBitrate: 2000000
      }]
    ]);

    mockPeerConnection.getStats.mockResolvedValueOnce(mockStats);

    const callback = jest.fn();
    await statsManager['gatherStats']();

    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      connection: {
        currentRoundTripTime: 0.05,
        availableOutgoingBitrate: 1000000,
        availableIncomingBitrate: 2000000
      }
    }));
  });
});
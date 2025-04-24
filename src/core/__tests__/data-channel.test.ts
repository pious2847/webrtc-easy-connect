import { DataChannelManager } from '../data-channel';

describe('DataChannelManager', () => {
  let peerConnection: RTCPeerConnection;
  let dataChannelManager: DataChannelManager;
  let mockDataChannel: Partial<RTCDataChannel>;

  beforeEach(() => {
    mockDataChannel = {
      label: 'test-channel',
      readyState: 'open',
      send: jest.fn(),
      close: jest.fn(),
      onopen: null,
      onclose: null,
      onmessage: null,
      onerror: null
    };

    peerConnection = new RTCPeerConnection();
    peerConnection.createDataChannel = jest.fn().mockReturnValue(mockDataChannel);
    
    dataChannelManager = new DataChannelManager(peerConnection);
  });

  afterEach(() => {
    peerConnection.close();
  });

  it('should create a data channel', () => {
    const channel = dataChannelManager.createChannel('test-channel');
    
    expect(peerConnection.createDataChannel).toHaveBeenCalledWith('test-channel', undefined);
    expect(channel).toBe(mockDataChannel);
  });

  it('should throw error when creating a channel with existing label', () => {
    dataChannelManager.createChannel('test-channel');
    
    expect(() => {
      dataChannelManager.createChannel('test-channel');
    }).toThrow('Data channel "test-channel" already exists');
  });

  it('should send data through a channel', () => {
    dataChannelManager.createChannel('test-channel');
    const result = dataChannelManager.send('test-channel', 'test-data');
    
    expect(result).toBe(true);
    expect(mockDataChannel.send).toHaveBeenCalledWith('test-data');
  });

  it('should return false when sending to non-existent channel', () => {
    const result = dataChannelManager.send('non-existent', 'test-data');
    
    expect(result).toBe(false);
    expect(mockDataChannel.send).not.toHaveBeenCalled();
  });

  it('should close a channel', () => {
    dataChannelManager.createChannel('test-channel');
    dataChannelManager.closeChannel('test-channel');
    
    expect(mockDataChannel.close).toHaveBeenCalled();
  });

  it('should register and call message handlers', () => {
    const handler = jest.fn();
    
    dataChannelManager.createChannel('test-channel');
    dataChannelManager.onMessage('test-channel', handler);
    
    // Simulate a message event
    const messageEvent = { data: 'test-data' };
    mockDataChannel.onmessage!(messageEvent as MessageEvent);
    
    expect(handler).toHaveBeenCalledWith('test-data');
  });

  it('should broadcast data to all channels', () => {
    const mockChannel1 = { ...mockDataChannel, label: 'channel1', send: jest.fn() };
    const mockChannel2 = { ...mockDataChannel, label: 'channel2', send: jest.fn() };
    
    peerConnection.createDataChannel = jest.fn()
      .mockReturnValueOnce(mockChannel1)
      .mockReturnValueOnce(mockChannel2);
    
    dataChannelManager.createChannel('channel1');
    dataChannelManager.createChannel('channel2');
    
    dataChannelManager.broadcast({ message: 'test' });
    
    expect(mockChannel1.send).toHaveBeenCalledWith(JSON.stringify({ message: 'test' }));
    expect(mockChannel2.send).toHaveBeenCalledWith(JSON.stringify({ message: 'test' }));
  });

  it('should close all channels', () => {
    const mockChannel1 = { ...mockDataChannel, label: 'channel1', close: jest.fn() };
    const mockChannel2 = { ...mockDataChannel, label: 'channel2', close: jest.fn() };
    
    peerConnection.createDataChannel = jest.fn()
      .mockReturnValueOnce(mockChannel1)
      .mockReturnValueOnce(mockChannel2);
    
    dataChannelManager.createChannel('channel1');
    dataChannelManager.createChannel('channel2');
    
    dataChannelManager.closeAll();
    
    expect(mockChannel1.close).toHaveBeenCalled();
    expect(mockChannel2.close).toHaveBeenCalled();
  });
});

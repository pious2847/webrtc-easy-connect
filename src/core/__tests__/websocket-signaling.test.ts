import { WebSocketSignaling } from '../websocket-signaling';
import { SignalingMessage } from '../types';

describe('WebSocketSignaling', () => {
  let signaling: WebSocketSignaling;
  let mockWebSocket: any;

  beforeEach(() => {
    mockWebSocket = {
      send: jest.fn(),
      close: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    };

    global.WebSocket = jest.fn().mockImplementation(() => mockWebSocket);

    signaling = new WebSocketSignaling({
      url: 'wss://test.com',
      room: 'test-room'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should connect to WebSocket server on initialization', () => {
    expect(WebSocket).toHaveBeenCalledWith('wss://test.com');
  });

  it('should send messages through WebSocket', () => {
    const message: SignalingMessage = {
      type: 'offer',
      payload: { type: 'offer', sdp: 'test' }
    };

    signaling.send(message);
    expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('should handle incoming messages', () => {
    const mockCallback = jest.fn();
    const message: SignalingMessage = {
      type: 'offer',
      payload: { type: 'offer', sdp: 'test' }
    };

    signaling.onMessage(mockCallback);

    // Simulate WebSocket message
    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify(message)
    });
    mockWebSocket.addEventListener.mock.calls[0][1](messageEvent);

    expect(mockCallback).toHaveBeenCalledWith(message);
  });

  it('should handle reconnection on disconnect', () => {
    jest.useFakeTimers();

    signaling = new WebSocketSignaling({
      url: 'wss://test.com',
      autoReconnect: true,
      reconnectInterval: 1000
    });

    // Simulate WebSocket close
    mockWebSocket.addEventListener.mock.calls
      .find(([event]) => event === 'close')[1]();

    jest.advanceTimersByTime(1000);
    expect(WebSocket).toHaveBeenCalledTimes(2);

    jest.useRealTimers();
  });

  it('should clean up on disconnect', () => {
    signaling.disconnect();
    expect(mockWebSocket.close).toHaveBeenCalled();
  });
});
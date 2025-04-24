class MockMediaStream {
  getTracks() { return []; }
  getVideoTracks() { return []; }
  getAudioTracks() { return []; }
}

class MockRTCPeerConnection {
  localDescription = null;
  remoteDescription = null;
  signalingState = 'stable';
  iceGatheringState = 'complete';
  iceConnectionState = 'connected';
  connectionState = 'connected';

  addEventListener() {}
  removeEventListener() {}
  createOffer() { return Promise.resolve({}); }
  createAnswer() { return Promise.resolve({}); }
  setLocalDescription() { return Promise.resolve(); }
  setRemoteDescription() { return Promise.resolve(); }
  addIceCandidate() { return Promise.resolve(); }
  close() {}
}

global.MediaStream = MockMediaStream as any;
global.RTCPeerConnection = MockRTCPeerConnection as any;
global.RTCSessionDescription = jest.fn() as any;
global.RTCIceCandidate = jest.fn() as any;

global.navigator.mediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue(new MockMediaStream()),
  getDisplayMedia: jest.fn().mockResolvedValue(new MockMediaStream()),
  enumerateDevices: jest.fn().mockResolvedValue([])
} as any;

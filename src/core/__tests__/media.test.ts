import { MediaHelper } from '../media';

describe('MediaHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserMedia', () => {
    it('should get user media with default constraints', async () => {
      const stream = await MediaHelper.getUserMedia();
      expect(stream).toBeTruthy();
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: true,
        audio: true
      });
    });

    it('should get user media with custom constraints', async () => {
      const constraints = {
        video: { facingMode: 'user' },
        audio: { echoCancellation: true }
      };
      await MediaHelper.getUserMedia(constraints);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(constraints);
    });

    it('should handle getUserMedia errors', async () => {
      const error = new Error('Permission denied');
      jest.spyOn(navigator.mediaDevices, 'getUserMedia')
        .mockRejectedValueOnce(error);

      await expect(MediaHelper.getUserMedia())
        .rejects
        .toThrow('Failed to get user media');
    });
  });

  describe('getDisplayMedia', () => {
    it('should get display media with default constraints', async () => {
      const stream = await MediaHelper.getDisplayMedia();
      expect(stream).toBeTruthy();
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith({
        video: true
      });
    });

    it('should handle getDisplayMedia errors', async () => {
      const error = new Error('Permission denied');
      jest.spyOn(navigator.mediaDevices, 'getDisplayMedia')
        .mockRejectedValueOnce(error);

      await expect(MediaHelper.getDisplayMedia())
        .rejects
        .toThrow('Failed to get display media');
    });
  });

  describe('stopMediaStream', () => {
    it('should stop all tracks in the stream', () => {
      const mockTrack = { stop: jest.fn() };
      const mockStream = { getTracks: () => [mockTrack, mockTrack] };
      
      MediaHelper.stopMediaStream(mockStream as unknown as MediaStream);
      
      expect(mockTrack.stop).toHaveBeenCalledTimes(2);
    });
  });
});
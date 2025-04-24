import { MediaHelper } from '../../src/core/media';

describe('MediaHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get user media with default constraints', async () => {
    const stream = await MediaHelper.getUserMedia();
    expect(stream).toBeInstanceOf(MediaStream);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: true,
      audio: true
    });
  });

  test('should get display media', async () => {
    const stream = await MediaHelper.getDisplayMedia();
    expect(stream).toBeInstanceOf(MediaStream);
    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
  });

  test('should handle getUserMedia failure', async () => {
    const error = new Error('Permission denied');
    (navigator.mediaDevices.getUserMedia as jest.Mock)
      .mockRejectedValueOnce(error);

    await expect(MediaHelper.getUserMedia())
      .rejects
      .toThrow('Failed to get user media');
  });
});
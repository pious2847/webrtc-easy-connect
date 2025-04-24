export class MediaHelper {
  static async getUserMedia(options: MediaStreamConstraints = { 
    video: true, 
    audio: true 
  }): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia(options);
    } catch (error) {
      throw new Error(`Failed to get user media: ${error}`);
    }
  }

  static async getDisplayMedia(options: DisplayMediaStreamConstraints = {
    video: true
  }): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getDisplayMedia(options);
    } catch (error) {
      throw new Error(`Failed to get display media: ${error}`);
    }
  }

  static stopMediaStream(stream: MediaStream) {
    stream.getTracks().forEach(track => track.stop());
  }

  static async toggleTrack(stream: MediaStream, kind: 'audio' | 'video'): Promise<void> {
    stream.getTracks()
      .filter(track => track.kind === kind)
      .forEach(track => track.enabled = !track.enabled);
  }

  static async replaceTrack(
    peerConnection: RTCPeerConnection,
    newTrack: MediaStreamTrack,
    oldStream: MediaStream
  ): Promise<void> {
    const sender = peerConnection.getSenders()
      .find(s => s.track?.kind === newTrack.kind);
    
    if (sender) {
      await sender.replaceTrack(newTrack);
      const oldTrack = oldStream.getTracks()
        .find(t => t.kind === newTrack.kind);
      if (oldTrack) {
        oldTrack.stop();
        oldStream.removeTrack(oldTrack);
      }
      oldStream.addTrack(newTrack);
    }
  }

  static getMediaConstraints(deviceId?: string): MediaStreamConstraints {
    return {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: true
    };
  }
}

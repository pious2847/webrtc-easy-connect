export class MediaDeviceManager {
  private currentDevices: Map<string, MediaDeviceInfo> = new Map();
  private deviceChangeListeners: Set<() => void> = new Set();

  constructor(private connection: RTCPeerConnection) {
    this.initializeDeviceTracking();
  }

  private async initializeDeviceTracking() {
    navigator.mediaDevices.addEventListener('devicechange', async () => {
      await this.updateDeviceList();
      this.notifyDeviceChange();
    });

    await this.updateDeviceList();
  }

  private async updateDeviceList() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    this.currentDevices.clear();
    devices.forEach(device => {
      this.currentDevices.set(device.deviceId, device);
    });
  }

  async switchAudioInput(deviceId: string): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: { exact: deviceId } }
    });

    const audioTrack = stream.getAudioTracks()[0];
    await this.replaceTrack(audioTrack);
  }

  async switchVideoInput(deviceId: string): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } }
    });

    const videoTrack = stream.getVideoTracks()[0];
    await this.replaceTrack(videoTrack);
  }

  private async replaceTrack(newTrack: MediaStreamTrack): Promise<void> {
    const sender = this.connection
      .getSenders()
      .find(s => s.track?.kind === newTrack.kind);

    if (sender) {
      await sender.replaceTrack(newTrack);
    } else {
      throw new Error(`No sender found for track kind: ${newTrack.kind}`);
    }
  }

  onDeviceChange(listener: () => void): () => void {
    this.deviceChangeListeners.add(listener);
    return () => this.deviceChangeListeners.delete(listener);
  }

  private notifyDeviceChange() {
    this.deviceChangeListeners.forEach(listener => listener());
  }

  async getAvailableDevices(): Promise<{
    audioInput: MediaDeviceInfo[];
    videoInput: MediaDeviceInfo[];
    audioOutput: MediaDeviceInfo[];
  }> {
    const devices = Array.from(this.currentDevices.values());
    return {
      audioInput: devices.filter(d => d.kind === 'audioinput'),
      videoInput: devices.filter(d => d.kind === 'videoinput'),
      audioOutput: devices.filter(d => d.kind === 'audiooutput')
    };
  }
}
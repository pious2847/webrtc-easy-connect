export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  reconnection: {
    autoReconnect: boolean;
    maxAttempts: number;
    delay: number;
  };
  media: {
    defaultConstraints: MediaStreamConstraints;
    screenShare: DisplayMediaStreamConstraints;
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: WebRTCConfig;

  private constructor() {
    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ],
      reconnection: {
        autoReconnect: true,
        maxAttempts: 3,
        delay: 2000
      },
      media: {
        defaultConstraints: {
          video: true,
          audio: true
        },
        screenShare: {
          video: true,
          audio: false
        }
      }
    };
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  updateConfig(newConfig: Partial<WebRTCConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  getConfig(): WebRTCConfig {
    return { ...this.config };
  }
}
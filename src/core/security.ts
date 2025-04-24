export class SecurityManager {
  private static readonly ALLOWED_ICE_PROTOCOLS = ['udp', 'tcp'];
  private static readonly MIN_ENCRYPTION_BITS = 128;

  static validateConfiguration(config: RTCConfiguration): void {
    // Validate ICE servers
    if (config.iceServers) {
      config.iceServers.forEach(server => {
        if (!this.isValidIceServer(server)) {
          throw new Error('Invalid ICE server configuration');
        }
      });
    }

    // Enforce encryption
    if (!config.bundlePolicy) {
      config.bundlePolicy = 'max-bundle';
    }

    // Enforce ICE transport policy
    if (!config.iceTransportPolicy) {
      config.iceTransportPolicy = 'relay';
    }
  }

  static validateDataChannel(options: RTCDataChannelInit): void {
    // Ensure ordered delivery by default
    if (options.ordered === undefined) {
      options.ordered = true;
    }

    // Set maximum retransmit time
    if (!options.maxRetransmitTime) {
      options.maxRetransmitTime = 3000;
    }
  }

  private static isValidIceServer(server: RTCIceServer): boolean {
    if (!server.urls) return false;
    
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    return urls.every(url => {
      const protocol = url.split(':')[0].toLowerCase();
      return ['stun', 'turn', 'turns'].includes(protocol);
    });
  }
}
import { MediaProcessor } from './processor';

export interface VideoFilter {
  type: 'blur' | 'colorize' | 'brightness' | 'contrast' | 'custom';
  params: Record<string, number | string>;
  shader?: string;
}

export class VideoProcessor extends MediaProcessor {
  private canvas: OffscreenCanvas;
  private gl: WebGL2RenderingContext;
  private filters: Map<string, VideoFilter> = new Map();
  private programs: Map<string, WebGLProgram> = new Map();
  private frameBuffer?: WebGLFramebuffer;
  private textures: WebGLTexture[] = [];

  async start(): Promise<void> {
    await this.createProcessingContext();
    this.canvas = this.context as OffscreenCanvas;
    this.gl = this.canvas.getContext('webgl2')!;
    await this.initializeWebGL();
  }

  async process(stream: MediaStream): Promise<MediaStream> {
    if (!this.options.enabled) return stream;

    const videoTrack = stream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();
    const width = settings.width || 640;
    const height = settings.height || 480;

    this.canvas.width = width;
    this.canvas.height = height;

    // Create a video element to capture the track
    const videoElement = document.createElement('video');
    videoElement.srcObject = new MediaStream([videoTrack]);
    videoElement.autoplay = true;
    videoElement.muted = true;

    // Wait for video to be ready
    await new Promise<void>(resolve => {
      videoElement.onloadedmetadata = () => {
        videoElement.play().then(() => resolve());
      };
    });

    await this.processFrame(videoElement);

    // Use canvas.convertToBlob() and createImageBitmap for OffscreenCanvas
    // For simplicity in this implementation, we'll return the original stream
    // In a real implementation, you would create a MediaStream from the canvas
    return stream;
  }

  async addFilter(id: string, filter: VideoFilter): Promise<void> {
    this.filters.set(id, filter);
    await this.compileShader(id, filter);
    // No need to update filter chain, it's applied in processFrame
  }

  private async updateFilterChain(): Promise<void> {
    // This method is a placeholder for future implementation
    // that might optimize the filter chain
    return Promise.resolve();
  }

  private async initializeWebGL(): Promise<void> {
    // Create framebuffers for ping-pong rendering
    this.frameBuffer = this.gl.createFramebuffer();
    this.textures = [
      this.createTexture(),
      this.createTexture()
    ];
  }

  private createTexture(): WebGLTexture {
    const texture = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    return texture;
  }

  private async compileShader(id: string, filter: VideoFilter): Promise<void> {
    let fragmentShader: string;

    switch (filter.type) {
      case 'blur':
        fragmentShader = this.getBlurShader();
        break;
      case 'colorize':
        fragmentShader = this.getColorizeShader();
        break;
      case 'custom':
        fragmentShader = filter.shader!;
        break;
      default:
        fragmentShader = this.getDefaultShader();
    }

    const program = this.createShaderProgram(fragmentShader);
    this.programs.set(id, program);
  }

  private getBlurShader(): string {
    return `#version 300 es
      precision mediump float;
      uniform sampler2D u_image;
      uniform vec2 u_textureSize;
      uniform float u_radius;
      in vec2 v_texCoord;
      out vec4 fragColor;

      void main() {
        vec4 color = vec4(0.0);
        float total = 0.0;

        for (float x = -u_radius; x <= u_radius; x += 1.0) {
          for (float y = -u_radius; y <= u_radius; y += 1.0) {
            vec2 offset = vec2(x, y) / u_textureSize;
            color += texture(u_image, v_texCoord + offset);
            total += 1.0;
          }
        }

        fragColor = color / total;
      }
    `;
  }

  private getColorizeShader(): string {
    return `#version 300 es
      precision mediump float;
      uniform sampler2D u_image;
      uniform vec3 u_color;
      uniform float u_intensity;
      in vec2 v_texCoord;
      out vec4 fragColor;

      void main() {
        vec4 texColor = texture(u_image, v_texCoord);
        vec3 gray = vec3(dot(texColor.rgb, vec3(0.299, 0.587, 0.114)));
        vec3 colorized = mix(gray, u_color, u_intensity);
        fragColor = vec4(colorized, texColor.a);
      }
    `;
  }

  private getDefaultShader(): string {
    return `#version 300 es
      precision mediump float;
      uniform sampler2D u_image;
      in vec2 v_texCoord;
      out vec4 fragColor;

      void main() {
        fragColor = texture(u_image, v_texCoord);
      }
    `;
  }

  private getVertexShader(): string {
    return `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;
  }

  private createShaderProgram(fragmentShaderSource: string): WebGLProgram {
    const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER)!;
    const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)!;
    const program = this.gl.createProgram()!;

    this.gl.shaderSource(vertexShader, this.getVertexShader());
    this.gl.shaderSource(fragmentShader, fragmentShaderSource);

    this.gl.compileShader(vertexShader);
    this.gl.compileShader(fragmentShader);

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    return program;
  }

  private async processFrame(frame: any): Promise<void> {
    let inputTexture = this.textures[0];
    let outputTexture = this.textures[1];

    // Upload frame data to input texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, inputTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      frame.width || 640,
      frame.height || 480,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      frame
    );

    // Apply each filter in chain
    for (const [id, filter] of this.filters) {
      const program = this.programs.get(id)!;
      await this.applyFilter(program, filter, inputTexture, outputTexture);
      [inputTexture, outputTexture] = [outputTexture, inputTexture];
    }
  }

  private async applyFilter(
    program: WebGLProgram,
    filter: VideoFilter,
    inputTexture: WebGLTexture,
    outputTexture: WebGLTexture
  ): Promise<void> {
    // Set up framebuffer for rendering to texture
    if (this.frameBuffer) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        outputTexture,
        0
      );
    } else {
      return; // Can't apply filter without a framebuffer
    }

    // Use the shader program
    this.gl.useProgram(program);

    // Set up uniforms based on filter type
    this.gl.uniform1i(this.gl.getUniformLocation(program, 'u_image'), 0);

    switch (filter.type) {
      case 'blur':
        this.gl.uniform1f(
          this.gl.getUniformLocation(program, 'u_radius'),
          filter.params.radius as number || 5.0
        );
        this.gl.uniform2f(
          this.gl.getUniformLocation(program, 'u_textureSize'),
          this.canvas.width,
          this.canvas.height
        );
        break;
      case 'colorize':
        const color = filter.params.color as string || '#FF0000';
        const r = parseInt(color.slice(1, 3), 16) / 255;
        const g = parseInt(color.slice(3, 5), 16) / 255;
        const b = parseInt(color.slice(5, 7), 16) / 255;
        this.gl.uniform3f(
          this.gl.getUniformLocation(program, 'u_color'),
          r, g, b
        );
        this.gl.uniform1f(
          this.gl.getUniformLocation(program, 'u_intensity'),
          filter.params.intensity as number || 0.5
        );
        break;
    }

    // Bind input texture
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, inputTexture);

    // Draw a quad that covers the entire viewport
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  async stop(): Promise<void> {
    this.filters.clear();
    this.programs.clear();
    if (this.frameBuffer) {
      this.gl.deleteFramebuffer(this.frameBuffer);
    }
    this.textures.forEach(texture => this.gl.deleteTexture(texture));
  }

  release(): void {
    this.stop();
  }
}
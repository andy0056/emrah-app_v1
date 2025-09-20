interface ARSupport {
  hasWebXR: boolean;
  hasARCore: boolean;
  hasARKit: boolean;
  supports8thWall: boolean;
  supportsMindAR: boolean;
  isIOSSafari: boolean;
  isAndroidChrome: boolean;
}

interface ARConfiguration {
  mode: 'webxr' | 'model-viewer' | '8thwall' | 'qr-fallback';
  trackingType: 'plane' | 'marker' | 'image' | 'location';
  modelFormat: 'gltf' | 'usdz' | 'obj';
  scale: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

interface ARSession {
  id: string;
  active: boolean;
  mode: ARConfiguration['mode'];
  startTime: Date;
  deviceInfo: {
    userAgent: string;
    platform: string;
    hasGyroscope: boolean;
    hasAccelerometer: boolean;
    hasCamera: boolean;
  };
}

export class ARPreviewService {
  private static currentSession: ARSession | null = null;
  private static arSupport: ARSupport | null = null;

  static async detectARSupport(): Promise<ARSupport> {
    if (this.arSupport) return this.arSupport;

    const userAgent = navigator.userAgent;
    const isIOSSafari = /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent);
    const isAndroidChrome = /Android/.test(userAgent) && /Chrome/.test(userAgent);

    // Check for WebXR support
    const hasWebXR = 'xr' in navigator && await this.checkWebXRSupport();

    // Check for ARCore (Android Chrome)
    const hasARCore = isAndroidChrome && await this.checkARCoreSupport();

    // Check for ARKit (iOS Safari)
    const hasARKit = isIOSSafari && await this.checkARKitSupport();

    // Check for 8th Wall support (WebAR library)
    const supports8thWall = await this.check8thWallSupport();

    // Check for Mind AR support
    const supportsMindAR = await this.checkMindARSupport();

    this.arSupport = {
      hasWebXR,
      hasARCore,
      hasARKit,
      supports8thWall,
      supportsMindAR,
      isIOSSafari,
      isAndroidChrome
    };

    return this.arSupport;
  }

  private static async checkWebXRSupport(): Promise<boolean> {
    try {
      if (!('xr' in navigator)) return false;
      const supported = await (navigator as any).xr.isSessionSupported('immersive-ar');
      return supported;
    } catch {
      return false;
    }
  }

  private static async checkARCoreSupport(): Promise<boolean> {
    // Check if device supports ARCore
    return /Android/.test(navigator.userAgent) &&
           'DeviceMotionEvent' in window &&
           'DeviceOrientationEvent' in window;
  }

  private static async checkARKitSupport(): Promise<boolean> {
    // Check if device supports ARKit
    return /iPad|iPhone|iPod/.test(navigator.userAgent) &&
           'DeviceMotionEvent' in window;
  }

  private static async check8thWallSupport(): Promise<boolean> {
    // Check if 8th Wall can be loaded
    try {
      return 'MediaDevices' in window &&
             'getUserMedia' in navigator.mediaDevices &&
             'WebGLRenderingContext' in window;
    } catch {
      return false;
    }
  }

  private static async checkMindARSupport(): Promise<boolean> {
    // Check if Mind AR can be loaded
    return 'MediaDevices' in window &&
           'getUserMedia' in navigator.mediaDevices;
  }

  static async getBestARConfiguration(
    displayType: string,
    dimensions: { width: number; height: number; depth?: number },
    environment: 'indoor' | 'outdoor' = 'indoor'
  ): Promise<ARConfiguration> {
    const support = await this.detectARSupport();

    // Determine best AR mode based on device capabilities
    let mode: ARConfiguration['mode'] = 'qr-fallback';
    let trackingType: ARConfiguration['trackingType'] = 'plane';
    let modelFormat: ARConfiguration['modelFormat'] = 'gltf';

    if (support.hasWebXR) {
      mode = 'webxr';
      trackingType = 'plane';
      modelFormat = 'gltf';
    } else if (support.hasARKit) {
      mode = 'model-viewer';
      modelFormat = 'usdz';
      trackingType = 'plane';
    } else if (support.hasARCore) {
      mode = 'model-viewer';
      modelFormat = 'gltf';
      trackingType = 'plane';
    } else if (support.supports8thWall) {
      mode = '8thwall';
      trackingType = environment === 'outdoor' ? 'location' : 'plane';
      modelFormat = 'gltf';
    }

    // Calculate appropriate scale based on dimensions
    const maxDimension = Math.max(dimensions.width, dimensions.height, dimensions.depth || 0);
    let scale = 1;

    if (maxDimension > 2000) scale = 0.001; // Large displays
    else if (maxDimension > 1000) scale = 0.002;
    else if (maxDimension > 500) scale = 0.005;
    else scale = 0.01; // Small displays

    return {
      mode,
      trackingType,
      modelFormat,
      scale,
      position: { x: 0, y: 0, z: -1.5 }, // 1.5m in front of user
      rotation: { x: 0, y: 0, z: 0 }
    };
  }

  static async generateARModel(
    formData: any,
    generatedImages: string[]
  ): Promise<{ gltfUrl?: string; usdzUrl?: string; objUrl?: string }> {
    try {
      // This would integrate with a 3D model generation service
      // For now, we'll create placeholder URLs
      const modelId = `display_${Date.now()}`;

      return {
        gltfUrl: await this.createGLTFModel(formData, generatedImages, modelId),
        usdzUrl: await this.createUSDZModel(formData, generatedImages, modelId),
        objUrl: await this.createOBJModel(formData, generatedImages, modelId)
      };
    } catch (error) {
      console.error('AR model generation failed:', error);
      throw new Error('Failed to generate AR model');
    }
  }

  private static async createGLTFModel(
    formData: any,
    images: string[],
    modelId: string
  ): Promise<string> {
    // Simulate GLTF model creation
    // In production, this would call a 3D model generation API
    const modelData = {
      scene: 0,
      scenes: [{
        nodes: [0]
      }],
      nodes: [{
        mesh: 0,
        translation: [0, 0, 0],
        scale: [1, 1, 1]
      }],
      meshes: [{
        primitives: [{
          attributes: {
            POSITION: 0,
            TEXCOORD_0: 1
          },
          indices: 2,
          material: 0
        }]
      }],
      materials: [{
        pbrMetallicRoughness: {
          baseColorTexture: { index: 0 },
          metallicFactor: 0.0,
          roughnessFactor: 0.9
        }
      }],
      textures: [{
        source: 0
      }],
      images: [{
        uri: images[0] || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      }],
      accessors: [
        // Position accessor
        {
          bufferView: 0,
          componentType: 5126,
          count: 4,
          type: "VEC3"
        },
        // UV accessor
        {
          bufferView: 1,
          componentType: 5126,
          count: 4,
          type: "VEC2"
        },
        // Index accessor
        {
          bufferView: 2,
          componentType: 5123,
          count: 6,
          type: "SCALAR"
        }
      ],
      bufferViews: [
        {
          buffer: 0,
          byteOffset: 0,
          byteLength: 48
        },
        {
          buffer: 0,
          byteOffset: 48,
          byteLength: 32
        },
        {
          buffer: 0,
          byteOffset: 80,
          byteLength: 12
        }
      ],
      buffers: [{
        byteLength: 92,
        uri: "data:application/octet-stream;base64,..." // Base64 encoded geometry data
      }],
      asset: {
        version: "2.0",
        generator: "Emrah AR Preview Generator"
      }
    };

    // Convert to blob URL (in production, upload to CDN)
    const blob = new Blob([JSON.stringify(modelData)], { type: 'model/gltf+json' });
    return URL.createObjectURL(blob);
  }

  private static async createUSDZModel(
    formData: any,
    images: string[],
    modelId: string
  ): Promise<string> {
    // For iOS devices, we need USDZ format
    // This would typically be generated server-side
    // For now, return a placeholder
    return `https://cdn.emrah.com/ar-models/${modelId}.usdz`;
  }

  private static async createOBJModel(
    formData: any,
    images: string[],
    modelId: string
  ): Promise<string> {
    // Fallback OBJ format
    return `https://cdn.emrah.com/ar-models/${modelId}.obj`;
  }

  static async startARSession(configuration: ARConfiguration): Promise<ARSession> {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      hasGyroscope: 'DeviceOrientationEvent' in window,
      hasAccelerometer: 'DeviceMotionEvent' in window,
      hasCamera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
    };

    const session: ARSession = {
      id: `ar_session_${Date.now()}`,
      active: true,
      mode: configuration.mode,
      startTime: new Date(),
      deviceInfo
    };

    this.currentSession = session;

    // Initialize tracking based on mode
    await this.initializeTracking(configuration);

    return session;
  }

  private static async initializeTracking(config: ARConfiguration): Promise<void> {
    switch (config.mode) {
      case 'webxr':
        await this.initializeWebXR(config);
        break;
      case 'model-viewer':
        await this.initializeModelViewer(config);
        break;
      case '8thwall':
        await this.initialize8thWall(config);
        break;
      case 'qr-fallback':
        await this.initializeQRFallback(config);
        break;
    }
  }

  private static async initializeWebXR(config: ARConfiguration): Promise<void> {
    if (!('xr' in navigator)) {
      throw new Error('WebXR not supported');
    }

    try {
      const xr = (navigator as any).xr;
      const session = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay']
      });

      // Set up WebXR session
      console.log('WebXR session initialized');
    } catch (error) {
      console.error('WebXR initialization failed:', error);
      throw error;
    }
  }

  private static async initializeModelViewer(config: ARConfiguration): Promise<void> {
    // Model-viewer uses native AR capabilities
    console.log('Model-viewer AR initialized');
  }

  private static async initialize8thWall(config: ARConfiguration): Promise<void> {
    // 8th Wall WebAR initialization
    console.log('8th Wall AR initialized');
  }

  private static async initializeQRFallback(config: ARConfiguration): Promise<void> {
    // QR code fallback for unsupported devices
    console.log('QR fallback AR initialized');
  }

  static async endARSession(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.active = false;
      this.currentSession = null;
    }
  }

  static getCurrentSession(): ARSession | null {
    return this.currentSession;
  }

  static async generateQRCode(modelUrl: string, displayInfo: any): Promise<string> {
    // Generate QR code that links to AR experience
    const arUrl = `https://ar.emrah.com/view?model=${encodeURIComponent(modelUrl)}&info=${encodeURIComponent(JSON.stringify(displayInfo))}`;

    // This would use a QR code generation service
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(arUrl)}`;
  }

  static async captureARScreenshot(): Promise<string> {
    if (!this.currentSession?.active) {
      throw new Error('No active AR session');
    }

    // Capture screenshot from AR session
    // Implementation depends on AR mode
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  static async measureARPerformance(): Promise<{
    fps: number;
    trackingQuality: 'excellent' | 'good' | 'fair' | 'poor';
    renderTime: number;
    memoryUsage: number;
  }> {
    // Mock performance metrics
    return {
      fps: 30 + Math.random() * 30,
      trackingQuality: ['excellent', 'good', 'fair', 'poor'][Math.floor(Math.random() * 4)] as any,
      renderTime: 16 + Math.random() * 8,
      memoryUsage: 50 + Math.random() * 30
    };
  }

  static async shareARExperience(): Promise<{
    shareUrl: string;
    qrCode: string;
    socialLinks: {
      whatsapp: string;
      telegram: string;
      email: string;
    };
  }> {
    if (!this.currentSession) {
      throw new Error('No active AR session to share');
    }

    const shareUrl = `https://ar.emrah.com/shared/${this.currentSession.id}`;
    const qrCode = await this.generateQRCode(shareUrl, {});

    return {
      shareUrl,
      qrCode,
      socialLinks: {
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out this AR display preview: ${shareUrl}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('AR Display Preview')}`,
        email: `mailto:?subject=${encodeURIComponent('AR Display Preview')}&body=${encodeURIComponent(`Check out this AR preview: ${shareUrl}`)}`
      }
    };
  }
}
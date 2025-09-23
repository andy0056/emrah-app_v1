/**
 * Scene Capture Hook
 *
 * Handles capturing 3D scenes from multiple camera angles
 * for AI model input with proper scale references
 */

import { useCallback, useRef } from 'react';
import * as THREE from 'three';

export interface CapturedViews {
  front: string;
  side: string;
  threeQuarter: string;
  metadata: {
    timestamp: number;
    resolution: { width: number; height: number };
    scaleReferences: {
      humanHeight: number; // cm
      productDimensions: { width: number; height: number; depth: number };
      displayDimensions: { width: number; height: number; depth: number };
    };
  };
}

export interface SceneCaptureOptions {
  resolution: { width: number; height: number };
  backgroundColor: string;
  format: 'png' | 'jpeg';
  quality: number; // 0-1 for jpeg
}

const DEFAULT_OPTIONS: SceneCaptureOptions = {
  resolution: { width: 1024, height: 1024 },
  backgroundColor: '#f8fafc',
  format: 'png',
  quality: 0.95
};

export const useSceneCapture = () => {
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const captureSceneFromAngles = useCallback(async (
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    objectPositions: Record<string, [number, number, number]>,
    productDimensions: { width: number; height: number; depth: number },
    displayDimensions: { width: number; height: number; depth: number },
    options: Partial<SceneCaptureOptions> = {}
  ): Promise<CapturedViews> => {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
      console.log('🎯 Capturing scene from multiple angles with useSceneCapture...');

      // Create temporary renderer for capturing
      const tempRenderer = new THREE.WebGLRenderer({
        canvas: document.createElement('canvas'),
        preserveDrawingBuffer: true,
        antialias: true
      });

      tempRenderer.setSize(opts.resolution.width, opts.resolution.height);
      tempRenderer.setClearColor(opts.backgroundColor);

      // Create scene copy with current object positions
      const captureScene = new THREE.Scene();

      // Add lighting
      captureScene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 5);
      captureScene.add(directionalLight);

      // Add ground plane
      const groundGeometry = new THREE.PlaneGeometry(20, 20);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: '#f3f4f6',
        transparent: true,
        opacity: 0.3
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.1;
      captureScene.add(ground);

      // Add reference objects based on positions
      const referenceObjects = {
        human: { width: 60, height: 175, depth: 30, color: '#4F46E5' },
        product: productDimensions,
        macbook: { width: 30.4, height: 2.2, depth: 21.2, color: '#6B7280' },
        displayBounds: displayDimensions
      };

      Object.entries(referenceObjects).forEach(([type, obj]) => {
        if (objectPositions[type]) {
          const position = objectPositions[type];
          const scaleX = obj.width / 10;
          const scaleY = obj.height / 10;
          const scaleZ = obj.depth / 10;

          const geometry = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);
          const material = new THREE.MeshStandardMaterial({
            color: (obj as any).color || '#059669',
            transparent: true,
            opacity: type === 'displayBounds' ? 0.3 : 0.6,
            wireframe: type === 'displayBounds'
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.set(...position);
          captureScene.add(mesh);
        }
      });

      // Create cameras for different views
      const cameras = {
        front: new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000),
        side: new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000),
        threeQuarter: new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
      };

      // Position cameras
      cameras.front.position.set(0, 5, 15);
      cameras.front.lookAt(0, 0, 0);

      cameras.side.position.set(15, 5, 0);
      cameras.side.lookAt(0, 0, 0);

      cameras.threeQuarter.position.set(8, 8, 8);
      cameras.threeQuarter.lookAt(0, 0, 0);

      // Capture each view
      const capturedImages: { [key: string]: string } = {};

      for (const [viewName, camera] of Object.entries(cameras)) {
        tempRenderer.render(captureScene, camera);

        // Extract image data
        const dataURL = tempRenderer.domElement.toDataURL(
          opts.format === 'png' ? 'image/png' : 'image/jpeg',
          opts.quality
        );

        capturedImages[viewName] = dataURL;
      }

      // Create metadata
      const metadata = {
        timestamp: Date.now(),
        resolution: opts.resolution,
        scaleReferences: {
          humanHeight: 175, // Standard human height reference
          productDimensions,
          displayDimensions
        }
      };

      // Clean up
      tempRenderer.dispose();
      captureScene.clear();

      console.log('✅ Scene captured successfully from all angles');

      return {
        front: capturedImages.front,
        side: capturedImages.side,
        threeQuarter: capturedImages.threeQuarter,
        metadata
      };

    } catch (error) {
      throw new Error(`Scene capture failed: ${error}`);
    }
  }, []);

  const downloadCapturedViews = useCallback((views: CapturedViews, filename: string = 'scale-reference') => {
    Object.entries(views).forEach(([viewName, dataURL]) => {
      if (viewName === 'metadata') return;

      const link = document.createElement('a');
      link.download = `${filename}-${viewName}.png`;
      link.href = dataURL as string;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // Also download metadata as JSON
    const metadataBlob = new Blob([JSON.stringify(views.metadata, null, 2)], {
      type: 'application/json'
    });
    const metadataURL = URL.createObjectURL(metadataBlob);
    const metadataLink = document.createElement('a');
    metadataLink.download = `${filename}-metadata.json`;
    metadataLink.href = metadataURL;
    document.body.appendChild(metadataLink);
    metadataLink.click();
    document.body.removeChild(metadataLink);
    URL.revokeObjectURL(metadataURL);
  }, []);

  const generateScalePromptEnhancement = useCallback((views: CapturedViews): string => {
    const { scaleReferences } = views.metadata;

    return `
VISUAL SCALE REFERENCES:
- Human figure: ${scaleReferences.humanHeight}cm height (standard reference)
- Product: ${scaleReferences.productDimensions.width}×${scaleReferences.productDimensions.height}×${scaleReferences.productDimensions.depth}cm
- Display bounds: ${scaleReferences.displayDimensions.width}×${scaleReferences.displayDimensions.height}×${scaleReferences.displayDimensions.depth}cm

SCALE ACCURACY REQUIREMENTS:
- All elements must maintain proportional relationships shown in reference images
- Human figure provides absolute scale baseline (1.75m height)
- Product size must be accurate relative to human scale
- Display dimensions must match the wireframe boundary shown
- No scaling deviations from established reference proportions

REFERENCE IMAGE ANALYSIS:
The provided reference images show exact spatial relationships between human, product, and display elements. Maintain these precise proportional relationships in the generated design.`;
  }, []);

  return {
    captureSceneFromAngles,
    downloadCapturedViews,
    generateScalePromptEnhancement
  };
};
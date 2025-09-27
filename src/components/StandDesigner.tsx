/**
 * StandDesigner - Stage-1 Geometry Designer
 * Authoritative 3D geometry builder with exact centimeter measurements
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// Core geometry system
import { SPEC_A } from "../lib/spec";
import { validate, validateWithReport } from "../lib/validate";
import { buildStandGroup } from "../lib/buildScene";
import { StandardDimensions } from "../lib/dimensions";
import { CONTRACT, generateContract } from "../lib/contract";
import { generateSpecFromFormData, generateContractFromFormData, generateDynamicPrompt } from "../lib/dynamicSpec";
import { useFormData } from "../contexts/FormDataContext";
import { getApiBaseUrl } from "../utils/apiConfig";

// Export utilities
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

interface StandDesignerProps {
  className?: string;
  onGeometryReady?: (geometry: THREE.Group) => void;
  onStage2Ready?: (stage2Data: { image: Blob; contract: any; prompt: string }) => void;
}

/**
 * Stage-1 3D Geometry Component
 */
const StandGeometry: React.FC<{
  spec: any,
  onGroupReady?: (group: THREE.Group) => void
}> = ({ spec, onGroupReady }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { formData } = useFormData(); // Access form data context

  // Build geometry with validation using dynamic spec
  const standGroup = useMemo(() => {
    try {
      // MATH GATE: Hard validation before geometry creation
      const validation = validateWithReport(spec);
      if (!validation.isValid) {
        console.error('❌ Validation failed:', validation.errors);
        throw new Error(`Geometry validation failed: ${validation.errors.join(', ')}`);
      }

      console.log('✅ Validation passed:', {
        totalProducts: validation.measurements.totalProducts,
        calculatedDepth: validation.measurements.calculatedDepth,
        availableDepth: validation.measurements.availableDepth
      });

      // Build exact geometry with form data context
      const group = buildStandGroup(spec, formData);
      return group;
    } catch (error) {
      console.error('❌ Failed to build stand geometry:', error);
      throw error;
    }
  }, [spec, formData]);

  useEffect(() => {
    if (onGroupReady && standGroup) {
      onGroupReady(standGroup);
    }
  }, [onGroupReady, standGroup]);

  // Render stand geometry
  return (
    <group ref={groupRef}>
      <primitive object={standGroup} />
      <StandardDimensions spec={spec} />
    </group>
  );
};

/**
 * Orthographic 3/4 Camera Setup
 */
const CameraController: React.FC = () => {
  const { camera, gl } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.OrthographicCamera) {
      // Position for balanced 3/4 isometric view with room to move
      camera.position.set(25, 25, 25);
      camera.lookAt(0, 15, 0);
      camera.zoom = 1.2; // Balanced default zoom
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return null;
};

/**
 * WebGL Renderer Capture Component
 */
interface RendererCaptureProps {
  onRendererReady: (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => void;
}

const RendererCapture: React.FC<RendererCaptureProps> = ({ onRendererReady }) => {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    if (gl && scene && camera) {
      // Enable drawing buffer preservation for canvas capture
      gl.preserveDrawingBuffer = true;
      onRendererReady(gl, scene, camera);
    }
  }, [gl, scene, camera, onRendererReady]);

  return null;
};

/**
 * Main StandDesigner Component
 */
export default function StandDesigner({
  className = "",
  onGeometryReady,
  onStage2Ready
}: StandDesignerProps) {
  const { formData } = useFormData(); // Get dynamic form data
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [standGroup, setStandGroup] = useState<THREE.Group | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>("");
  const [webglRenderer, setWebglRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [threeScene, setThreeScene] = useState<THREE.Scene | null>(null);
  const [threeCamera, setThreeCamera] = useState<THREE.Camera | null>(null);

  // Prompt optimization state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedPrompt, setOptimizedPrompt] = useState<string>("");
  const [optimizationAnalysis, setOptimizationAnalysis] = useState<any>(null);
  const [showOptimization, setShowOptimization] = useState(false);
  const [optimizationConfidence, setOptimizationConfidence] = useState<number>(0);

  // Generate dynamic spec from form data
  const currentSpec = useMemo(() => generateSpecFromFormData(formData), [formData]);

  // Create dynamic orthographic camera based on model dimensions
  const orthoCamera = useMemo(() => {
    // Get model dimensions from current spec
    const { W, D, H } = currentSpec.stand;
    const standType = formData.standType || 'Tabletop Stand';

    // Calculate intelligent bounds based on model aspect ratio
    const horizontalSize = Math.max(W, D);
    const verticalSize = H;

    // Use much smaller, optimized padding
    const horizontalPadding = horizontalSize * 0.25; // 25% horizontal padding
    const verticalPadding = verticalSize * 0.15; // 15% vertical padding

    // Bounds that closely fit the model with minimal waste
    const left = -(horizontalSize / 2 + horizontalPadding);
    const right = horizontalSize / 2 + horizontalPadding;
    const top = verticalSize + verticalPadding;
    const bottom = -verticalPadding * 0.5; // Minimal bottom padding

    console.log(`📷 Optimized camera bounds for ${standType}: L:${left.toFixed(1)} R:${right.toFixed(1)} T:${top.toFixed(1)} B:${bottom.toFixed(1)}`);

    const camera = new THREE.OrthographicCamera(left, right, top, bottom, 0.1, 2000);

    // Camera position optimized for isometric view
    const distance = Math.max(horizontalSize, verticalSize) * 0.8;
    camera.position.set(distance, distance, distance);
    camera.lookAt(0, H / 2, 0); // Look at model center
    camera.zoom = 1.0; // Start with full view

    return camera;
  }, [currentSpec, formData.standType]);

  const handleGroupReady = (group: THREE.Group) => {
    setStandGroup(group);
    if (onGeometryReady) {
      onGeometryReady(group);
    }
  };

  const handleRendererReady = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) => {
    setWebglRenderer(renderer);
    setThreeScene(scene);
    setThreeCamera(camera);
  };

  // Optimize prompt using ChatGPT-4o
  const optimizePrompt = async () => {
    if (!webglRenderer || !threeScene || !threeCamera) {
      console.error('WebGL renderer not ready');
      return;
    }

    setIsOptimizing(true);
    setExportStatus("🧠 Analyzing with ChatGPT...");

    try {
      // Capture the current 3D scene
      webglRenderer.render(threeScene, threeCamera);
      const canvas = webglRenderer.domElement;

      // Convert to blob
      const imageBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.9);
      });

      // Generate the current prompt
      const currentPrompt = generateDynamicPrompt(formData, currentSpec);

      // Prepare form data for optimization
      const optimizationFormData = new FormData();
      optimizationFormData.append('stage1Image', imageBlob, 'stage1-geometry.png');
      optimizationFormData.append('currentPrompt', currentPrompt);
      optimizationFormData.append('formData', JSON.stringify(formData));

      // Include brand assets if available
      if (formData.brandLogo && formData.brandLogo instanceof File) {
        optimizationFormData.append('brandLogo', formData.brandLogo);
      }
      if (formData.productImage && formData.productImage instanceof File) {
        optimizationFormData.append('productImage', formData.productImage);
      }
      if (formData.keyVisual && formData.keyVisual instanceof File) {
        optimizationFormData.append('keyVisual', formData.keyVisual);
      }

      setExportStatus("🤖 ChatGPT analyzing images and optimizing...");

      // Call optimization API
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/optimize-prompt`, {
        method: 'POST',
        body: optimizationFormData
      });

      if (!response.ok) {
        throw new Error(`Optimization failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Store optimization results
      setOptimizedPrompt(result.optimizedPrompt);
      setOptimizationAnalysis(result.analysis);
      setOptimizationConfidence(result.confidence);
      setShowOptimization(true);

      if (result.fallbackMode) {
        setExportStatus("⚠️ ChatGPT unavailable - used fallback optimization");
      } else {
        setExportStatus(`✅ Prompt optimized (${Math.round(result.confidence * 100)}% confidence)`);
      }

      setTimeout(() => setExportStatus(""), 5000);

    } catch (error) {
      console.error('Prompt optimization failed:', error);
      setExportStatus("❌ Prompt optimization failed");
      setTimeout(() => setExportStatus(""), 5000);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Export functions
  const exportClayPNG = async () => {
    if (!webglRenderer || !threeScene || !threeCamera) {
      setExportStatus("❌ WebGL renderer not ready");
      return;
    }

    setExportStatus("Exporting PNG...");
    try {
      // Force render to ensure latest frame
      webglRenderer.render(threeScene, threeCamera);

      // Get the WebGL canvas and export
      const canvas = webglRenderer.domElement;
      const dataURL = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "stage1_clay_stand.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus("✅ PNG exported successfully");
      setTimeout(() => setExportStatus(""), 3000);
    } catch (error) {
      setExportStatus("❌ PNG export failed");
      console.error("PNG export error:", error);
    }
  };

  const exportGLB = async () => {
    if (!standGroup) return;

    setIsExporting(true);
    setExportStatus("Exporting GLB...");

    try {
      const exporter = new GLTFExporter();

      exporter.parse(
        standGroup,
        (result: ArrayBuffer) => {
          const blob = new Blob([result], { type: "model/gltf-binary" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "stage1_stand.glb";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setExportStatus("✅ GLB exported successfully");
          setTimeout(() => setExportStatus(""), 3000);
        },
        (error: any) => {
          console.error("GLB export error:", error);
          setExportStatus("❌ GLB export failed");
        },
        { binary: true }
      );
    } catch (error) {
      setExportStatus("❌ GLB export failed");
      console.error("GLB export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportSTL = async () => {
    if (!standGroup) return;

    setIsExporting(true);
    setExportStatus("Exporting STL...");

    try {
      const exporter = new STLExporter();
      const result = exporter.parse(standGroup, { binary: true });

      const blob = new Blob([result as ArrayBuffer], { type: "model/stl" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "stage1_stand.stl";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus("✅ STL exported successfully");
      setTimeout(() => setExportStatus(""), 3000);
    } catch (error) {
      setExportStatus("❌ STL export failed");
      console.error("STL export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const sendToNanoBanana = async () => {
    if (!webglRenderer || !threeScene || !threeCamera) {
      setExportStatus("❌ WebGL renderer not ready");
      return;
    }

    setIsExporting(true);
    setExportStatus("Preparing for Nano Banana...");

    try {
      // Force render to ensure latest frame
      webglRenderer.render(threeScene, threeCamera);

      // Get Stage-1 clay image from WebGL canvas
      const canvas = webglRenderer.domElement;
      const dataURL = canvas.toDataURL("image/png");
      const response = await fetch(dataURL);
      const imageBlob = await response.blob();

      // Generate contract from current form data
      const contract = generateContractFromFormData(formData);

      // Use optimized prompt if available, otherwise generate dynamic prompt
      const prompt = optimizedPrompt || generateDynamicPrompt(formData, currentSpec);

      setExportStatus("🚀 Sending to Nano Banana API...");

      // Send to backend API
      const apiFormData = new FormData();
      apiFormData.append('image', imageBlob, 'stage1-clay.png');
      apiFormData.append('contract', JSON.stringify(contract));
      apiFormData.append('prompt', prompt);

      // Include brand assets from form data
      if (formData.brandLogo) {
        if (formData.brandLogo instanceof File) {
          apiFormData.append('brandLogo', formData.brandLogo);
        } else if (typeof formData.brandLogo === 'string') {
          // Handle base64 or URL string
          try {
            const response = await fetch(formData.brandLogo);
            const blob = await response.blob();
            apiFormData.append('brandLogo', blob, 'brand-logo.png');
          } catch (error) {
            console.warn('Failed to fetch brand logo:', error);
          }
        }
      }

      if (formData.productImage) {
        if (formData.productImage instanceof File) {
          apiFormData.append('productImage', formData.productImage);
        } else if (typeof formData.productImage === 'string') {
          try {
            const response = await fetch(formData.productImage);
            const blob = await response.blob();
            apiFormData.append('productImage', blob, 'product-image.png');
          } catch (error) {
            console.warn('Failed to fetch product image:', error);
          }
        }
      }

      if (formData.keyVisual) {
        if (formData.keyVisual instanceof File) {
          apiFormData.append('keyVisual', formData.keyVisual);
        } else if (typeof formData.keyVisual === 'string') {
          try {
            const response = await fetch(formData.keyVisual);
            const blob = await response.blob();
            apiFormData.append('keyVisual', blob, 'key-visual.png');
          } catch (error) {
            console.warn('Failed to fetch key visual:', error);
          }
        }
      }

      // Include example stands if any
      if (formData.exampleStands && formData.exampleStands.length > 0) {
        formData.exampleStands.forEach((example, index) => {
          if (example instanceof File) {
            apiFormData.append(`exampleStand${index}`, example);
          } else if (typeof example === 'string') {
            fetch(example).then(response => response.blob()).then(blob => {
              apiFormData.append(`exampleStand${index}`, blob, `example-stand-${index}.png`);
            }).catch(error => {
              console.warn(`Failed to fetch example stand ${index}:`, error);
            });
          }
        });
      }

      const apiBaseUrl = getApiBaseUrl();
      const apiResponse = await fetch(`${apiBaseUrl}/api/nano-banana`, {
        method: 'POST',
        body: apiFormData
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`API Error: ${errorData.error || 'Failed to process Stage-2'}`);
      }

      const result = await apiResponse.json();

      setExportStatus("✅ Stage-2 processing completed!");
      console.log('🍌 Nano Banana result:', result);

      // Show results or trigger callback
      if (onStage2Ready) {
        onStage2Ready({
          image: imageBlob,
          contract,
          prompt,
          result
        });
      }

      // Display results (you can customize this)
      if (result.images && result.images.length > 0) {
        setTimeout(() => {
          setExportStatus(`🎯 Generated ${result.images.length} branded image(s)`);
          setTimeout(() => setExportStatus(""), 5000);
        }, 2000);
      }

    } catch (error) {
      setExportStatus("❌ Stage-2 processing failed");
      console.error("Stage-2 processing error:", error);
      setTimeout(() => setExportStatus(""), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`stand-designer ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Stage-1: Authoritative Geometry
        </h2>
        <div className="text-sm text-gray-600 space-y-1">
          <div>📐 <strong>Stand:</strong> {currentSpec.stand.W}W × {currentSpec.stand.D}D × {currentSpec.stand.H}H cm, 1 shelf</div>
          <div>📦 <strong>Products:</strong> Single-file {currentSpec.layout.columns}×{currentSpec.layout.depthCount} queue ({currentSpec.product.W}×{currentSpec.product.H}×{currentSpec.product.D} cm each, zero gaps)</div>
          <div>📷 <strong>Controls:</strong> Scroll to zoom (wide range), drag to rotate, right-click to pan</div>
          <div>🎯 <strong>Output:</strong> Clay geometry + exports → Stage-2 (Nano Banana)</div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative mb-4 border border-gray-300 rounded-lg overflow-hidden">
        <Canvas
          ref={canvasRef}
          orthographic
          camera={orthoCamera}
          shadows
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: true,
            physicallyCorrectLights: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0
          }}
          style={{ width: '100%', height: '600px', background: '#f7f7f7' }}
        >
          <CameraController />
          <RendererCapture onRendererReady={handleRendererReady} />

          {/* Enhanced PBR lighting system with shadows */}
          <ambientLight intensity={0.3} color="#ffffff" />

          {/* Main directional light with shadows */}
          <directionalLight
            position={[15, 20, 10]}
            intensity={1.2}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={50}
            shadow-camera-left={-30}
            shadow-camera-right={30}
            shadow-camera-top={30}
            shadow-camera-bottom={-30}
            shadow-bias={-0.0001}
          />

          {/* Fill lights for better material visibility */}
          <directionalLight position={[-12, 15, -8]} intensity={0.4} color="#b3d9ff" />
          <directionalLight position={[8, 12, 15]} intensity={0.3} color="#fff5e6" />

          {/* Rim light for edge definition */}
          <directionalLight position={[0, 5, -20]} intensity={0.5} color="#ffffff" />

          {/* Stand geometry */}
          <StandGeometry spec={currentSpec} onGroupReady={handleGroupReady} />

          {/* Controls (optimized for better zoom and space usage) */}
          <OrbitControls
            enableRotate={true}
            enablePan={true}
            enableZoom={true}
            maxZoom={8} // Close zoom without clipping
            minZoom={0.3} // Far zoom for full context
            zoomSpeed={0.8} // Smoother zoom control
            rotateSpeed={0.6}
            panSpeed={1.0}
            enableDamping={true}
            dampingFactor={0.08}
            target={[0, currentSpec.stand.H / 2, 0]} // Dynamic center based on model height
          />
        </Canvas>

        {/* Status overlay */}
        {exportStatus && (
          <div className="absolute top-4 right-4 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm">
            {exportStatus}
          </div>
        )}
      </div>

      {/* Export Controls */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={exportClayPNG}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
          disabled={isExporting}
        >
          📸 Export PNG
        </button>

        <button
          onClick={exportGLB}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
          disabled={isExporting || !standGroup}
        >
          🗂️ Export GLB
        </button>

        <button
          onClick={exportSTL}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
          disabled={isExporting || !standGroup}
        >
          🖨️ Export STL
        </button>

        <div className="flex-1" />

        {/* Prompt Optimization Step */}
        <button
          onClick={optimizePrompt}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            optimizedPrompt
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
          disabled={isExporting || isOptimizing}
        >
          {isOptimizing ? '🧠 Optimizing...' : optimizedPrompt ? '✅ Re-optimize' : '🧠 Optimize Prompt'}
        </button>

        <button
          onClick={sendToNanoBanana}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            optimizedPrompt
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-gray-400 text-gray-700 cursor-not-allowed'
          }`}
          disabled={isExporting || isOptimizing || !optimizedPrompt}
          title={optimizedPrompt ? "Send to Nano Banana with optimized prompt" : "Optimize prompt first for best results"}
        >
          🚀 Send to Nano Banana
        </button>
      </div>

      {/* Geometry Validation Info */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
        <div className="font-semibold text-green-800 mb-1">✅ Geometry Validated</div>
        <div className="text-green-700 space-y-1">
          <div>• Stand: {currentSpec.stand.W}×{currentSpec.stand.D}×{currentSpec.stand.H} cm</div>
          <div>• Products: {currentSpec.layout.depthCount} units @ {currentSpec.product.W}×{currentSpec.product.H}×{currentSpec.product.D} cm</div>
          <div>• Layout: Single-file queue, depth usage = {currentSpec.layout.depthCount * currentSpec.product.D} cm</div>
          <div>• Contract ready for Stage-2 handoff</div>
        </div>
      </div>

      {/* Optimization Results */}
      {showOptimization && optimizationAnalysis && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-800">🧠 ChatGPT Prompt Optimization</h3>
            <span className="text-sm text-blue-600">
              Confidence: {Math.round(optimizationConfidence * 100)}%
            </span>
          </div>

          {optimizationAnalysis.brandPersonality && (
            <div className="mb-2">
              <span className="font-medium text-blue-700">Brand Personality:</span>
              <span className="ml-2 text-blue-600">{optimizationAnalysis.brandPersonality}</span>
            </div>
          )}

          {optimizationAnalysis.colorPalette && optimizationAnalysis.colorPalette.length > 0 && (
            <div className="mb-2">
              <span className="font-medium text-blue-700">Colors:</span>
              <span className="ml-2 text-blue-600">{optimizationAnalysis.colorPalette.join(', ')}</span>
            </div>
          )}

          {optimizationAnalysis.qualityImprovements && optimizationAnalysis.qualityImprovements.length > 0 && (
            <div className="mb-2">
              <span className="font-medium text-blue-700">Improvements:</span>
              <ul className="ml-6 text-blue-600 text-sm">
                {optimizationAnalysis.qualityImprovements.map((improvement: string, index: number) => (
                  <li key={index} className="list-disc">{improvement}</li>
                ))}
              </ul>
            </div>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-blue-700 font-medium">View Optimized Prompt</summary>
            <div className="mt-2 p-3 bg-white border border-blue-200 rounded text-sm text-gray-700 whitespace-pre-wrap">
              {optimizedPrompt}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
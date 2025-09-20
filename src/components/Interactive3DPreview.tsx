import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Text,
  Box,
  Plane,
  useTexture,
  Html,
  PerspectiveCamera,
  useHelper
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Eye,
  Camera,
  Download,
  Settings,
  Play,
  Pause,
  RotateCw,
  Move3D,
  Smartphone
} from 'lucide-react';
import { FormData } from '../types';

interface Interactive3DPreviewProps {
  formData: FormData;
  imageUrl?: string;
  brandAssetUrls?: string[];
  onSnapshotTaken?: (dataUrl: string) => void;
  className?: string;
}

interface Display3DProps {
  formData: FormData;
  imageUrl?: string;
  brandAssetUrls?: string[];
  showProducts: boolean;
  animationSpeed: number;
  viewMode: '3d' | 'ar' | 'assembly';
}

interface ProductPlacementProps {
  formData: FormData;
  shelfIndex: number;
  position: [number, number, number];
}

export const Interactive3DPreview: React.FC<Interactive3DPreviewProps> = ({
  formData,
  imageUrl,
  brandAssetUrls = [],
  onSnapshotTaken,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [showProducts, setShowProducts] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | 'ar' | 'assembly'>('3d');
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [cameraPreset, setCameraPreset] = useState<'front' | 'side' | 'top' | 'perspective'>('perspective');
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleSnapshot = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png', 1.0);
      onSnapshotTaken?.(dataUrl);

      // Also trigger download
      const link = document.createElement('a');
      link.download = `display-3d-preview-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const toggleFullscreen = () => {
    const container = canvasRef.current?.parentElement;
    if (!isFullscreen && container) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const cameraPositions = {
    front: [0, 1, 3],
    side: [3, 1, 0],
    top: [0, 4, 0],
    perspective: [2, 2, 3]
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header Controls */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Move3D className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">3D Interactive Preview</h3>
              <p className="text-sm text-gray-600">360° view with virtual product placement</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm border">
              {[
                { mode: '3d' as const, icon: Move3D, label: '3D' },
                { mode: 'ar' as const, icon: Smartphone, label: 'AR' },
                { mode: 'assembly' as const, icon: Settings, label: 'Assembly' }
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-all ${
                    viewMode === mode
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Camera and Animation Controls */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Camera Presets */}
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600 mr-2">View:</span>
              {Object.keys(cameraPositions).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setCameraPreset(preset as any)}
                  className={`px-2 py-1 text-xs rounded-md transition-all ${
                    cameraPreset === preset
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {preset.charAt(0).toUpperCase() + preset.slice(1)}
                </button>
              ))}
            </div>

            {/* Products Toggle */}
            <button
              onClick={() => setShowProducts(!showProducts)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-all ${
                showProducts
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Products</span>
            </button>

            {/* Auto Rotation */}
            <button
              onClick={() => setIsRotating(!isRotating)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-all ${
                isRotating
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>Auto Rotate</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Action Buttons */}
            <button
              onClick={handleSnapshot}
              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all"
              title="Take Screenshot"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
              title="Fullscreen"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 bg-white rounded-lg border"
            >
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Animation Speed
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="3"
                    step="0.1"
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{animationSpeed.toFixed(1)}x</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lighting
                  </label>
                  <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                    <option>Studio</option>
                    <option>Natural</option>
                    <option>Dramatic</option>
                    <option>Soft</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quality
                  </label>
                  <select className="w-full px-2 py-1 border border-gray-300 rounded text-sm">
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3D Canvas */}
      <div className={`relative ${isFullscreen ? 'h-screen' : 'h-96'} bg-gradient-to-b from-gray-100 to-gray-200`}>
        <Canvas
          ref={canvasRef}
          shadows
          camera={{ position: cameraPositions[cameraPreset] as any, fov: 50 }}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Display3D
              formData={formData}
              imageUrl={imageUrl}
              brandAssetUrls={brandAssetUrls}
              showProducts={showProducts}
              animationSpeed={animationSpeed}
              viewMode={viewMode}
            />

            {/* Camera Controls */}
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              autoRotate={isRotating}
              autoRotateSpeed={2 * animationSpeed}
              minDistance={1}
              maxDistance={10}
            />

            {/* Lighting Setup */}
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <pointLight position={[-5, 5, 5]} intensity={0.5} />

            {/* Environment */}
            <Environment preset="studio" />

            {/* Ground */}
            <ContactShadows
              position={[0, -0.5, 0]}
              scale={10}
              blur={2}
              far={20}
              opacity={0.3}
            />
          </Suspense>
        </Canvas>

        {/* AR Mode Overlay */}
        {viewMode === 'ar' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm">AR Preview Mode</span>
              </div>
              <p className="text-xs mt-1">Scan QR code to view in AR</p>
            </div>

            {/* AR QR Code Placeholder */}
            <div className="absolute bottom-4 right-4 w-24 h-24 bg-white rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center">
              <span className="text-xs text-gray-500 text-center">QR Code</span>
            </div>
          </div>
        )}

        {/* Assembly Mode Annotations */}
        {viewMode === 'assembly' && (
          <AssemblyAnnotations formData={formData} />
        )}
      </div>

      {/* Dimensions and Info Panel */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Dimensions:</span>
            <p className="text-gray-600">
              {formData.standWidth} × {formData.standHeight} × {formData.standDepth} cm
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Material:</span>
            <p className="text-gray-600">{formData.materials[0]}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Shelves:</span>
            <p className="text-gray-600">{formData.shelfCount} levels</p>
          </div>
        </div>

        {/* Interaction Help */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>🖱️ Drag to rotate</span>
            <span>🔍 Scroll to zoom</span>
            <span>⌨️ Shift+drag to pan</span>
          </div>
          <div className="flex items-center space-x-2">
            <RotateCw className="w-3 h-3" />
            <span>Interactive 3D model</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3D Display Component
const Display3D: React.FC<Display3DProps> = ({
  formData,
  imageUrl,
  brandAssetUrls = [],
  showProducts,
  animationSpeed,
  viewMode
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const { scene } = useThree();

  // Load textures
  const displayTexture = useTexture(imageUrl || '/api/placeholder/400/400');

  useFrame((state) => {
    if (meshRef.current && viewMode === 'assembly') {
      // Gentle floating animation for assembly mode
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * animationSpeed) * 0.1;
    }
  });

  // Calculate dimensions in 3D units
  const scale = 0.01; // Convert cm to 3D units
  const width = formData.standWidth * scale;
  const height = formData.standHeight * scale;
  const depth = formData.standDepth * scale;

  const shelfSpacing = height / (formData.shelfCount + 1);

  return (
    <group ref={meshRef}>
      {/* Main Display Structure */}
      <group position={[0, height / 2, 0]}>
        {/* Back Panel */}
        <Plane
          args={[width, height]}
          position={[0, 0, -depth / 2]}
          receiveShadow
        >
          <meshStandardMaterial
            map={displayTexture}
            transparent={true}
            side={THREE.DoubleSide}
          />
        </Plane>

        {/* Side Panels */}
        <Plane
          args={[depth, height]}
          position={[-width / 2, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            color="#f0f0f0"
            transparent={true}
            opacity={0.9}
          />
        </Plane>

        <Plane
          args={[depth, height]}
          position={[width / 2, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            color="#f0f0f0"
            transparent={true}
            opacity={0.9}
          />
        </Plane>

        {/* Top Panel */}
        <Plane
          args={[width, depth]}
          position={[0, height / 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial
            color="#e0e0e0"
            transparent={true}
            opacity={0.8}
          />
        </Plane>

        {/* Shelves */}
        {Array.from({ length: formData.shelfCount }, (_, i) => {
          const shelfY = -height / 2 + shelfSpacing * (i + 1);
          return (
            <group key={i}>
              {/* Shelf Surface */}
              <Box
                args={[width * 0.95, 0.02, depth * 0.9]}
                position={[0, shelfY, 0]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  color={formData.materials[0] === 'Metal' ? '#d0d0d0' : '#f5f5f5'}
                  metalness={formData.materials[0] === 'Metal' ? 0.8 : 0.1}
                  roughness={0.2}
                />
              </Box>

              {/* Products on Shelf */}
              {showProducts && (
                <ProductPlacement
                  formData={formData}
                  shelfIndex={i}
                  position={[0, shelfY + 0.1, 0]}
                />
              )}
            </group>
          );
        })}

        {/* Brand Logo (if available) */}
        {brandAssetUrls[0] && (
          <Text
            position={[0, height / 2 - 0.3, -depth / 2 + 0.01]}
            fontSize={0.2}
            color="#4E5AC3"
            anchorX="center"
            anchorY="middle"
          >
            {formData.brand}
          </Text>
        )}
      </group>

      {/* Assembly Guides (for assembly mode) */}
      {viewMode === 'assembly' && (
        <AssemblyGuides formData={formData} />
      )}
    </group>
  );
};

// Product Placement Component
const ProductPlacement: React.FC<ProductPlacementProps> = ({
  formData,
  shelfIndex,
  position
}) => {
  const productsPerShelf = formData.frontFaceCount || 3;
  const productWidth = (formData.productWidth || 50) * 0.01;
  const productHeight = (formData.productHeight || 100) * 0.01;
  const productDepth = (formData.productDepth || 30) * 0.01;

  const shelfWidth = formData.standWidth * 0.01 * 0.9;
  const spacing = shelfWidth / (productsPerShelf + 1);

  return (
    <group position={position}>
      {Array.from({ length: productsPerShelf }, (_, i) => {
        const productX = -shelfWidth / 2 + spacing * (i + 1);
        return (
          <Box
            key={i}
            args={[productWidth, productHeight, productDepth]}
            position={[productX, productHeight / 2, 0]}
            castShadow
          >
            <meshStandardMaterial
              color={`hsl(${(shelfIndex * 60 + i * 30) % 360}, 70%, 60%)`}
              metalness={0.1}
              roughness={0.3}
            />
          </Box>
        );
      })}
    </group>
  );
};

// Assembly Guides Component
const AssemblyGuides: React.FC<{ formData: FormData }> = ({ formData }) => {
  return (
    <group>
      {/* Assembly arrows and connection points would go here */}
      <Html position={[0, 2, 0]} center>
        <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
          Assembly: {formData.materials[0]} with standard fasteners
        </div>
      </Html>
    </group>
  );
};

// Assembly Annotations Component
const AssemblyAnnotations: React.FC<{ formData: FormData }> = ({ formData }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-4 left-4 bg-orange-500 bg-opacity-90 text-white px-3 py-2 rounded-lg">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Assembly Mode</span>
        </div>
        <p className="text-xs mt-1">View construction details</p>
      </div>

      {/* Assembly Steps */}
      <div className="absolute bottom-4 left-4 space-y-2">
        {[
          'Connect side panels',
          'Install shelving brackets',
          'Mount back panel',
          'Attach top surface'
        ].map((step, index) => (
          <div key={index} className="bg-white bg-opacity-90 px-3 py-2 rounded-lg text-sm">
            <span className="font-medium text-orange-600">{index + 1}.</span> {step}
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading Fallback Component
const LoadingFallback: React.FC = () => {
  return (
    <Html center>
      <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading 3D model...</span>
      </div>
    </Html>
  );
};
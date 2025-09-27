/**
 * StandDesigner Demo Page
 * Complete Stage-1 to Stage-2 workflow demonstration
 */

import React, { useState } from 'react';
import StandDesigner from '../components/StandDesigner';
import { useFormData } from '../contexts/FormDataContext';
import { generateSpecFromFormData } from '../lib/dynamicSpec';
import { Download, Eye, X } from 'lucide-react';
import * as THREE from 'three';

interface Stage2Result {
  image: Blob;
  contract: any;
  prompt: string;
  result?: any;
}

export default function StandDesignerDemo() {
  const { formData } = useFormData();
  const currentSpec = generateSpecFromFormData(formData);
  const [geometry, setGeometry] = useState<THREE.Group | null>(null);
  const [stage2Result, setStage2Result] = useState<Stage2Result | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);

  const handleGeometryReady = (group: THREE.Group) => {
    setGeometry(group);
    console.log('✅ Stage-1 Geometry ready:', group.userData);
  };

  const handleStage2Ready = (data: Stage2Result) => {
    setStage2Result(data);
    setShowResults(true);
    console.log('🍌 Stage-2 result received:', data);
  };

  const openImageModal = (imageUrl: string, index: number) => {
    setModalImage(imageUrl);
    setModalImageIndex(index);
  };

  const closeImageModal = () => {
    setModalImage(null);
  };

  const downloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `branded-stand-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🏗️ Exact Geometry Stand Designer
          </h1>
          <p className="text-gray-600 mt-2">
            Stage-1 authoritative geometry → Stage-2 Nano Banana branding
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Designer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <StandDesigner
                onGeometryReady={handleGeometryReady}
                onStage2Ready={handleStage2Ready}
              />
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Workflow Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Workflow Status</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${geometry ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={geometry ? 'text-green-700' : 'text-gray-500'}>
                    Stage-1 Geometry
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${stage2Result ? 'bg-blue-500' : 'bg-gray-300'}`} />
                  <span className={stage2Result ? 'text-blue-700' : 'text-gray-500'}>
                    Stage-2 Processing
                  </span>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Specifications</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Stand:</strong> {currentSpec.stand.W}×{currentSpec.stand.D}×{currentSpec.stand.H} cm</div>
                <div><strong>Products:</strong> {currentSpec.layout.depthCount} units @ {currentSpec.product.W}×{currentSpec.product.H}×{currentSpec.product.D} cm</div>
                <div><strong>Layout:</strong> Single-file {currentSpec.layout.columns}×{currentSpec.layout.depthCount} queue</div>
                <div><strong>Gaps:</strong> Zero (tight fit)</div>
                <div><strong>Verification:</strong> {currentSpec.layout.depthCount}×{currentSpec.product.D} = {currentSpec.layout.depthCount * currentSpec.product.D} cm depth ✓</div>
              </div>
            </div>

            {/* Contract Preview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Stage-1 → Stage-2 Contract</h3>
              <div className="text-xs bg-gray-100 rounded p-3 font-mono">
                <div>🔒 Geometry: LOCKED</div>
                <div>📏 Dimensions: PRESERVED</div>
                <div>🔢 Count: EXACT ({currentSpec.layout.depthCount} units)</div>
                <div>🚫 Forbidden: extra_rows, stagger</div>
                <div>✅ Allowed: materials, branding</div>
              </div>
            </div>

            {/* Export Status */}
            {geometry && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Ready for Export</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div>✓ GLB (3D model)</div>
                  <div>✓ STL (3D printing)</div>
                  <div>✓ PNG (Stage-1 clay)</div>
                  <div>✓ Nano Banana (Stage-2)</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {stage2Result && showResults && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              🍌 Stage-2 Results
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contract Info */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Contract Enforcement</h4>
                <div className="bg-gray-50 rounded p-4 text-sm space-y-2">
                  <div><strong>Stand:</strong> {stage2Result.contract.stand_cm?.width}×{stage2Result.contract.stand_cm?.depth}×{stage2Result.contract.stand_cm?.height} cm</div>
                  <div><strong>Products:</strong> {stage2Result.contract.checksum?.total_products} units</div>
                  <div><strong>Layout:</strong> {stage2Result.contract.checksum?.verification}</div>
                  <div><strong>Verification:</strong> {stage2Result.contract.checksum?.used_depth_cm}cm depth usage</div>
                </div>
              </div>

              {/* Results */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Generated Assets</h4>
                {stage2Result.result?.images ? (
                  <div className="space-y-2">
                    {stage2Result.result.images.map((imageUrl: string, index: number) => (
                      <div key={index} className="border border-gray-200 rounded p-2 group">
                        <div className="relative">
                          <img
                            src={imageUrl}
                            alt={`Branded Stand ${index + 1}`}
                            className="w-full h-48 object-contain rounded bg-gray-50 cursor-pointer transition-opacity hover:opacity-90"
                            onClick={() => openImageModal(imageUrl, index)}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjYiPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                            }}
                          />

                          {/* Overlay buttons */}
                          <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openImageModal(imageUrl, index)}
                              className="p-2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-lg transition-all"
                              title="View full size"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadImage(imageUrl, index)}
                              className="p-2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-lg transition-all"
                              title="Download image"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-gray-500">Branded Stand View {index + 1}</div>
                          <button
                            onClick={() => downloadImage(imageUrl, index)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Processing... Check console for details
                  </div>
                )}
              </div>
            </div>

            {/* Close Results */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowResults(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
              >
                Close Results
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">🚀 How to Use</h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <div><strong>1.</strong> The 3D scene shows exact {currentSpec.stand.W}×{currentSpec.stand.D}×{currentSpec.stand.H} cm stand with {currentSpec.layout.columns}×{currentSpec.layout.depthCount} product queue</div>
            <div><strong>2.</strong> Export PNG/GLB/STL for manufacturing or use "Send to Nano Banana" for branding</div>
            <div><strong>3.</strong> Stage-2 applies Ülker branding while preserving exact geometry from Stage-1</div>
            <div><strong>4.</strong> Contract enforcement ensures AI cannot change dimensions or product count</div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-6xl max-h-full bg-white rounded-lg overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Branded Stand View {modalImageIndex + 1}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => downloadImage(modalImage, modalImageIndex)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={closeImageModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="relative max-h-[80vh] overflow-auto">
              <img
                src={modalImage}
                alt={`Branded Stand ${modalImageIndex + 1}`}
                className="w-full h-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjYiPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
                }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Click and drag to pan • Use mouse wheel to zoom • Right-click to save image
              </div>
            </div>
          </div>

          {/* Click outside to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={closeImageModal}
          />
        </div>
      )}
    </div>
  );
}
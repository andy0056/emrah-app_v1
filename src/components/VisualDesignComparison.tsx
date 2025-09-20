import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight, Eye, EyeOff, RefreshCw, Download, Share2, Maximize2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefinementResult } from '../services/smartRefinementService';

interface VisualDesignComparisonProps {
  originalImage: string;
  refinedResult?: RefinementResult;
  onSaveComparison?: (comparisonData: ComparisonData) => void;
  className?: string;
}

export interface ComparisonData {
  originalImageUrl: string;
  refinedImageUrl: string;
  appliedChanges: any[];
  annotations: ComparisonAnnotation[];
  timestamp: string;
}

export interface ComparisonAnnotation {
  id: string;
  x: number; // Percentage position
  y: number;
  label: string;
  description: string;
  changeType: 'added' | 'modified' | 'removed';
  beforeValue?: string;
  afterValue?: string;
}

export const VisualDesignComparison: React.FC<VisualDesignComparisonProps> = ({
  originalImage,
  refinedResult,
  onSaveComparison,
  className = ""
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay' | 'slider'>('side-by-side');
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [annotations, setAnnotations] = useState<ComparisonAnnotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Auto-generate annotations based on applied changes
  useEffect(() => {
    if (refinedResult?.appliedChanges) {
      const newAnnotations: ComparisonAnnotation[] = refinedResult.appliedChanges.map((change, index) => ({
        id: `annotation_${index}`,
        x: 20 + (index * 15) % 60, // Distribute annotations across the image
        y: 15 + (index * 10) % 70,
        label: change.type.charAt(0).toUpperCase() + change.type.slice(1),
        description: change.description,
        changeType: 'modified',
        beforeValue: change.beforeValue,
        afterValue: change.afterValue
      }));

      setAnnotations(newAnnotations);
    }
  }, [refinedResult]);

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const exportComparison = () => {
    if (!refinedResult) return;

    const comparisonData: ComparisonData = {
      originalImageUrl: originalImage,
      refinedImageUrl: refinedResult.refinedImageUrl,
      appliedChanges: refinedResult.appliedChanges,
      annotations,
      timestamp: new Date().toISOString()
    };

    onSaveComparison?.(comparisonData);

    // Also trigger download
    const link = document.createElement('a');
    link.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(comparisonData, null, 2))}`;
    link.download = `design-comparison-${Date.now()}.json`;
    link.click();
  };

  const renderSideBySideView = () => (
    <div className="grid grid-cols-2 gap-4 h-full">
      <div className="relative">
        <img
          src={originalImage}
          alt="Original Design"
          className="w-full h-full object-contain rounded-lg border border-gray-200"
        />
        <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-75 text-white px-2 py-1 rounded text-sm">
          Original
        </div>
        {showAnnotations && viewMode === 'side-by-side' && (
          <AnnotationOverlay
            annotations={annotations.filter(a => a.changeType === 'removed')}
            selectedAnnotation={selectedAnnotation}
            onSelectAnnotation={setSelectedAnnotation}
            type="original"
          />
        )}
      </div>

      <div className="relative">
        <img
          src={refinedResult?.refinedImageUrl || originalImage}
          alt="Refined Design"
          className="w-full h-full object-contain rounded-lg border border-gray-200"
        />
        <div className="absolute top-2 left-2 bg-green-600 bg-opacity-90 text-white px-2 py-1 rounded text-sm">
          Refined
        </div>
        {showAnnotations && viewMode === 'side-by-side' && (
          <AnnotationOverlay
            annotations={annotations.filter(a => a.changeType !== 'removed')}
            selectedAnnotation={selectedAnnotation}
            onSelectAnnotation={setSelectedAnnotation}
            type="refined"
          />
        )}
      </div>
    </div>
  );

  const renderOverlayView = () => (
    <div className="relative h-full">
      <img
        src={originalImage}
        alt="Original Design"
        className="w-full h-full object-contain rounded-lg border border-gray-200"
      />
      <img
        src={refinedResult?.refinedImageUrl || originalImage}
        alt="Refined Design"
        className="absolute inset-0 w-full h-full object-contain rounded-lg opacity-50 hover:opacity-75 transition-opacity duration-300"
      />
      <div className="absolute top-2 left-2 bg-purple-600 bg-opacity-90 text-white px-2 py-1 rounded text-sm">
        Overlay Mode
      </div>
      {showAnnotations && (
        <AnnotationOverlay
          annotations={annotations}
          selectedAnnotation={selectedAnnotation}
          onSelectAnnotation={setSelectedAnnotation}
          type="overlay"
        />
      )}
    </div>
  );

  const renderSliderView = () => (
    <div
      ref={sliderRef}
      className="relative h-full cursor-col-resize"
      onMouseMove={handleSliderMove}
    >
      <img
        src={originalImage}
        alt="Original Design"
        className="w-full h-full object-contain rounded-lg border border-gray-200"
      />
      <div
        className="absolute inset-0 overflow-hidden rounded-lg"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={refinedResult?.refinedImageUrl || originalImage}
          alt="Refined Design"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ArrowLeftRight className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-75 text-white px-2 py-1 rounded text-sm">
        Original
      </div>
      <div className="absolute top-2 right-2 bg-green-600 bg-opacity-90 text-white px-2 py-1 rounded text-sm">
        Refined
      </div>

      {showAnnotations && (
        <AnnotationOverlay
          annotations={annotations}
          selectedAnnotation={selectedAnnotation}
          onSelectAnnotation={setSelectedAnnotation}
          type="slider"
        />
      )}
    </div>
  );

  const renderViewContent = () => {
    switch (viewMode) {
      case 'side-by-side':
        return renderSideBySideView();
      case 'overlay':
        return renderOverlayView();
      case 'slider':
        return renderSliderView();
      default:
        return renderSideBySideView();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-xl shadow-lg ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}
    >
      {/* Header Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">Design Comparison</h3>
            {refinedResult && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                {refinedResult.appliedChanges.length} changes applied
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { mode: 'side-by-side' as const, label: 'Side by Side' },
                { mode: 'overlay' as const, label: 'Overlay' },
                { mode: 'slider' as const, label: 'Slider' }
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    viewMode === mode
                      ? 'bg-white shadow-sm text-purple-600'
                      : 'text-gray-600 hover:text-purple-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`p-2 rounded-lg transition-all ${
                showAnnotations
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={exportComparison}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Processing Info */}
        {refinedResult && (
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Processing time: {refinedResult.processingTime}ms</span>
              <span>Confidence: {(refinedResult.confidenceScore * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-1" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Comparison View */}
      <div className={`${isFullscreen ? 'h-screen p-4' : 'h-96 p-4'}`}>
        {renderViewContent()}
      </div>

      {/* Changes Summary */}
      {refinedResult && refinedResult.appliedChanges.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Applied Changes Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {refinedResult.appliedChanges.map((change, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  change.impact === 'high'
                    ? 'border-red-400 bg-red-50'
                    : change.impact === 'medium'
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-green-400 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 capitalize">{change.type}</span>
                  {change.costImpact && (
                    <span className="text-sm text-gray-600">+{change.costImpact}%</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-1">{change.description}</p>
                {change.beforeValue && change.afterValue && (
                  <div className="text-xs text-gray-600 mt-2">
                    <span className="line-through">{change.beforeValue}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{change.afterValue}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Next Steps Suggestions */}
          {refinedResult.suggestedNextSteps.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Suggested Next Steps</h5>
              <ul className="space-y-1">
                {refinedResult.suggestedNextSteps.map((step, index) => (
                  <li key={index} className="text-sm text-blue-700 flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Annotation Overlay Component
interface AnnotationOverlayProps {
  annotations: ComparisonAnnotation[];
  selectedAnnotation: string | null;
  onSelectAnnotation: (id: string | null) => void;
  type: 'original' | 'refined' | 'overlay' | 'slider';
}

const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  annotations,
  selectedAnnotation,
  onSelectAnnotation,
  type
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {annotations.map((annotation) => (
        <div
          key={annotation.id}
          className="absolute pointer-events-auto"
          style={{ left: `${annotation.x}%`, top: `${annotation.y}%` }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`relative cursor-pointer ${
              selectedAnnotation === annotation.id ? 'z-20' : 'z-10'
            }`}
            onClick={() => onSelectAnnotation(
              selectedAnnotation === annotation.id ? null : annotation.id
            )}
          >
            {/* Annotation Dot */}
            <div
              className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                annotation.changeType === 'added'
                  ? 'bg-green-500'
                  : annotation.changeType === 'modified'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              } ${selectedAnnotation === annotation.id ? 'scale-125' : ''}`}
            />

            {/* Annotation Tooltip */}
            <AnimatePresence>
              {selectedAnnotation === annotation.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3"
                >
                  <div className="flex items-center mb-2">
                    <Info className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">{annotation.label}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{annotation.description}</p>

                  {annotation.beforeValue && annotation.afterValue && (
                    <div className="text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Before:</span>
                        <span>{annotation.beforeValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>After:</span>
                        <span className="font-medium">{annotation.afterValue}</span>
                      </div>
                    </div>
                  )}

                  {/* Arrow pointing to dot */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      ))}
    </div>
  );
};
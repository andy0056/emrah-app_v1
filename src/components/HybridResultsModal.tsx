import React from 'react';
import { X, Zap, DollarSign, Clock, Settings, Palette, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HybridDesignResult } from '../services/hybridDesignService';

interface HybridResultsModalProps {
  result: HybridDesignResult;
  onClose: () => void;
  onDownload?: () => void;
  isOpen: boolean;
}

export const HybridResultsModal: React.FC<HybridResultsModalProps> = ({
  result,
  onClose,
  onDownload,
  isOpen
}) => {
  const getCostColor = (cost: number) => {
    if (cost < 100) return 'text-green-600 bg-green-50';
    if (cost < 300) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'complex': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCostImpactIcon = (impact: string) => {
    switch (impact) {
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Hybrid Design Results</h2>
                  <p className="text-purple-100 mt-1">Balanced creativity with manufacturability</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="p-6 space-y-6">

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Base Score</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {result.baseStructure.manufacturabilityScore}%
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">Enhancements</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {result.creativeElements.appliedEnhancements.length}
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Total Cost</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${result.creativeElements.additionalCost}
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-orange-900">Extra Time</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    +{result.creativeElements.additionalTime}min
                  </div>
                </div>
              </div>

              {/* Generated Images */}
              {result.images.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-600" />
                    Generated Hybrid Design
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Hybrid design ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 bg-white px-4 py-2 rounded-lg shadow-lg transition-opacity">
                            View Full Size
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Creative Zones */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Creative Enhancement Zones
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.creativeElements.zones.map((zone) => (
                    <div
                      key={zone.id}
                      className={`p-4 rounded-lg border-2 ${
                        zone.canUseCreative
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{zone.name}</h4>
                        <div className="flex items-center gap-1">
                          {getCostImpactIcon(zone.costImpact)}
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(
                              zone.manufacturingComplexity
                            )}`}
                          >
                            {zone.manufacturingComplexity}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{zone.constraints}</p>

                      {zone.suggestions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">Suggestions:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {zone.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-blue-500 mt-1">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Applied Enhancements */}
              {result.creativeElements.appliedEnhancements.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    Applied Creative Enhancements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.creativeElements.appliedEnhancements.map((enhancement, index) => (
                      <div
                        key={index}
                        className="bg-white px-3 py-2 rounded-lg border border-purple-200 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-green-500 inline mr-2" />
                        {enhancement}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manufacturability Analysis */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Manufacturability Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Base Structure</h4>
                    <p className="text-sm text-gray-600 mb-2">{result.manufacturability.base}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Score:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCostColor(
                          result.manufacturability.totalScore
                        )}`}
                      >
                        {result.manufacturability.totalScore}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Creative Additions</h4>
                    <p className="text-sm text-gray-600 mb-2">{result.manufacturability.accents}</p>
                    <p className="text-sm">
                      <span className="font-medium">Additional Cost:</span>{' '}
                      <span className="text-green-600">{result.manufacturability.additionalCost}</span>
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Processing time: {result.metadata.processingTime}ms
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              {onDownload && (
                <button
                  onClick={onDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Report
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
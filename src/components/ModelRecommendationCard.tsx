import React from 'react';
import { Target, TrendingUp, Zap, Star, CheckCircle, AlertCircle } from 'lucide-react';

interface ModelRecommendationCardProps {
  recommendation: {
    modelRecommendation: string;
    confidence: number;
    promptStrategy: string;
    focusAreas: string[];
    reasoning: string;
    expectedImprovement: number;
    riskLevel: 'low' | 'medium' | 'high';
    implementation: {
      immediate: string[];
      gradual: string[];
    };
  };
  currentModel?: string;
  onApplyRecommendation?: () => void;
  className?: string;
}

const ModelRecommendationCard: React.FC<ModelRecommendationCardProps> = ({
  recommendation,
  currentModel = 'nano-banana',
  onApplyRecommendation,
  className = ''
}) => {
  const isCurrentModel = recommendation.modelRecommendation === currentModel;

  const getModelIcon = (model: string) => {
    switch (model) {
      case 'seedream-v4':
        return '🎯';
      case 'nano-banana':
        return '🍌';
      default:
        return '🤖';
    }
  };

  const getModelName = (model: string) => {
    switch (model) {
      case 'seedream-v4':
        return 'SeedReam v4';
      case 'nano-banana':
        return 'Nano Banana';
      default:
        return model;
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className={`p-4 ${isCurrentModel ? 'bg-green-50 border-b border-green-200' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getModelIcon(recommendation.modelRecommendation)}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getModelName(recommendation.modelRecommendation)}
              </h3>
              <p className="text-sm text-gray-600">
                {isCurrentModel ? 'Currently Active' : 'Recommended Switch'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isCurrentModel && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            <span className={`text-lg font-bold ${getConfidenceColor(recommendation.confidence)}`}>
              {(recommendation.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Confidence & Risk */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-600">Confidence:</span>
            <span className={`font-semibold ${getConfidenceColor(recommendation.confidence)}`}>
              {(recommendation.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(recommendation.riskLevel)}`}>
            {recommendation.riskLevel.toUpperCase()} RISK
          </span>
        </div>

        {/* Expected Improvement */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Expected Improvement</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            +{recommendation.expectedImprovement.toFixed(1)}%
          </p>
          <p className="text-xs text-blue-700">performance gain over current setup</p>
        </div>

        {/* Strategy */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Recommended Strategy
          </h4>
          <p className="text-lg font-medium text-purple-600 capitalize">
            {recommendation.promptStrategy}
          </p>
        </div>

        {/* Focus Areas */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Focus Areas</h4>
          <div className="flex flex-wrap gap-2">
            {recommendation.focusAreas.map((area, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        {/* Reasoning */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Why This Recommendation?</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {recommendation.reasoning}
          </p>
        </div>

        {/* Implementation Steps */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Implementation Plan</h4>

          <div className="space-y-3">
            <div>
              <h5 className="text-xs font-medium text-green-700 mb-2 flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                Immediate Actions
              </h5>
              <ul className="space-y-1">
                {recommendation.implementation.immediate.map((action, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-medium text-blue-700 mb-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Gradual Improvements
              </h5>
              <ul className="space-y-1">
                {recommendation.implementation.gradual.map((action, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!isCurrentModel && onApplyRecommendation && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onApplyRecommendation}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Apply Recommendation</span>
            </button>
          </div>
        )}

        {isCurrentModel && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Currently Applied</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelRecommendationCard;
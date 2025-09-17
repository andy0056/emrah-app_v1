import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  GitBranch,
  Target,
  BarChart3,
  Award,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { PromptEvolutionService } from '../services/promptEvolutionService';

interface EvolutionStatusProps {
  onViewDetails?: (stepId: string) => void;
  onApplyVariant?: (variantId: string) => void;
  className?: string;
}


const EvolutionStatus: React.FC<EvolutionStatusProps> = ({
  onViewDetails,
  onApplyVariant,
  className = ''
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history' | 'variants'>('overview');
  const [evolutionData, setEvolutionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvolutionData();
  }, [loadEvolutionData]);

  const loadEvolutionData = useCallback(async () => {
    try {
      // Load real evolution data
      const history = PromptEvolutionService.getEvolutionHistory();
      const patterns = PromptEvolutionService.getAllPatterns();

      const data = {
        currentGeneration: PromptEvolutionService.getCurrentGeneration ? PromptEvolutionService.getCurrentGeneration() : Math.max(...patterns.map((p: any) => p.generation), 0),
        totalGenerations: 100, // Target generation
        evolutionHistory: history.map((step: any) => ({
          id: step.id,
          generation: step.generation,
          timestamp: new Date(step.timestamp),
          improvement: ((step.feedbackScore - 0.5) * 100), // Convert to percentage improvement
          variants: step.patternsUsed.length,
          bestScore: step.feedbackScore,
          mutations: step.patternsUsed,
          status: step.feedbackScore > 0.7 ? 'completed' : step.feedbackScore > 0.4 ? 'processing' : 'failed'
        })),
        activeOptimizations: [], // Will be populated with real data
        performanceMetrics: [
          {
            name: 'Pattern Success Rate',
            current: patterns.length > 0 ? patterns.reduce((sum: number, p: any) => sum + p.successRate, 0) / patterns.length : 0,
            previous: 0.5, // Previous value
            trend: 'up' as const,
            target: 0.8
          },
          {
            name: 'Generation Speed',
            current: history.length > 0 ? history.length / 10 : 0, // Steps per unit time
            previous: 0.5,
            trend: 'up' as const,
            target: 1.0
          },
          {
            name: 'Pattern Diversity',
            current: patterns.length,
            previous: 4,
            trend: patterns.length > 4 ? 'up' as const : 'stable' as const,
            target: 12
          },
          {
            name: 'Mutation Rate',
            current: patterns.filter((p: any) => p.parentPatterns && p.parentPatterns.length > 0).length / Math.max(patterns.length, 1),
            previous: 0.1,
            trend: 'up' as const,
            target: 0.3
          }
        ],
        bestVariants: patterns
          .filter((p: any) => p.usage > 0)
          .sort((a: any, b: any) => b.successRate - a.successRate)
          .slice(0, 5)
          .map((p: any) => ({
            id: p.id,
            name: p.pattern.substring(0, 50) + '...',
            score: p.successRate,
            improvements: [
              p.successRate > 0.8 ? 'High Success Rate' : '',
              p.confidence > 0.7 ? 'High Confidence' : '',
              p.usage > 10 ? 'Well Tested' : ''
            ].filter(Boolean),
            confidence: p.confidence,
            tested: p.usage > 5,
            generation: p.generation
          })),
        evolutionSpeed: history.length > 10 ? history.length / 10 : 1.0,
        convergenceStatus: determineConvergenceStatus(patterns, history)
      };

      setEvolutionData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load evolution data:', error);
      setIsLoading(false);
    }
  }, []);

  const determineConvergenceStatus = (patterns: any[], history: any[]) => {
    if (history.length < 5) return 'improving';

    const recentScores = history.slice(-5).map((h: any) => h.feedbackScore);
    const trend = recentScores[recentScores.length - 1] - recentScores[0];

    if (trend > 0.1) return 'improving';
    if (Math.abs(trend) < 0.05) return 'stable';
    return 'declining';
  };

  if (isLoading || !evolutionData) {
    return (
      <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading evolution data...</span>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConvergenceColor = (status: string) => {
    switch (status) {
      case 'improving':
        return 'text-green-600';
      case 'stable':
        return 'text-blue-600';
      case 'declining':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <GitBranch className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-semibold">Evolution Status</h3>
              <p className="text-indigo-200 text-sm">
                Generation {evolutionData.currentGeneration} of {evolutionData.totalGenerations}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-lg font-bold ${getConvergenceColor(evolutionData.convergenceStatus)}`}>
              {evolutionData.convergenceStatus.toUpperCase()}
            </div>
            <div className="text-xs text-indigo-200">
              {evolutionData.evolutionSpeed.toFixed(1)}x speed
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-indigo-200 mb-1">
            <span>Evolution Progress</span>
            <span>{((evolutionData.currentGeneration / evolutionData.totalGenerations) * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-indigo-800 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(evolutionData.currentGeneration / evolutionData.totalGenerations) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'history', label: 'History', icon: Clock },
            { key: 'variants', label: 'Top Variants', icon: Award }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedTab(key as any)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Performance Metrics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {evolutionData.performanceMetrics.map((metric, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{metric.name}</span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {metric.current.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Target: {metric.target.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Optimizations */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Active Optimizations ({evolutionData.activeOptimizations.length})
              </h4>
              <div className="space-y-3">
                {evolutionData.activeOptimizations.map((optimization) => (
                  <div key={optimization.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-gray-900">{optimization.name}</h5>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        optimization.status === 'active' ? 'bg-green-100 text-green-800' :
                        optimization.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {optimization.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                      <span>Target: {optimization.targetMetric}</span>
                      <span>
                        {optimization.currentValue.toFixed(2)} / {optimization.targetValue.toFixed(2)}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${optimization.progress * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{(optimization.progress * 100).toFixed(0)}% complete</span>
                      <span>ETA: {optimization.estimatedCompletion.toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'history' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Evolution History</h4>
            <div className="space-y-3">
              {evolutionData.evolutionHistory
                .sort((a, b) => b.generation - a.generation)
                .slice(0, 10)
                .map((step) => (
                <div key={step.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(step.status)}
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">
                          Generation {step.generation}
                        </h5>
                        <p className="text-xs text-gray-600">
                          {step.timestamp.toLocaleDateString()} at {step.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        step.improvement > 0 ? 'text-green-600' :
                        step.improvement < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {step.improvement > 0 ? '+' : ''}{step.improvement.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Score: {step.bestScore.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>{step.variants} variants tested</span>
                      <span>{step.mutations.length} mutations</span>
                    </div>

                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(step.id)}
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Details</span>
                      </button>
                    )}
                  </div>

                  {step.mutations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {step.mutations.slice(0, 3).map((mutation, idx) => (
                          <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {mutation}
                          </span>
                        ))}
                        {step.mutations.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            +{step.mutations.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'variants' && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">Top Performing Variants</h4>
            <div className="space-y-3">
              {evolutionData.bestVariants
                .sort((a, b) => b.score - a.score)
                .map((variant) => (
                <div key={variant.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900">{variant.name}</h5>
                        <p className="text-xs text-gray-600">Generation {variant.generation}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {variant.score.toFixed(3)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(variant.confidence * 100).toFixed(0)}% confidence
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-xs font-medium text-gray-700">Key Improvements:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {variant.improvements.map((improvement, idx) => (
                          <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {improvement}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          variant.tested ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></span>
                        <span className="text-xs text-gray-600">
                          {variant.tested ? 'Fully Tested' : 'Testing in Progress'}
                        </span>
                      </div>

                      {onApplyVariant && (
                        <button
                          onClick={() => onApplyVariant(variant.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Target className="w-3 h-3" />
                          <span>Apply</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvolutionStatus;
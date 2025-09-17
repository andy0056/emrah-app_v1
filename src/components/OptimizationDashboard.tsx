import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Zap, BarChart3, Settings, RefreshCw, ChevronRight, AlertTriangle } from 'lucide-react';
import { PromptOptimizationService } from '../services/promptOptimizationService';
import { ABTestingService } from '../services/abTestingService';
import { FeedbackService } from '../services/feedbackService';

interface OptimizationDashboardProps {
  className?: string;
}

const OptimizationDashboard: React.FC<OptimizationDashboardProps> = ({ className }) => {
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [abTestData, setAbTestData] = useState<any>(null);
  const [dynamicWeights, setDynamicWeights] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    const loadOptimizationData = async () => {
      try {
        // Load optimization data
        const weights = PromptOptimizationService.calculateDynamicWeights();
        const recs = PromptOptimizationService.getOptimizationRecommendations();
        const activeOptimizations = PromptOptimizationService.getActiveOptimizations();
        const abTests = ABTestingService.getActiveTests();
        const analytics = ABTestingService.getTestAnalytics();

        // Get real feedback analytics
        const feedbackAnalytics = FeedbackService.getAnalytics();
        console.log('📊 Real feedback analytics loaded:', feedbackAnalytics);

        // Enhance recommendations with feedback data
        const enhancedRecs = {
          ...recs,
          modelRecommendation: FeedbackService.getRecommendedModel({}),
          feedbackInsights: {
            totalFeedbacks: feedbackAnalytics.totalFeedbacks,
            averageRating: feedbackAnalytics.averageRating,
            clientPreferences: feedbackAnalytics.clientPreferences
          }
        };

        setDynamicWeights(weights);
        setRecommendations(enhancedRecs);
        setOptimizationData({
          activeOptimizations,
          totalOptimizations: activeOptimizations.length,
          feedbackAnalytics
        });
        setAbTestData({
          activeTests: abTests,
          analytics
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load optimization data:', error);
        setIsLoading(false);
      }
    };

    loadOptimizationData();
  }, [selectedTimeframe]);

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      window.location.reload(); // Simple refresh for demo
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-lg ${className}`}>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Loading optimization data...</span>
        </div>
      </div>
    );
  }

  const WeightGauge: React.FC<{
    label: string;
    value: number;
    color: string;
    description: string;
  }> = ({ label, value, color, description }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <span className="text-lg font-bold text-gray-900">{(value * 100).toFixed(0)}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${value * 100}%` }}
        ></div>
      </div>

      <p className="text-xs text-gray-600">{description}</p>

      <div className="mt-2 flex items-center">
        <span className={`text-xs px-2 py-1 rounded-full ${
          value > 0.7 ? 'bg-red-100 text-red-800' :
          value > 0.5 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value > 0.7 ? 'High Priority' : value > 0.5 ? 'Medium Priority' : 'Optimized'}
        </span>
      </div>
    </div>
  );

  const OptimizationCard: React.FC<{
    optimization: any;
  }> = ({ optimization }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">{optimization.name}</h4>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">{optimization.currentSamples} samples</span>
          <div className={`w-2 h-2 rounded-full ${
            optimization.confidence > 0.7 ? 'bg-green-500' :
            optimization.confidence > 0.4 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}></div>
        </div>
      </div>

      <p className="text-xs text-gray-600 mb-3">{optimization.description}</p>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Performance Impact</span>
          <span className="text-sm font-medium text-gray-900">
            {(optimization.performanceImpact * 20).toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-blue-600 h-1 rounded-full"
            style={{ width: `${optimization.performanceImpact * 20}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Confidence Level</span>
          <span className="text-sm font-medium text-gray-900">
            {(optimization.confidence * 100).toFixed(0)}%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Weight</span>
          <span className="text-sm font-medium text-gray-900">
            {(optimization.weight * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex flex-wrap gap-1">
          {optimization.modifiers.slice(0, 3).map((modifier: string, idx: number) => (
            <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {modifier.substring(0, 20)}...
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  const ABTestCard: React.FC<{
    test: any;
  }> = ({ test }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">{test.name}</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${
          test.status === 'active' ? 'bg-green-100 text-green-800' :
          test.status === 'completed' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {test.status}
        </span>
      </div>

      <p className="text-xs text-gray-600 mb-3">{test.description}</p>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Sample Size</span>
          <span className="text-sm font-medium text-gray-900">
            {test.currentSampleSize} / {test.targetSampleSize}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{ width: `${(test.currentSampleSize / test.targetSampleSize) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Success Metric</span>
          <span className="text-sm font-medium text-gray-900 capitalize">
            {test.successMetric.replace('_', ' ')}
          </span>
        </div>

        {test.results && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Winner</span>
              <span className="text-sm font-medium text-green-600">
                {test.results.winningVariant}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Improvement</span>
              <span className="text-sm font-medium text-green-600">
                +{test.results.improvementPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-2xl font-bold">Optimization Dashboard</h2>
              <p className="text-purple-100 mt-1">Dynamic prompt optimization and A/B testing insights</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as 'day' | 'week' | 'month')}
              className="px-3 py-2 bg-white bg-opacity-20 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="day" className="text-gray-900">Last 24 hours</option>
              <option value="week" className="text-gray-900">Last week</option>
              <option value="month" className="text-gray-900">Last month</option>
            </select>

            <button
              onClick={refreshData}
              className="flex items-center px-3 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Active Optimizations</p>
              <p className="text-lg font-semibold text-gray-900">{optimizationData?.totalOptimizations || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">A/B Tests Running</p>
              <p className="text-lg font-semibold text-gray-900">{abTestData?.analytics?.activeTests || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-500 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Avg Improvement</p>
              <p className="text-lg font-semibold text-gray-900">
                +{abTestData?.analytics?.averageImprovement?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">Variants Tested</p>
              <p className="text-lg font-semibold text-gray-900">
                {abTestData?.analytics?.totalVariantsTested || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Weights */}
      {dynamicWeights && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Dynamic Prompt Weights
            </h3>
            <span className="text-sm text-gray-500">Updated in real-time based on client feedback</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <WeightGauge
              label="Brand Intensity"
              value={dynamicWeights.brandIntensity}
              color="bg-red-500"
              description="How aggressive brand integration should be"
            />

            <WeightGauge
              label="Product Density"
              value={dynamicWeights.productDensity}
              color="bg-blue-500"
              description="How full product shelves should appear"
            />

            <WeightGauge
              label="Realism Focus"
              value={dynamicWeights.realismFocus}
              color="bg-green-500"
              description="Emphasis on photorealistic presentation"
            />

            <WeightGauge
              label="Technical Precision"
              value={dynamicWeights.technicalPrecision}
              color="bg-purple-500"
              description="Focus on specification adherence"
            />

            <WeightGauge
              label="Visual Drama"
              value={dynamicWeights.visualDrama}
              color="bg-orange-500"
              description="Dramatic vs subtle presentation style"
            />
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            AI Recommendations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Recommended Model</h4>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {recommendations.modelRecommendation === 'seedream-v4' ? '🎯 SeedReam v4' : '🍌 Nano Banana'}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {(recommendations.confidence * 100).toFixed(0)}% confidence
                </p>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Prompt Strategy</h4>
              <div className="text-center">
                <p className="text-xl font-bold text-green-600 capitalize">
                  {recommendations.promptStrategy}
                </p>
                <p className="text-sm text-green-700 mt-1">Optimized approach</p>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Focus Areas</h4>
              <div className="space-y-1">
                {recommendations.focusAreas.slice(0, 3).map((area: string, idx: number) => (
                  <div key={idx} className="flex items-center text-sm text-purple-700">
                    <ChevronRight className="w-4 h-4 mr-1" />
                    {area}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Optimizations */}
      {optimizationData?.activeOptimizations && optimizationData.activeOptimizations.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Active Optimizations ({optimizationData.activeOptimizations.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {optimizationData.activeOptimizations.map((optimization: any) => (
              <OptimizationCard key={optimization.id} optimization={optimization} />
            ))}
          </div>
        </div>
      )}

      {/* A/B Tests */}
      {abTestData?.activeTests && abTestData.activeTests.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Running A/B Tests ({abTestData.activeTests.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {abTestData.activeTests.map((test: any) => (
              <ABTestCard key={test.id} test={test} />
            ))}
          </div>
        </div>
      )}

      {/* Real Feedback Insights */}
      {optimizationData?.feedbackAnalytics && optimizationData.feedbackAnalytics.totalFeedbacks > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Live Feedback Analytics ({optimizationData.feedbackAnalytics.totalFeedbacks} reviews)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Overall Rating</h4>
              <p className="text-2xl font-bold text-blue-600">
                {optimizationData.feedbackAnalytics.averageRating.toFixed(1)}/5
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">SeedReam v4</h4>
              <p className="text-lg font-bold text-green-600">
                {optimizationData.feedbackAnalytics.modelPerformance['seedream-v4'].averageRating.toFixed(1)}/5
              </p>
              <p className="text-xs text-green-700">
                {optimizationData.feedbackAnalytics.modelPerformance['seedream-v4'].count} samples
              </p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">Nano Banana</h4>
              <p className="text-lg font-bold text-yellow-600">
                {optimizationData.feedbackAnalytics.modelPerformance['nano-banana'].averageRating.toFixed(1)}/5
              </p>
              <p className="text-xs text-yellow-700">
                {optimizationData.feedbackAnalytics.modelPerformance['nano-banana'].count} samples
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">Brand Priority</h4>
              <p className="text-lg font-bold text-purple-600">
                {optimizationData.feedbackAnalytics.clientPreferences.brandIntegrationImportance.toFixed(1)}/5
              </p>
              <p className="text-xs text-purple-700">Client importance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">SeedReam v4 Strengths</h4>
              <div className="space-y-1">
                {optimizationData.feedbackAnalytics.modelPerformance['seedream-v4'].strongPoints.map((point: string, idx: number) => (
                  <span key={idx} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                    {point}
                  </span>
                ))}
                {optimizationData.feedbackAnalytics.modelPerformance['seedream-v4'].strongPoints.length === 0 && (
                  <p className="text-sm text-gray-500">No sufficient data yet</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Areas for Improvement</h4>
              <div className="space-y-1">
                {optimizationData.feedbackAnalytics.modelPerformance['seedream-v4'].weakPoints.map((point: string, idx: number) => (
                  <span key={idx} className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-2">
                    {point}
                  </span>
                ))}
                {optimizationData.feedbackAnalytics.modelPerformance['nano-banana'].weakPoints.map((point: string, idx: number) => (
                  <span key={idx} className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full mr-2">
                    {point} (Nano)
                  </span>
                ))}
                {optimizationData.feedbackAnalytics.modelPerformance['seedream-v4'].weakPoints.length === 0 &&
                 optimizationData.feedbackAnalytics.modelPerformance['nano-banana'].weakPoints.length === 0 && (
                  <p className="text-sm text-gray-500">No major issues identified</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Alerts */}
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Performance Alerts
        </h3>

        <div className="space-y-3">
          {dynamicWeights?.brandIntensity > 0.8 && (
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">High Brand Intensity Detected</p>
                <p className="text-xs text-red-700">Client feedback indicates brand integration needs are very high. Consider using SeedReam v4 for better results.</p>
              </div>
            </div>
          )}

          {dynamicWeights?.technicalPrecision > 0.7 && (
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Technical Precision Priority</p>
                <p className="text-xs text-yellow-700">Clients are prioritizing specification accuracy. Ensure dimensional precision in prompts.</p>
              </div>
            </div>
          )}

          {(!abTestData?.activeTests || abTestData.activeTests.length === 0) && (
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">No Active A/B Tests</p>
                <p className="text-xs text-blue-700">Consider starting A/B tests to optimize prompt performance and discover better approaches.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizationDashboard;
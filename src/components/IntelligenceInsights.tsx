import React, { useState, useEffect } from 'react';
import { Brain, Target, TrendingUp, Zap, Activity, BarChart3, Users, Lightbulb } from 'lucide-react';
import { FeedbackService } from '../services/feedbackService';
import { ABTestingService } from '../services/abTestingService';
import { PromptOptimizationService } from '../services/promptOptimizationService';
import { PromptEvolutionService } from '../services/promptEvolutionService';
import { IntelligentPromptService } from '../services/intelligentPromptService';
import { BrandAssetAnalysisService } from '../services/brandAssetAnalysisService';

interface IntelligenceInsightsProps {
  formData?: any;
  className?: string;
}

const IntelligenceInsights: React.FC<IntelligenceInsightsProps> = ({ formData, className }) => {
  const [feedbackAnalytics, setFeedbackAnalytics] = useState<any>(null);
  const [abTestAnalytics, setAbTestAnalytics] = useState<any>(null);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [evolutionMetrics, setEvolutionMetrics] = useState<any>(null);
  const [assetInsights, setAssetInsights] = useState<any>(null);
  const [clientInsights, setClientInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        // Load all analytics data
        const feedback = FeedbackService.getAnalytics();
        const abTest = ABTestingService.getTestAnalytics();
        const optimization = PromptOptimizationService.getPromptOptimizations();
        const evolution = PromptEvolutionService.getEvolutionMetrics();
        const assets = BrandAssetAnalysisService.getAssetOptimizationInsights();

        setFeedbackAnalytics(feedback);
        setAbTestAnalytics(abTest);
        setOptimizationData(optimization);
        setEvolutionMetrics(evolution);
        setAssetInsights(assets);

        // Generate client insights if form data is available
        if (formData) {
          const insights = IntelligentPromptService.getPromptRecommendation(formData);
          setClientInsights(insights);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [formData]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-lg ${className}`}>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading intelligence insights...</span>
        </div>
      </div>
    );
  }

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    color: string;
    trend?: 'up' | 'down' | 'stable';
  }> = ({ icon, title, value, subtitle, color, trend }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        {trend && (
          <div className={`text-xs px-2 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-100 text-green-800' :
            trend === 'down' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mt-2">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  const InsightCard: React.FC<{
    title: string;
    insights: string[];
    icon: React.ReactNode;
    color: string;
  }> = ({ title, insights, icon, color }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-lg ${color} mr-3`}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-2">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm text-gray-700">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center">
          <Brain className="w-8 h-8 mr-3" />
          <div>
            <h2 className="text-2xl font-bold">AI Intelligence Dashboard</h2>
            <p className="text-blue-100 mt-1">Real-time insights from your AI generation system</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-white" />}
          title="Total Feedback"
          value={feedbackAnalytics?.totalFeedbacks || 0}
          subtitle={`Avg rating: ${(feedbackAnalytics?.averageRating || 0).toFixed(1)}/5`}
          color="bg-blue-500"
          trend="up"
        />

        <StatCard
          icon={<Target className="w-5 h-5 text-white" />}
          title="A/B Tests"
          value={`${abTestAnalytics?.activeTests || 0}/${abTestAnalytics?.completedTests || 0}`}
          subtitle="Active / Completed"
          color="bg-green-500"
          trend="stable"
        />

        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          title="Evolution Generation"
          value={evolutionMetrics?.totalGenerations || 0}
          subtitle={`Status: ${evolutionMetrics?.convergenceStatus || 'unknown'}`}
          color="bg-purple-500"
          trend="up"
        />

        <StatCard
          icon={<Zap className="w-5 h-5 text-white" />}
          title="Active Patterns"
          value={evolutionMetrics?.activePatterns || 0}
          subtitle={`${(evolutionMetrics?.avgSuccessRate * 100 || 0).toFixed(1)}% success rate`}
          color="bg-orange-500"
          trend="up"
        />
      </div>

      {/* Model Performance Comparison */}
      {feedbackAnalytics?.modelPerformance && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Model Performance Comparison
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(feedbackAnalytics.modelPerformance).map(([model, data]: [string, any]) => (
              <div key={model} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    {model === 'seedream-v4' ? '🎯 SeedReam v4' : '🍌 Nano Banana'}
                  </h4>
                  <span className="text-sm text-gray-600">{data.count} generations</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <span className="font-medium">{data.averageRating.toFixed(1)}/5</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(data.averageRating / 5) * 100}%` }}
                    ></div>
                  </div>

                  {data.strongPoints.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-green-700 mb-1">Strong Points:</p>
                      <div className="flex flex-wrap gap-1">
                        {data.strongPoints.map((point: string, idx: number) => (
                          <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.weakPoints.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-red-700 mb-1">Areas for Improvement:</p>
                      <div className="flex flex-wrap gap-1">
                        {data.weakPoints.map((point: string, idx: number) => (
                          <span key={idx} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            {point}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client Preferences Analysis */}
      {feedbackAnalytics?.clientPreferences && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Client Preference Patterns
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(feedbackAnalytics.clientPreferences).map(([key, value]: [string, any]) => {
              const labels: Record<string, string> = {
                brandIntegrationImportance: 'Brand Integration',
                promptAdherenceImportance: 'Prompt Accuracy',
                visualQualityImportance: 'Visual Quality',
                realismAccuracyImportance: 'Realism'
              };

              return (
                <div key={key} className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        strokeDasharray={`${value * 20}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-900">{value.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{labels[key]}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evolution Insights */}
      {evolutionMetrics && (
        <InsightCard
          title="Prompt Evolution Insights"
          icon={<Brain className="w-5 h-5 text-white" />}
          color="bg-purple-500"
          insights={[
            `System has evolved through ${evolutionMetrics.totalGenerations} generations`,
            `Currently tracking ${evolutionMetrics.activePatterns} active patterns`,
            `Average success rate: ${(evolutionMetrics.avgSuccessRate * 100).toFixed(1)}%`,
            `Status: ${evolutionMetrics.convergenceStatus} - ${
              evolutionMetrics.convergenceStatus === 'stable' ? 'Optimal patterns identified' :
              evolutionMetrics.convergenceStatus === 'converging' ? 'Patterns stabilizing' :
              'Actively discovering new patterns'
            }`
          ]}
        />
      )}

      {/* A/B Testing Insights */}
      {abTestAnalytics && (
        <InsightCard
          title="A/B Testing Performance"
          icon={<Target className="w-5 h-5 text-white" />}
          color="bg-green-500"
          insights={[
            `${abTestAnalytics.activeTests} tests currently running`,
            `${abTestAnalytics.completedTests} tests completed successfully`,
            `Best performing variant shows ${abTestAnalytics.averageImprovement?.toFixed(1)}% improvement`,
            `${abTestAnalytics.totalVariantsTested} unique prompt variants tested`
          ]}
        />
      )}

      {/* Asset Analysis Insights */}
      {assetInsights && assetInsights.recommendations.length > 0 && (
        <InsightCard
          title="Brand Asset Optimization"
          icon={<Lightbulb className="w-5 h-5 text-white" />}
          color="bg-yellow-500"
          insights={assetInsights.recommendations}
        />
      )}

      {/* Client-Specific Insights */}
      {clientInsights && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Personalized Recommendations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Recommended Model</h4>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {clientInsights.modelRecommendation === 'seedream-v4' ? '🎯 SeedReam v4' : '🍌 Nano Banana'}
              </p>
              <p className="text-sm text-blue-700 mt-1">{(clientInsights.confidence * 100).toFixed(0)}% confidence</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900">Prompt Strategy</h4>
              <p className="text-xl font-bold text-purple-600 mt-2 capitalize">{clientInsights.promptStrategy}</p>
              <p className="text-sm text-purple-700 mt-1">Optimized for your needs</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Focus Areas</h4>
              <div className="mt-2 space-y-1">
                {clientInsights.focusAreas.slice(0, 2).map((area: string, idx: number) => (
                  <span key={idx} className="inline-block text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-900">Reasoning:</h4>
            {clientInsights.reasoning.map((reason: string, idx: number) => (
              <p key={idx} className="text-sm text-gray-600">• {reason}</p>
            ))}
          </div>
        </div>
      )}

      {/* Performance Trends */}
      {evolutionMetrics?.recentEvolutions && evolutionMetrics.recentEvolutions.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Recent Performance Evolution
          </h3>

          <div className="space-y-3">
            {evolutionMetrics.recentEvolutions.slice(0, 5).map((evolution: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{evolution.pattern}</p>
                  <p className="text-xs text-gray-600">{new Date(evolution.timestamp).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-medium ${
                    evolution.improvement > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {evolution.improvement > 0 ? '+' : ''}{(evolution.improvement * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligenceInsights;
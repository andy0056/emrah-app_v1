import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  BarChart3,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Award,
  Zap,
  Eye,
  Globe,
  Building2,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormData } from '../types';
import {
  CompetitiveAnalysisService,
  CompetitiveReport
} from '../services/competitiveAnalysisService';

interface CompetitiveIntelligenceProps {
  formData: FormData;
  userPricing?: number;
  onStrategicInsights?: (insights: any) => void;
  className?: string;
}

export const CompetitiveIntelligence: React.FC<CompetitiveIntelligenceProps> = ({
  formData,
  userPricing,
  onStrategicInsights,
  className = ""
}) => {
  const [report, setReport] = useState<CompetitiveReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'competitors' | 'market' | 'strategy' | 'pricing'>('overview');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');
  const [competitorReport, setCompetitorReport] = useState<any>(null);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    performCompetitiveAnalysis();
  }, [formData, userPricing]);

  const performCompetitiveAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysisReport = await CompetitiveAnalysisService.analyzeCompetitivePosition(
        formData,
        userPricing
      );
      setReport(analysisReport);
      onStrategicInsights?.(analysisReport.strategicRecommendations);
    } catch (error) {
      console.error('Competitive analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadCompetitorDetails = async (competitorId: string) => {
    try {
      const details = await CompetitiveAnalysisService.generateCompetitorReport(competitorId);
      setCompetitorReport(details);
      setSelectedCompetitor(competitorId);
    } catch (error) {
      console.error('Failed to load competitor details:', error);
    }
  };

  const exportReport = () => {
    if (!report) return;

    const exportData = {
      timestamp: report.generatedAt.toISOString(),
      summary: {
        totalCompetitors: report.competitors.length,
        marketSize: report.marketAnalysis.marketSize,
        ourPosition: report.competitivePositions.reduce((acc, pos) => acc + pos.ourScore, 0) / report.competitivePositions.length
      },
      recommendations: report.strategicRecommendations.filter(r => r.priority === 'high'),
      pricingStrategy: report.pricingStrategy
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `competitive-analysis-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (score >= 6) return <Minus className="w-4 h-4 text-yellow-600" />;
    return <ArrowDown className="w-4 h-4 text-red-600" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMarketPresenceIcon = (presence: string) => {
    switch (presence) {
      case 'international': return <Globe className="w-4 h-4 text-blue-600" />;
      case 'national': return <Building2 className="w-4 h-4 text-green-600" />;
      case 'local': return <Users className="w-4 h-4 text-yellow-600" />;
      default: return <Building2 className="w-4 h-4 text-gray-600" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'competitors', label: 'Competitors', icon: Users },
    { id: 'market', label: 'Market', icon: TrendingUp },
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'pricing', label: 'Pricing', icon: DollarSign }
  ];

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="w-6 h-6 text-purple-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold">Competitive Intelligence</h3>
              <p className="text-sm text-gray-600">AI-powered market analysis and strategic insights</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>

            {report && (
              <button
                onClick={exportReport}
                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            )}

            <button
              onClick={performCompetitiveAnalysis}
              disabled={isAnalyzing}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    selectedTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="p-8 text-center">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mr-3" />
            <div>
              <p className="text-lg font-medium">Analyzing Competitive Landscape...</p>
              <p className="text-sm text-gray-600">Gathering market intelligence and insights</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {report && !isAnalyzing && (
        <div className="p-6">
          <AnimatePresence mode="wait">
            {selectedTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Key Metrics */}
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 text-center">
                    <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-900">{report.competitors.length}</p>
                    <p className="text-sm text-purple-700">Tracked Competitors</p>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-900">{report.marketAnalysis.marketSize.growth.toFixed(1)}%</p>
                    <p className="text-sm text-green-700">Market Growth</p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 text-center">
                    <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">
                      {(report.competitivePositions.reduce((acc, pos) => acc + pos.ourScore, 0) / report.competitivePositions.length).toFixed(1)}
                    </p>
                    <p className="text-sm text-blue-700">Overall Score</p>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 text-center">
                    <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-900">
                      {report.strategicRecommendations.filter(r => r.priority === 'high').length}
                    </p>
                    <p className="text-sm text-orange-700">High Priority Actions</p>
                  </div>
                </div>

                {/* Competitive Position Chart */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-medium text-gray-900 mb-4">Competitive Position Analysis</h4>
                  <div className="space-y-4">
                    {report.competitivePositions.map((position, index) => (
                      <div key={index} className="bg-white rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-700">{position.category}</span>
                          <div className="flex items-center">
                            {getScoreIcon(position.ourScore)}
                            <span className={`ml-1 font-bold ${getScoreColor(position.ourScore)}`}>
                              {position.ourScore.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${(position.ourScore / 10) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">{position.analysis}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SWOT Analysis */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h5 className="font-medium text-green-900 mb-3 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Strengths
                    </h5>
                    <ul className="space-y-1 text-sm text-green-800">
                      {report.swotAnalysis.strengths.slice(0, 4).map((strength, index) => (
                        <li key={index}>• {strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h5 className="font-medium text-blue-900 mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Opportunities
                    </h5>
                    <ul className="space-y-1 text-sm text-blue-800">
                      {report.swotAnalysis.opportunities.slice(0, 4).map((opportunity, index) => (
                        <li key={index}>• {opportunity}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedTab === 'competitors' && (
              <motion.div
                key="competitors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="grid gap-4">
                  {report.competitors.map(competitor => (
                    <div key={competitor.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h5 className="font-medium text-gray-900">{competitor.name}</h5>
                            <div className="ml-2 flex items-center">
                              {getMarketPresenceIcon(competitor.marketPresence)}
                              <span className="ml-1 text-sm text-gray-600 capitalize">
                                {competitor.marketPresence}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{competitor.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>📍 {competitor.headquarters}</span>
                            <span>👥 {competitor.employeeCount}</span>
                            <span>💰 {competitor.estimatedRevenue}</span>
                            <span>📅 Est. {competitor.foundedYear}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => loadCompetitorDetails(competitor.id)}
                          className="ml-4 flex items-center px-3 py-1 text-sm text-purple-600 hover:text-purple-800 border border-purple-300 rounded-md hover:bg-purple-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </button>
                      </div>

                      {/* Industry Focus Tags */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {competitor.industryFocus.map((industry, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                          >
                            {industry}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Competitor Details Modal */}
                {competitorReport && selectedCompetitor && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-6">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Detailed Analysis: {competitorReport.competitor.name}
                    </h4>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Recent Activity</h5>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {competitorReport.recentActivity.map((activity: string, index: number) => (
                            <li key={index}>• {activity}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Counter Strategies</h5>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {competitorReport.recommendedCounterStrategies.map((strategy: string, index: number) => (
                            <li key={index}>• {strategy}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCompetitor('')}
                      className="mt-4 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Close Details
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {selectedTab === 'market' && (
              <motion.div
                key="market"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Market Size */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                  <h4 className="font-medium text-blue-900 mb-4">Market Overview</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-900">
                        {report.marketAnalysis.marketSize.value} {report.marketAnalysis.marketSize.currency}
                      </p>
                      <p className="text-sm text-blue-700">Market Size ({report.marketAnalysis.marketSize.period})</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">
                        +{report.marketAnalysis.marketSize.growth}%
                      </p>
                      <p className="text-sm text-blue-700">Annual Growth Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-600">
                        {report.marketAnalysis.segments.length}
                      </p>
                      <p className="text-sm text-blue-700">Key Segments</p>
                    </div>
                  </div>
                </div>

                {/* Market Segments */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {report.marketAnalysis.segments.map((segment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">{segment.name}</h5>
                        <span className="text-sm font-bold text-green-600">+{segment.growth}%</span>
                      </div>
                      <p className="text-lg font-bold text-gray-700 mb-2">
                        {segment.size}M TRY
                      </p>
                      <div className="space-y-1">
                        {segment.trends.map((trend, tIndex) => (
                          <p key={tIndex} className="text-sm text-gray-600">• {trend}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Opportunities & Threats */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                      Market Opportunities
                    </h5>
                    <div className="space-y-3">
                      {report.marketAnalysis.opportunities.map((opportunity, index) => (
                        <div key={index} className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-green-900">{opportunity.title}</h6>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(opportunity.priority)}`}>
                              {opportunity.priority}
                            </span>
                          </div>
                          <p className="text-sm text-green-800 mb-2">{opportunity.description}</p>
                          <div className="flex items-center justify-between text-xs text-green-700">
                            <span>Value: {(opportunity.estimatedValue / 1000000).toFixed(0)}M TRY</span>
                            <span>Timeline: {opportunity.timeToMarket}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                      Market Threats
                    </h5>
                    <div className="space-y-3">
                      {report.marketAnalysis.threats.map((threat, index) => (
                        <div key={index} className="bg-red-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-red-900">{threat.title}</h6>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(threat.severity)}`}>
                              {threat.severity}
                            </span>
                          </div>
                          <p className="text-sm text-red-800 mb-2">{threat.description}</p>
                          <div className="text-xs text-red-700">
                            <p><strong>Timeline:</strong> {threat.timeline}</p>
                            <p><strong>Mitigation:</strong> {threat.mitigation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedTab === 'strategy' && (
              <motion.div
                key="strategy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="space-y-4">
                  {report.strategicRecommendations.map((recommendation, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h5 className="font-medium text-gray-900">{recommendation.title}</h5>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPriorityColor(recommendation.priority)}`}>
                              {recommendation.priority} priority
                            </span>
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                              {recommendation.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Expected Impact</p>
                          <p className="text-gray-600">{recommendation.expectedImpact}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Resources Needed</p>
                          <p className="text-gray-600">{recommendation.resources}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Timeline</p>
                          <p className="text-gray-600">{recommendation.timeline}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {selectedTab === 'pricing' && (
              <motion.div
                key="pricing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Pricing Overview */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6">
                  <h4 className="font-medium text-green-900 mb-4">Pricing Strategy Analysis</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {report.pricingStrategy.competitorRange.min.toLocaleString()} - {report.pricingStrategy.competitorRange.max.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Competitor Range ({report.pricingStrategy.competitorRange.currency})</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {report.pricingStrategy.recommendedPricing.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Recommended Price ({report.pricingStrategy.competitorRange.currency})</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600 capitalize">
                        {report.pricingStrategy.recommendedPricing.strategy.replace('-', ' ')}
                      </p>
                      <p className="text-sm text-gray-600">Strategy</p>
                    </div>
                  </div>
                </div>

                {/* Current Position */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h5 className="font-medium text-gray-900 mb-2">Current Position</h5>
                  <p className="text-gray-700">{report.pricingStrategy.currentPosition}</p>
                </div>

                {/* Pricing Reasoning */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h5 className="font-medium text-blue-900 mb-2">Strategic Reasoning</h5>
                  <p className="text-blue-800">{report.pricingStrategy.recommendedPricing.reasoning}</p>
                </div>

                {/* Competitor Products */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-4">Competitor Product Analysis</h5>
                  <div className="space-y-4">
                    {report.products.map(product => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h6 className="font-medium text-gray-900">{product.name}</h6>
                            <p className="text-sm text-gray-600">{product.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{product.pricing.range}</p>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              product.marketPosition === 'premium' ? 'bg-purple-100 text-purple-800' :
                              product.marketPosition === 'mid-range' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {product.marketPosition}
                            </span>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Strengths</p>
                            <ul className="text-gray-600 space-y-1">
                              {product.strengths.map((strength, index) => (
                                <li key={index}>• {strength}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Weaknesses</p>
                            <ul className="text-gray-600 space-y-1">
                              {product.weaknesses.map((weakness, index) => (
                                <li key={index}>• {weakness}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
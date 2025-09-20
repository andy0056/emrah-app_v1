import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  DollarSign,
  RefreshCw,
  Settings,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormData } from '../types';
import {
  QualityAssuranceService,
  QualityReport,
  QualityCheck
} from '../services/qualityAssuranceService';

interface QualityAssuranceInspectorProps {
  formData: FormData;
  generatedImages?: string[];
  designChanges?: any[];
  onIssuesFixed?: (updatedFormData: FormData) => void;
  className?: string;
}

export const QualityAssuranceInspector: React.FC<QualityAssuranceInspectorProps> = ({
  formData,
  generatedImages = [],
  designChanges = [],
  onIssuesFixed,
  className = ""
}) => {
  const [report, setReport] = useState<QualityReport | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoFixing, setAutoFixing] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    performInspection();
  }, [formData, generatedImages, designChanges]);

  const performInspection = async () => {
    setIsInspecting(true);
    try {
      const qualityReport = await QualityAssuranceService.performQualityInspection(
        formData,
        generatedImages,
        designChanges
      );
      setReport(qualityReport);
    } catch (error) {
      console.error('Quality inspection failed:', error);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleAutoFix = async () => {
    if (!report) return;

    setAutoFixing(true);
    try {
      const autoFixableIssues = report.checks.filter(check => check.autoFixable);
      const { fixedChecks, updatedFormData, remainingIssues } =
        await QualityAssuranceService.autoFixIssues(autoFixableIssues, formData);

      if (fixedChecks.length > 0) {
        onIssuesFixed?.(updatedFormData);

        // Update the report with remaining issues
        const updatedReport = {
          ...report,
          checks: remainingIssues,
          criticalIssues: remainingIssues.filter(c => c.severity === 'critical').length
        };
        setReport(updatedReport);
      }
    } catch (error) {
      console.error('Auto-fix failed:', error);
    } finally {
      setAutoFixing(false);
    }
  };

  const getSeverityIcon = (severity: QualityCheck['severity']) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low': return <AlertTriangle className="w-5 h-5 text-blue-600" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: QualityCheck['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-blue-50 border-blue-200';
      case 'info': return 'bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredChecks = report?.checks.filter(check =>
    selectedCategory === 'all' || check.category === selectedCategory
  ) || [];

  const categoryTabs = [
    { id: 'all', label: 'All Issues', count: report?.checks.length || 0 },
    { id: 'manufacturing', label: 'Manufacturing', count: report?.checks.filter(c => c.category === 'manufacturing').length || 0 },
    { id: 'design', label: 'Design', count: report?.checks.filter(c => c.category === 'design').length || 0 },
    { id: 'brand', label: 'Brand', count: report?.checks.filter(c => c.category === 'brand').length || 0 },
    { id: 'compliance', label: 'Compliance', count: report?.checks.filter(c => c.category === 'compliance').length || 0 },
    { id: 'safety', label: 'Safety', count: report?.checks.filter(c => c.category === 'safety').length || 0 }
  ];

  const exportReport = () => {
    if (!report) return;

    const reportData = {
      timestamp: report.generatedAt.toISOString(),
      overallScore: report.overallScore,
      summary: report.summary,
      scores: {
        manufacturing: report.manufacturabilityScore,
        brandAlignment: report.brandAlignmentScore,
        compliance: report.complianceScore
      },
      issues: report.checks.map(check => ({
        category: check.category,
        severity: check.severity,
        title: check.title,
        description: check.description,
        recommendation: check.recommendation,
        autoFixable: check.autoFixable,
        confidence: check.confidence
      })),
      recommendations: report.recommendations
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quality-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold">AI Quality Inspector</h3>
              <p className="text-sm text-gray-600">Automated design & manufacturing analysis</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
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
              onClick={performInspection}
              disabled={isInspecting}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isInspecting ? 'animate-spin' : ''}`} />
              {isInspecting ? 'Inspecting...' : 'Re-inspect'}
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isInspecting && (
        <div className="p-8 text-center">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <div>
              <p className="text-lg font-medium">Running Quality Inspection...</p>
              <p className="text-sm text-gray-600">Analyzing design, manufacturing, and compliance</p>
            </div>
          </div>
        </div>
      )}

      {/* Quality Report */}
      {report && !isInspecting && (
        <div className="p-6">
          {/* Overall Score Dashboard */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 text-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900">{report.overallScore.toFixed(0)}%</p>
              <p className="text-sm text-blue-700">Overall Quality</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 text-center">
              <Settings className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">{report.manufacturabilityScore.toFixed(0)}%</p>
              <p className="text-sm text-green-700">Manufacturing</p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 text-center">
              <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-900">{report.brandAlignmentScore.toFixed(0)}%</p>
              <p className="text-sm text-purple-700">Brand Alignment</p>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 text-center">
              <FileText className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-900">{report.complianceScore.toFixed(0)}%</p>
              <p className="text-sm text-orange-700">Compliance</p>
            </div>
          </div>

          {/* Summary and Actions */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">Quality Summary</h4>
                <p className="text-gray-700 mb-3">{report.summary}</p>
                {report.recommendations.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-700">Key Recommendations:</p>
                    {report.recommendations.map((rec, index) => (
                      <p key={index} className="text-sm text-gray-600">• {rec}</p>
                    ))}
                  </div>
                )}
              </div>

              {report.checks.some(check => check.autoFixable) && (
                <button
                  onClick={handleAutoFix}
                  disabled={autoFixing}
                  className="ml-4 flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <Zap className={`w-4 h-4 mr-2 ${autoFixing ? 'animate-pulse' : ''}`} />
                  {autoFixing ? 'Fixing...' : 'Auto-Fix Issues'}
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-8">
              {categoryTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedCategory === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredChecks.map(check => (
                <motion.div
                  key={check.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`border rounded-lg p-4 ${getSeverityColor(check.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      {getSeverityIcon(check.severity)}
                      <div className="ml-3 flex-1">
                        <div className="flex items-center">
                          <h5 className="font-medium text-gray-900">{check.title}</h5>
                          {check.autoFixable && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Auto-fixable
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{check.description}</p>
                        <p className="text-sm text-gray-700 mt-2">
                          <strong>Recommendation:</strong> {check.recommendation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          {check.estimatedImpact.timeline}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          +{check.estimatedImpact.cost}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {(check.confidence * 100).toFixed(0)}% confidence
                        </div>
                      </div>

                      <button
                        onClick={() => setShowDetails(showDetails === check.id ? null : check.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Detailed Information */}
                  <AnimatePresence>
                    {showDetails === check.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-3 border-t border-gray-200"
                      >
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700">Category</p>
                            <p className="text-gray-600 capitalize">{check.category}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Impact Assessment</p>
                            <div className="text-gray-600">
                              <p>Cost: +{check.estimatedImpact.cost}%</p>
                              <p>Quality: {check.estimatedImpact.quality}</p>
                              <p>Timeline: {check.estimatedImpact.timeline}</p>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Resolution</p>
                            <p className="text-gray-600">
                              {check.autoFixable ? 'Can be automatically resolved' : 'Requires manual intervention'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredChecks.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-lg font-medium text-gray-900">
                  {selectedCategory === 'all' ? 'No issues detected!' : `No ${selectedCategory} issues detected!`}
                </p>
                <p className="text-gray-600">This design meets all quality standards in this category.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
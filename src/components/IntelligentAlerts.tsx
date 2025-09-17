import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Lightbulb,
  TrendingUp,
  Users,
  Settings,
  TestTube,
  GitBranch,
  X,
  ChevronDown,
  ChevronRight,
  Clock
} from 'lucide-react';
import { IntelligentAlertService, IntelligentAlert } from '../services/intelligentAlertService';

interface IntelligentAlertsProps {
  className?: string;
}

const IntelligentAlerts: React.FC<IntelligentAlertsProps> = ({ className = '' }) => {
  const [alerts, setAlerts] = useState<IntelligentAlert[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    setIsLoading(true);
    try {
      const generatedAlerts = IntelligentAlertService.generateAlerts();
      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Failed to load intelligent alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'insight':
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return <TrendingUp className="w-4 h-4" />;
      case 'user_behavior':
        return <Users className="w-4 h-4" />;
      case 'optimization':
        return <Settings className="w-4 h-4" />;
      case 'testing':
        return <TestTube className="w-4 h-4" />;
      case 'evolution':
        return <GitBranch className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getAlertBg = (type: string, priority: number) => {
    const baseClasses = 'border-l-4 ';
    switch (type) {
      case 'critical':
        return baseClasses + 'bg-red-50 border-red-500';
      case 'warning':
        return baseClasses + 'bg-yellow-50 border-yellow-500';
      case 'success':
        return baseClasses + 'bg-green-50 border-green-500';
      case 'insight':
        return baseClasses + 'bg-blue-50 border-blue-500';
      default:
        return baseClasses + 'bg-gray-50 border-gray-400';
    }
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 5) return 'bg-red-100 text-red-800';
    if (priority >= 4) return 'bg-orange-100 text-orange-800';
    if (priority >= 3) return 'bg-yellow-100 text-yellow-800';
    if (priority >= 2) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const dismissAlert = (alertId: string) => {
    IntelligentAlertService.dismissAlert(alertId);
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const filteredAlerts = filterCategory === 'all'
    ? alerts
    : alerts.filter(alert => alert.category === filterCategory);

  const categories = [
    { value: 'all', label: 'All Alerts' },
    { value: 'performance', label: 'Performance' },
    { value: 'optimization', label: 'Optimization' },
    { value: 'user_behavior', label: 'User Behavior' },
    { value: 'testing', label: 'A/B Testing' },
    { value: 'evolution', label: 'Evolution' },
    { value: 'model_performance', label: 'Models' }
  ];

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg p-6 shadow-lg ${className}`}>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Analyzing data for insights...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Lightbulb className="w-6 h-6 text-purple-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Intelligent Alerts</h3>
              <p className="text-sm text-gray-600">AI-powered insights and recommendations</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <button
              onClick={loadAlerts}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="p-6">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No alerts found for the selected category.</p>
            <p className="text-sm">This means everything is running smoothly!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg p-4 ${getAlertBg(alert.type, alert.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getAlertIcon(alert.type)}

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-semibold text-gray-900">{alert.title}</h4>

                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(alert.priority)}`}>
                          P{alert.priority}
                        </span>

                        <div className="flex items-center text-xs text-gray-500">
                          {getCategoryIcon(alert.category)}
                          <span className="ml-1 capitalize">{alert.category.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">{alert.message}</p>

                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{alert.timestamp.toLocaleString()}</span>
                        {alert.estimatedImpact && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="capitalize">Impact: {alert.estimatedImpact}</span>
                          </>
                        )}
                      </div>

                      <div className="bg-white bg-opacity-50 rounded-md p-3 mb-3">
                        <div className="flex items-start space-x-2">
                          <Lightbulb className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <h5 className="text-xs font-medium text-gray-900 mb-1">Recommendation</h5>
                            <p className="text-xs text-gray-700">{alert.recommendation}</p>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Action Steps */}
                      {alert.actionableSteps && alert.actionableSteps.length > 0 && (
                        <div>
                          <button
                            onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                            className="flex items-center text-xs text-purple-600 hover:text-purple-800 mb-2"
                          >
                            {expandedAlert === alert.id ? (
                              <ChevronDown className="w-3 h-3 mr-1" />
                            ) : (
                              <ChevronRight className="w-3 h-3 mr-1" />
                            )}
                            <span>Show Action Steps ({alert.actionableSteps.length})</span>
                          </button>

                          {expandedAlert === alert.id && (
                            <div className="bg-white bg-opacity-50 rounded-md p-3">
                              <h5 className="text-xs font-medium text-gray-900 mb-2">Action Steps</h5>
                              <ul className="space-y-1">
                                {alert.actionableSteps.map((step, index) => (
                                  <li key={index} className="flex items-start text-xs text-gray-700">
                                    <span className="text-purple-600 mr-2 flex-shrink-0">{index + 1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Related Metrics */}
                      {Object.keys(alert.relatedMetrics).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {Object.entries(alert.relatedMetrics).map(([key, value]) => (
                            <span
                              key={key}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                              {key.replace('_', ' ')}: {typeof value === 'number' ? value.toFixed(1) : value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligentAlerts;
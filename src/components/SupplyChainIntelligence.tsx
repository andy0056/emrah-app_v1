import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Star,
  Zap,
  DollarSign,
  Leaf,
  Shield,
  RefreshCw,
  Download,
  Bell,
  Filter,
  Search,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormData } from '../types';
import {
  SupplyChainService,
  SupplyChainReport
} from '../services/supplyChainService';

interface SupplyChainIntelligenceProps {
  formData: FormData;
  materialRequirements?: { material: string; quantity: number }[];
  onSupplyChainOptimized?: (optimization: any) => void;
  className?: string;
}

export const SupplyChainIntelligence: React.FC<SupplyChainIntelligenceProps> = ({
  formData,
  materialRequirements = [],
  onSupplyChainOptimized,
  className = ""
}) => {
  const [report, setReport] = useState<SupplyChainReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'suppliers' | 'inventory' | 'alerts' | 'optimize'>('overview');
  const [materialAvailability, setMaterialAvailability] = useState<any>(null);
  const [optimization, setOptimization] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [deliveryTracking, setDeliveryTracking] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadSupplyChainData();
  }, [formData, materialRequirements]);

  const loadSupplyChainData = async () => {
    setIsLoading(true);
    try {
      const [
        supplyReport,
        availability,
        disruptions,
        tracking
      ] = await Promise.all([
        SupplyChainService.getSupplyChainReport(materialRequirements),
        materialRequirements.length > 0 ?
          SupplyChainService.checkMaterialAvailability(
            materialRequirements.map(req => ({ ...req, urgency: 'standard' as const }))
          ) : null,
        SupplyChainService.predictSupplyDisruptions(),
        SupplyChainService.trackDelivery('order-123')
      ]);

      setReport(supplyReport);
      setMaterialAvailability(availability);
      setPredictions(disruptions);
      setDeliveryTracking(tracking);
    } catch (error) {
      console.error('Failed to load supply chain data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeSupplyChain = async () => {
    if (materialRequirements.length === 0) return;

    try {
      const optimizationResult = await SupplyChainService.optimizeSupplyChain(
        materialRequirements,
        {
          maxBudget: 10000,
          maxDeliveryTime: 7,
          sustainabilityWeight: 0.3
        }
      );
      setOptimization(optimizationResult);
      onSupplyChainOptimized?.(optimizationResult);
    } catch (error) {
      console.error('Supply chain optimization failed:', error);
    }
  };

  const exportReport = () => {
    if (!report) return;

    const exportData = {
      timestamp: report.generatedAt.toISOString(),
      metrics: report.metrics,
      riskAssessment: report.riskAssessment,
      alerts: report.alerts.filter(a => !a.acknowledged),
      optimization: optimization
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-chain-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'in-stock': return 'text-green-600 bg-green-50';
      case 'low-stock': return 'text-yellow-600 bg-yellow-50';
      case 'out-of-stock': return 'text-red-600 bg-red-50';
      case 'pre-order': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredInventory = report?.inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.specification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'optimize', label: 'Optimize', icon: Zap }
  ];

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Truck className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold">Supply Chain Intelligence</h3>
              <p className="text-sm text-gray-600">Real-time supplier and inventory management</p>
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
              onClick={loadSupplyChainData}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
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
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  {tab.id === 'alerts' && report?.alerts.filter(a => !a.acknowledged).length > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                      {report.alerts.filter(a => !a.acknowledged).length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <div>
              <p className="text-lg font-medium">Loading Supply Chain Data...</p>
              <p className="text-sm text-gray-600">Analyzing suppliers, inventory, and market conditions</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {report && !isLoading && (
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
                <div className="grid md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 text-center">
                    <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-900">{report.metrics.totalSuppliers}</p>
                    <p className="text-sm text-blue-700">Active Suppliers</p>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-900">{report.metrics.materialsInStock}</p>
                    <p className="text-sm text-green-700">Materials Available</p>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 text-center">
                    <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-900">{report.metrics.averageLeadTime}</p>
                    <p className="text-sm text-yellow-700">Avg Lead Time</p>
                  </div>

                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-900">{report.metrics.criticalShortages}</p>
                    <p className="text-sm text-red-700">Critical Shortages</p>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-900">
                      {report.metrics.costTrends.change > 0 ? '+' : ''}{report.metrics.costTrends.change}%
                    </p>
                    <p className="text-sm text-purple-700">Cost Trend</p>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Risk Assessment
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Overall Risk Level</span>
                        <span className={`font-bold capitalize ${getRiskColor(report.riskAssessment.overall)}`}>
                          {report.riskAssessment.overall}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(report.riskAssessment.factors).map(([factor, value]) => (
                          <div key={factor} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{factor} Risk</span>
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    value < 30 ? 'bg-green-500' :
                                    value < 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${value}%` }}
                                ></div>
                              </div>
                              <span className="text-gray-600">{value}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Recent Predictions</h5>
                      {predictions && (
                        <div className="space-y-2">
                          {predictions.predictions.slice(0, 2).map((pred: any, index: number) => (
                            <div key={index} className="text-sm bg-white rounded p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{pred.description}</span>
                                <span className="text-xs text-gray-500">{(pred.probability * 100).toFixed(0)}%</span>
                              </div>
                              <p className="text-gray-600">{pred.timeframe}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Material Availability */}
                {materialAvailability && (
                  <div className="bg-blue-50 rounded-lg p-6 mb-6">
                    <h4 className="font-medium text-blue-900 mb-4">Current Project Material Status</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Overall Availability</span>
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            materialAvailability.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {materialAvailability.available ? 'Available' : 'Partial'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          Estimated Delivery: {materialAvailability.estimatedDelivery}
                        </p>
                        <p className="text-lg font-bold text-blue-900">
                          Total Cost: {materialAvailability.totalCost.toLocaleString()} TRY
                        </p>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Material Details</h5>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {materialAvailability.details.map((detail: any, index: number) => (
                            <div key={index} className="text-sm bg-white rounded p-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{detail.material}</span>
                                <span className={detail.shortfall ? 'text-red-600' : 'text-green-600'}>
                                  {detail.available}/{detail.requested}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Alerts */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Recent Alerts
                  </h4>
                  <div className="space-y-3">
                    {report.alerts.slice(0, 3).map(alert => (
                      <div key={alert.id} className={`border-l-4 rounded-lg p-3 ${getAlertSeverityColor(alert.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{alert.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {alert.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {selectedTab === 'suppliers' && (
              <motion.div
                key="suppliers"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="grid gap-4">
                  {report.suppliers.map(supplier => (
                    <div key={supplier.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">{supplier.name}</h5>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <MapPin className="w-4 h-4 mr-1" />
                            {supplier.location}
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" />
                              <span>Reliability: {(supplier.reliability * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                              <span>Quality: {(supplier.qualityRating * 100).toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-sm">
                          <p className="text-gray-600">Response Time</p>
                          <p className="font-medium">{supplier.responseTime}</p>
                          <p className="text-gray-600 mt-2">Lead Time</p>
                          <p className="font-medium">{supplier.leadTime.standard}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">Specialties</h6>
                          <div className="flex flex-wrap gap-1">
                            {supplier.specialties.map((specialty, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                              >
                                {specialty}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">Certifications</h6>
                          <div className="flex flex-wrap gap-1">
                            {supplier.certifications.map((cert, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                              >
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">Contact</h6>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 text-gray-400 mr-2" />
                              <a href={`mailto:${supplier.contactInfo.email}`} className="text-blue-600 hover:underline">
                                Email
                              </a>
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 text-gray-400 mr-2" />
                              <span>{supplier.contactInfo.phone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {selectedTab === 'inventory' && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Search and Filters */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search materials..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="metal">Metal</option>
                    <option value="plastic">Plastic</option>
                    <option value="glass">Glass</option>
                    <option value="electronic">Electronic</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Inventory Grid */}
                <div className="grid gap-4">
                  {filteredInventory.map(item => (
                    <div key={item.materialId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getAvailabilityColor(item.availability)}`}>
                              {item.availability.replace('-', ' ')}
                            </span>
                            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                              Grade {item.qualityGrade}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.specification}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span>Stock: <strong>{item.currentStock} {item.unit}</strong></span>
                            <span>Price: <strong>{item.pricePerUnit} {item.currency}/{item.unit}</strong></span>
                            <div className="flex items-center">
                              <Leaf className="w-4 h-4 text-green-500 mr-1" />
                              <span>Sustainability: {item.sustainabilityScore}/100</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-sm">
                          <p className="text-gray-600">Supplier</p>
                          <p className="font-medium">
                            {report.suppliers.find(s => s.id === item.supplierId)?.name || 'Unknown'}
                          </p>
                          {item.estimatedRestockDate && (
                            <>
                              <p className="text-gray-600 mt-2">Restock Date</p>
                              <p className="font-medium">{item.estimatedRestockDate.toLocaleDateString()}</p>
                            </>
                          )}
                        </div>
                      </div>

                      {item.availability === 'low-stock' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                          <p className="text-yellow-800">
                            ⚠️ Low stock warning - Consider reordering soon
                          </p>
                        </div>
                      )}

                      {item.availability === 'out-of-stock' && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                          <p className="text-red-800">
                            🚨 Out of stock - Production may be delayed
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {selectedTab === 'alerts' && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="space-y-4">
                  {report.alerts.map(alert => (
                    <div key={alert.id} className={`border-l-4 rounded-lg p-4 ${getAlertSeverityColor(alert.severity)}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h5 className="font-medium text-gray-900">{alert.title}</h5>
                            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full capitalize">
                              {alert.type.replace('-', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{alert.description}</p>

                          {alert.impact && (
                            <div className="mb-3">
                              <h6 className="font-medium text-gray-700 mb-1">Impact:</h6>
                              <div className="text-sm text-gray-600 space-y-1">
                                {alert.impact.costChange && (
                                  <p>• Cost change: +{alert.impact.costChange}%</p>
                                )}
                                {alert.impact.deliveryDelay && (
                                  <p>• Delivery delay: {alert.impact.deliveryDelay}</p>
                                )}
                                {alert.impact.qualityRisk && (
                                  <p>• Quality risk: {alert.impact.qualityRisk}</p>
                                )}
                              </div>
                            </div>
                          )}

                          <div>
                            <h6 className="font-medium text-gray-700 mb-1">Recommendations:</h6>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {alert.recommendations.map((rec, index) => (
                                <li key={index}>• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="text-right text-sm ml-4">
                          <p className="text-gray-600">Created</p>
                          <p className="font-medium">{alert.createdAt.toLocaleDateString()}</p>
                          <p className="font-medium">{alert.createdAt.toLocaleTimeString()}</p>

                          {!alert.acknowledged && (
                            <button className="mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                              Acknowledge
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {report.alerts.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <p className="text-lg font-medium text-gray-900">No Active Alerts</p>
                      <p className="text-gray-600">Your supply chain is running smoothly!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {selectedTab === 'optimize' && (
              <motion.div
                key="optimize"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Optimization Controls */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h4 className="font-medium text-gray-900 mb-4">Supply Chain Optimization</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Optimize your supply chain for cost, delivery time, and sustainability
                      </p>
                      {materialRequirements.length > 0 && (
                        <p className="text-sm text-blue-600 mt-1">
                          {materialRequirements.length} materials identified from current project
                        </p>
                      )}
                    </div>
                    <button
                      onClick={optimizeSupplyChain}
                      disabled={materialRequirements.length === 0}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Optimize Now
                    </button>
                  </div>
                </div>

                {/* Optimization Results */}
                {optimization && (
                  <div className="space-y-6">
                    {/* Savings Summary */}
                    <div className="bg-green-50 rounded-lg p-6">
                      <h5 className="font-medium text-green-900 mb-4">Optimization Results</h5>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-900">{optimization.savings.cost}%</p>
                          <p className="text-sm text-green-700">Cost Savings</p>
                        </div>
                        <div className="text-center">
                          <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-900">{optimization.savings.time}</p>
                          <p className="text-sm text-blue-700">Time Reduction</p>
                        </div>
                        <div className="text-center">
                          <Leaf className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-emerald-900">{optimization.savings.sustainability}%</p>
                          <p className="text-sm text-emerald-700">Sustainability Boost</p>
                        </div>
                      </div>
                    </div>

                    {/* Optimized Plan */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-4">Optimized Sourcing Plan</h5>
                      <div className="space-y-4">
                        {optimization.optimizedPlan.map((plan: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h6 className="font-medium text-gray-900">{plan.supplier}</h6>
                                <div className="mt-2 space-y-1">
                                  {plan.materials.map((material: any, mIndex: number) => (
                                    <div key={mIndex} className="flex items-center justify-between text-sm">
                                      <span>{material.name} ({material.quantity} units)</span>
                                      <span className="font-medium">{material.cost.toLocaleString()} TRY</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right text-sm ml-4">
                                <p className="font-bold text-lg">{plan.totalCost.toLocaleString()} TRY</p>
                                <p className="text-gray-600">{plan.deliveryTime}</p>
                                <div className="flex items-center mt-1">
                                  <Leaf className="w-4 h-4 text-green-500 mr-1" />
                                  <span>{plan.sustainabilityScore}/100</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-900 mb-3">Implementation Recommendations</h5>
                      <ul className="space-y-1 text-sm text-blue-800">
                        {optimization.recommendations.map((rec: string, index: number) => (
                          <li key={index}>• {rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Available Optimizations */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-4">Available Optimizations</h5>
                  <div className="grid gap-4">
                    {report.optimizations.map(opt => (
                      <div key={opt.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h6 className="font-medium text-gray-900">{opt.title}</h6>
                            <p className="text-sm text-gray-600 mt-1">{opt.description}</p>
                          </div>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                            {opt.type.replace('-', ' ')}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700">Potential Savings</p>
                            <div className="text-gray-600">
                              {opt.potentialSavings.cost && <p>Cost: {opt.potentialSavings.cost}%</p>}
                              {opt.potentialSavings.time && <p>Time: {opt.potentialSavings.time}</p>}
                              {opt.potentialSavings.sustainability && <p>Sustainability: {opt.potentialSavings.sustainability}%</p>}
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Implementation</p>
                            <div className="text-gray-600">
                              <p>Difficulty: {opt.implementation.difficulty}</p>
                              <p>Timeline: {opt.implementation.timeline}</p>
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">Confidence</p>
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${opt.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-gray-600">{(opt.confidence * 100).toFixed(0)}%</span>
                            </div>
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
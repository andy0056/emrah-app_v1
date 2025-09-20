import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, DollarSign, TrendingDown, Package, Clock, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormData } from '../types';
import { AppliedChange } from '../services/smartRefinementService';
import { ManufacturingCostService, CostBreakdown, CostOptimization } from '../services/manufacturingCostService';

interface RealTimeCostCalculatorProps {
  formData: FormData;
  appliedChanges?: AppliedChange[];
  region?: string;
  quantity?: number;
  onCostCalculated?: (breakdown: CostBreakdown) => void;
  className?: string;
}

export const RealTimeCostCalculator: React.FC<RealTimeCostCalculatorProps> = ({
  formData,
  appliedChanges = [],
  region = 'Turkey',
  quantity = 1,
  onCostCalculated,
  className = ""
}) => {
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [optimizations, setOptimizations] = useState<CostOptimization | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(quantity);
  const [selectedRegion, setSelectedRegion] = useState(region);
  const [showOptimizations, setShowOptimizations] = useState(false);

  // Debounced calculation trigger
  const calculationTrigger = useMemo(() => {
    return {
      formData,
      appliedChanges,
      selectedRegion,
      selectedQuantity
    };
  }, [formData, appliedChanges, selectedRegion, selectedQuantity]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const calculateCosts = async () => {
      setIsCalculating(true);
      setError(null);

      try {
        const breakdown = await ManufacturingCostService.calculateManufacturingCost(
          formData,
          appliedChanges,
          selectedRegion,
          selectedQuantity
        );

        setCostBreakdown(breakdown);

        const opts = ManufacturingCostService.generateCostOptimizations(
          formData,
          breakdown,
          appliedChanges
        );
        setOptimizations(opts);

        onCostCalculated?.(breakdown);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Cost calculation failed');
      } finally {
        setIsCalculating(false);
      }
    };

    // Debounce calculation by 500ms
    timeoutId = setTimeout(calculateCosts, 500);

    return () => clearTimeout(timeoutId);
  }, [calculationTrigger, onCostCalculated]);

  const handleQuantityChange = (newQuantity: number) => {
    setSelectedQuantity(newQuantity);
  };

  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
  };

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Calculator className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold">Real-Time Cost Calculator</h3>
              <p className="text-sm text-gray-600">Live manufacturing cost estimation</p>
            </div>
          </div>

          {isCalculating && (
            <div className="flex items-center text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm">Calculating...</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Quantity:</label>
            <select
              value={selectedQuantity}
              onChange={(e) => handleQuantityChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500"
            >
              {[1, 5, 10, 25, 50, 100].map(qty => (
                <option key={qty} value={qty}>{qty}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Region:</label>
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="Turkey">Turkey</option>
              <option value="Europe">Europe</option>
              <option value="North America">North America</option>
              <option value="Asia">Asia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      {costBreakdown && (
        <div className="p-6">
          {/* Total Cost Display */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Manufacturing Cost</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(costBreakdown.total.total, costBreakdown.total.currency)}
                </p>
                {selectedQuantity > 1 && (
                  <p className="text-sm text-gray-600">
                    {formatCurrency(costBreakdown.total.total / selectedQuantity, costBreakdown.total.currency)} per unit
                  </p>
                )}
              </div>

              <div className="text-right">
                <div className={`flex items-center ${getConfidenceColor(costBreakdown.total.confidence)}`}>
                  <Check className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">
                    {getConfidenceText(costBreakdown.total.confidence)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Valid until {new Date(costBreakdown.total.validUntil).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Cost Components */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <CostComponent
              title="Materials"
              amount={costBreakdown.materials.total}
              currency={costBreakdown.total.currency}
              icon={Package}
              breakdown={costBreakdown.materials.breakdown.map(item => ({
                label: item.material,
                value: item.subtotal,
                detail: `${item.quantity} ${item.unit} @ ${formatCurrency(item.unitPrice, costBreakdown.total.currency)}`
              }))}
            />

            <CostComponent
              title="Fabrication"
              amount={costBreakdown.fabrication.total}
              currency={costBreakdown.total.currency}
              icon={Package}
              breakdown={[
                { label: 'Cutting', value: costBreakdown.fabrication.cutting },
                { label: 'Machining', value: costBreakdown.fabrication.machining },
                { label: 'Welding', value: costBreakdown.fabrication.welding },
                { label: 'Setup', value: costBreakdown.fabrication.setup }
              ]}
              detail={`${costBreakdown.fabrication.estimatedTime}h • ${costBreakdown.fabrication.complexity} complexity`}
            />

            <CostComponent
              title="Finishing"
              amount={costBreakdown.finishing.total}
              currency={costBreakdown.total.currency}
              icon={Package}
              breakdown={[
                { label: 'Surface Prep', value: costBreakdown.finishing.surface },
                { label: 'Painting/Coating', value: costBreakdown.finishing.painting },
                { label: 'Graphics/Printing', value: costBreakdown.finishing.printing }
              ]}
              detail={`Processes: ${costBreakdown.finishing.processes.join(', ')}`}
            />

            <CostComponent
              title="Assembly & Shipping"
              amount={costBreakdown.assembly.total + costBreakdown.shipping.domestic}
              currency={costBreakdown.total.currency}
              icon={Package}
              breakdown={[
                { label: 'Assembly Labor', value: costBreakdown.assembly.labor },
                { label: 'Packaging', value: costBreakdown.assembly.packaging },
                { label: 'Quality Testing', value: costBreakdown.assembly.testing },
                { label: 'Shipping', value: costBreakdown.shipping.domestic }
              ]}
              detail={`${costBreakdown.assembly.estimatedTime}h assembly • ${costBreakdown.shipping.estimatedWeight}kg`}
            />
          </div>

          {/* Applied Changes Impact */}
          {appliedChanges.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Changes Impact on Cost</h4>
              <div className="space-y-2">
                {appliedChanges.map((change, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">{change.description}</span>
                    {change.costImpact && (
                      <span className="text-blue-900 font-medium">
                        +{change.costImpact}% ({formatCurrency(costBreakdown.total.total * (change.costImpact / 100), costBreakdown.total.currency)})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {optimizations && (
            <div className="border-t pt-6">
              <button
                onClick={() => setShowOptimizations(!showOptimizations)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center">
                  <TrendingDown className="w-5 h-5 text-green-600 mr-2" />
                  <h4 className="font-medium text-gray-900">Cost Optimization Opportunities</h4>
                </div>
                <span className="text-sm text-gray-500">
                  {showOptimizations ? 'Hide' : 'Show'} savings
                </span>
              </button>

              <AnimatePresence>
                {showOptimizations && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                  >
                    {/* Savings Suggestions */}
                    {optimizations.savings.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Quick Savings</h5>
                        <div className="space-y-2">
                          {optimizations.savings.map((saving, index) => (
                            <div key={index} className="bg-green-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-green-800">{saving.suggestion}</p>
                                <span className="text-sm font-medium text-green-900">
                                  Save {formatCurrency(saving.potentialSaving, costBreakdown.total.currency)}
                                </span>
                              </div>
                              <p className="text-xs text-green-600 mt-1">
                                {saving.implementationEffort} effort • {saving.qualityImpact} quality impact
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bulk Discounts */}
                    {optimizations.bulkDiscounts.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Bulk Order Savings</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {optimizations.bulkDiscounts.slice(1, 4).map((discount, index) => (
                            <div key={index} className="bg-blue-50 rounded-lg p-3 text-center">
                              <p className="text-sm font-medium text-blue-900">{discount.quantity} units</p>
                              <p className="text-xs text-blue-700">{discount.discountPercentage.toFixed(1)}% off</p>
                              <p className="text-xs text-blue-600">
                                Save {formatCurrency(discount.totalSavings, costBreakdown.total.currency)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper component for cost breakdown items
interface CostComponentProps {
  title: string;
  amount: number;
  currency: string;
  icon: React.ComponentType<any>;
  breakdown?: { label: string; value: number; detail?: string }[];
  detail?: string;
}

const CostComponent: React.FC<CostComponentProps> = ({
  title,
  amount,
  currency,
  icon: Icon,
  breakdown = [],
  detail
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setShowBreakdown(!showBreakdown)}
      >
        <div className="flex items-center">
          <Icon className="w-5 h-5 text-gray-400 mr-2" />
          <span className="font-medium text-gray-700">{title}</span>
        </div>
        <span className="font-semibold text-gray-900">
          {formatCurrency(amount, currency)}
        </span>
      </div>

      {detail && (
        <p className="text-xs text-gray-500 mt-1">{detail}</p>
      )}

      <AnimatePresence>
        {showBreakdown && breakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-100"
          >
            <div className="space-y-1">
              {breakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="text-gray-700">{formatCurrency(item.value, currency)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
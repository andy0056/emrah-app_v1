import React from 'react';
import { X, Download, ExternalLink, Package, Clock, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ManufacturingReport as IManufacturingReport } from '../services/productionDesignService';

interface ManufacturingReportModalProps {
  report: IManufacturingReport;
  onClose: () => void;
  onDownload: () => void;
  isOpen: boolean;
}

export const ManufacturingReportModal: React.FC<ManufacturingReportModalProps> = ({
  report,
  onClose,
  onDownload,
  isOpen
}) => {
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5" />;
    if (score >= 75) return <AlertTriangle className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manufacturing Specifications</h2>
            <p className="text-sm text-gray-600 mt-1">Design ID: {report.designId}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Specs
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">${report.totalCost}</p>
                  <p className="text-xs text-blue-600">Total Cost</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Clock className="w-8 h-8 text-green-600" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{report.assemblyTime}</p>
                  <p className="text-xs text-green-600">Assembly (min)</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Package className="w-8 h-8 text-purple-600" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">{report.packaging.weight}kg</p>
                  <p className="text-xs text-purple-600">Shipping Weight</p>
                </div>
              </div>
            </div>

            <div className={`rounded-lg p-4 ${getScoreColor(report.manufacturability.score)}`}>
              <div className="flex items-center justify-between">
                {getScoreIcon(report.manufacturability.score)}
                <div className="text-right">
                  <p className="text-2xl font-bold">{report.manufacturability.score}%</p>
                  <p className="text-xs">Manufacturability</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Bill of Materials */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-gray-600" />
                Bill of Materials
              </h3>
              <div className="bg-white rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold">Item</th>
                      <th className="text-center py-3 px-4 font-semibold">Qty</th>
                      <th className="text-right py-3 px-4 font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.materials.map((item, idx) => (
                      <tr key={idx} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.partNumber && (
                              <div className="text-xs text-gray-500">PN: {item.partNumber}</div>
                            )}
                            {item.supplier && (
                              <div className="text-xs text-gray-500">{item.supplier}</div>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">{item.quantity}</td>
                        <td className="text-right py-3 px-4 font-medium">${item.totalCost}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td className="py-3 px-4 font-semibold">Total Material Cost</td>
                      <td></td>
                      <td className="text-right py-3 px-4 font-semibold">${report.totalCost}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Production Steps */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-600" />
                Production Steps
              </h3>
              <div className="space-y-3">
                {report.productionSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg p-4 border-l-4 border-blue-500"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <span className="font-semibold text-blue-600 mr-3 mt-1">{idx + 1}.</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{step.description}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {step.estimatedTime}
                            </span>
                            <span className="mx-2">•</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              step.skillLevel === 'basic' ? 'bg-green-100 text-green-700' :
                              step.skillLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {step.skillLevel}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Tools: {step.requiredTools.join(', ')}
                          </div>
                          {step.notes && (
                            <div className="text-xs text-blue-600 mt-1 italic">
                              Note: {step.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Drawings */}
            {report.technicalDrawings.length > 0 && (
              <div className="lg:col-span-2">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <ExternalLink className="w-5 h-5 mr-2 text-gray-600" />
                  Technical Drawings
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
                  {report.technicalDrawings.map((drawing, idx) => (
                    <div key={idx} className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow">
                      <img
                        src={drawing.url}
                        alt={`${drawing.view} view`}
                        className="w-full h-32 object-contain mb-2 bg-gray-50 rounded"
                      />
                      <p className="text-xs text-center text-gray-600 font-medium capitalize">
                        {drawing.view} View
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quality Checks */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Quality Control
              </h3>
              <ul className="space-y-2">
                {report.qualityChecks.map((check, idx) => (
                  <li key={idx} className="flex items-start text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Manufacturability Assessment */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-blue-600" />
                Manufacturability Assessment
              </h3>

              <div className={`inline-flex items-center px-3 py-2 rounded-lg mb-4 ${getScoreColor(report.manufacturability.score)}`}>
                {getScoreIcon(report.manufacturability.score)}
                <span className="ml-2 font-semibold">
                  Score: {report.manufacturability.score}%
                </span>
              </div>

              {report.manufacturability.issues.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-red-700 mb-2">Issues Identified:</h4>
                  <ul className="space-y-1">
                    {report.manufacturability.issues.map((issue, idx) => (
                      <li key={idx} className="text-sm text-red-600 flex items-start">
                        <AlertTriangle className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {report.manufacturability.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-700 mb-2">Recommendations:</h4>
                  <ul className="space-y-1">
                    {report.manufacturability.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-blue-600 flex items-start">
                        <CheckCircle className="w-3 h-3 mr-2 mt-1 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Packaging Information */}
            <div className="lg:col-span-2 bg-purple-50 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-purple-600" />
                Packaging & Shipping
              </h3>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Package Dimensions</h4>
                  <div className="text-sm text-gray-600">
                    <p>L: {report.packaging.dimensions.length}cm</p>
                    <p>W: {report.packaging.dimensions.width}cm</p>
                    <p>H: {report.packaging.dimensions.height}cm</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Weight & Class</h4>
                  <div className="text-sm text-gray-600">
                    <p>Weight: {report.packaging.weight}kg</p>
                    <p>Class: {report.packaging.shippingClass}</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Assembly</h4>
                  <div className="text-sm text-gray-600">
                    <p>Time: {report.assemblyTime} minutes</p>
                    <p>Difficulty: Basic</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={onDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Full Report
                </button>
                <button className="px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                  Request Quote
                </button>
                <button className="px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                  View 3D Model
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
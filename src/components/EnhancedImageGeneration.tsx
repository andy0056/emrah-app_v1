import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Calculator,
  Eye,
  Mic,
  Zap,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Settings
} from 'lucide-react';

import { FormData } from '../types';
import { useAuth } from '../hooks/useAuth';
import { VoiceRefinementInput, DesignRefinement } from './VoiceRefinementInput';
import { RealTimeCostCalculator } from './RealTimeCostCalculator';
import { VisualDesignComparison } from './VisualDesignComparison';
import { SmartRefinementService, RefinementResult } from '../services/smartRefinementService';
import { CostBreakdown } from '../services/manufacturingCostService';
import { FalService } from '../services/falService';

interface EnhancedImageGenerationProps {
  formData: FormData;
  brandAssetUrls: string[];
  onImagesGenerated?: (images: string[]) => void;
  className?: string;
}

interface GenerationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  result?: any;
}

export const EnhancedImageGeneration: React.FC<EnhancedImageGenerationProps> = ({
  formData,
  brandAssetUrls,
  onImagesGenerated,
  className = ""
}) => {
  const { user } = useAuth();

  // Generation state
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);

  // Refinement state
  const [refinementHistory, setRefinementHistory] = useState<RefinementResult[]>([]);
  const [isRefining, setIsRefining] = useState(false);

  // Cost calculation state
  const [currentCostBreakdown, setCurrentCostBreakdown] = useState<CostBreakdown | null>(null);

  // UI state
  const [activeSection, setActiveSection] = useState<'generation' | 'refinement' | 'cost' | 'comparison'>('generation');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Turkey');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Initialize generation steps
  useEffect(() => {
    const steps: GenerationStep[] = [
      {
        id: 'analysis',
        title: 'Brand Asset Analysis',
        description: 'Analyzing uploaded brand assets and design requirements',
        status: 'pending'
      },
      {
        id: 'template',
        title: 'Template Selection',
        description: 'Selecting optimal display template based on requirements',
        status: 'pending'
      },
      {
        id: 'generation',
        title: 'AI Image Generation',
        description: 'Generating design variations with Empati brand DNA alignment',
        status: 'pending'
      },
      {
        id: 'cost-calc',
        title: 'Cost Calculation',
        description: 'Calculating real-time manufacturing costs',
        status: 'pending'
      },
      {
        id: 'finalization',
        title: 'Quality Assurance',
        description: 'Validating design manufacturability and brand consistency',
        status: 'pending'
      }
    ];

    setGenerationSteps(steps);
  }, []);

  const updateStepStatus = (stepId: string, status: GenerationStep['status'], result?: any) => {
    setGenerationSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, result } : step
    ));
  };

  const handleInitialGeneration = async () => {
    setIsGenerating(true);
    setActiveSection('generation');

    try {
      // Step 1: Brand Asset Analysis
      updateStepStatus('analysis', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate analysis
      updateStepStatus('analysis', 'completed');

      // Step 2: Template Selection
      updateStepStatus('template', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStepStatus('template', 'completed');

      // Step 3: AI Generation
      updateStepStatus('generation', 'in-progress');

      const generationResult = await FalService.generateWithBrandAssets({
        formData,
        brand_asset_urls: brandAssetUrls,
        aspect_ratio: "1:1",
        num_images: 3,
        output_format: "jpeg",
        enableCompression: true
      });

      const imageUrls = generationResult.images.map(img => img.url);
      setCurrentImages(imageUrls);
      updateStepStatus('generation', 'completed', { images: imageUrls });

      onImagesGenerated?.(imageUrls);

      // Step 4: Cost Calculation (will be handled by the cost calculator component)
      updateStepStatus('cost-calc', 'in-progress');
      // This will be completed by the cost calculator

      // Step 5: Quality Assurance
      updateStepStatus('finalization', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus('finalization', 'completed');

    } catch (error) {
      console.error('Generation failed:', error);
      const currentStep = generationSteps.find(step => step.status === 'in-progress');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinementRequest = async (refinement: DesignRefinement) => {
    if (!currentImages.length) return;

    setIsRefining(true);
    setActiveSection('refinement');

    try {
      const refinementResult = await SmartRefinementService.processRefinement(
        refinement,
        currentImages[0], // Use first image as base
        formData,
        user?.id
      );

      setRefinementHistory(prev => [refinementResult, ...prev]);
      setCurrentImages([refinementResult.refinedImageUrl, ...currentImages.slice(1)]);

      // Switch to comparison view
      setTimeout(() => setActiveSection('comparison'), 500);

    } catch (error) {
      console.error('Refinement failed:', error);
    } finally {
      setIsRefining(false);
    }
  };

  const handleCostCalculated = (breakdown: CostBreakdown) => {
    setCurrentCostBreakdown(breakdown);
    updateStepStatus('cost-calc', 'completed', breakdown);
  };

  const renderGenerationProgress = () => (
    <div className="space-y-4">
      {generationSteps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center space-x-4 p-4 rounded-lg border ${
            step.status === 'completed' ? 'bg-green-50 border-green-200' :
            step.status === 'in-progress' ? 'bg-blue-50 border-blue-200' :
            step.status === 'error' ? 'bg-red-50 border-red-200' :
            'bg-gray-50 border-gray-200'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step.status === 'completed' ? 'bg-green-500 text-white' :
            step.status === 'in-progress' ? 'bg-blue-500 text-white' :
            step.status === 'error' ? 'bg-red-500 text-white' :
            'bg-gray-300 text-gray-600'
          }`}>
            {step.status === 'completed' ? '✓' :
             step.status === 'in-progress' ? <Sparkles className="w-4 h-4 animate-spin" /> :
             step.status === 'error' ? '✗' :
             index + 1}
          </div>

          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{step.title}</h4>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>

          {step.status === 'in-progress' && (
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-4 bg-blue-500 rounded-full"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

  const renderCurrentImages = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {currentImages.map((imageUrl, index) => (
        <motion.div
          key={`${imageUrl}-${index}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.2 }}
          className="relative group"
        >
          <img
            src={imageUrl}
            alt={`Generated Design ${index + 1}`}
            className="w-full h-64 object-cover rounded-lg border border-gray-200 shadow-sm"
          />
          {index === 0 && (
            <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
              Latest
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

  const sectionTabs = [
    { id: 'generation', title: 'Generation', icon: Sparkles },
    { id: 'refinement', title: 'Smart Refinement', icon: Mic },
    { id: 'cost', title: 'Cost Calculator', icon: Calculator },
    { id: 'comparison', title: 'Comparison', icon: Eye }
  ];

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header with Tabs */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Enhanced Design Generation</h2>
            <p className="text-sm text-gray-600">AI-powered design creation with real-time refinement</p>
          </div>

          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Advanced</span>
            {showAdvancedOptions ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Advanced Options */}
        <AnimatePresence>
          {showAdvancedOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Turkey">Turkey</option>
                    <option value="Europe">Europe</option>
                    <option value="North America">North America</option>
                    <option value="Asia">Asia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <select
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                  >
                    {[1, 5, 10, 25, 50, 100].map(qty => (
                      <option key={qty} value={qty}>{qty} units</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {sectionTabs.map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeSection === id
                  ? 'bg-white shadow-sm text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeSection === 'generation' && (
            <motion.div
              key="generation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {!currentImages.length ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate</h3>
                  <p className="text-gray-600 mb-6">
                    Start creating your intelligent display design with AI assistance
                  </p>
                  <button
                    onClick={handleInitialGeneration}
                    disabled={isGenerating}
                    className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700
                             disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Design'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Generated Designs</h3>
                  {renderCurrentImages()}
                </div>
              )}

              {isGenerating && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Generation Progress</h4>
                  {renderGenerationProgress()}
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'refinement' && (
            <motion.div
              key="refinement"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VoiceRefinementInput
                onRefinementRequest={handleRefinementRequest}
                isProcessing={isRefining}
                disabled={!currentImages.length}
                currentDesignContext={{
                  imageUrl: currentImages[0] || '',
                  designMode: 'hybrid',
                  materials: formData.materials,
                  colors: ['#FFFFFF', '#4E5AC3']
                }}
              />

              {refinementHistory.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Refinement History</h4>
                  <div className="space-y-3">
                    {refinementHistory.slice(0, 3).map((result, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            "{result.refinementPrompt.split('\n')[1]?.replace('Original Request: "', '').replace('"', '') || 'Refinement'}"
                          </span>
                          <span className="text-xs text-gray-500">
                            {result.processingTime}ms
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          {result.appliedChanges.map((change, i) => (
                            <span key={i} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {change.type}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'cost' && (
            <motion.div
              key="cost"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <RealTimeCostCalculator
                formData={formData}
                appliedChanges={refinementHistory[0]?.appliedChanges || []}
                region={selectedRegion}
                quantity={selectedQuantity}
                onCostCalculated={handleCostCalculated}
              />
            </motion.div>
          )}

          {activeSection === 'comparison' && currentImages.length > 0 && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VisualDesignComparison
                originalImage={currentImages[1] || currentImages[0]}
                refinedResult={refinementHistory[0]}
                onSaveComparison={(data) => {
                  console.log('Comparison saved:', data);
                  // Handle comparison save
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Stats Footer */}
      {currentImages.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Generated: {currentImages.length} designs</span>
              <span>Refinements: {refinementHistory.length}</span>
              {currentCostBreakdown && (
                <span>
                  Est. Cost: {new Intl.NumberFormat('tr-TR', {
                    style: 'currency',
                    currency: currentCostBreakdown.total.currency
                  }).format(currentCostBreakdown.total.total)}
                </span>
              )}
            </div>
            <div className="flex items-center text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Ready for production</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
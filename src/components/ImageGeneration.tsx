import React, { useState, useEffect } from 'react';
import { Wand2, Download, Loader2, AlertCircle, Maximize2, Edit, Sparkles, TestTube, Brain, Target, TrendingUp } from 'lucide-react';
import { FalService } from '../services/falService';
import { ProjectService } from '../services/projectService';
import { RefinedPromptGenerator } from '../utils/refinedPromptGenerator';
import { AdvancedPromptGenerator } from '../utils/advancedPromptGenerator';
import { OptimizedPromptGenerator } from '../utils/optimizedPromptGenerator';
import ValidatedPromptGenerator from '../utils/validatedPromptGenerator';
import { SmartPromptGenerator, type FormDataWithDimensions } from '../utils/smartPromptGenerator';
import { FormData } from '../types';
import ImageModal from './ImageModal';
import ImageEditModal from './ImageEditModal';
import ImageFeedback from './ImageFeedback';
import { RealAnalyticsService } from '../services/realAnalyticsService';
import type { CapturedViews } from '../hooks/useSceneCapture';
import type { Visual3DPromptResult } from '../services/visual3DPromptService';

interface ImageGenerationProps {
  prompts: {
    frontView: string;
    storeView: string;
    threeQuarterView: string;
  };
  enhancedPrompts?: {
    frontView: string;
    storeView: string;
    threeQuarterView: string;
  } | null;
  isFormValid: boolean;
  currentProjectId?: string;
  formData?: FormData;
  initialImages?: {
    frontView?: string;
    storeView?: string;
    threeQuarterView?: string;
  };
  onImagesUpdated?: (images: GeneratedImageSet) => void;
  // New props for 3D visual references
  capturedViews?: CapturedViews | null;
  visual3DPrompts?: Visual3DPromptResult | null;
}

interface GeneratedImageSet {
  frontView?: string;
  storeView?: string;
  threeQuarterView?: string;
}

const ImageGeneration: React.FC<ImageGenerationProps> = ({
  prompts,
  enhancedPrompts,
  isFormValid,
  currentProjectId,
  formData,
  initialImages,
  onImagesUpdated,
  capturedViews,
  visual3DPrompts
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageSet>(initialImages || {});
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  
  // Experimental generation state
  const [isExperimentalGenerating, setIsExperimentalGenerating] = useState(false);
  const [experimentalImages, setExperimentalImages] = useState<GeneratedImageSet>({});
  const [experimentalError, setExperimentalError] = useState<string | null>(null);
  const [experimentalProgress, setExperimentalProgress] = useState<string>('');
  const [creativeMode, setCreativeMode] = useState<'refined' | 'advanced' | 'optimized' | 'validated'>('refined');
  const [selectedModel, setSelectedModel] = useState<'nano-banana' | 'seedream-v4'>('nano-banana');

  // Intelligence and optimization features
  const [enableIntelligence, setEnableIntelligence] = useState(true);
  const [enableOptimization, setEnableOptimization] = useState(true);
  const [enableEvolution, setEnableEvolution] = useState(true);
  const [enableABTesting, setEnableABTesting] = useState(true);
  const [enableDimensionalIntelligence, setEnableDimensionalIntelligence] = useState(true);
  const [modelRecommendation, setModelRecommendation] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [dimensionalAnalysis, setDimensionalAnalysis] = useState<any>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
    fileName: string;
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<{
    url: string;
    title: string;
    aspectRatio: "9:16" | "16:9" | "3:4" | "1:1";
  } | null>(null);
  // Removed selectedModel since we automatically choose the best model based on assets

  // Update generated images when initialImages prop changes
  React.useEffect(() => {
    if (initialImages) {
      setGeneratedImages(initialImages);
    }
  }, [initialImages]);

  // Call onImagesUpdated when generatedImages changes
  React.useEffect(() => {
    if (onImagesUpdated) {
      onImagesUpdated(generatedImages);
    }
  }, [generatedImages, onImagesUpdated]);

  // Get intelligent model recommendation when form data changes
  useEffect(() => {
    const getModelRecommendation = async () => {
      if (formData && formData.brandLogo && formData.productImage) {
        try {
          const brandAssetUrls = [formData.brandLogo, formData.productImage];
          if (formData.keyVisual) brandAssetUrls.push(formData.keyVisual);

          const recommendation = await FalService.getRecommendedModel(brandAssetUrls, formData);
          setModelRecommendation(recommendation);
          setSelectedModel(recommendation.model);

          console.log('🎯 Model recommendation received:', recommendation);
        } catch (error) {
          console.warn('Failed to get model recommendation:', error);
        }
      }
    };

    getModelRecommendation();
  }, [formData]);

  // Initialize intelligence system
  useEffect(() => {
    FalService.initializeIntelligence();
  }, []);

  // Generate dimensional analysis when form data changes
  useEffect(() => {
    const generateDimensionalAnalysis = async () => {
      if (formData && enableDimensionalIntelligence) {
        try {
          // Try to extract dimensional data from formData
          const dimensionalData: FormDataWithDimensions = {
            // Product specifications - get from formData or use defaults
            productWidth: formData.productWidth || 13, // User's example: 13cm
            productDepth: formData.productDepth || 2.5, // User's example: 2.5cm
            productHeight: formData.productHeight || 5, // User's example: 5cm
            productFrontFaceCount: formData.productFrontFaceCount || 1,
            productBackToBackCount: formData.productBackToBackCount || 12,

            // Stand specifications
            standWidth: formData.standWidth || 15, // User's example: 15cm
            standDepth: formData.standDepth || 30, // User's example: 30cm
            standHeight: formData.standHeight || 30, // User's example: 30cm

            // Shelf specifications
            shelfWidth: formData.shelfWidth || 15, // User's example: 15cm
            shelfDepth: formData.shelfDepth || 15, // User's example: 15cm
            shelfCount: formData.shelfCount || 1,

            // Brand information
            brand: formData.brand,
            product: formData.product,
            standType: 'countertop display',
            materials: ['wood', 'acrylic'],
            standBaseColor: formData.standBaseColor
          };

          const analysis = SmartPromptGenerator.generateIntelligentPrompts(dimensionalData);
          setDimensionalAnalysis(analysis);

          console.log('🧮 Dimensional analysis generated:', {
            spaceEfficiency: analysis.analysis.spaceUtilization.efficiency,
            productCapacity: analysis.analysis.calculatedLayout.totalProductCapacity,
            issues: analysis.analysis.issues.length
          });
        } catch (error) {
          console.warn('Failed to generate dimensional analysis:', error);
        }
      }
    };

    generateDimensionalAnalysis();
  }, [formData, enableDimensionalIntelligence]);

  const saveImageToSupabase = async (
    imageUrl: string, 
    imageType: 'front_view' | 'store_view' | 'three_quarter_view',
    promptUsed: string,
    aspectRatio: string
  ) => {
    if (!currentProjectId) {
      console.warn('No current project ID, skipping image save to Supabase');
      return;
    }

    try {
      await ProjectService.saveGeneratedImage(
        currentProjectId,
        imageType,
        imageUrl,
        promptUsed,
        aspectRatio
      );
      console.log(`✅ Saved ${imageType} image to Supabase for project ${currentProjectId}`);
    } catch (error) {
      console.error(`❌ Failed to save ${imageType} image to Supabase:`, error);
      // Don't throw error - image generation was successful, just storage failed
    }
  };

  const generateImages = async () => {
    if (!isFormValid) {
      setError('Please fill out all required form fields before generating images.');
      return;
    }

    // Validate mandatory brand assets
    if (!formData || !formData.brandLogo || !formData.productImage) {
      setError('Brand logo and product image are required for AI generation');
      return;
    }

    // Run validation checks and show warnings
    const validationResult = ValidatedPromptGenerator.validateAgainstTestCases(formData);
    if (!validationResult.isValid) {
      setError(`Validation issues detected: ${validationResult.warnings.join(', ')}`);
      return;
    }
    
    // Show warnings but allow generation to continue
    if (validationResult.warnings.length > 0) {
      console.warn('⚠️ Validation warnings:', validationResult.warnings);
      console.log('💡 Recommendations:', validationResult.recommendations);
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages({});

    const startTime = Date.now();

    try {
      // Track session activity
      RealAnalyticsService.recordClientSession('image_generation_started');

      // Use enhanced prompts (which include 3D visual enhancements) if available, otherwise fall back to basic prompts
      const finalPrompts = enhancedPrompts || prompts;

      // Log prompt source for debugging
      if (enhancedPrompts && visual3DPrompts) {
        console.log('🎯 Using Visual 3D enhanced prompts with scale references');
        console.log('📊 Scale accuracy:', visual3DPrompts.scaleAccuracy.overallConfidence);
        console.log('📷 Reference images included:', visual3DPrompts.referenceImages.length);
      } else if (enhancedPrompts) {
        console.log('📝 Using enhanced prompts (dimensional intelligence)');
      } else {
        console.log('📋 Using basic prompts');
      }

      // MODEL SELECTION: Use selected AI model for brand-integrated generation
      const modelName = selectedModel === 'seedream-v4' ? 'SeedReam v4' : 'Nano Banana';
      console.log(`🎯 Generating with ${modelName} for brand integration`);
      
      // Collect brand asset URLs (Logo and Product are mandatory, Key Visual is optional)
      const brandAssetUrls: string[] = [];
      brandAssetUrls.push(formData.brandLogo); // Mandatory
      brandAssetUrls.push(formData.productImage); // Mandatory
      if (formData.keyVisual) brandAssetUrls.push(formData.keyVisual); // Optional

      setProgress(`🎯 Generating front view with ${modelName}...`);

      const frontStartTime = Date.now();
      // Choose generation method based on selected model
      const frontResult = selectedModel === 'seedream-v4'
        ? await FalService.generateWithSeedreamV4({
            prompt: finalPrompts.frontView,
            brand_asset_urls: brandAssetUrls,
            aspect_ratio: '9:16',
            num_images: 1,
            image_size: 1024,
            formData: formData,
            userId: 'demo-user', // In production, get from auth
            enableABTesting: enableABTesting,
            enableOptimization: enableOptimization,
            enableIntelligence: enableIntelligence,
            enableEvolution: enableEvolution
          })
        : await FalService.generateWithBrandAssets({
            prompt: finalPrompts.frontView,
            brand_asset_urls: brandAssetUrls,
            aspect_ratio: '9:16',
            num_images: 1,
            formData: formData,
            userId: 'demo-user', // In production, get from auth
            enableABTesting: enableABTesting,
            enableOptimization: enableOptimization,
            enableIntelligence: enableIntelligence,
            enableEvolution: enableEvolution
          });
      const frontImageUrl = frontResult.images[0]?.url;
      if (frontImageUrl) {
        const frontDuration = Date.now() - frontStartTime;
        RealAnalyticsService.recordGenerationTiming('frontView', frontDuration, true, selectedModel);

        setGeneratedImages(prev => ({ ...prev, frontView: frontImageUrl }));
        if (currentProjectId) {
          await saveImageToSupabase(frontImageUrl, 'front_view', finalPrompts.frontView, '9:16');
        }
      }

      setProgress(`🎯 Generating store view with ${modelName}...`);
      const storeResult = selectedModel === 'seedream-v4'
        ? await FalService.generateWithSeedreamV4({
            prompt: finalPrompts.storeView,
            brand_asset_urls: brandAssetUrls,
            aspect_ratio: '16:9',
            num_images: 1,
            image_size: 1024,
            formData: formData,
            userId: 'demo-user',
            enableABTesting: enableABTesting,
            enableOptimization: enableOptimization,
            enableIntelligence: enableIntelligence,
            enableEvolution: enableEvolution
          })
        : await FalService.generateWithBrandAssets({
            prompt: finalPrompts.storeView,
            brand_asset_urls: brandAssetUrls,
            aspect_ratio: '16:9',
            num_images: 1,
            formData: formData,
            userId: 'demo-user',
            enableABTesting: enableABTesting,
            enableOptimization: enableOptimization,
            enableIntelligence: enableIntelligence,
            enableEvolution: enableEvolution
          });
      const storeImageUrl = storeResult.images[0]?.url;
      if (storeImageUrl) {
        setGeneratedImages(prev => ({ ...prev, storeView: storeImageUrl }));
        if (currentProjectId) {
          await saveImageToSupabase(storeImageUrl, 'store_view', finalPrompts.storeView, '16:9');
        }
      }

      setProgress(`🎯 Generating 3/4 view with ${modelName}...`);
      const threeQuarterResult = selectedModel === 'seedream-v4'
        ? await FalService.generateWithSeedreamV4({
            prompt: finalPrompts.threeQuarterView,
            brand_asset_urls: brandAssetUrls,
            aspect_ratio: '3:4',
            num_images: 1,
            image_size: 1024,
            formData: formData,
            userId: 'demo-user',
            enableABTesting: enableABTesting,
            enableOptimization: enableOptimization,
            enableIntelligence: enableIntelligence,
            enableEvolution: enableEvolution
          })
        : await FalService.generateWithBrandAssets({
            prompt: finalPrompts.threeQuarterView,
            brand_asset_urls: brandAssetUrls,
            aspect_ratio: '3:4',
            num_images: 1,
            formData: formData,
            userId: 'demo-user',
            enableABTesting: enableABTesting,
            enableOptimization: enableOptimization,
            enableIntelligence: enableIntelligence,
            enableEvolution: enableEvolution
          });
      const threeQuarterImageUrl = threeQuarterResult.images[0]?.url;
      if (threeQuarterImageUrl) {
        setGeneratedImages(prev => ({ ...prev, threeQuarterView: threeQuarterImageUrl }));
        if (currentProjectId) {
          await saveImageToSupabase(threeQuarterImageUrl, 'three_quarter_view', finalPrompts.threeQuarterView, '3:4');
        }
      }

      setProgress(`✅ All ${modelName} images generated successfully!`);

      // Track successful completion
      const totalDuration = Date.now() - startTime;
      RealAnalyticsService.recordClientSession('image_generation_completed', totalDuration);

      setTimeout(() => setProgress(''), 3000);
    } catch (error) {
      console.error('Image generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate images. Please try again.');

      // Track failed generation
      RealAnalyticsService.recordClientSession('image_generation_failed');
      RealAnalyticsService.recordGenerationTiming('failed', Date.now() - startTime, false, selectedModel);
    } finally {
      setIsGenerating(false);
    }
  };

  // EXPERIMENTAL: Grounded Manufacturing-First Generation
  const generateExperimentalImages = async () => {
    if (!isFormValid || !formData) {
      setExperimentalError('Please fill in all required fields');
      return;
    }

    setIsExperimentalGenerating(true);
    setExperimentalError(null);
    setExperimentalImages({});

    try {
      setExperimentalProgress('🏗️ Analyzing requirements and selecting optimal template...');

      // Collect brand asset URLs if available
      const brandAssetUrls: string[] = [];
      if (formData.brandLogo) brandAssetUrls.push(formData.brandLogo);
      if (formData.productImage) brandAssetUrls.push(formData.productImage);
      if (formData.keyVisual) brandAssetUrls.push(formData.keyVisual);

      // Import the new grounded generation service
      const { GroundedGenerationService } = await import('../services/groundedGenerationService');

      // Configure generation options based on creative mode
      const options = {
        // Advanced mode: Use Nano Banana with enhanced prompts (SeedReam v4 has compatibility issues with structure guides)
        model: 'nano-banana' as const, // All modes use Nano Banana for structure guide compatibility
        preserveStructure: creativeMode === 'validated' || creativeMode === 'refined',
        includeBrandAssets: brandAssetUrls.length > 0,
        showJoinery: creativeMode === 'validated' || creativeMode === 'refined',
        perspective: '3quarter' as const,
        enableDFMValidation: creativeMode === 'validated',
        creativeMode: creativeMode
      };

      console.log(`🧪 GROUNDED GENERATION: ${options.model} with ${creativeMode} mode`);

      const modeDescriptions = {
        'advanced': 'enhanced photorealistic rendering',
        'optimized': 'optimized for speed and compatibility',
        'validated': 'strict manufacturing compliance',
        'refined': 'balanced creative approach'
      };

      // Use dimensional intelligence if enabled and available
      if (enableDimensionalIntelligence && dimensionalAnalysis) {
        setExperimentalProgress(`🧮 Using dimensional intelligence with ${options.model} (${dimensionalAnalysis.analysis.spaceUtilization.efficiency} efficiency)...`);

        // Override the experimental progress with dimensional analysis insights
        const analysisInsights = [
          `${dimensionalAnalysis.analysis.calculatedLayout.totalProductCapacity} product capacity`,
          `${dimensionalAnalysis.analysis.spaceUtilization.standUsagePercent}% space utilization`,
          dimensionalAnalysis.analysis.issues.length > 0 ? 'with dimensional constraints' : 'dimensionally optimized'
        ].join(', ');

        setExperimentalProgress(`🎯 Dimensional-aware generation: ${analysisInsights}`);
      } else {
        setExperimentalProgress(`🎯 Using ${options.model} with ${modeDescriptions[creativeMode]}...`);
      }

      // Generate using grounded pipeline
      const result = await GroundedGenerationService.generateGroundedDisplay(
        formData,
        brandAssetUrls,
        options
      );

      console.log('✅ Grounded Generation Result:', {
        templateUsed: result.template.name,
        manufacturabilityScore: result.manufacturability.score,
        processingTime: result.metadata.processingTime
      });

      setExperimentalProgress(`✅ Generated with template: ${result.template.name} (${result.manufacturability.score}% manufacturable)`);

      // Display results
      if (result.images.length > 0) {
        setExperimentalImages({ frontView: result.images[0].url });

        if (currentProjectId) {
          await saveImageToSupabase(
            result.images[0].url,
            'front_view',
            `Grounded: ${result.template.name}`,
            '9:16'
          );
        }

        // Show manufacturability insights
        if (result.manufacturability.issues.length > 0) {
          const warnings = result.manufacturability.issues
            .filter(issue => issue.severity === 'warning')
            .map(issue => issue.message);

          if (warnings.length > 0) {
            setExperimentalProgress(`⚠️ Manufacturing notes: ${warnings.slice(0, 2).join(', ')}`);
          }
        }
      } else {
        setExperimentalError('No images generated. Please check your inputs and try again.');
      }

      setExperimentalProgress('✅ Grounded generation complete!');
      setTimeout(() => setExperimentalProgress(''), 3000);
    } catch (error) {
      console.error('Experimental generation error:', error);
      setExperimentalError(error instanceof Error ? error.message : 'Failed to generate experimental images. Please try again.');
    } finally {
      setIsExperimentalGenerating(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const openModal = (url: string, title: string, filename: string) => {
    setSelectedImage({ url, title, fileName: filename });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
  };

  const openEditModal = (url: string, title: string, aspectRatio: "9:16" | "16:9" | "3:4" | "1:1") => {
    setImageToEdit({ url, title, aspectRatio });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setImageToEdit(null);
  };

  const handleImageEdited = (editedImageUrl: string) => {
    console.log('Image edited successfully:', editedImageUrl);
    // Could update the UI to show the new edited image or refresh the gallery
  };

  // All images are square from Nano Banana
  const getAspectRatioClass = () => 'aspect-square';
  const imageTypes = [
    { key: 'frontView', title: 'Front View', filename: 'pop-stand-front-view.png', aspectRatio: '1:1' as const },
    { key: 'storeView', title: 'Store View', filename: 'pop-stand-store-view.png', aspectRatio: '1:1' as const },
    { key: 'threeQuarterView', title: 'Three-Quarter View', filename: 'pop-stand-three-quarter-view.png', aspectRatio: '1:1' as const }
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Wand2 className="w-5 h-5 mr-2" />
            AI Image Generation
          </h3>
          <p className="text-sm text-purple-600 mt-1 flex items-center">
            <Sparkles className="w-4 h-4 mr-1" />
            Brand-integrated generation with advanced AI models
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Intelligence Toggle */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </button>

          {/* Model Selection Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">AI Model:</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as 'nano-banana' | 'seedream-v4')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
            >
              <option value="nano-banana">🍌 Nano Banana Edit</option>
              <option value="seedream-v4">🎯 SeedReam v4 Edit (New)</option>
            </select>
          </div>
          
          <button
            onClick={generateImages}
            disabled={isGenerating || !isFormValid}
            className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all ${
              isGenerating || !isFormValid
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Images
              </>
            )}
          </button>
        </div>
      </div>

      {/* Model Info */}
      {(() => {
        const hasBrandAssets = formData && (formData.brandLogo || formData.productImage || formData.keyVisual);
        const modelInfo = {
          'nano-banana': {
            name: 'Nano Banana Edit',
            description: 'Natural language image editing with brand integration',
            icon: '🍌'
          },
          'seedream-v4': {
            name: 'SeedReam v4 Edit',
            description: 'Advanced multi-image editing with precise control (1024-4096px)',
            icon: '🎯'
          }
        };
        
        const currentModel = modelInfo[selectedModel];
        
        return (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg">
            <p className="text-purple-800 text-sm font-medium">
              {currentModel.icon} Using {currentModel.name}: {currentModel.description}
              {hasBrandAssets && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {selectedModel === 'seedream-v4' ? 'Multi-asset integration' : 'Brand assets integrated'}
                </span>
              )}
              {selectedModel === 'seedream-v4' && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  ✨ NEW MODEL
                </span>
              )}
            </p>
          </div>
        );
      })()}

      {/* Model Recommendation */}
      {modelRecommendation && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-green-800 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Intelligent Model Recommendation
              </h4>
              <p className="text-green-700 text-sm mt-1">
                {modelRecommendation.model === 'seedream-v4' ? '🎯 SeedReam v4' : '🍌 Nano Banana'}
                {' '}({Math.round(modelRecommendation.confidence * 100)}% confidence)
              </p>
              <p className="text-green-600 text-xs mt-1">
                {modelRecommendation.reasoning[0]}
              </p>
            </div>
            {modelRecommendation.assetAnalysis && (
              <div className="text-right">
                <div className="text-xs text-gray-600">
                  Complexity: {modelRecommendation.assetAnalysis.overallComplexity}/10
                </div>
                <div className="text-xs text-gray-600">
                  Integration: {modelRecommendation.assetAnalysis.brandIntegrationDifficulty}/10
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intelligence Controls */}
      {showAnalytics && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            AI Intelligence Controls
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={enableIntelligence}
                  onChange={(e) => setEnableIntelligence(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">🧠 Form Intelligence</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={enableOptimization}
                  onChange={(e) => setEnableOptimization(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">🎯 Dynamic Optimization</span>
              </label>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={enableEvolution}
                  onChange={(e) => setEnableEvolution(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">🧬 Evolved Patterns</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={enableABTesting}
                  onChange={(e) => setEnableABTesting(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">🧪 A/B Testing</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={enableDimensionalIntelligence}
                  onChange={(e) => setEnableDimensionalIntelligence(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">📐 Dimensional Intelligence</span>
              </label>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-600">
            <p>• <strong>Form Intelligence:</strong> Analyzes your inputs to understand brand priorities and visual preferences</p>
            <p>• <strong>Dynamic Optimization:</strong> Adjusts prompts based on previous client feedback patterns</p>
            <p>• <strong>Evolved Patterns:</strong> Uses genetic algorithms to improve prompt effectiveness over time</p>
            <p>• <strong>A/B Testing:</strong> Tests different prompt approaches to find the most effective ones</p>
            <p>• <strong>Dimensional Intelligence:</strong> Analyzes product and stand dimensions to ensure physically accurate designs</p>
          </div>
        </div>
      )}

      {/* Dimensional Analysis Display */}
      {dimensionalAnalysis && enableDimensionalIntelligence && (
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-green-800 flex items-center">
                📐 Dimensional Intelligence Analysis
              </h4>
              <p className="text-green-700 text-sm mt-1">
                Space efficiency: {dimensionalAnalysis.analysis.spaceUtilization.efficiency} ({dimensionalAnalysis.analysis.spaceUtilization.standUsagePercent}%)
              </p>
              <p className="text-green-600 text-xs mt-1">
                Capacity: {dimensionalAnalysis.analysis.calculatedLayout.totalProductCapacity} products
                ({dimensionalAnalysis.analysis.calculatedLayout.productsPerShelf} per shelf)
              </p>
              {dimensionalAnalysis.analysis.issues.length > 0 && (
                <p className="text-orange-600 text-xs mt-1">
                  Issues detected: {dimensionalAnalysis.analysis.issues.slice(0, 2).join(', ')}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">
                Layout: {dimensionalAnalysis.analysis.calculatedLayout.shelfColumns}×{dimensionalAnalysis.analysis.calculatedLayout.shelfRows}
              </div>
              <div className="text-xs text-gray-600">
                Wasted: {Math.round(dimensionalAnalysis.analysis.spaceUtilization.wastedSpace)} cm³
              </div>
            </div>
          </div>
        </div>
      )}

      {enhancedPrompts && (
        <div className="mb-4 p-3 bg-purple-100 border border-purple-200 rounded-lg">
          <p className="text-purple-800 text-sm font-medium">🚀 Using AI-enhanced Brand-First prompts with signature elements, brand metaphors, and emotional storytelling!</p>
        </div>
      )}

      {progress && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm font-medium">{progress}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {imageTypes.map(({ key, title, filename, aspectRatio }) => {
          const imageUrl = generatedImages[key as keyof GeneratedImageSet];
          
          return (
            <div key={key} className="bg-white rounded-lg p-4 shadow-md">
              <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
              
              <div className={`relative ${getAspectRatioClass()} bg-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden group`}>
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                      onClick={() => openModal(imageUrl, title, filename)}
                    />
                    <div
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                      onClick={() => openModal(imageUrl, title, filename)}
                    >
                      <div className="bg-white bg-opacity-90 rounded-full p-2">
                        <Maximize2 className="w-5 h-5 text-gray-700" />
                      </div>
                    </div>

                    {/* Feedback Component */}
                    <ImageFeedback
                      imageUrl={imageUrl}
                      imageType={key as 'frontView' | 'storeView' | 'threeQuarterView'}
                      model={selectedModel}
                      promptVersion="phase3-intelligent"
                      promptUsed={prompts[key as keyof typeof prompts]}
                      formData={formData}
                      projectId={currentProjectId || 'demo-project'}
                      userId="demo-user"
                      generationTime={Date.now() - (new Date().getTime() - 30000)} // Approximate
                    />
                  </>
                ) : (
                  <div className="text-gray-400 text-center">
                    <Wand2 className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Image will appear here</p>
                  </div>
                )}
              </div>

            {imageUrl && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => downloadImage(imageUrl, filename)}
                  className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
                <button
                  onClick={() => openEditModal(imageUrl, title, aspectRatio)}
                  className="flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </div>
            )}
            </div>
          );
        })}
      </div>

      {/* EXPERIMENTAL SECTION */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 mt-8 border-2 border-dashed border-blue-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <TestTube className="w-5 h-5 mr-2 text-blue-600" />
              🧪 Experimental Generation
            </h3>
            <p className="text-sm text-blue-600 mt-1 flex items-center">
              <Sparkles className="w-4 h-4 mr-1" />
              {creativeMode === 'advanced' 
                ? 'Advanced creative system with dimension precision & producibility validation' 
                : creativeMode === 'optimized' 
                ? 'Optimized concise prompts - 35% shorter, maximum AI model compatibility' 
                : creativeMode === 'validated'
                ? 'Strict constraint validation ensuring manufacturability & spec compliance'
                : 'Refined prompt templates with flexible brand integration'}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Creative Mode Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Creative Mode:</label>
              <select
                value={creativeMode}
                onChange={(e) => setCreativeMode(e.target.value as 'refined' | 'advanced' | 'optimized' | 'validated')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="refined">Refined (Current)</option>
                <option value="advanced">🎯 Advanced (Client Feedback)</option>
                <option value="optimized">⚡ Optimized (35% Shorter)</option>
                <option value="validated">✅ Validated (Strict Compliance)</option>
              </select>
            </div>
            
            <button
              onClick={generateExperimentalImages}
              disabled={isExperimentalGenerating || !isFormValid}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all ${
                isExperimentalGenerating || !isFormValid
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:scale-105'
              }`}
            >
              {isExperimentalGenerating ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <TestTube className="w-5 h-5 mr-2" />
              )}
              {isExperimentalGenerating ? 'Experimenting...' : 'Generate Experimental'}
            </button>
          </div>
        </div>

        {/* Experimental Progress */}
        {experimentalProgress && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">{experimentalProgress}</p>
          </div>
        )}

        {/* Experimental Error */}
        {experimentalError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700 text-sm">{experimentalError}</p>
          </div>
        )}

        {/* Experimental Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {imageTypes.map(({ key, title, filename, aspectRatio }) => {
            const imageUrl = experimentalImages[key as keyof GeneratedImageSet];
            return (
              <div key={`exp-${key}`} className="space-y-3">
                <h4 className="text-lg font-medium text-gray-800">{title} (Experimental)</h4>
                
                <div className="relative bg-white rounded-lg border-2 border-dashed border-blue-200 group">
                  <div className={`${getAspectRatioClass()} bg-gray-50 rounded-lg flex items-center justify-center relative overflow-hidden`}>
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={title}
                          className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                          onClick={() => openModal(imageUrl, `${title} (Experimental)`, `exp-${filename}`)}
                        />
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                          onClick={() => openModal(imageUrl, `${title} (Experimental)`, `exp-${filename}`)}
                        >
                          <div className="bg-white bg-opacity-90 rounded-full p-2">
                            <Maximize2 className="w-5 h-5 text-gray-700" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 text-center">
                        <TestTube className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                        <p className="text-sm">Experimental image will appear here</p>
                      </div>
                    )}
                  </div>

                  {imageUrl && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => downloadImage(imageUrl, `exp-${filename}`)}
                        className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </button>
                      <button
                        onClick={() => openEditModal(imageUrl, `${title} (Experimental)`, aspectRatio)}
                        className="flex items-center justify-center px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isFormValid && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Please complete all required form fields to enable image generation.
          </p>
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={modalOpen}
        imageUrl={selectedImage?.url || null}
        imageTitle={selectedImage?.title || ''}
        fileName={selectedImage?.fileName || 'pop-stand-image.png'}
        onClose={closeModal}
      />

      {/* Image Edit Modal */}
      <ImageEditModal
        isOpen={isEditModalOpen}
        imageUrl={imageToEdit?.url || null}
        imageTitle={imageToEdit?.title || ''}
        aspectRatio={imageToEdit?.aspectRatio || '1:1'}
        projectId={currentProjectId}
        formData={formData}
        onClose={closeEditModal}
        onImageEdited={handleImageEdited}
      />
    </div>
  );
};

export default ImageGeneration;
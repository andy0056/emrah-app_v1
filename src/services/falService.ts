/**
 * Simplified FAL Service
 * Refactored and modular version of the original FalService
 */

import { FalCoreService, FalBrandIntegrationService, AVAILABLE_MODELS } from './fal';
import { ReplicateBrandIntegrationService } from './replicate/replicateBrandIntegration';
import { ABTestingService } from './abTestingService';
import { PromptOptimizationService } from './promptOptimizationService';
import { IntelligentPromptService } from './intelligentPromptService';
import { BrandAssetAnalysisService } from './brandAssetAnalysisService';
import { PromptEvolutionService } from './promptEvolutionService';
import { FeedbackService } from './feedbackService';
import { PromptCompressionService } from './promptCompressionService';
import type {
  AIModel,
  ModelConfig,
  ImageGenerationRequest,
  FluxKontextRequest,
  BrandAssetGenerationRequest,
  SeedreamGenerationRequest,
  ModelRecommendation
} from './fal/types';

export class FalService {
  /**
   * Initialize the intelligence system
   */
  static initializeIntelligence(): void {
    PromptOptimizationService.initialize();
    PromptEvolutionService.initialize();
    ABTestingService.initialize();
    console.log('🚀 FalService AI intelligence system initialized');
  }

  /**
   * Get intelligent model recommendation based on brand assets
   */
  static async getRecommendedModel(brandAssetUrls: string[], formData?: any): Promise<ModelRecommendation> {
    try {
      // Analyze brand assets
      const assetAnalysis = await BrandAssetAnalysisService.analyzeBrandAssets(brandAssetUrls);
      const assetRecommendation = BrandAssetAnalysisService.getModelRecommendation(assetAnalysis);
      const feedbackRecommendation = FeedbackService.getRecommendedModel(formData || {});

      // Combine recommendations
      let finalModel: 'seedream-v4' | 'nano-banana';
      let confidence = assetRecommendation.confidence;
      const reasoning = [...assetRecommendation.reasoning];

      if (assetRecommendation.model === feedbackRecommendation) {
        finalModel = assetRecommendation.model;
        confidence = Math.min(0.95, confidence + 0.1);
        reasoning.push('Asset analysis and feedback history agree on model choice');
      } else {
        if (assetAnalysis.overallComplexity >= 7) {
          finalModel = assetRecommendation.model;
          reasoning.push('Prioritizing asset analysis for complex brand integration');
        } else {
          finalModel = feedbackRecommendation;
          confidence = 0.7;
          reasoning.push('Using feedback-based recommendation for simpler cases');
        }
      }

      console.log('🎯 Intelligent model recommendation:', {
        model: finalModel,
        confidence: confidence.toFixed(2),
        assetComplexity: assetAnalysis.overallComplexity,
        brandDifficulty: assetAnalysis.brandIntegrationDifficulty
      });

      // Force Nano Banana for API stability
      return {
        model: 'nano-banana' as const,
        confidence: Math.max(0.8, confidence),
        reasoning: [...reasoning, 'Using Nano Banana for better API stability'],
        assetAnalysis
      };

    } catch (error) {
      console.warn('⚠️ Intelligent model selection failed, using fallback:', error);
      return {
        model: 'nano-banana' as const,
        confidence: 0.6,
        reasoning: ['Using Nano Banana fallback due to analysis error and better API stability']
      };
    }
  }

  /**
   * Generate image using Replicate service
   */
  static async generateImage(request: {
    prompt: string;
    aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1" | "4:3";
    num_images?: number;
    model?: AIModel;
    inputImages?: string[];
  }) {
    console.log('🎯 Generating basic image with Replicate Nano Banana...');
    return await ReplicateBrandIntegrationService.generateWithBrandAssets({
      prompt: request.prompt,
      aspect_ratio: request.aspect_ratio,
      num_images: request.num_images || 1,
      brand_asset_urls: request.inputImages || []
    });
  }

  /**
   * Generate with Master Orchestration using Replicate only
   */
  static async generateWithMasterOrchestration(request: BrandAssetGenerationRequest & { capturedViews?: any }) {
    console.log('🎭 Master Orchestration with Replicate Nano Banana...');
    return await ReplicateBrandIntegrationService.generateWithBrandAssets(request);
  }

  /**
   * Generate with brand assets using Replicate only
   */
  static async generateWithBrandAssets(request: BrandAssetGenerationRequest) {
    console.log('🎯 Generating with Replicate Nano Banana...');
    return await ReplicateBrandIntegrationService.generateWithBrandAssets(request);
  }

  /**
   * Generate with SeedReam v4 (advanced method) using Replicate
   */
  static async generateWithSeedreamV4(request: SeedreamGenerationRequest) {
    console.log('🎯 SeedReam v4 generation with Replicate Nano Banana');
    return ReplicateBrandIntegrationService.generateWithBrandAssets(request);
  }

  /**
   * Get model by ID - now returns Replicate Nano Banana config
   */
  static getModelById(modelId: AIModel): ModelConfig | undefined {
    // Always return nano-banana config since we're using Replicate only
    return {
      id: 'nano-banana' as AIModel,
      name: 'Nano Banana (Replicate)',
      description: 'Google Nano Banana via Replicate',
      maxImages: 4,
      supportsBrandAssets: true,
      supportsAspectRatio: true,
      defaultAspectRatio: '1:1' as const
    };
  }

  /**
   * Generate multiple images using Replicate
   */
  static async generateMultipleImages(requests: ImageGenerationRequest[]): Promise<any[]> {
    console.log('🎯 Generating multiple images with Replicate Nano Banana...');
    const results = [];
    for (const request of requests) {
      const result = await ReplicateBrandIntegrationService.generateWithBrandAssets({
        prompt: request.prompt,
        aspect_ratio: request.aspect_ratio,
        num_images: request.num_images || 1,
        brand_asset_urls: []
      });
      results.push(result);
    }
    return results;
  }

  // Legacy function for backward compatibility - returns standard image size
  static getImageSize(aspectRatio: string) {
    const sizes = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1344, height: 768 },
      '9:16': { width: 768, height: 1344 },
      '3:4': { width: 896, height: 1152 },
      '4:3': { width: 1152, height: 896 }
    };
    return sizes[aspectRatio as keyof typeof sizes] || sizes['1:1'];
  }
}

// Re-export types and config for backward compatibility
export { AVAILABLE_MODELS };
export type { AIModel, ModelConfig, ImageGenerationRequest, FluxKontextRequest };
/**
 * Simplified FAL Service
 * Refactored and modular version of the original FalService
 */

import { FalCoreService, FalBrandIntegrationService, AVAILABLE_MODELS } from './fal';
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
   * Generate image using core service
   */
  static async generateImage(request: {
    prompt: string;
    aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1" | "4:3";
    num_images?: number;
    model?: AIModel;
    inputImages?: string[];
  }) {
    return FalCoreService.generateImage(request);
  }

  /**
   * Generate with brand assets (primary method)
   */
  static async generateWithBrandAssets(request: BrandAssetGenerationRequest) {
    return FalBrandIntegrationService.generateWithBrandAssets(request);
  }

  /**
   * Generate with SeedReam v4 (advanced method)
   */
  static async generateWithSeedreamV4(request: SeedreamGenerationRequest) {
    // For now, delegate to brand assets generation
    // TODO: Implement SeedReam v4 specific logic
    console.log('🎯 SeedReam v4 generation - delegating to brand assets for now');
    return FalBrandIntegrationService.generateWithBrandAssets(request);
  }

  /**
   * Get model by ID
   */
  static getModelById(modelId: AIModel): ModelConfig | undefined {
    return FalCoreService.getModelById(modelId);
  }

  /**
   * Generate multiple images
   */
  static async generateMultipleImages(requests: ImageGenerationRequest[]): Promise<any[]> {
    return FalCoreService.generateMultipleImages(requests.map(req => ({
      prompt: req.prompt,
      aspect_ratio: req.aspect_ratio,
      num_images: req.num_images
    })));
  }

  // Legacy exports for backward compatibility
  static getImageSize = FalCoreService.getImageSize;
}

// Re-export types and config for backward compatibility
export { AVAILABLE_MODELS };
export type { AIModel, ModelConfig, ImageGenerationRequest, FluxKontextRequest };
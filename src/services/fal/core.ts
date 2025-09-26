/**
 * FAL AI Core Service
 * Main service class with simplified, focused methods
 */

import { fal } from "@fal-ai/client";
import { AVAILABLE_MODELS, DEFAULT_GENERATION_CONFIG } from './config';
import { getImageSize } from './utils';
import type { FalGenerationRequest, FalImageResponse, ModelConfig, AIModel } from './types';

// SECURITY UPDATE: API keys removed from client-side
// All Fal.ai calls now go through secure backend proxy
// DO NOT add API keys here - use the proxy service instead
console.warn('⚠️ Fal.ai client configuration removed for security. Using secure proxy.');

export class FalCoreService {
  /**
   * Generate image with specified model
   */
  static async generateImage(request: FalGenerationRequest): Promise<FalImageResponse> {
    try {
      const selectedModel = AVAILABLE_MODELS.find(m => m.id === (request.model || 'flux-dev'));
      console.log(`🎯 Using ${selectedModel?.name} (${selectedModel?.endpoint})`);
      console.log("📝 Prompt:", request.prompt);
      console.log("📐 Aspect ratio:", request.aspect_ratio);

      if (selectedModel?.type === 'image-editing') {
        return this.generateWithEditingModel(selectedModel, request);
      } else {
        return this.generateWithTextToImageModel(selectedModel, request);
      }
    } catch (error: unknown) {
      console.error(`❌ ${request.model || 'flux-dev'} generation failed:`, error);
      throw new Error(
        `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate with text-to-image model
   */
  private static async generateWithTextToImageModel(model: ModelConfig | undefined, request: FalGenerationRequest): Promise<FalImageResponse> {
    const endpoint = model?.endpoint || 'fal-ai/flux/dev';

    let inputConfig: Record<string, unknown> = {
      prompt: request.prompt,
      num_images: request.num_images || DEFAULT_GENERATION_CONFIG.num_images
    };

    // Model-specific configurations
    if (endpoint === 'fal-ai/flux/dev') {
      inputConfig = {
        ...inputConfig,
        image_size: getImageSize(request.aspect_ratio),
        num_inference_steps: DEFAULT_GENERATION_CONFIG.num_inference_steps,
        guidance_scale: DEFAULT_GENERATION_CONFIG.guidance_scale,
        enable_safety_checker: DEFAULT_GENERATION_CONFIG.enable_safety_checker
      };
    } else if (endpoint === 'fal-ai/flux-pro') {
      inputConfig = {
        ...inputConfig,
        aspect_ratio: request.aspect_ratio,
        guidance_scale: 3.5,
        num_inference_steps: 50,
        safety_tolerance: 2
      };
    } else if (endpoint === 'fal-ai/nano-banana') {
      inputConfig = {
        ...inputConfig,
        output_format: "jpeg"
      };
    }

    const result = await fal.subscribe(endpoint, {
      input: inputConfig,
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`${model?.name} Status:`, update.status);
        if (update.logs) {
          update.logs.forEach(log => console.log("Log:", log.message));
        }
      }
    });

    return {
      images: result.data.images,
      seed: result.data.seed || 0,
      description: result.data.description || null
    };
  }

  /**
   * Generate with image editing model
   */
  private static async generateWithEditingModel(model: ModelConfig | undefined, request: FalGenerationRequest): Promise<FalImageResponse> {
    if (!request.inputImages || request.inputImages.length === 0) {
      throw new Error(`${model?.name} requires input images. Please upload reference images first.`);
    }

    console.log("🖼️ Input images:", request.inputImages);

    const result = await fal.subscribe(model?.endpoint || 'fal-ai/nano-banana/edit', {
      input: {
        prompt: request.prompt,
        image_urls: request.inputImages,
        num_images: request.num_images || 1,
        output_format: "jpeg"
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          update.logs?.map((log) => log.message).forEach(console.log);
        }
      }
    });

    return {
      images: result.data.images,
      description: result.data.description || null
    };
  }

  /**
   * Get model configuration by ID
   */
  static getModelById(modelId: AIModel): ModelConfig | undefined {
    return AVAILABLE_MODELS.find(m => m.id === modelId);
  }

  /**
   * Generate multiple images
   */
  static async generateMultipleImages(requests: FalGenerationRequest[]): Promise<FalImageResponse[]> {
    try {
      const promises = requests.map(request => this.generateImage(request));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error generating multiple images:', error);
      throw error;
    }
  }

  /**
   * Get image size for aspect ratio (for backward compatibility)
   */
  static getImageSize = getImageSize;
}
/**
 * Replicate Brand Integration Service
 * Alternative to FAL.ai using Replicate's Nano Banana
 */

import type { BrandAssetGenerationRequest } from '../fal/types';
import { ReplicateService, type ReplicateImageResponse } from '../replicateService';
import { makeBrandFriendlyPrompt, compressPrompt } from '../fal/utils';
import { createFormPriorityBrandPrompt, validateFormRequirementsInPrompt, getProtectedFormContent } from '../fal/formPriorityPromptUtils';
import { mergeWithDefaults } from '../../utils/formDataMapper';
import { SmartPromptGenerator } from '../../utils/smartPromptGenerator';

export class ReplicateBrandIntegrationService {
  /**
   * Generate images with brand assets using Replicate Nano Banana
   */
  static async generateWithBrandAssets(request: BrandAssetGenerationRequest): Promise<ReplicateImageResponse> {
    try {
      console.log('🔄 Replicate generation with integrated brand assets');

      // Transform the prompt to be brand-friendly
      const brandFriendlyPrompt = makeBrandFriendlyPrompt(request.prompt);

      let integratedPrompt: string;

      // Form-priority approach - treat form inputs as absolute truth
      if (request.formData) {
        try {
          // Step 1: Create form-priority prompt
          integratedPrompt = createFormPriorityBrandPrompt(brandFriendlyPrompt, request.formData);

          // Step 2: Validate form requirements
          const validation = validateFormRequirementsInPrompt(integratedPrompt, request.formData);
          if (!validation.isValid) {
            console.warn('⚠️ Form validation failed:', validation.missingRequirements.length, 'issues');
          }

          console.log('✅ Form-priority integration active:', request.formData.brand);

        } catch (error) {
          console.warn('⚠️ Form integration failed, using basic prompt');
          integratedPrompt = brandFriendlyPrompt;
        }
      } else {
        // Fallback to basic brand integration
        integratedPrompt = brandFriendlyPrompt;
        console.log('ℹ️ Using basic brand integration (no form data)');
      }

      // Compress prompt for Replicate (no hard length limit but keep reasonable)
      const protectedContent = request.formData ? getProtectedFormContent(request.formData) : [];
      const compressedPrompt = compressPrompt(integratedPrompt, 8000, protectedContent);

      // Use Replicate Nano Banana for generation
      const result = await ReplicateService.generateWithNanoBanana({
        prompt: compressedPrompt,
        image_urls: request.brand_asset_urls,
        aspect_ratio: request.aspect_ratio,
        num_images: request.num_images || 1,
        output_format: request.output_format || "jpeg"
      });

      console.log('✅ Replicate brand asset generation complete');
      return result;

    } catch (error: unknown) {
      console.error('❌ Error generating with Replicate brand assets:', error);
      throw new Error(`Failed to generate with Replicate brand assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if Replicate is available as an alternative
   */
  static async checkAvailability(): Promise<boolean> {
    try {
      return await ReplicateService.checkHealth();
    } catch {
      return false;
    }
  }
}
/**
 * FAL Brand Integration Service
 * Specialized service for brand asset integration
 */

import { fal } from "@fal-ai/client";
import { generateClientRequirementMapping, makeBrandFriendlyPrompt, createBrandIntegrationPrompt, createDimensionalBrandIntegrationPrompt, generatePhysicsValidatedRequirements, compressPrompt } from './utils';
import { SmartPromptGenerator } from '../../utils/smartPromptGenerator';
import { mapToFormDataWithDimensions, mergeWithDefaults } from '../../utils/formDataMapper';
import type { BrandAssetGenerationRequest, FalImageResponse } from './types';

export class FalBrandIntegrationService {
  /**
   * Generate images with brand assets using Nano Banana Edit
   */
  static async generateWithBrandAssets(request: BrandAssetGenerationRequest): Promise<FalImageResponse> {
    try {
      console.log('🍌 Primary generation with integrated brand assets using Nano Banana Edit');

      // Transform the prompt to be brand-friendly
      const brandFriendlyPrompt = makeBrandFriendlyPrompt(request.prompt);

      let integratedPrompt: string;

      // Use dimensional intelligence if form data is available
      if (request.formData) {
        try {
          console.log('🧮 Generating dimensional analysis for brand integration...');

          // Convert to dimensional format
          const dimensionalData = mergeWithDefaults(request.formData, request.formData.product);

          // Generate dimensional analysis
          const analysis = SmartPromptGenerator.generateIntelligentPrompts(dimensionalData);

          // Generate physics-validated client requirements (replaces generic mapping)
          const physicsValidatedRequirements = generatePhysicsValidatedRequirements(request.formData, analysis.analysis);

          // Use dimensional brand integration with physics validation
          integratedPrompt = createDimensionalBrandIntegrationPrompt(
            brandFriendlyPrompt,
            analysis.analysis,
            physicsValidatedRequirements
          );

          console.log('✅ Using DIMENSIONAL-PRIORITY brand integration with physics validation');
          console.log('📊 Layout Analysis:', {
            productsPerShelf: analysis.analysis.calculatedLayout.productsPerShelf,
            arrangement: `${analysis.analysis.calculatedLayout.shelfRows}×${analysis.analysis.calculatedLayout.shelfColumns}`,
            efficiency: analysis.analysis.spaceUtilization.efficiency,
            utilization: `${analysis.analysis.spaceUtilization.standUsagePercent}%`,
            manufacturingConstraints: analysis.analysis.manufacturingConstraints.length,
            physicsValid: analysis.analysis.issues.length === 0
          });

        } catch (error) {
          console.warn('⚠️ Dimensional analysis failed, falling back to generic brand integration:', error);

          // Fallback to generic requirements if dimensional analysis fails
          const clientRequirements = generateClientRequirementMapping(request.formData);
          integratedPrompt = createBrandIntegrationPrompt(brandFriendlyPrompt, clientRequirements);
        }
      } else {
        // Fallback to generic brand integration when no form data
        integratedPrompt = createBrandIntegrationPrompt(brandFriendlyPrompt, '');
        console.log('ℹ️ Using generic CLIENT-PRIORITY brand integration (no form data)');
      }

      // Compress prompt to stay within API limits
      const compressedPrompt = compressPrompt(integratedPrompt);

      console.log('📝 Final Integrated Prompt Length:', compressedPrompt.length);
      console.log('🖼️ Brand Asset URLs:', request.brand_asset_urls);
      console.log('🎯 Aspect Ratio:', request.aspect_ratio);

      // Use Nano Banana Edit with brand assets for initial generation
      const result = await this.applyBrandAssetsWithNanaBanana({
        image_urls: request.brand_asset_urls,
        prompt: compressedPrompt,
        aspect_ratio: request.aspect_ratio,
        num_images: request.num_images || 1,
        output_format: request.output_format || "jpeg"
      });

      return result;
    } catch (error: unknown) {
      console.error('❌ Error generating with brand assets:', error);
      throw new Error(`Failed to generate with brand assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply brand assets using Nano Banana Edit
   */
  private static async applyBrandAssetsWithNanaBanana(request: {
    image_urls: string[];
    prompt: string;
    aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1";
    num_images?: number;
    output_format?: 'jpeg' | 'png';
  }): Promise<FalImageResponse> {
    try {
      console.log('🍌 Applying brand assets with Nano Banana Edit');

      // Validate inputs
      if (!request.image_urls || request.image_urls.length === 0) {
        throw new Error('At least one image URL is required');
      }

      if (!request.prompt || request.prompt.trim().length === 0) {
        throw new Error('Prompt is required');
      }

      // Process images, only re-uploading non-fal.ai images
      const accessibleImageUrls: string[] = [];

      for (let i = 0; i < request.image_urls.length; i++) {
        const originalUrl = request.image_urls[i];
        console.log(`📥 Processing image ${i + 1}/${request.image_urls.length}: ${originalUrl}`);

        try {
          // Check if image is already on fal.ai - if so, use it directly
          if (originalUrl.includes('fal.media') || originalUrl.includes('fal.ai')) {
            console.log(`✅ Image ${i + 1} already on fal.ai, using directly`);
            accessibleImageUrls.push(originalUrl);
            continue;
          }

          // For external images, download and re-upload to fal.ai
          const response = await fetch(originalUrl, {
            headers: { 'User-Agent': 'FalAI-Client/1.0' }
          });

          if (!response.ok) {
            console.warn(`⚠️ Skipping image ${i + 1} due to download error: ${response.status}`);
            continue;
          }

          const blob = await response.blob();

          // Verify we got actual image data
          if (!blob.type.startsWith('image/')) {
            console.warn(`⚠️ Skipping image ${i + 1}: Invalid content type: ${blob.type}`);
            continue;
          }

          // Create a File object for Fal.ai upload
          const file = new File([blob], `image-${i + 1}.${blob.type.split('/')[1] || 'jpg'}`, {
            type: blob.type
          });

          // Upload to Fal.ai storage
          const falUrl = await fal.storage.upload(file);
          console.log(`✅ Re-uploaded image ${i + 1} to Fal.ai`);

          accessibleImageUrls.push(falUrl);
        } catch (error) {
          console.error(`❌ Failed to process image ${i + 1}:`, error);
          console.warn(`⚠️ Skipping image ${i + 1} due to processing error`);
          continue;
        }
      }

      if (accessibleImageUrls.length === 0) {
        throw new Error(`No valid images could be processed from ${request.image_urls.length} provided images`);
      }

      console.log(`✅ Successfully processed ${accessibleImageUrls.length} out of ${request.image_urls.length} images`);

      // Validate prompt length (3-5000 characters required)
      const trimmedPrompt = request.prompt.trim();
      if (trimmedPrompt.length < 3) {
        throw new Error('Prompt must be at least 3 characters long');
      }
      if (trimmedPrompt.length > 5000) {
        throw new Error('Prompt must be no more than 5000 characters long');
      }

      // Validate image URLs (1-10 images required)
      if (accessibleImageUrls.length > 10) {
        console.warn(`⚠️ Too many images (${accessibleImageUrls.length}), using first 10`);
        accessibleImageUrls.splice(10);
      }

      // Validate num_images (1-4 range)
      const numImages = Math.min(Math.max(request.num_images || 1, 1), 4);

      console.log('🔍 Request validation:', {
        promptLength: trimmedPrompt.length,
        imageCount: accessibleImageUrls.length,
        numImages,
        outputFormat: request.output_format || "jpeg"
      });

      // Use the correct nano-banana/edit endpoint
      const result = await fal.subscribe("fal-ai/nano-banana/edit", {
        input: {
          prompt: trimmedPrompt,
          image_urls: accessibleImageUrls,
          num_images: numImages,
          output_format: request.output_format || "jpeg"
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log('🍌 Nano Banana Status:', update.status);
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach(console.log);
          }
        }
      });

      console.log('✅ Brand assets applied successfully');
      if (result.data.description) {
        console.log('📝 AI Description:', result.data.description);
      }

      return result.data as FalImageResponse;
    } catch (error: unknown) {
      console.error('❌ Error applying brand assets with Nano Banana:', error);

      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      throw new Error(`Failed to apply brand assets: ${errorMessage}`);
    }
  }
}
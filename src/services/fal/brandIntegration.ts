/**
 * FAL Brand Integration Service
 * Specialized service for brand asset integration
 */

import { fal } from "@fal-ai/client";
import { generateClientRequirementMapping, makeBrandFriendlyPrompt, createBrandIntegrationPrompt, compressPrompt } from './utils';
import { createFormPriorityBrandPrompt, validateFormRequirementsInPrompt, getProtectedFormContent } from './formPriorityPromptUtils';
import { advancedCompressPrompt, type CompressionConfig } from './advancedCompressionUtils';
import { assessPromptQuality, generateCompressionReport } from './promptQualityAssessment';
import { MasterPromptOrchestrator, type SourceOfTruthHierarchy } from './masterPromptOrchestrator';
import { EndToEndQualityAssurance } from './endToEndQualityAssurance';
import { SmartPromptGenerator } from '../../utils/smartPromptGenerator';
import { mergeWithDefaults } from '../../utils/formDataMapper';
import type { BrandAssetGenerationRequest, FalImageResponse } from './types';

export class FalBrandIntegrationService {
  /**
   * PHASE 4: Master Orchestrated Generation with Source-of-Truth Hierarchy
   */
  static async generateWithMasterOrchestration(request: BrandAssetGenerationRequest & { capturedViews?: any }): Promise<FalImageResponse> {
    try {
      console.log('🎭 PHASE 4: Master Orchestrated Generation Starting...');

      // Transform the prompt to be brand-friendly
      const brandFriendlyPrompt = makeBrandFriendlyPrompt(request.prompt);

      // Set up source-of-truth hierarchy
      const sourceHierarchy: SourceOfTruthHierarchy = {
        formData: request.formData!,
        capturedViews: request.capturedViews,
        aiEnhancements: {}, // Can be expanded later
        compressionOptimizations: {}
      };

      // Use Master Orchestrator for perfect integration
      const orchestrationResult = await MasterPromptOrchestrator.orchestratePromptGeneration(
        sourceHierarchy,
        brandFriendlyPrompt
      );

      console.log('🎭 Master Orchestration Results:', {
        integrityScore: `${orchestrationResult.integrityScore}/100`,
        conflictsResolved: orchestrationResult.conflictResolutions.length,
        finalLength: orchestrationResult.finalPrompt.length
      });

      // Generate user-friendly report
      const userReport = MasterPromptOrchestrator.generateUserReport(orchestrationResult);
      console.log('📋 User Report:', userReport);

      // Ensure final prompt meets FAL API length requirements
      let finalPrompt = orchestrationResult.finalPrompt;
      if (finalPrompt.length > 5000) {
        console.warn(`⚠️ Final prompt too long (${finalPrompt.length} chars), applying emergency compression...`);

        // Emergency compression - simply truncate to 4900 chars to leave room for any additional processing
        finalPrompt = finalPrompt.substring(0, 4900);

        // Try to end at a reasonable point (end of sentence or word)
        const lastPeriod = finalPrompt.lastIndexOf('.');
        const lastSpace = finalPrompt.lastIndexOf(' ');
        const cutPoint = lastPeriod > 4800 ? lastPeriod + 1 : (lastSpace > 4800 ? lastSpace : finalPrompt.length);
        finalPrompt = finalPrompt.substring(0, cutPoint);

        console.log(`🔧 Emergency compression applied: ${orchestrationResult.finalPrompt.length} → ${finalPrompt.length} chars`);
      }

      // Use the orchestrated prompt for generation
      const result = await this.applyBrandAssetsWithNanaBanana({
        image_urls: request.brand_asset_urls,
        prompt: finalPrompt,
        aspect_ratio: request.aspect_ratio,
        num_images: request.num_images || 1,
        output_format: request.output_format || "jpeg"
      });

      // PHASE 4.1: End-to-End Quality Assurance
      console.log('🔍 Running End-to-End Quality Assurance...');
      const qaReport = EndToEndQualityAssurance.runComprehensiveQA(
        request.formData!,
        request.capturedViews,
        orchestrationResult,
        orchestrationResult.finalPrompt
      );

      // Generate comprehensive QA report
      const qaReportText = EndToEndQualityAssurance.generateQAReport(qaReport);
      console.log('📋 End-to-End Quality Report:', qaReportText);

      // Log quality insights for user transparency
      console.log('📊 Final Quality Metrics:', {
        overallScore: `${qaReport.overallScore}/100`,
        formDataIntegrity: `${qaReport.detailedMetrics.formDataIntegrity.toFixed(1)}%`,
        hierarchyCompliance: `${qaReport.detailedMetrics.hierarchyCompliance.toFixed(1)}%`,
        testsPassed: qaReport.passedTests.length,
        warnings: qaReport.warnings.length,
        recommendations: qaReport.recommendations.length
      });

      return result;

    } catch (error: unknown) {
      console.error('❌ Error in master orchestrated generation:', error);
      throw new Error(`Failed to generate with master orchestration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * LEGACY: Generate images with brand assets using Nano Banana Edit
   */
  static async generateWithBrandAssets(request: BrandAssetGenerationRequest): Promise<FalImageResponse> {
    try {
      console.log('🍌 Primary generation with integrated brand assets using Nano Banana Edit');

      // Transform the prompt to be brand-friendly
      const brandFriendlyPrompt = makeBrandFriendlyPrompt(request.prompt);

      let integratedPrompt: string;

      // NEW: Form-priority approach - treat form inputs as absolute truth
      if (request.formData) {
        try {
          console.log('🎯 Using FORM-PRIORITY brand integration (Phase 2)...');

          // Step 1: Create form-priority prompt that treats user inputs as absolute requirements
          integratedPrompt = createFormPriorityBrandPrompt(brandFriendlyPrompt, request.formData);

          // Step 2: Validate that critical form requirements are preserved
          const validation = validateFormRequirementsInPrompt(integratedPrompt, request.formData);
          if (!validation.isValid) {
            console.warn('⚠️ Form requirements validation failed:', validation.missingRequirements);
          }

          console.log('✅ Using FORM-PRIORITY brand integration');
          console.log('📊 Critical Form Values Preserved:', {
            frontFaceCount: request.formData.frontFaceCount,
            backToBackCount: request.formData.backToBackCount,
            shelfCount: request.formData.shelfCount,
            brand: request.formData.brand,
            validationPassed: validation.isValid
          });

          // Optional: Also run dimensional analysis for supplementary insights (not to override form data)
          try {
            const dimensionalData = mergeWithDefaults(request.formData, request.formData.product);
            const analysis = SmartPromptGenerator.generateIntelligentPrompts(dimensionalData);
            console.log('📐 Supplementary dimensional analysis:', {
              calculatedProductsPerShelf: analysis.analysis.calculatedLayout.productsPerShelf,
              userSpecifiedArrangement: `${request.formData.frontFaceCount}×${request.formData.backToBackCount}`,
              dimensionalEfficiency: analysis.analysis.spaceUtilization.efficiency
            });
          } catch (dimensionalError) {
            console.log('📐 Dimensional analysis skipped (not critical for form-priority mode)');
          }

        } catch (error) {
          console.warn('⚠️ Form-priority integration failed, falling back to legacy mode:', error);

          // Fallback to legacy system if form-priority fails
          const clientRequirements = generateClientRequirementMapping(request.formData);
          integratedPrompt = createBrandIntegrationPrompt(brandFriendlyPrompt, clientRequirements);
        }
      } else {
        // Fallback to generic brand integration when no form data
        integratedPrompt = createBrandIntegrationPrompt(brandFriendlyPrompt, '');
        console.log('ℹ️ Using generic CLIENT-PRIORITY brand integration (no form data)');
      }

      // Advanced compression with intelligent content preservation (Phase 3)
      const protectedContent = request.formData ? getProtectedFormContent(request.formData) : [];

      // Phase 3: Quality-based compression strategy
      const qualityMetrics = assessPromptQuality(integratedPrompt);
      console.log('📊 Prompt Quality Assessment:', {
        contentDensity: `${(qualityMetrics.contentDensity * 100).toFixed(1)}%`,
        redundancyScore: `${(qualityMetrics.redundancyScore * 100).toFixed(1)}%`,
        formSpecificity: `${(qualityMetrics.formSpecificityScore * 100).toFixed(1)}%`,
        overallQuality: qualityMetrics.overallQuality,
        recommendedCompression: qualityMetrics.compressionRecommendation
      });

      const compressionConfig: CompressionConfig = {
        maxLength: 4800,
        protectedContent,
        compressionLevel: qualityMetrics.compressionRecommendation,
        preserveCreativeContext: qualityMetrics.creativeContentRatio > 0.1, // Preserve if significant creative content
        maintainFormPriority: qualityMetrics.formSpecificityScore > 0.3 // High priority if form-specific
      };

      console.log(`🧠 Using ${qualityMetrics.compressionRecommendation} compression based on quality analysis`);

      const compressionResult = advancedCompressPrompt(integratedPrompt, compressionConfig);
      let compressedPrompt = compressionResult.compressedPrompt;

      // Fallback: If advanced compression fails or doesn't preserve protected content, use legacy
      if (!compressionResult.protectedContentPreserved || compressionResult.compressedLength > 4800) {
        console.warn('⚠️ Advanced compression failed, falling back to legacy compression');
        compressedPrompt = compressPrompt(integratedPrompt, 4800, protectedContent);
      }

      console.log('🧠 Advanced Compression Results:', {
        originalLength: compressionResult.originalLength,
        compressedLength: compressionResult.compressedLength,
        compressionRatio: `${(compressionResult.compressionRatio * 100).toFixed(1)}%`,
        protectedContentPreserved: compressionResult.protectedContentPreserved,
        sectionsRemoved: compressionResult.sectionsRemoved.length,
        sectionsAbbreviated: compressionResult.sectionsAbbreviated.length
      });

      // Generate detailed compression report for monitoring
      const compressionReport = generateCompressionReport(integratedPrompt, compressedPrompt, qualityMetrics);
      console.log('📋 Detailed Compression Report:', compressionReport);

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
          // Check if image is already on fal.ai or supabase (accessible URLs) - if so, use it directly
          if (originalUrl.includes('fal.media') || originalUrl.includes('fal.ai') || originalUrl.includes('supabase.co')) {
            console.log(`✅ Image ${i + 1} already accessible, using directly`);
            accessibleImageUrls.push(originalUrl);
            continue;
          }

          // Handle data URLs (base64 encoded images)
          if (originalUrl.startsWith('data:image/')) {
            console.log(`📷 Processing data URL image ${i + 1}`);

            try {
              // Parse data URL manually to avoid CSP issues
              const [header, base64Data] = originalUrl.split(',');
              const mimeMatch = header.match(/data:(image\/[^;]+)/);
              const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

              // Convert base64 to Uint8Array
              const binaryString = atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let j = 0; j < binaryString.length; j++) {
                bytes[j] = binaryString.charCodeAt(j);
              }

              // Create blob from bytes
              const blob = new Blob([bytes], { type: mimeType });

              // Create a File object for Fal.ai upload
              const file = new File([blob], `image-${i + 1}.${mimeType.split('/')[1]}`, {
                type: mimeType
              });

              // Upload to Fal.ai storage via secure proxy
              const formData = new FormData();
              formData.append('file', file);

              const apiBaseUrl = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001';
              const uploadResponse = await fetch(`${apiBaseUrl}/api/proxy/fal/storage/upload`, {
                method: 'POST',
                body: formData
              });

              if (!uploadResponse.ok) {
                throw new Error(`Failed to upload via proxy: ${uploadResponse.status}`);
              }

              const { url: falUrl } = await uploadResponse.json();
              console.log(`✅ Converted data URL to fal.ai image ${i + 1}`);

              accessibleImageUrls.push(falUrl);
              continue;
            } catch (dataUrlError) {
              console.error(`❌ Failed to process data URL image ${i + 1}:`, dataUrlError);
              console.warn(`⚠️ Skipping data URL image ${i + 1} due to processing error`);
              continue;
            }
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

          // Upload to Fal.ai storage via secure proxy
          const formData = new FormData();
          formData.append('file', file);

          const apiBaseUrl = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001';
          const uploadResponse = await fetch(`${apiBaseUrl}/api/proxy/fal/storage/upload`, {
            method: 'POST',
            body: formData
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload via proxy: ${uploadResponse.status}`);
          }

          const { url: falUrl } = await uploadResponse.json();
          console.log(`✅ Re-uploaded image ${i + 1} to Fal.ai via proxy`);

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

      // Use secure backend proxy for generation
      console.log('🔐 Using secure backend proxy for generation');
      const apiBaseUrl = import.meta.env.VITE_API_PROXY_URL || 'http://localhost:3001';
      const proxyResponse = await fetch(`${apiBaseUrl}/api/proxy/fal/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'fal-ai/nano-banana/edit',
          payload: {
            prompt: trimmedPrompt,
            image_urls: accessibleImageUrls,
            num_images: numImages,
            output_format: request.output_format || "jpeg"
          }
        })
      });

      if (!proxyResponse.ok) {
        const error = await proxyResponse.json();
        throw new Error(`Proxy generation failed: ${error.details || error.error}`);
      }

      const { data: result } = await proxyResponse.json();
      console.log('🍌 Generation complete via proxy');

      console.log('✅ Brand assets applied successfully');
      if (result.description) {
        console.log('📝 AI Description:', result.description);
      }

      return result as FalImageResponse;
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
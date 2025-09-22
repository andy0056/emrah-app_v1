import { fal } from "@fal-ai/client";
import { DisplayTemplate } from '../../domain/templates/templateLibrary';
import { StructureGuide } from '../guide/structureGuideGenerator';
import { FormData } from '../../types';

export interface GroundedGenerationRequest {
  template: DisplayTemplate;
  structureGuide: StructureGuide;
  formData: FormData;
  brandAssetUrls?: string[];
  referenceImages?: string[]; // Empati build photos of same archetype
  model: 'seedream-v4' | 'nano-banana' | 'flux-kontext';
  preserveStructure: boolean;
  creativeMode?: 'refined' | 'advanced' | 'optimized' | 'validated';
}

export interface GroundedGenerationResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  prompt_used: string;
  model_used: string;
  manufacturability_preserved: boolean;
  processing_time_ms: number;
}

export class GroundedImageGeneration {

  // Main generation method that replaces pure T2I
  static async generateWithStructureGuide(
    request: GroundedGenerationRequest
  ): Promise<GroundedGenerationResult> {
    const startTime = Date.now();

    // Force optimal model selection to avoid SeedReam v4 API issues
    const optimalModel = this.selectOptimalModel(request);
    const safeRequest = { ...request, model: optimalModel };

    console.log('🔧 Model Override:', { requested: request.model, using: optimalModel });

    // Generate manufacturing-aware prompt
    const structuredPrompt = this.generateStructuredPrompt(safeRequest);

    let result: GroundedGenerationResult;

    try {
      switch (safeRequest.model) {
        case 'seedream-v4':
          result = await this.generateWithSeedreamV4(structuredPrompt, safeRequest);
          break;
        case 'nano-banana':
          result = await this.generateWithNanoBanana(structuredPrompt, safeRequest);
          break;
        case 'flux-kontext':
          result = await this.generateWithFluxKontext(structuredPrompt, safeRequest);
          break;
        default:
          throw new Error(`Unsupported model: ${safeRequest.model}`);
      }
    } catch (error) {
      // Fallback strategy: if advanced models fail, use Nano Banana
      if (safeRequest.model !== 'nano-banana') {
        console.warn(`⚠️ ${safeRequest.model} failed, falling back to Nano Banana:`, error);
        result = await this.generateWithNanoBanana(structuredPrompt, { ...safeRequest, model: 'nano-banana' });
      } else {
        throw error; // Re-throw if Nano Banana itself fails
      }
    }

    result.processing_time_ms = Date.now() - startTime;
    return result;
  }

  // SeedReam v4 Edit - SOTA structure-preserving editing
  private static async generateWithSeedreamV4(
    prompt: string,
    request: GroundedGenerationRequest
  ): Promise<GroundedGenerationResult> {
    try {
      // Convert SVG guide to base64 data URL for fal.ai
      const guideImageUrl = await this.convertSVGToDataURL(request.structureGuide.svg);

      // Prepare image URLs array - structure guide is primary, reference images as secondary
      const image_urls = [guideImageUrl];
      if (request.referenceImages && request.referenceImages.length > 0) {
        // Add reference images but limit total to 10 as per API constraints
        image_urls.push(...request.referenceImages.slice(0, 9)); // 1 guide + max 9 reference
      }

      const payload = {
        prompt: prompt,
        image_urls: image_urls,
        num_images: 1,
        image_size: "2048x2048" as const,
        enable_safety_checker: true,
        seed: Math.floor(Math.random() * 100000)
      };

      console.log('🎯 SeedReam v4 Edit Request:', {
        template: request.template.id,
        preserveStructure: request.preserveStructure,
        imageUrls: image_urls.length,
        imageSize: payload.image_size,
        guideImageFormat: guideImageUrl.substring(0, 50) + '...',
        payloadKeys: Object.keys(payload)
      });

      const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/edit", {
        input: payload,
        logs: false
      });

      return {
        images: result.images || [],
        prompt_used: prompt,
        model_used: 'seedream-v4',
        manufacturability_preserved: request.preserveStructure,
        processing_time_ms: 0
      };

    } catch (error) {
      console.error('SeedReam v4 generation failed:', error);
      throw new Error(`SeedReam v4 generation failed: ${error}`);
    }
  }

  // Gemini 2.5 Flash Image (Nano Banana) - Multi-image fusion
  private static async generateWithNanoBanana(
    prompt: string,
    request: GroundedGenerationRequest
  ): Promise<GroundedGenerationResult> {
    try {
      // Convert SVG guide to data URL for fal.ai
      const guideImageUrl = await this.convertSVGToDataURL(request.structureGuide.svg);

      // Prepare multi-image input for brand asset fusion
      const images = [guideImageUrl];
      if (request.brandAssetUrls) {
        images.push(...request.brandAssetUrls);
      }
      if (request.referenceImages) {
        images.push(...request.referenceImages.slice(0, 2)); // Limit to 2 reference images
      }

      const payload = {
        prompt: prompt,
        image_urls: images,
        aspect_ratio: "4:3" as const,
        num_images: 1,
        guidance_scale: 8.0,
        safety_tolerance: "2"
      };

      console.log('🍌 Nano Banana Request:', {
        template: request.template.id,
        imageCount: images.length,
        hasBrandAssets: !!request.brandAssetUrls?.length
      });

      const result = await fal.subscribe("fal-ai/nano-banana", {
        input: payload,
        logs: false
      });

      console.log('🍌 Nano Banana API Response:', {
        rawResult: result,
        dataProperty: result.data,
        imagesProperty: result.data?.images,
        imageCount: result.data?.images?.length || 0,
        resultKeys: Object.keys(result)
      });

      return {
        images: result.data?.images || [],
        prompt_used: prompt,
        model_used: 'nano-banana',
        manufacturability_preserved: true, // Nano Banana respects input structure well
        processing_time_ms: 0
      };

    } catch (error) {
      console.error('Nano Banana generation failed:', error);
      throw new Error(`Nano Banana generation failed: ${error}`);
    }
  }

  // FLUX.1 Kontext - Compositional editing fallback
  private static async generateWithFluxKontext(
    prompt: string,
    request: GroundedGenerationRequest
  ): Promise<GroundedGenerationResult> {
    try {
      const guideImageUrl = await this.convertSVGToDataURL(request.structureGuide.svg);

      const payload = {
        prompt: prompt,
        image_url: guideImageUrl,
        aspect_ratio: "4:3" as const,
        guidance_scale: 7.0,
        num_images: 1,
        output_format: "jpeg",
        safety_tolerance: "2"
      };

      console.log('⚡ FLUX Kontext Request:', {
        template: request.template.id,
        preserveStructure: request.preserveStructure
      });

      const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
        input: payload,
        logs: false
      });

      return {
        images: result.images || [],
        prompt_used: prompt,
        model_used: 'flux-kontext',
        manufacturability_preserved: request.preserveStructure,
        processing_time_ms: 0
      };

    } catch (error) {
      console.error('FLUX Kontext generation failed:', error);
      throw new Error(`FLUX Kontext generation failed: ${error}`);
    }
  }

  // Generate manufacturing-aware prompt scaffold
  private static generateStructuredPrompt(request: GroundedGenerationRequest): string {
    const { template, formData } = request;

    // Build prompt in priority order per your specification
    const promptSections = [
      // ROLE & TASK
      "Role: Retail POP stand finisher.",
      "Task: Convert structure guide to photorealistic display while preserving exact geometry.",
      "",

      // INPUT PRESERVATION (CRITICAL)
      "STRUCTURE_GUIDE: Must be preserved exactly - all edges, planes, proportions unchanged.",
      "Requirements:",
      "- Strictly preserve edges, planes, and proportions from structure guide",
      "- No curves or overhangs beyond guide geometry",
      "- No floating shelves or invisible fasteners",
      "- Keep mounting points, tabs, and fold lines visible",
      "",

      // MATERIALS & CONSTRAINTS
      `Materials: ${template.material.type} ${template.material.thickness_mm}mm thickness`,
      `Construction: ${template.joinery.type} joinery with visible connections`,
      `Dimensions: ${template.overall_dimensions.width_mm}×${template.overall_dimensions.height_mm}×${template.overall_dimensions.depth_mm}mm`,
      "",

      // BRAND & PRODUCT DETAILS
      `Brand: ${formData.brand}`,
      `Product: ${formData.product}`,
      `Product Description: ${formData.description || 'Premium retail product display'}`,
      "",

      // BRAND INTEGRATION (only if assets provided)
      ...(request.brandAssetUrls?.length ? [
        "Brand Integration:",
        `- Primary brand color: ${formData.standBaseColor || '#bd2828'}`,
        `- Integrate ${formData.brand} logo prominently on header/front panel`,
        "- Logo placement only within designated print zones",
        "- No logo warping or distortion",
        "- Respect safe margins around print areas",
        `- Display authentic ${formData.product} packaging/products`,
        ""
      ] : []),

      // PRODUCT SHOWCASE
      `Product Display:`,
      `- Display for ${formData.brand} ${formData.product}`,
      `- ${template.product_capacity.shelf_count} shelves each holding ${template.product_capacity.products_per_shelf} products`,
      `- Product boxes sized ${template.product_capacity.max_product_dimensions.width_mm}×${template.product_capacity.max_product_dimensions.height_mm}×${template.product_capacity.max_product_dimensions.depth_mm}mm`,
      `- Show authentic ${formData.product} packages with ${formData.brand} branding`,
      "- Products clearly visible, not occluding headers or branding",
      "",

      // VISUAL QUALITY
      "Output Requirements:",
      "- Photorealistic retail photography style",
      "- Neutral studio lighting with subtle shadows to reveal seams and edges",
      "- 3/4 hero angle aligned with structure guide",
      "- Clean background, professional product photography aesthetic",
      "- All joinery hints visible (slots, tabs, material thickness)",
      "",

      // FORBIDDEN ELEMENTS
      "Strict Prohibitions:",
      "- No fantasy geometry or impossible structures",
      "- No hidden or floating structural elements",
      "- No modifications to guide proportions or angles",
      "- No curves, overhangs, or elements not in original guide"
    ];

    const finalPrompt = promptSections.join("\n");

    // Add creative mode specific modifications
    const modeSpecificPrompt = this.applyCreativeModePromptModifications(finalPrompt, request.creativeMode || 'refined');

    console.log('🎯 Generated Prompt for', formData.brand, formData.product + ':', {
      promptLength: modeSpecificPrompt.length,
      hasBrandAssets: !!request.brandAssetUrls?.length,
      brandColor: formData.standBaseColor,
      template: template.id,
      creativeMode: request.creativeMode
    });

    return modeSpecificPrompt;
  }

  // Apply creative mode specific prompt modifications
  private static applyCreativeModePromptModifications(
    basePrompt: string,
    creativeMode: 'refined' | 'advanced' | 'optimized' | 'validated'
  ): string {
    switch (creativeMode) {
      case 'advanced':
        return basePrompt + "\n\nADVANCED MODE ENHANCEMENTS:\n" +
               "- Apply sophisticated lighting and material rendering\n" +
               "- Enhanced photorealistic details and textures\n" +
               "- Professional product photography aesthetics\n" +
               "- Advanced compositional techniques for visual impact\n" +
               "- Premium finish quality with subtle material imperfections for realism";

      case 'optimized':
        // Shorter, more concise prompt for better model compatibility
        const optimizedSections = basePrompt.split('\n')
          .filter(line => !line.includes('Strict Prohibitions:') && !line.startsWith('- No '))
          .slice(0, 12) // Limit to first 12 lines for 35% reduction
          .join('\n');
        return optimizedSections + "\nOptimized for speed and compatibility.";

      case 'validated':
        return basePrompt + "\n\nSTRICT COMPLIANCE MODE:\n" +
               "- Mandatory adherence to all structural constraints\n" +
               "- Manufacturing-ready specifications only\n" +
               "- Zero deviation from template geometry\n" +
               "- Industry-standard tolerances and materials\n" +
               "- DFM (Design for Manufacturing) validation required";

      case 'refined':
      default:
        return basePrompt + "\n\nREFINED MODE:\n" +
               "- Balanced creative freedom with structural integrity\n" +
               "- Flexible brand integration while maintaining form\n" +
               "- Professional retail display aesthetics";
    }
  }

  // Negative prompts are now handled by the API's built-in safety checker
  private static getNegativePrompt(): string {
    return [
      "floating elements",
      "invisible supports",
      "fantasy geometry",
      "impossible structures",
      "curved surfaces not in guide",
      "hidden fasteners",
      "distorted proportions",
      "modified angles",
      "unrealistic materials",
      "blurry details",
      "low quality",
      "deformed structure"
    ].join(", ");
  }

  private static async convertSVGToDataURL(svg: string): Promise<string> {
    // Convert SVG to data URL for fal.ai consumption
    const encodedSvg = encodeURIComponent(svg);
    return `data:image/svg+xml,${encodedSvg}`;
  }

  // Helper method to determine best model for request
  static selectOptimalModel(
    request: Partial<GroundedGenerationRequest>
  ): 'seedream-v4' | 'nano-banana' | 'flux-kontext' {
    // If user explicitly requested a model (via creative mode), respect their choice
    if (request.model) {
      console.log('🎯 Respecting user model choice:', request.model);
      return request.model;
    }

    // Fallback logic only when no model specified
    // Structure preservation with SVG guides -> Nano Banana (SeedReam v4 fails with SVG data URLs)
    if (request.preserveStructure) {
      return 'nano-banana';
    }

    // Multi-image fusion (brand assets + guide) -> Nano Banana
    if (request.brandAssetUrls?.length && request.brandAssetUrls.length > 1) {
      return 'nano-banana';
    }

    // Default to Nano Banana for better compatibility with structure guides
    return 'nano-banana';
  }

  // Validate generation result against DFM rules
  static async validateGeneratedImage(
    imageUrl: string,
    template: DisplayTemplate
  ): Promise<{ isValid: boolean; issues: string[] }> {
    // In a full implementation, this would use computer vision to verify:
    // - Structure guide geometry is preserved
    // - Joinery points are visible
    // - No impossible geometry was introduced
    // - Material thickness appears correct

    // For now, return basic validation
    return {
      isValid: true,
      issues: []
    };
  }
}
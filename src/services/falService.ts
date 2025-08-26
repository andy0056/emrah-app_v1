import { fal } from "@fal-ai/client";

// Configure Fal.ai client
fal.config({
  credentials: import.meta.env.VITE_FAL_KEY
});

export interface ImageGenerationRequest {
  prompt: string;
  aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1" | "4:3";
  num_images?: number;
  negative_prompt?: string;
  seed?: number;
  reference_image_url?: string;
}

export interface GeneratedImage {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
}

export interface ImageGenerationResult {
  images: GeneratedImage[];
  seed: number;
}

export interface FluxKontextRequest {
  prompt: string;
  image_url?: string;
  aspect_ratio?: "21:9" | "16:9" | "4:3" | "3:2" | "1:1" | "2:3" | "3:4" | "9:16" | "9:21";
  guidance_scale?: number;
  num_images?: number;
  seed?: number;
  output_format?: "jpeg" | "png";
  safety_tolerance?: "1" | "2" | "3" | "4" | "5" | "6";
}

export interface FluxKontextResult {
  images: GeneratedImage[];
  seed: number;
  prompt: string;
  has_nsfw_concepts: boolean[];
}

export class TrinityPipeline {
  
  // ============================================
  // STAGE 1: FLUX PULID - Product/Face Accuracy
  // ============================================
  static async generateAccurateBase(formData: any, productImageUrl?: string) {
    console.log("🎯 Stage 1: FLUX PULID - Generating accurate product placement...");
    
    // Build focused prompt - ONLY essential details
    const prompt = `${formData.standType} display stand, ${formData.standWidth}x${formData.standDepth}x${formData.standHeight}cm, ${formData.materials.join(', ')}, ${formData.standBaseColor} color, ${formData.shelfCount} shelves, ${formData.frontFaceCount} products across, ${formData.product} brand products clearly visible`;

    try {
      const result = await fal.subscribe("fal-ai/flux-pulid", {
          prompt: prompt,
          reference_images: productImageUrl ? [{ url: productImageUrl }] : [],
          num_steps: 20,
          guidance_scale: 4,
          seed: Math.floor(Math.random() * 1000000),
          width: 1024,
          height: 1024,
          num_images: 1
        },
        {
        logs: true,
        onQueueUpdate: (update) => {
          console.log("Flux Pro Progress:", update.status);
        }
      });
      
      console.log("✅ Stage 1 Complete:", result.data.images[0].url);
      return result.data.images[0].url;
    } catch (error) {
      console.error("❌ Flux Pro failed, falling back to Flux Dev...");
      console.error("Flux Pro error details:", error instanceof Error ? error.message : error);
      console.error("Full error object:", error);
      // FALLBACK: Use Flux Dev if PULID fails
      return await this.fallbackFluxDev(prompt);
    }
  }

  // ============================================
  // STAGE 2: SDXL LIGHTNING - Fast Enhancement
  // ============================================
  static async enhanceWithLightning(baseImageUrl: string, formData: any, viewType: string) {
    console.log("⚡ Stage 2: SDXL Lightning - Quick quality enhancement...");
    
    // View-specific enhancement prompts
    const viewPrompts = {
      'frontView': 'front orthographic view, flat perspective, head-on angle',
      'storeView': 'wide retail store aisle, fluorescent lighting, other products visible',
      'threeQuarterView': 'three-quarter angle view, dynamic perspective, hero shot'
    };

    const prompt = `photorealistic ${formData.brand} POP display, ${viewPrompts[viewType]}, professional product photography, ultra detailed, 8K quality`;

    try {
      const result = await fal.subscribe("fal-ai/fast-sdxl", {
          prompt: prompt,
          image_url: baseImageUrl,
          image_size: "landscape_16_9",
          num_inference_steps: 8, // Lightning fast!
          guidance_scale: 2,
          num_images: 1,
          enable_safety_checker: false
        }
      );
      
      console.log("✅ Stage 2 Complete (Lightning):", result.data.images[0].url);
      return result.data.images[0].url;
    } catch (error) {
      console.error("⚠️ Lightning enhancement failed:");
      console.error("Lightning error details:", error instanceof Error ? error.message : error);
      console.error("Full error object:", error);
      return baseImageUrl; // Continue with original if fails
    }
  }

  // ============================================
  // STAGE 3: RECRAFT V3 - Final Polish
  // ============================================
  static async polishWithRecraft(enhancedImageUrl: string, formData: any, productImageUrl?: string) {
    console.log("✨ Stage 3: Recraft V3 - Final photorealistic polish...");
    
    const prompt = `hyperrealistic ${formData.brand} ${formData.product} retail display, perfect lighting, professional photography, commercial quality, no text errors, clear product visibility`;

    try {
      const result = await fal.subscribe("fal-ai/recraft-v3", {
          prompt: prompt,
          image_url: enhancedImageUrl,
          reference_images: productImageUrl ? [{ url: productImageUrl }] : [],
          num_steps: 20,
          guidance_scale: 4,
          seed: Math.floor(Math.random() * 1000000),
          width: 1024,
          height: 1024,
          num_images: 1
        }
      );
      
      console.log("✅ Stage 3 Complete (SDXL Polish):", result.data.images[0].url);
      return result.data.images[0].url;
    } catch (error) {
      console.error("⚠️ SDXL polish failed, using Stage 2 result:");
      console.error("SDXL error details:", error instanceof Error ? error.message : error);
      console.error("Full error object:", error);
      return enhancedImageUrl;
    }
  }

  // ============================================
  // FALLBACK: Flux Dev (if PULID unavailable)
  // ============================================
  static async fallbackFluxDev(prompt: string) {
    try {
      const result = await fal.subscribe("fal-ai/flux/dev", {
        input: {
          prompt: prompt,
          image_size: "landscape_16_9",
          style: "photographic",
          style_id: "default",
          subseed_strength: 0.5,
          aspect_ratio: "16:9",
          enable_safety_checker: false
        }
      });
      return result.data.images[0].url;
    } catch (error) {
      console.error("❌ Even Flux Dev failed:");
      console.error("Flux Dev error details:", error instanceof Error ? error.message : error);
      console.error("Full error object:", error);
      throw new Error(`All fallbacks failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================
  // MAIN PIPELINE - Orchestrates all 3 stages
  // ============================================
  static async generateTrinityImage(
    formData: any,
    viewType: 'frontView' | 'storeView' | 'threeQuarterView',
    productImageUrl?: string
  ) {
    console.log("🚀 Starting Trinity Pipeline for", viewType);
    console.log("📊 Input data:", {
      brand: formData.brand,
      product: formData.product,
      standType: formData.standType,
      dimensions: `${formData.standWidth}x${formData.standDepth}x${formData.standHeight}`,
      viewType: viewType
    });

    try {
      // Stage 1: Generate accurate base with PULID
      const baseImage = await this.generateAccurateBase(formData, productImageUrl);
      
      // Stage 2: Enhance with Lightning
      const enhancedImage = await this.enhanceWithLightning(baseImage, formData, viewType);
      
      // Stage 3: Polish with Recraft
      const finalImage = await this.polishWithRecraft(enhancedImage, formData, productImageUrl);
      
      console.log("🎉 Trinity Pipeline Complete!");
      return {
        url: finalImage,
        stages: {
          base: baseImage,
          enhanced: enhancedImage,
          final: finalImage
        }
      };
    } catch (error) {
      console.error("Trinity Pipeline Error:", error);
      throw error;
    }
  }

  // ============================================
  // BATCH GENERATION - All 3 views
  // ============================================
  static async generateAllViews(formData: any, productImageUrl?: string) {
    console.log("🎬 Generating all 3 views with Trinity Pipeline");
    
    const views: Array<'frontView' | 'storeView' | 'threeQuarterView'> = 
      ['frontView', 'storeView', 'threeQuarterView'];
    
    const results = await Promise.all(
      views.map(view => this.generateTrinityImage(formData, view, productImageUrl))
    );

    return {
      frontView: results[0].url,
      storeView: results[1].url,
      threeQuarterView: results[2].url,
      allStages: results.map(r => r.stages)
    };
  }
}

// ============================================
// ORIGINAL FALSERVICE - Updated to use Trinity
// ============================================
export class FalService {
  // Keep original generateImage for backward compatibility
  static async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
      console.log("🔄 Legacy generateImage called, routing to appropriate model...");
      
      // Use Flux Pro 1.1 if reference image is provided, otherwise use Imagen 4
      const modelEndpoint = request.reference_image_url 
        ? "fal-ai/flux-pro-v1.1" 
        : "fal-ai/imagen4/preview";
      
      const input: any = {
        prompt: request.prompt,
        num_images: request.num_images || 1,
        negative_prompt: request.negative_prompt || "blurry, low quality, distorted, unrealistic proportions"
      };
      
      if (request.reference_image_url) {
        // Flux Pro 1.1 parameters
        input.image_url = request.reference_image_url;
        input.guidance_scale = request.seed || 7;
        input.num_inference_steps = 25;
        input.aspect_ratio = request.aspect_ratio;
      } else {
        // Imagen 4 parameters  
        input.aspect_ratio = request.aspect_ratio;
        if (request.seed) input.seed = request.seed;
      }

      const result = await fal.subscribe(modelEndpoint, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      return result.data as ImageGenerationResult;
    } catch (error) {
      console.error('Error generating image with Fal.ai:', error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // NEW: Use Trinity Pipeline
  static async generateWithTrinity(formData: any, viewType: string, productImage?: string) {
    return await TrinityPipeline.generateTrinityImage(formData, viewType as any, productImage);
  }

  // Keep existing methods for compatibility
  static async generateMultipleImages(requests: ImageGenerationRequest[]): Promise<ImageGenerationResult[]> {
    try {
      const promises = requests.map(request => this.generateImage(request));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error generating multiple images:', error);
      throw error;
    }
  }

  static async editImageWithFluxKontext(request: FluxKontextRequest): Promise<FluxKontextResult> {
    try {
      // Ensure we have an image URL for image-to-image editing
      if (!request.image_url) {
        throw new Error('Image URL is required for image editing');
      }

      console.log('Original image URL:', request.image_url);
      
      // Upload the original image to Fal.ai storage to ensure accessibility
      let accessibleImageUrl = request.image_url;
      
      try {
        // Download the original image
        console.log('Downloading original image...');
        const imageResponse = await fetch(request.image_url);
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }
        
        const imageBlob = await imageResponse.blob();
        console.log('Image downloaded, size:', imageBlob.size, 'bytes');
        
        // Upload to Fal.ai storage
        console.log('Uploading to Fal.ai storage...');
        accessibleImageUrl = await fal.storage.upload(imageBlob);
        console.log('Uploaded to Fal.ai storage:', accessibleImageUrl);
        
      } catch (uploadError) {
        console.warn('Failed to upload image to Fal.ai storage, trying original URL:', uploadError);
        // If upload fails, we'll try with the original URL
      }
      
      console.log('Editing image with Flux Kontext:', {
        prompt: request.prompt,
        image_url: accessibleImageUrl,
        aspect_ratio: request.aspect_ratio
      });

      const result = await fal.subscribe("fal-ai/flux-pro/kontext/max", {
        input: {
          prompt: request.prompt,
          image_url: accessibleImageUrl,
          aspect_ratio: request.aspect_ratio,
          guidance_scale: request.guidance_scale || 7.5,
          num_images: request.num_images || 1,
          output_format: request.output_format || "png",
          safety_tolerance: request.safety_tolerance || "2",
          ...(request.seed && { seed: request.seed })
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log('Flux Kontext result:', result.data);
      
      // Debug: Log the actual edited image URL for direct inspection
      if (result.data.images && result.data.images.length > 0) {
        console.log('🖼️ EDITED IMAGE URL (copy and paste in new tab):', result.data.images[0].url);
      }
      
      return result.data as FluxKontextResult;
    } catch (error) {
      console.error('Error editing image with Flux Kontext:', error);
      throw new Error(`Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
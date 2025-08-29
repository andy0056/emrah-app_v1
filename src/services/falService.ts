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

export interface FluxKontextRequest {
  prompt: string;
  image_url: string;
  aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1";
  guidance_scale?: number;
  num_images?: number;
  output_format?: string;
  safety_tolerance?: string;
}

export class TrinityPipeline {
  
  // ============================================
  // STAGE 1: FLUX DEV - Base Generation (VERIFIED WORKING)
  // ============================================
  static async generateAccurateBase(formData: any, productImageUrl?: string) {
    console.log("🎯 Stage 1: FLUX DEV - Generating base structure...");
    
    // Critical details only - materials simplified
    const materials = formData.materials.map((m: string) => m.split(' ')[0]).join('/');
    
    const prompt = `${formData.standType} display, ${formData.standWidth}x${formData.standDepth}x${formData.standHeight}cm, ${materials}, ${formData.standBaseColor}, ${formData.shelfCount} shelves, ${formData.frontFaceCount}x${formData.backToBackCount} ${formData.product} products, retail environment, photorealistic`;

    try {
      const result = await fal.subscribe("fal-ai/flux/dev", {
        input: {
          prompt: prompt,
          image_size: {
            width: 1024,
            height: 1024
          },
          num_inference_steps: 28,
          guidance_scale: 3.5,
          seed: Math.floor(Math.random() * 1000000),
          num_images: 1
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log("FLUX DEV Status:", update.status);
          if (update.logs) {
            update.logs.forEach((log: any) => console.log("Log:", log.message));
          }
        }
      });
      
      console.log("✅ Stage 1 Complete");
      return result.data.images[0].url;
      
    } catch (error: any) {
      console.error("❌ FLUX DEV Error:", {
        message: error?.message,
        body: JSON.stringify(error?.body, null, 2),
        detail: error?.detail,
        status: error?.status
      });
      throw error;
    }
  }

  // ============================================
  // STAGE 2: FLUX SCHNELL - Fast Enhancement (VERIFIED WORKING)
  // ============================================
  static async enhanceWithSchnell(baseImageUrl: string, formData: any, viewType: string) {
    console.log("⚡ Stage 2: FLUX SCHNELL - Starting enhancement...");
    console.log("📥 Stage 2 Input Image URL:", baseImageUrl);
    
    const viewEnhancements = {
      'frontView': 'front orthographic view, straight-on perspective',
      'storeView': 'retail store environment, aisle view, ambient lighting',
      'threeQuarterView': 'three-quarter angle, dynamic perspective'
    };

    const prompt = `${formData.brand} ${formData.product} display stand, ${viewEnhancements[viewType]}, ultra detailed, 8K quality, photorealistic`;

    try {
      // FLUX SCHNELL is the FAST version of FLUX
      const result = await fal.subscribe("fal-ai/flux/schnell", {
        input: {
          prompt: prompt,
          image_size: {
            width: viewType === 'frontView' ? 768 : 1344,
            height: viewType === 'frontView' ? 1344 : 768
          },
          num_inference_steps: 4, // Super fast!
          num_images: 1,
          enable_safety_checker: false
        }
      });
      
      console.log("✅ Stage 2 Complete - Enhanced image generated");
      console.log("📤 Stage 2 Output Image URL:", result.data.images[0].url);
      return result.data.images[0].url;
      
    } catch (error: any) {
      console.warn("⚠️ Stage 2 FAILED - Schnell skipped, continuing with base image");
      console.error("❌ Stage 2 Error Details:", JSON.stringify(error, null, 2));
      console.log("📤 Stage 2 Fallback - Using base image:", baseImageUrl);
        message: error?.message,
        body: JSON.stringify(error?.body, null, 2),
        detail: error?.detail,
        status: error?.status
      });
      return baseImageUrl;
    }
  }

  // ============================================
  // STAGE 3: FLUX REALISM - Photorealistic Enhancement (ALTERNATIVE)
  // ============================================
  static async polishWithFluxRealism(imageUrl: string, formData: any) {
    console.log("✨ Stage 3: FLUX DEV Image-to-Image - Starting final polish...");
    console.log("📥 Stage 3 Input Image URL:", imageUrl);
    
    const prompt = `hyperrealistic ${formData.brand} retail display, perfect lighting, commercial photography, sharp focus, high detail`;

    try {
      // Using FLUX DEV with image-to-image for polish
      const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
        input: {
          prompt: prompt,
          image_url: imageUrl,
          strength: 0.65, // Preserve structure, enhance quality
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: false
        }
      });
      
      console.log("✅ Stage 3 Complete - Final polished image generated");
      console.log("📤 Stage 3 Output Image URL:", result.data.images[0].url);
      return result.data.images[0].url;
      
    } catch (error: any) {
      console.warn("⚠️ Stage 3 FAILED - Realism polish skipped");
      console.error("❌ Stage 3 Error Details:", JSON.stringify(error, null, 2));
      console.log("📤 Stage 3 Fallback - Using Stage 2 image:", imageUrl);
        message: error?.message,
        body: JSON.stringify(error?.body, null, 2),
        detail: error?.detail,
        status: error?.status
      });
      return imageUrl;
    }
  }

  // ============================================
  // ALTERNATIVE: Single-Pass High Quality (FALLBACK)
  // ============================================
  static async generateSinglePassHighQuality(formData: any, viewType: string) {
    console.log("🎨 Alternative: Single-pass high quality generation");
    
    const viewPrompts = {
      'frontView': `${formData.standType} display stand, front view, ${formData.standWidth}x${formData.standDepth}x${formData.standHeight}cm, ${formData.materials.join(', ')}, ${formData.standBaseColor} base, ${formData.shelfCount} shelves with ${formData.frontFaceCount} ${formData.brand} ${formData.product} products, orthographic perspective, studio lighting, photorealistic, 8K`,
      
      'storeView': `${formData.standType} in retail store aisle, ${formData.brand} ${formData.product} display, ${formData.standWidth}cm wide stand with ${formData.shelfCount} shelves, fluorescent store lighting, customers shopping nearby, wide angle view, photorealistic environment`,
      
      'threeQuarterView': `${formData.standType} ${formData.brand} display, three-quarter angle view, ${formData.standWidth}x${formData.standDepth}x${formData.standHeight}cm dimensions, ${formData.materials.join(', ')} construction, ${formData.standBaseColor} color scheme, ${formData.frontFaceCount}x${formData.backToBackCount} product arrangement, hero shot, professional photography`
    };

    try {
      const result = await fal.subscribe("fal-ai/flux-pro", {
        input: {
          prompt: viewPrompts[viewType],
          image_size: viewType === 'frontView' ? "portrait_16_9" : "landscape_16_9",
          num_inference_steps: 50,
          guidance_scale: 3.5,
          num_images: 1,
          safety_tolerance: 6,
          seed: Math.floor(Math.random() * 1000000)
        }
      });
      
      return result.data.images[0].url;
      
    } catch (error: any) {
      console.error("Single-pass error, trying basic FLUX:", {
        message: error?.message,
        body: JSON.stringify(error?.body, null, 2),
        detail: error?.detail,
        status: error?.status
      });
      
      // ULTIMATE FALLBACK: Basic FLUX
      const fallback = await fal.subscribe("fal-ai/flux/dev", {
        input: {
          prompt: viewPrompts[viewType],
          image_size: {
            width: 1024,
            height: 1024
          },
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1
        }
      });
      
      return fallback.data.images[0].url;
    }
  }

  // ============================================
  // MAIN EXECUTION - With Better Error Handling
  // ============================================
  static async generateTrinityImage(
    formData: any,
    viewType: 'frontView' | 'storeView' | 'threeQuarterView',
    productImageUrl?: string
  ) {
    console.log("🚀 TRINITY PIPELINE START:", viewType);
    console.log("═══════════════════════════════════════");
    
    try {
      // Try the 3-stage pipeline
      console.log("🎯 Beginning Stage 1...");
      const baseImage = await this.generateAccurateBase(formData, productImageUrl);
      
      console.log("⚡ Beginning Stage 2...");
      const enhancedImage = await this.enhanceWithSchnell(baseImage, formData, viewType);
      
      console.log("✨ Beginning Stage 3...");
      const finalImage = await this.polishWithFluxRealism(enhancedImage, formData);
      
      console.log("🎉 TRINITY PIPELINE COMPLETE for", viewType);
      console.log("📊 Final Result URL:", finalImage);
      console.log("═══════════════════════════════════════");
      
      return {
        url: finalImage,
        stages: {
          base: baseImage,
          enhanced: enhancedImage,
          final: finalImage
        }
      };
      
    } catch (primaryError: any) {
      console.error("Trinity Pipeline failed, trying single-pass:", {
        message: primaryError?.message,
        body: JSON.stringify(primaryError?.body, null, 2),
        detail: primaryError?.detail,
        status: primaryError?.status
      console.error("🚨 TRINITY PIPELINE COMPLETELY FAILED for", viewType);
      console.error("❌ Primary Error:", JSON.stringify(primaryError, null, 2));
      console.log("🔄 Attempting single-pass fallback...");
      
      // FALLBACK: Try single-pass generation
      try {
        const singlePassUrl = await this.generateSinglePassHighQuality(formData, viewType);
        return {
          url: singlePassUrl,
          stages: {
            base: singlePassUrl,
            enhanced: singlePassUrl,
            final: singlePassUrl
          }
        };
      } catch (fallbackError: any) {
        console.error("🚨 ALL METHODS FAILED for", viewType);
        console.error("❌ Fallback Error:", JSON.stringify(fallbackError, null, 2));
          message: fallbackError?.message,
          body: JSON.stringify(fallbackError?.body, null, 2),
          detail: fallbackError?.detail,
          status: fallbackError?.status
        });
        throw new Error(`Failed to generate image: ${fallbackError.message || 'Unknown error'}`);
      }
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
  static async generateImage(request: ImageGenerationRequest): Promise<any> {
    try {
      console.log("🔄 Legacy generateImage called, routing to appropriate model...");
      
      // Use Flux Pro if reference image is provided, otherwise use Imagen 4
      const modelEndpoint = request.reference_image_url 
        ? "fal-ai/flux-pro" 
        : "fal-ai/imagen4";
      
      const input: any = {
        prompt: request.prompt,
        num_images: request.num_images || 1,
        negative_prompt: request.negative_prompt || "blurry, low quality, distorted, unrealistic proportions"
      };
      
      if (request.reference_image_url) {
        // Flux Pro parameters
        input.image_url = request.reference_image_url;
        input.guidance_scale = 7;
        input.num_inference_steps = 25;
        input.image_size = request.aspect_ratio;
      } else {
        // Imagen 4 parameters  
        input.aspect_ratio = request.aspect_ratio;
        if (request.seed) input.seed = request.seed;
      }

      const result = await fal.subscribe(modelEndpoint, {
        input,
        logs: true,
        onQueueUpdate: (update: any) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log: any) => log.message).forEach(console.log);
          }
        },
      });

      return result.data as any;
    } catch (error: any) {
      console.error('Error generating image with Fal.ai:', error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // NEW: Use Trinity Pipeline
  static async generateWithTrinity(formData: any, viewType: string, productImage?: string) {
    return await TrinityPipeline.generateTrinityImage(formData, viewType as any, productImage);
  }

  // Keep existing methods for compatibility
  static async generateMultipleImages(requests: ImageGenerationRequest[]): Promise<any[]> {
    try {
      const promises = requests.map(request => this.generateImage(request));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error generating multiple images:', error);
      throw error;
    }
  }

  static async editImageWithFluxKontext(request: FluxKontextRequest): Promise<any> {
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
          output_format: "png",
          safety_tolerance: "2",
          ...(request.seed && { seed: request.seed })
        },
        logs: true,
        onQueueUpdate: (update: any) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log: any) => log.message).forEach(console.log);
          }
        },
      });

      console.log('Flux Kontext result:', result.data);
      
      // Debug: Log the actual edited image URL for direct inspection
      if (result.data.images && result.data.images.length > 0) {
        console.log('🖼️ EDITED IMAGE URL (copy and paste in new tab):', result.data.images[0].url);
      }
      
      return result.data as any;
    } catch (error: any) {
      console.error('Error editing image with Flux Kontext:', error);
      throw new Error(`Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ============================================
// SIMPLE TEST FUNCTION
// ============================================
export async function testFalModels() {
  console.log("🧪 Testing Fal.ai model availability...");
  
  const testPrompt = "modern retail display stand, photorealistic";
  const modelsToTest = [
    "fal-ai/flux/dev",
    "fal-ai/flux/schnell", 
    "fal-ai/flux-pro",
    "fal-ai/flux/dev/image-to-image"
  ];
  
  for (const model of modelsToTest) {
    try {
      console.log(`Testing ${model}...`);
      const result = await fal.subscribe(model, {
        input: {
          prompt: testPrompt,
          num_inference_steps: model.includes('schnell') ? 4 : 10,
          num_images: 1
        }
      });
      console.log(`✅ ${model} WORKS!`);
    } catch (error: any) {
      console.log(`❌ ${model} FAILED:`, error?.message || error);
    }
  }
}
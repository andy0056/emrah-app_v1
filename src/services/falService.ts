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

export class FalService {
  
  // SIMPLE, SINGLE MODEL APPROACH - FLUX DEV WORKS AND IT'S GOOD
  static async generateImage(request: ImageGenerationRequest): Promise<any> {
    try {
      console.log("🎯 Using FLUX DEV for reliable generation");
      console.log("📝 Prompt:", request.prompt);
      console.log("📐 Aspect ratio:", request.aspect_ratio);
      
      // Use FLUX DEV - IT WORKS AND IT'S GOOD
      const result = await fal.subscribe("fal-ai/flux/dev", {
        input: {
          prompt: request.prompt,
          image_size: this.getImageSize(request.aspect_ratio),
          num_inference_steps: 28,
          guidance_scale: 7.5, // Higher for better prompt adherence
          num_images: request.num_images || 1,
          enable_safety_checker: false
        },
        logs: true,
        onQueueUpdate: (update: any) => {
          console.log("FLUX DEV Progress:", update.status);
          if (update.logs) {
            update.logs.forEach((log: any) => console.log("Log:", log.message));
          }
        }
      });

      console.log("✅ FLUX DEV generation complete");
      return {
        images: result.data.images,
        seed: result.data.seed || 0
      };
    } catch (error: any) {
      console.error('❌ FLUX DEV generation failed:', error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static getImageSize(aspectRatio: string) {
    const sizes = {
      "9:16": { width: 768, height: 1344 },
      "16:9": { width: 1344, height: 768 },
      "3:4": { width: 896, height: 1152 },
      "4:3": { width: 1152, height: 896 },
      "1:1": { width: 1024, height: 1024 }
    };
    return sizes[aspectRatio as keyof typeof sizes] || sizes["1:1"];
  }

  // Keep existing methods for backward compatibility
  static async generateMultipleImages(requests: ImageGenerationRequest[]): Promise<any[]> {
    try {
      const promises = requests.map(request => this.generateImage(request));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error generating multiple images:', error);
      throw error;
    }
  }

  // For image editing - keep it simple but working
  static async editImageWithFluxKontext(request: FluxKontextRequest): Promise<any> {
    try {
      // Ensure we have an image URL for image-to-image editing
      if (!request.image_url) {
        throw new Error('Image URL is required for image editing');
      }

      console.log('🎨 Editing image with Flux Kontext');
      console.log('Original image URL:', request.image_url);
      
      // Upload the original image to Fal.ai storage to ensure accessibility
      let accessibleImageUrl = request.image_url;
      
      try {
        // Download the original image
        console.log('📥 Downloading original image...');
        const imageResponse = await fetch(request.image_url);
        
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.status}`);
        }
        
        const imageBlob = await imageResponse.blob();
        console.log('✅ Image downloaded, size:', imageBlob.size, 'bytes');
        
        // Upload to Fal.ai storage
        console.log('📤 Uploading to Fal.ai storage...');
        accessibleImageUrl = await fal.storage.upload(imageBlob);
        console.log('✅ Uploaded to Fal.ai storage:', accessibleImageUrl);
        
      } catch (uploadError) {
        console.warn('⚠️ Failed to upload image to Fal.ai storage, trying original URL:', uploadError);
        // If upload fails, we'll try with the original URL
      }
      
      console.log('🎯 Editing with prompt:', request.prompt);

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

      console.log('✅ Image editing complete');
      
      // Debug: Log the actual edited image URL for direct inspection
      if (result.data.images && result.data.images.length > 0) {
        console.log('🖼️ EDITED IMAGE URL:', result.data.images[0].url);
      }
      
      return result.data as any;
    } catch (error: any) {
      console.error('❌ Error editing image with Flux Kontext:', error);
      throw new Error(`Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// DELETE ALL THE TRINITY PIPELINE STUFF - WE DON'T NEED IT
// Simple test function for model verification
export async function testFalModels() {
  console.log("🧪 Testing Fal.ai FLUX DEV model...");
  
  const testPrompt = "modern retail display stand, photorealistic";
  
  try {
    console.log("Testing fal-ai/flux/dev...");
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: testPrompt,
        image_size: { width: 1024, height: 1024 },
        num_inference_steps: 28,
        guidance_scale: 7.5,
        num_images: 1
      }
    });
    console.log("✅ fal-ai/flux/dev WORKS!");
    return result;
  } catch (error: any) {
    console.log("❌ fal-ai/flux/dev FAILED:", error?.message || error);
    throw error;
  }
}
import { fal } from "@fal-ai/client";

// Configure Fal.ai client
fal.config({
  credentials: import.meta.env.VITE_FAL_KEY
});

export type AIModel = 'flux-dev' | 'flux-pro' | 'nano-banana' | 'stable-diffusion';

export interface ModelConfig {
  id: AIModel;
  name: string;
  description: string;
  endpoint: string;
  type: 'text-to-image' | 'image-editing';
  requiresInput: boolean;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'flux-dev',
    name: 'Flux Dev',
    description: 'Fast, reliable text-to-image generation',
    endpoint: 'fal-ai/flux/dev',
    type: 'text-to-image',
    requiresInput: false
  },
  {
    id: 'flux-pro',
    name: 'Flux Pro',
    description: 'Higher quality, slower generation',
    endpoint: 'fal-ai/flux-pro',
    type: 'text-to-image',
    requiresInput: false
  },
  {
    id: 'nano-banana-t2i',
    name: 'Nano Banana T2I',
    description: 'AI text-to-image with natural language understanding',
    endpoint: 'fal-ai/nano-banana',
    type: 'text-to-image',
    requiresInput: false
  }
];

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
  
  // MULTI-MODEL APPROACH WITH SIMPLE INTERFACE
  static async generateImage(request: {
    prompt: string;
    aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1" | "4:3";
    num_images?: number;
    model?: AIModel;
    inputImages?: string[]; // For editing models
  }) {
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
    } catch (error: any) {
      console.error(`❌ ${request.model || 'flux-dev'} generation failed:`, error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async generateWithTextToImageModel(model: ModelConfig | undefined, request: any) {
    const endpoint = model?.endpoint || 'fal-ai/flux/dev';
    
    let inputConfig: any = {
      prompt: request.prompt,
      num_images: request.num_images || 1
    };

    // Model-specific configurations
    if (endpoint === 'fal-ai/flux/dev') {
      inputConfig = {
        ...inputConfig,
        image_size: this.getImageSize(request.aspect_ratio),
        num_inference_steps: 28,
        guidance_scale: 7.5,
        enable_safety_checker: false
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
        // Note: Nano Banana doesn't support aspect_ratio, it generates square images
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
      description: result.data.description || null // Nano Banana provides descriptions
    };
  }

  private static async generateWithEditingModel(model: ModelConfig | undefined, request: any) {
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

  static getModelById(modelId: AIModel): ModelConfig | undefined {
    return AVAILABLE_MODELS.find(m => m.id === modelId);
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

  // Apply brand assets using Nano Banana Edit
  static async applyBrandAssetsWithNanaBanana(request: {
    image_urls: string[];
    prompt: string;
    num_images?: number;
    output_format?: 'jpeg' | 'png';
  }): Promise<any> {
    try {
      console.log('🍌 Applying brand assets with Nano Banana Edit');
      console.log('📝 Prompt:', request.prompt);
      console.log('🖼️ Input images:', request.image_urls);

      // Validate inputs before API call
      if (!request.image_urls || request.image_urls.length === 0) {
        throw new Error('At least one image URL is required');
      }
      
      if (!request.prompt || request.prompt.trim().length === 0) {
        throw new Error('Prompt is required');
      }
      
      // Validate image URLs are accessible
      for (const url of request.image_urls) {
        if (!url || !url.startsWith('http')) {
          throw new Error(`Invalid image URL: ${url}`);
        }
      }

      // Use the correct nano-banana endpoint without "/edit"
      const result = await fal.subscribe("fal-ai/nano-banana", {
        input: {
          prompt: request.prompt,
          image_urls: request.image_urls,
          output_format: request.output_format || "jpeg"
          // Note: nano-banana may not support num_images parameter
        },
        logs: true,
        onQueueUpdate: (update: any) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log: any) => log.message).forEach(console.log);
          }
        }
      });

      console.log('✅ Brand assets applied successfully');
      if (result.data.description) {
        console.log('📝 AI Description:', result.data.description);
      }
      
      return result.data as any;
    } catch (error: any) {
      console.error('❌ Error applying brand assets with Nano Banana:', error);
      
      // Extract detailed error information
      let errorMessage = 'Unknown error';
      let errorDetails = '';
      
      // Handle ValidationError and other Fal.ai errors
      if (error.name === 'ValidationError' || error.message?.includes('ValidationError')) {
        errorMessage = 'Invalid input parameters for Nano Banana API';
        if (error.body) {
          try {
            const errorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
            if (errorBody.detail) {
              errorDetails = ` Details: ${JSON.stringify(errorBody.detail)}`;
            }
          } catch {
            errorDetails = ` Raw response: ${error.body}`;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        if (error.stack) {
          console.error('Full stack trace:', error.stack);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Handle API response errors
        if (error.body) {
          errorDetails += ` API Response: ${error.body}`;
        }
        if (error.status) {
          errorDetails += ` Status: ${error.status}`;
        }
        if (error.detail || error.message) {
          errorMessage = error.detail || error.message;
        }
      }
      
      const fullErrorMessage = `Failed to apply brand assets: ${errorMessage}${errorDetails}`;
      console.error('Full error details:', fullErrorMessage);
      throw new Error(fullErrorMessage);
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
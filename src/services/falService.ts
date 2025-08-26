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
export class FalService {
  static async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    try {
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
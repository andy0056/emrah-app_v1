import { fal } from "@fal-ai/client";

// Configure Fal.ai client
fal.config({
  credentials: import.meta.env.VITE_FAL_KEY
});

export type AIModel = 'flux-dev' | 'flux-pro' | 'nano-banana' | 'seedream-v4' | 'stable-diffusion';

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
  },
  {
    id: 'seedream-v4',
    name: 'SeedReam v4 Edit',
    description: 'Advanced multi-image editing with precise text control',
    endpoint: 'fal-ai/bytedance/seedream/v4/edit',
    type: 'image-editing',
    requiresInput: true
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

export interface SeedreamV4Request {
  prompt: string;
  image_urls: string[];
  image_size?: { width: number; height: number };
  num_images?: number;
  enable_safety_checker?: boolean;
  seed?: number;
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
          safety_tolerance: "6", // Increased from 2 to 6 for better brand name tolerance
          enable_safety_checker: false, // Disable safety checker to prevent false positives
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
      
      // Check for NSFW false positives
      if (result.data.has_nsfw_concepts && result.data.has_nsfw_concepts[0] === true) {
        console.warn('⚠️ NSFW filter triggered (likely false positive for brand names)');
        console.warn('📝 Original prompt:', request.prompt);
        
        // Log additional debugging info
        if (result.data.images && result.data.images.length > 0) {
          console.warn('🖼️ Result image URL (may be black due to filter):', result.data.images[0].url);
        }
        
        // Throw a more descriptive error for brand-related false positives
        if (request.prompt.toLowerCase().includes('coca-cola') || 
            request.prompt.toLowerCase().includes('brand') ||
            request.prompt.toLowerCase().includes('logo')) {
          throw new Error('The safety filter incorrectly flagged your brand-related prompt as inappropriate. This is a known issue with brand names. Try rephrasing your prompt without specific brand names (e.g., use "cola drink" instead of "Coca-Cola").');
        } else {
          throw new Error('The content safety filter flagged this request. Please try rephrasing your prompt or contact support if this seems incorrect.');
        }
      }
      
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

  // Generate images with brand assets using SeedReam v4 Edit (New Advanced Model)
  static async generateWithSeedreamV4(request: {
    prompt: string;
    brand_asset_urls: string[];
    aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1";
    num_images?: number;
    image_size?: number;
  }): Promise<any> {
    try {
      console.log('🎯 NEW: Generating with SeedReam v4 Edit - Advanced multi-image editing');
      
      // Transform prompt to be brand-friendly for SeedReam
      let brandFriendlyPrompt = request.prompt
        .replace(/no branding/gi, 'with strong brand integration')
        .replace(/no products/gi, 'with featured branded products')
        .replace(/no text/gi, 'with clear brand text and logos')
        .replace(/no logos/gi, 'with prominent brand logos')
        .replace(/empty shelves/gi, 'shelves filled with branded products')
        .replace(/clean display surfaces/gi, 'branded display surfaces with logo placement');

      const enhancedPrompt = `${brandFriendlyPrompt}

BRAND INTEGRATION: Seamlessly integrate all provided brand assets (logos, products, visuals) into the display design. Apply brand colors throughout the structure. Position products prominently on shelves. Ensure brand visibility from multiple angles. Create cohesive brand experience that maximizes retail impact and customer engagement.`;

      console.log('📝 SeedReam Prompt:', enhancedPrompt);
      console.log('🖼️ Brand Assets:', request.brand_asset_urls);
      console.log('📏 Image Size:', request.image_size || 1024);

      // Validate inputs
      if (!request.brand_asset_urls || request.brand_asset_urls.length === 0) {
        throw new Error('SeedReam v4 requires at least one brand asset image');
      }

      // Re-upload images to ensure Fal.ai compatibility
      const accessibleImageUrls: string[] = [];
      
      for (let i = 0; i < request.brand_asset_urls.length; i++) {
        const originalUrl = request.brand_asset_urls[i];
        console.log(`📥 Processing brand asset ${i + 1}/${request.brand_asset_urls.length}`);
        
        try {
          const response = await fetch(originalUrl);
          if (!response.ok) {
            console.warn(`⚠️ Skipping asset ${i + 1}: HTTP ${response.status}`);
            continue;
          }
          
          const blob = await response.blob();
          if (!blob.type.startsWith('image/')) {
            console.warn(`⚠️ Skipping asset ${i + 1}: Invalid content type`);
            continue;
          }
          
          const file = new File([blob], `brand-asset-${i + 1}.${blob.type.split('/')[1] || 'jpg'}`, {
            type: blob.type
          });
          
          const falUrl = await fal.storage.upload(file);
          console.log(`✅ Uploaded brand asset ${i + 1} to Fal.ai`);
          accessibleImageUrls.push(falUrl);
        } catch (error) {
          console.error(`❌ Failed to process brand asset ${i + 1}:`, error);
          continue;
        }
      }
      
      if (accessibleImageUrls.length === 0) {
        throw new Error('No valid brand assets could be processed for SeedReam v4');
      }
      
      console.log(`✅ Using ${accessibleImageUrls.length} brand assets with SeedReam v4`);

      // Call SeedReam v4 Edit API with correct parameters
      const baseSize = request.image_size || 1024;
      const aspectRatioSizes = {
        "1:1": { width: baseSize, height: baseSize },
        "9:16": { width: Math.round(baseSize * 9/16), height: baseSize },
        "16:9": { width: baseSize, height: Math.round(baseSize * 9/16) },
        "3:4": { width: Math.round(baseSize * 3/4), height: baseSize },
        "4:3": { width: baseSize, height: Math.round(baseSize * 3/4) }
      };
      
      const apiInput = {
        prompt: enhancedPrompt,
        image_urls: accessibleImageUrls,
        image_size: aspectRatioSizes[request.aspect_ratio] || aspectRatioSizes["1:1"],
        num_images: request.num_images || 1,
        enable_safety_checker: true
      };
      
      console.log('🔧 SeedReam v4 API Input:', JSON.stringify(apiInput, null, 2));
      
      const result = await fal.subscribe("fal-ai/bytedance/seedream/v4/edit", {
        input: apiInput,
        logs: true,
        onQueueUpdate: (update: any) => {
          console.log('🎯 SeedReam v4 Status:', update.status);
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log: any) => log.message).forEach(console.log);
          }
        }
      });

      console.log('✅ SeedReam v4 generation complete');
      return result.data as any;
    } catch (error: any) {
      console.error('❌ Error generating with SeedReam v4:', error);
      
      // Enhanced error reporting for validation issues
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object') {
        if (error.body) {
          try {
            const errorBody = typeof error.body === 'string' ? JSON.parse(error.body) : error.body;
            if (errorBody.detail) {
              errorMessage = `Validation error: ${JSON.stringify(errorBody.detail)}`;
            } else {
              errorMessage = `API error: ${error.body}`;
            }
          } catch {
            errorMessage = `API response error: ${error.body}`;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      throw new Error(`SeedReam v4 generation failed: ${errorMessage}`);
    }
  }

  // Generate images with brand assets integrated from the start using Nano Banana Edit
  static async generateWithBrandAssets(request: {
    prompt: string;
    brand_asset_urls: string[];
    aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1"; // Required for proper output dimensions
    num_images?: number;
    output_format?: 'jpeg' | 'png';
  }): Promise<any> {
    try {
      console.log('🍌 Primary generation with integrated brand assets using Nano Banana Edit');
      
      // Transform the prompt to be brand-friendly by removing negative branding instructions
      let brandFriendlyPrompt = request.prompt
        .replace(/no branding/gi, 'with strong branding')
        .replace(/no products/gi, 'with featured products')
        .replace(/no text/gi, 'with clear branding text and logos')
        .replace(/no logos/gi, 'with prominent brand logos')
        .replace(/no brand elements/gi, 'with integrated brand elements')
        .replace(/without branding/gi, 'with comprehensive branding')
        .replace(/empty shelves/gi, 'shelves stocked with products')
        .replace(/clean display surfaces/gi, 'branded display surfaces')
        .replace(/minimal branding/gi, 'prominent branding')
        .replace(/subtle branding/gi, 'bold brand presence')
        .replace(/plain/gi, 'branded')
        .replace(/generic/gi, 'brand-specific');

      // Create a comprehensive prompt that encourages brand integration
      const integratedPrompt = `${brandFriendlyPrompt}

BRAND INTEGRATION REQUIREMENTS:
- Prominently display the brand logo from the provided images in multiple locations
- Fill shelves with the specific product items shown in the brand assets
- Use brand colors, typography, and visual elements throughout the entire display
- Create a bold, eye-catching retail display that maximizes brand recognition and impact
- Seamlessly integrate ALL provided brand assets (logos, products, key visuals) as focal points
- Design for maximum brand visibility and customer engagement in retail environments
- Ensure brand consistency across all display elements and surfaces
- Make the brand the hero of the display design with strong visual hierarchy`;

      console.log('📝 Integrated Prompt:', integratedPrompt);
      console.log('🖼️ Brand Asset URLs:', request.brand_asset_urls);
      console.log('🎯 Aspect Ratio:', request.aspect_ratio);

      // Use Nano Banana Edit with brand assets for initial generation
      return await this.applyBrandAssetsWithNanaBanana({
        image_urls: request.brand_asset_urls,
        prompt: integratedPrompt,
        aspect_ratio: request.aspect_ratio,
        num_images: request.num_images || 1,
        output_format: request.output_format || "jpeg"
      });
    } catch (error: any) {
      console.error('❌ Error generating with brand assets:', error);
      throw new Error(`Failed to generate with brand assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // EXPERIMENTAL: Generate images with refined brand integration framework
  static async generateWithRefinedBrandAssets(request: {
    prompt: string;
    brand_asset_urls: string[];
    aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1"; // Required for proper output dimensions
    num_images?: number;
    output_format?: 'jpeg' | 'png';
  }): Promise<any> {
    try {
      console.log('🧪 EXPERIMENTAL: Refined brand integration approach using Nano Banana');
      
      // Create enhanced prompt with refined brand integration framework
      const refinedPrompt = `${request.prompt}

VISUAL INTEGRATION FRAMEWORK:
- Apply provided brand assets (logo, product, key visual) strategically throughout design
- Populate display areas with supplied product imagery at appropriate scale
- Incorporate brand color palette naturally into display architecture
- Maintain professional retail presentation standards
- Balance brand presence with structural design integrity
- Ensure visibility and accessibility of displayed products
- Create cohesive visual hierarchy between branding and product placement
- Design for versatile retail environments and lighting conditions`;

      console.log('📝 Refined Prompt:', refinedPrompt);
      console.log('🖼️ Brand Asset URLs:', request.brand_asset_urls);
      console.log('🎯 Aspect Ratio:', request.aspect_ratio);

      // Use Nano Banana Edit with refined approach
      return await this.applyBrandAssetsWithNanaBanana({
        image_urls: request.brand_asset_urls,
        prompt: refinedPrompt,
        aspect_ratio: request.aspect_ratio,
        num_images: request.num_images || 1,
        output_format: request.output_format || "jpeg"
      });
    } catch (error: any) {
      console.error('❌ Error generating with refined brand assets:', error);
      throw new Error(`Failed to generate with refined brand assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Apply brand assets using Nano Banana Edit (legacy method for secondary editing)
  static async applyBrandAssetsWithNanaBanana(request: {
    image_urls: string[]; 
    prompt: string;
    aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1"; // Make aspect_ratio required
    num_images?: number;
    output_format?: 'jpeg' | 'png';
  }): Promise<any> {
    try {
      console.log('🍌 Applying brand assets with Nano Banana Edit');
      const { image_urls, prompt, num_images, output_format, aspect_ratio } = request;
      console.log('📝 Prompt:', request.prompt);
      console.log('🖼️ Input images:', request.image_urls);
      console.log('🎯 Target aspect ratio:', aspect_ratio);

      // Validate inputs before API call
      if (!request.image_urls || request.image_urls.length === 0) {
        throw new Error('At least one image URL is required');
      }
      
      if (!request.prompt || request.prompt.trim().length === 0) {
        throw new Error('Prompt is required');
      }
      
      // Re-upload all images to Fal.ai storage to ensure accessibility
      const accessibleImageUrls: string[] = [];
      
      for (let i = 0; i < request.image_urls.length; i++) {
        const originalUrl = request.image_urls[i];
        console.log(`📥 Processing image ${i + 1}/${request.image_urls.length}: ${originalUrl}`);
        
        try {
          // Download the image
          const response = await fetch(originalUrl, {
            headers: {
              'User-Agent': 'FalAI-Client/1.0'
            }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Failed to download image ${i + 1}: HTTP ${response.status} - ${response.statusText}`);
            console.error(`Response body:`, errorText);
            
            // Check for specific Supabase bucket not found error
            if (errorText.includes('Bucket not found')) {
              console.warn(`⚠️ Skipping image ${i + 1}: Supabase 'uploads' bucket not found. Please create the bucket in your Supabase project.`);
              continue; // Skip this image but continue with others
            }
            
            console.warn(`⚠️ Skipping image ${i + 1} due to download error: ${response.status}`);
            continue; // Skip this image but continue with others
          }
          
          if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status}`);
          }
          
          const blob = await response.blob();
          
          // Verify we got actual image data
          if (!blob.type.startsWith('image/')) {
            console.error(`❌ Image ${i + 1} returned invalid content type: ${blob.type}`);
            console.warn(`⚠️ Skipping image ${i + 1}: Invalid content type: ${blob.type}`);
            continue; // Skip this image but continue with others
          }
          
          console.log(`✅ Downloaded image ${i + 1}, size: ${blob.size} bytes`);
          
          // Create a File object for Fal.ai upload
          const file = new File([blob], `image-${i + 1}.${blob.type.split('/')[1] || 'jpg'}`, {
            type: blob.type
          });
          
          // Upload to Fal.ai storage  
          const falUrl = await fal.storage.upload(file);
          console.log(`✅ Re-uploaded image ${i + 1} to Fal.ai: ${falUrl}`);
          
          accessibleImageUrls.push(falUrl);
        } catch (error) {
          console.error(`❌ Failed to re-upload image ${i + 1}:`, error);
          // Skip this image but continue with others
          console.warn(`⚠️ Skipping image ${i + 1} due to processing error`);
          continue;
        }
      }
      
      if (accessibleImageUrls.length === 0) {
        throw new Error(`No valid images could be processed from ${request.image_urls.length} provided images. This may be because:\n\n1. The Supabase 'uploads' bucket doesn't exist - please create it in your Supabase project dashboard under Storage\n2. The images are not publicly accessible\n3. The image URLs are invalid\n\nPlease check your Supabase storage configuration and try again.`);
      }
      
      console.log(`✅ Successfully processed ${accessibleImageUrls.length} out of ${request.image_urls.length} images`);
      console.log('🔄 Final image URLs for API call:', accessibleImageUrls);

      // Use the correct nano-banana/edit endpoint  
      const result = await fal.subscribe("fal-ai/nano-banana/edit", {
        input: {
          prompt: request.prompt,
          image_urls: accessibleImageUrls, // Use re-uploaded URLs
          num_images: request.num_images || 1,
          output_format: request.output_format || "jpeg"
        },
        logs: true,
        onQueueUpdate: (update: any) => {
          console.log('🍌 Nano Banana Status:', update.status);
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
        errorMessage = 'Invalid input parameters for Nano Banana Edit API';
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
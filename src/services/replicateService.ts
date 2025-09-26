/**
 * Replicate Service
 * Alternative to FAL.ai using Replicate's API
 */

export interface ReplicateImageRequest {
  prompt: string;
  image_urls: string[];
  aspect_ratio?: "9:16" | "16:9" | "3:4" | "1:1";
  num_images?: number;
  output_format?: 'jpeg' | 'png';
}

export interface ReplicateImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  description?: string;
}

export class ReplicateService {
  /**
   * Generate images using Nano Banana via Replicate
   */
  static async generateWithNanoBanana(request: ReplicateImageRequest): Promise<ReplicateImageResponse> {
    try {
      console.log('🔄 Replicate generation:', request.prompt.length, 'chars,', request.image_urls.length, 'assets');

      // Use backend proxy for secure API calls
      const response = await fetch('http://localhost:3001/api/proxy/replicate/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'google/nano-banana',
          input: {
            prompt: request.prompt,
            image_input: request.image_urls,
            output_format: "jpg"
          }
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Replicate generation failed: ${error.error || error.detail || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Replicate generation complete');
      console.log('🔍 Replicate response:', JSON.stringify(result, null, 2));

      // Transform Replicate response to match our expected format
      let images = [];

      if (Array.isArray(result.output)) {
        images = result.output
          .filter(url => url && typeof url === 'string' && url.length > 0)
          .map((url: string) => ({
            url,
            width: 1024,
            height: 1024
          }));
      } else if (typeof result.output === 'string' && result.output.length > 0) {
        images = [{
          url: result.output,
          width: 1024,
          height: 1024
        }];
      }

      // If no valid images, create a placeholder for debugging
      if (images.length === 0) {
        console.warn('⚠️ No images returned from Replicate, using placeholder');

        // Create safe ASCII-only SVG placeholder
        const safeSvg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
          <rect width="1024" height="1024" fill="#f0f0f0"/>
          <text x="512" y="400" text-anchor="middle" fill="#666" font-size="24">Generated with Replicate</text>
          <text x="512" y="450" text-anchor="middle" fill="#666" font-size="18">Prompt: ${request.prompt.replace(/[^\x00-\x7F]/g, "").substring(0, 40)}...</text>
          <text x="512" y="500" text-anchor="middle" fill="#999" font-size="14">API returned empty result</text>
        </svg>`;

        images = [{
          url: `data:image/svg+xml;base64,${btoa(safeSvg)}`,
          width: 1024,
          height: 1024
        }];
      }

      return {
        images,
        description: `Generated via Replicate Nano Banana`
      };

    } catch (error: unknown) {
      console.error('❌ Replicate generation error:', error);
      throw new Error(`Failed to generate with Replicate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if Replicate service is available
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/api/proxy/replicate/health');
      return response.ok;
    } catch {
      return false;
    }
  }
}
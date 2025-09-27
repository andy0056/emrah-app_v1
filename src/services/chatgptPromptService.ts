/**
 * ChatGPT-5 Prompt Optimization Service
 * Analyzes 3D geometry + brand assets to optimize prompts for Nano Banana
 */

import { MASTER_PROMPT_INSTRUCTIONS } from '../prompts/masterPromptInstructions';

export interface OptimizationRequest {
  stage1Image: Blob | File; // 3D rendered display stand
  brandLogo?: Blob | File; // Brand logo/identity
  productImage?: Blob | File; // Product being displayed
  keyVisual?: Blob | File; // Optional brand aesthetic reference
  currentPrompt: string; // Current dynamic prompt
  formData: {
    brand?: string;
    product?: string;
    standWidth?: number;
    standDepth?: number;
    standHeight?: number;
    frontFaceCount?: number;
    backToBackCount?: number;
    materials?: string[];
    description?: string;
  };
}

export interface OptimizationResponse {
  optimizedPrompt: string;
  analysis: {
    brandPersonality?: string;
    colorPalette?: string[];
    materialSuggestions?: string[];
    qualityImprovements?: string[];
  };
  confidence: number; // 0-1 score
  processingTime: number; // milliseconds
}

export class ChatGPTPromptService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Prompt optimization will use fallback mode.');
    }
  }

  /**
   * Optimize prompt using ChatGPT-4o with visual analysis
   */
  async optimizePrompt(request: OptimizationRequest): Promise<OptimizationResponse> {
    const startTime = Date.now();

    if (!this.apiKey) {
      return this.fallbackOptimization(request, startTime);
    }

    try {
      // Prepare images for ChatGPT analysis
      const images = await this.prepareImages(request);

      // Build analysis payload
      const messages = await this.buildChatGPTMessages(request, images);

      // Call ChatGPT-4o API
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o', // Use GPT-4o with vision capabilities
          messages: messages,
          max_tokens: 1000,
          temperature: 0.3, // Lower temperature for consistent, technical output
        }),
      });

      if (!response.ok) {
        throw new Error(`ChatGPT API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const optimizedContent = result.choices[0]?.message?.content;

      if (!optimizedContent) {
        throw new Error('No optimized prompt returned from ChatGPT');
      }

      // Parse the optimized response
      const analysis = this.parseOptimizationResult(optimizedContent);

      return {
        optimizedPrompt: analysis.prompt,
        analysis: {
          brandPersonality: analysis.brandPersonality,
          colorPalette: analysis.colorPalette,
          materialSuggestions: analysis.materialSuggestions,
          qualityImprovements: analysis.qualityImprovements,
        },
        confidence: analysis.confidence,
        processingTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error('ChatGPT prompt optimization failed:', error);
      return this.fallbackOptimization(request, startTime);
    }
  }

  /**
   * Convert images to base64 for ChatGPT vision API
   */
  private async prepareImages(request: OptimizationRequest): Promise<{ [key: string]: string }> {
    const images: { [key: string]: string } = {};

    try {
      // Convert each image to base64
      if (request.stage1Image) {
        images.stage1 = await this.fileToBase64(request.stage1Image);
      }
      if (request.brandLogo) {
        images.brandLogo = await this.fileToBase64(request.brandLogo);
      }
      if (request.productImage) {
        images.productImage = await this.fileToBase64(request.productImage);
      }
      if (request.keyVisual) {
        images.keyVisual = await this.fileToBase64(request.keyVisual);
      }
    } catch (error) {
      console.warn('Image preparation failed:', error);
    }

    return images;
  }

  /**
   * Build ChatGPT message array with instructions and images
   */
  private async buildChatGPTMessages(request: OptimizationRequest, images: { [key: string]: string }) {
    const imageContent = Object.entries(images).map(([key, base64]) => ({
      type: 'image_url' as const,
      image_url: {
        url: `data:image/jpeg;base64,${base64}`,
        detail: 'high' as const
      }
    }));

    const messages = [
      {
        role: 'system' as const,
        content: MASTER_PROMPT_INSTRUCTIONS,
      },
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `Please optimize this prompt for a retail display stand:

CURRENT PROMPT TO OPTIMIZE:
${request.currentPrompt}

TECHNICAL SPECIFICATIONS:
- Stand: ${request.formData.standWidth}×${request.formData.standDepth}×${request.formData.standHeight}cm
- Products: ${request.formData.frontFaceCount} columns × ${request.formData.backToBackCount} deep
- Brand: ${request.formData.brand || 'Not specified'}
- Product: ${request.formData.product || 'Not specified'}
- Materials: ${request.formData.materials?.join(', ') || 'Not specified'}
- Description: ${request.formData.description || 'None'}

IMAGES PROVIDED:
${Object.keys(images).map(key => `- ${key}: Brand/visual reference`).join('\n')}

Please analyze the images and provide an optimized prompt following the master instructions.`,
          },
          ...imageContent
        ],
      },
    ];

    return messages;
  }

  /**
   * Parse ChatGPT response to extract optimized prompt and analysis
   */
  private parseOptimizationResult(content: string) {
    // Extract the main optimized prompt (everything before analysis markers)
    const promptMatch = content.match(/^(.*?)(?=\n\n(?:ANALYSIS|BRAND|CONFIDENCE):|$)/s);
    const prompt = promptMatch ? promptMatch[1].trim() : content.trim();

    // Extract analysis sections
    const brandPersonality = this.extractSection(content, /BRAND PERSONALITY[:\s]*([^\n]+)/i);
    const colorPalette = this.extractColors(content);
    const materialSuggestions = this.extractSection(content, /MATERIALS?[:\s]*([^\n]+)/i);
    const qualityImprovements = this.extractList(content, /IMPROVEMENTS?[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/is);

    // Estimate confidence based on content quality
    const confidence = this.estimateConfidence(content, prompt);

    return {
      prompt,
      brandPersonality,
      colorPalette,
      materialSuggestions: materialSuggestions ? [materialSuggestions] : [],
      qualityImprovements,
      confidence,
    };
  }

  /**
   * Extract specific sections from ChatGPT response
   */
  private extractSection(content: string, regex: RegExp): string | undefined {
    const match = content.match(regex);
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extract color codes and names from response
   */
  private extractColors(content: string): string[] {
    const colorRegex = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}|\b\w+\s+(?:blue|red|green|yellow|purple|orange|pink|brown|black|white|gray|grey)\b/g;
    const matches = content.match(colorRegex);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Extract lists from response
   */
  private extractList(content: string, regex: RegExp): string[] {
    const match = content.match(regex);
    if (!match) return [];

    return match[1]
      .split(/\n|,|;/)
      .map(item => item.trim())
      .filter(item => item.length > 0 && !item.match(/^[-•*]\s*$/));
  }

  /**
   * Estimate confidence based on content analysis
   */
  private estimateConfidence(content: string, prompt: string): number {
    let confidence = 0.5;

    // Check for specific technical details
    if (prompt.includes('cm') || prompt.includes('dimensions')) confidence += 0.1;
    if (prompt.includes('#') && prompt.match(/#[0-9a-fA-F]{6}/)) confidence += 0.1; // Color codes
    if (prompt.length > 200) confidence += 0.1; // Detailed prompt
    if (content.includes('brand') || content.includes('logo')) confidence += 0.1;
    if (prompt.includes('material') || prompt.includes('finish')) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  /**
   * Fallback optimization when ChatGPT is unavailable
   */
  private fallbackOptimization(request: OptimizationRequest, startTime: number): OptimizationResponse {
    const enhanced = this.enhancePromptFallback(request.currentPrompt, request.formData);

    return {
      optimizedPrompt: enhanced,
      analysis: {
        brandPersonality: 'Analysis unavailable (fallback mode)',
        colorPalette: [],
        materialSuggestions: ['Professional retail materials'],
        qualityImprovements: ['Fallback enhancement applied', 'Technical specifications added'],
      },
      confidence: 0.3,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * Fallback enhancement when ChatGPT is unavailable
   */
  private enhancePromptFallback(currentPrompt: string, formData: any): string {
    let enhanced = currentPrompt;

    // Add technical specifications if missing
    if (!enhanced.includes('dimensions') && formData.standWidth) {
      enhanced += ` Maintain exact ${formData.standWidth}×${formData.standDepth}×${formData.standHeight}cm stand dimensions.`;
    }

    // Add brand name if available
    if (formData.brand && !enhanced.includes(formData.brand)) {
      enhanced = enhanced.replace('Transform this', `Transform this ${formData.brand}`);
    }

    // Add product count specification
    if (formData.frontFaceCount && formData.backToBackCount) {
      enhanced += ` Preserve exact ${formData.frontFaceCount}×${formData.backToBackCount} product arrangement.`;
    }

    // Add rendering quality requirements
    if (!enhanced.includes('photorealistic')) {
      enhanced += ' Render photorealistic quality with professional retail lighting and accurate materials.';
    }

    // Add material specifications if provided
    if (formData.materials && formData.materials.length > 0) {
      enhanced += ` Apply materials: ${formData.materials.join(', ')}.`;
    }

    return enhanced;
  }

  /**
   * Convert File/Blob to base64 string
   */
  private async fileToBase64(file: File | Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 content
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

// Export singleton instance
export const chatGPTPromptService = new ChatGPTPromptService();
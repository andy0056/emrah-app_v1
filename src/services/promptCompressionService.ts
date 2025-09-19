/**
 * LLM-based prompt compression service
 * Reduces prompt length by ~70% while maintaining quality and essential details
 */

export interface CompressionResult {
  originalPrompt: string;
  compressedPrompt: string;
  compressionRatio: number;
  tokensReduced: number;
  processingTime: number;
}

export interface CompressionOptions {
  targetReduction?: number; // Default 70%
  preserveKeywords?: string[]; // Must-keep terms
  style?: 'concise' | 'bullet' | 'structured';
  maxRetries?: number;
}

export class PromptCompressionService {
  private static readonly DEFAULT_REDUCTION = 0.7; // 70%
  private static readonly OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

  // Cache for frequently compressed prompts
  private static compressionCache = new Map<string, CompressionResult>();

  /**
   * Compress a prompt using OpenAI GPT-4 while maintaining essential details
   */
  static async compressPrompt(
    originalPrompt: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(originalPrompt, options);
    if (this.compressionCache.has(cacheKey)) {
      console.log('📦 Using cached compression result');
      return this.compressionCache.get(cacheKey)!;
    }

    const {
      targetReduction = this.DEFAULT_REDUCTION,
      preserveKeywords = [],
      style = 'structured',
      maxRetries = 2
    } = options;

    try {
      console.log('🔄 Compressing prompt...', {
        originalLength: originalPrompt.length,
        targetReduction: `${(targetReduction * 100)}%`,
        style
      });

      const compressionPrompt = this.buildCompressionPrompt(
        originalPrompt,
        targetReduction,
        preserveKeywords,
        style
      );

      let compressedPrompt = '';
      let attempts = 0;

      while (attempts < maxRetries) {
        try {
          compressedPrompt = await this.callOpenAI(compressionPrompt);
          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxRetries) {
            throw error;
          }
          console.warn(`🔄 Compression attempt ${attempts} failed, retrying...`);
          await this.delay(1000 * attempts); // Exponential backoff
        }
      }

      const result = this.calculateCompressionMetrics(
        originalPrompt,
        compressedPrompt,
        Date.now() - startTime
      );

      // Cache successful result
      this.compressionCache.set(cacheKey, result);

      // Clean cache if it gets too large
      if (this.compressionCache.size > 100) {
        const firstKey = this.compressionCache.keys().next().value;
        this.compressionCache.delete(firstKey);
      }

      console.log('✅ Prompt compression complete:', {
        originalTokens: result.originalPrompt.length,
        compressedTokens: result.compressedPrompt.length,
        reduction: `${(result.compressionRatio * 100).toFixed(1)}%`,
        processingTime: `${result.processingTime}ms`
      });

      return result;

    } catch (error) {
      console.error('❌ Prompt compression failed:', error);

      // Fallback: return original prompt with basic compression
      return this.basicFallbackCompression(originalPrompt, startTime);
    }
  }

  /**
   * Build the meta-prompt for OpenAI to compress the image generation prompt
   */
  private static buildCompressionPrompt(
    originalPrompt: string,
    targetReduction: number,
    preserveKeywords: string[],
    style: string
  ): string {
    const reductionPercent = Math.round(targetReduction * 100);

    const systemPrompt = `You are an expert at compressing image generation prompts while preserving 100% of their essential meaning and visual impact.

TASK: Compress the following image generation prompt by ${reductionPercent}% while maintaining:
- ALL technical specifications (dimensions, materials, colors)
- ALL brand requirements and product details
- ALL visual directives and constraints
- Essential creative and quality instructions

COMPRESSION STYLE: ${style}
${preserveKeywords.length > 0 ? `REQUIRED KEYWORDS: ${preserveKeywords.join(', ')}` : ''}

RULES:
1. Remove redundant phrases and verbose explanations
2. Combine related concepts into concise statements
3. Use bullet points or structured format for clarity
4. Preserve numerical values, brand names, and technical specs EXACTLY
5. Maintain the prompt's professional and directive tone
6. Keep all visual quality requirements (lighting, angles, etc.)

ORIGINAL PROMPT TO COMPRESS:
"${originalPrompt}"

Return ONLY the compressed prompt, no explanations or metadata.`;

    return systemPrompt;
  }

  /**
   * Call OpenAI API to perform the compression
   */
  private static async callOpenAI(prompt: string): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(this.OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview', // Good balance of quality and speed
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800, // Compressed prompts should be much shorter
        temperature: 0.1, // Low creativity, high consistency
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI API response format');
    }

    return data.choices[0].message.content.trim();
  }

  /**
   * Calculate compression metrics and create result object
   */
  private static calculateCompressionMetrics(
    originalPrompt: string,
    compressedPrompt: string,
    processingTime: number
  ): CompressionResult {
    const originalLength = originalPrompt.length;
    const compressedLength = compressedPrompt.length;
    const tokensReduced = originalLength - compressedLength;
    const compressionRatio = tokensReduced / originalLength;

    return {
      originalPrompt,
      compressedPrompt,
      compressionRatio,
      tokensReduced,
      processingTime
    };
  }

  /**
   * Generate cache key for compression results
   */
  private static generateCacheKey(prompt: string, options: CompressionOptions): string {
    const optionsHash = JSON.stringify(options);
    return `${prompt.substring(0, 100)}:${optionsHash}`;
  }

  /**
   * Basic fallback compression without LLM
   */
  private static basicFallbackCompression(
    originalPrompt: string,
    startTime: number
  ): CompressionResult {
    console.log('🔄 Using basic fallback compression...');

    // Basic compression: remove redundant words and phrases
    let compressed = originalPrompt
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/CLIENT-PRIORITY BRAND INTEGRATION:\s*-\s*/g, '') // Remove section headers
      .replace(/CLIENT REQUIREMENTS:\s*-\s*/g, '')
      .replace(/VARIANT MODIFICATIONS.*?:\s*-\s*/g, '')
      .replace(/KEY EMPHASIS AREAS:\s*-\s*/g, '')
      .replace(/VISUAL DIRECTIVES:\s*-\s*/g, '')
      .replace(/PRECISION CALIBRATION:\s*-\s*/g, '')
      .replace(/AVOID:\s*-\s*/g, 'Avoid: ')
      .replace(/- /g, '') // Remove bullet points
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/must be|should be|need to be/g, '') // Remove modal verbs
      .replace(/\s*,\s*/g, ', ') // Normalize commas
      .trim();

    return {
      originalPrompt,
      compressedPrompt: compressed,
      compressionRatio: (originalPrompt.length - compressed.length) / originalPrompt.length,
      tokensReduced: originalPrompt.length - compressed.length,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Utility delay function
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch compress multiple prompts efficiently
   */
  static async compressPrompts(
    prompts: string[],
    options: CompressionOptions = {}
  ): Promise<CompressionResult[]> {
    console.log(`🔄 Batch compressing ${prompts.length} prompts...`);

    const results = await Promise.allSettled(
      prompts.map(prompt => this.compressPrompt(prompt, options))
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<CompressionResult> =>
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failed = results.filter(result => result.status === 'rejected').length;

    console.log(`✅ Batch compression complete: ${successful.length} successful, ${failed} failed`);

    return successful;
  }

  /**
   * Get compression statistics
   */
  static getCompressionStats(): {
    cacheSize: number;
    averageReduction: number;
  } {
    const results = Array.from(this.compressionCache.values());
    const averageReduction = results.length > 0
      ? results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length
      : 0;

    return {
      cacheSize: this.compressionCache.size,
      averageReduction
    };
  }

  /**
   * Clear compression cache
   */
  static clearCache(): void {
    this.compressionCache.clear();
    console.log('🗑️ Compression cache cleared');
  }
}
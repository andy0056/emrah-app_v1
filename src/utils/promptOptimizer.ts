export class PromptOptimizer {
  /**
   * Optimize prompt for specific AI model characteristics
   */
  public static optimizeForImagen4(prompt: string): string {
    // Clean the prompt first
    let cleanedPrompt = this.cleanPrompt(prompt);
    
    // Add Imagen 4 specific optimizations
    const qualityMarkers = [
      'Photorealistic',
      '8K resolution',
      'professional photography',
      'commercial quality',
      'sharp focus',
      'perfect lighting'
    ];
    
    // Check if quality markers are already present
    const hasQualityMarkers = qualityMarkers.some(marker => 
      cleanedPrompt.toLowerCase().includes(marker.toLowerCase())
    );
    
    if (!hasQualityMarkers) {
      cleanedPrompt = `Photorealistic, 8K resolution, professional photography, commercial quality. ${cleanedPrompt}`;
    }
    
    // Add negative prompt guidance
    const negativePrompt = this.generateNegativePrompt();
    
    return `${cleanedPrompt} | Negative: ${negativePrompt}`;
  }

  /**
   * Clean prompt of any technical artifacts
   */
  public static cleanPrompt(prompt: string): string {
    return prompt
      // Remove dimensions and measurements
      .replace(/\d+\.?\d*\s*×\s*\d+\.?\d*\s*×\s*\d+\.?\d*\s*(cm|mm|m|inches?)?/gi, '')
      .replace(/\d+\.?\d*\s*(cm|mm|m|inches?|"|\′|″)/gi, '')
      .replace(/dimensions?:\s*\d+[^.]*\./gi, '')
      .replace(/size:\s*\d+[^.]*\./gi, '')
      
      // Remove capacity and quantity specifications
      .replace(/capacity:\s*\d+[^.]*\./gi, '')
      .replace(/\d+\s*across\s*×\s*\d+\s*deep\s*×\s*\d+\s*shelves?/gi, '')
      .replace(/must fit capacity exactly:\s*\d+[^.]*\./gi, '')
      
      // Remove technical terms and CAD references
      .replace(/\b(dimension|measurement|capacity|specification|tolerance|scale|CAD|blueprint|wireframe|technical drawing)\b/gi, '')
      .replace(/\b(orthographic|isometric|schematic|diagram|annotation|ruler|grid)\b/gi, '')
      
      // Remove mathematical expressions
      .replace(/\d+\s*(across|deep|high|wide|tall|front|back)\s*[×x]/gi, '')
      .replace(/\d+\s*[×x]\s*\d+\s*[×x]\s*\d+/gi, '')
      
      // Remove lens and camera technical specs that are too specific
      .replace(/35\s*mm\s*full-frame\s*lens,\s*f\/8,\s*ISO\s*100/gi, 'professional camera settings')
      .replace(/f\/\d+,?\s*ISO\s*\d+/gi, 'optimal camera settings')
      
      // Clean up extra spaces and formatting
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .replace(/\.\s*\./g, '.')
      .replace(/;\s*;/g, ';')
      .trim();
  }

  /**
   * Generate comprehensive negative prompt
   */
  public static generateNegativePrompt(): string {
    const negativeElements = [
      // Technical artifacts
      'technical drawings', 'CAD renders', 'dimension lines', 'measurement text', 'rulers',
      'grid overlays', 'blueprints', 'wireframes', 'annotation arrows', 'specification labels',
      'engineering diagrams', 'schematic drawings', 'construction lines',
      
      // Quality issues
      'watermarks', 'low quality', 'blurry', 'distorted proportions', 'poor lighting',
      'compression artifacts', 'pixelated', 'grainy', 'overexposed', 'underexposed',
      
      // Unrealistic elements  
      'floating elements', 'impossible physics', 'gravity defying', 'unsupported structures',
      'transparent products', 'glowing outlines', 'x-ray vision',
      
      // Generic/boring elements
      'generic design', 'bland appearance', 'boring composition', 'lifeless lighting',
      'corporate sterility', 'stock photo feel',
      
      // Text and typography
      'text overlays', 'written descriptions', 'price tags', 'labels', 'signs',
      'typography', 'fonts', 'written words'
    ];
    
    return negativeElements.join(', ');
  }

  /**
   * Optimize prompt length for specific AI models
   */
  public static optimizeLength(prompt: string, maxTokens: number = 400): string {
    // Simple token estimation (rough approximation)
    const estimatedTokens = prompt.split(/\s+/).length * 1.3; // Account for punctuation
    
    if (estimatedTokens <= maxTokens) {
      return prompt;
    }
    
    // If too long, prioritize key elements
    const sentences = prompt.split(/[.!?]+/);
    let optimizedPrompt = '';
    let currentTokens = 0;
    
    // Prioritize sentences with brand names and key descriptors
    const prioritySentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes('brand') ||
      sentence.toLowerCase().includes('display') ||
      sentence.toLowerCase().includes('professional') ||
      sentence.toLowerCase().includes('photorealistic')
    );
    
    // Add priority sentences first
    for (const sentence of prioritySentences) {
      const sentenceTokens = sentence.split(/\s+/).length * 1.3;
      if (currentTokens + sentenceTokens <= maxTokens) {
        optimizedPrompt += sentence.trim() + '. ';
        currentTokens += sentenceTokens;
      }
    }
    
    // Fill remaining space with other sentences
    const remainingSentences = sentences.filter(sentence => !prioritySentences.includes(sentence));
    for (const sentence of remainingSentences) {
      const sentenceTokens = sentence.split(/\s+/).length * 1.3;
      if (currentTokens + sentenceTokens <= maxTokens) {
        optimizedPrompt += sentence.trim() + '. ';
        currentTokens += sentenceTokens;
      }
    }
    
    return optimizedPrompt.trim();
  }

  /**
   * Add style modifiers for different effects
   */
  public static addStyleModifier(prompt: string, style: 'premium' | 'mass_market' | 'innovation' | 'practical'): string {
    const styleModifiers = {
      premium: 'Architectural photography style, subtle reflections, premium materials, Vogue aesthetic, luxury retail environment',
      mass_market: 'Bright and approachable, Target/Walmart friendly, value-focused presentation, family-oriented appeal',
      innovation: 'Concept store aesthetic, Apple Store minimalism, future retail vision, cutting-edge design',
      practical: 'IKEA-style efficiency, modular appearance, clearly assembled from standard components, cost-effective build'
    };
    
    const modifier = styleModifiers[style];
    return `${prompt} ${modifier}`;
  }

  /**
   * Enhance prompt with emotional language
   */
  public static addEmotionalLanguage(prompt: string, emotion: 'excitement' | 'trust' | 'luxury' | 'comfort'): string {
    const emotionalEnhancements = {
      excitement: 'vibrant energy, dynamic movement, eye-catching appeal, irresistible attraction',
      trust: 'reliable stability, honest presentation, dependable quality, reassuring presence',
      luxury: 'sophisticated elegance, premium craftsmanship, exclusive appeal, refined beauty',
      comfort: 'welcoming warmth, approachable design, friendly atmosphere, inviting presence'
    };
    
    const enhancement = emotionalEnhancements[emotion];
    return `${prompt} The overall feeling conveys ${enhancement}.`;
  }

  /**
   * Validate prompt for potential issues
   */
  public static validatePrompt(prompt: string): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for technical artifacts
    if (/\d+\.?\d*\s*(cm|mm|inches?)/i.test(prompt)) {
      issues.push('Contains measurement units');
      suggestions.push('Replace measurements with descriptive proportions');
    }
    
    // Check for CAD terminology
    if (/\b(CAD|wireframe|blueprint|schematic)\b/i.test(prompt)) {
      issues.push('Contains technical CAD terminology');
      suggestions.push('Use creative architectural language instead');
    }
    
    // Check for brand mention
    if (!/\b(brand|company|product)\b/i.test(prompt)) {
      issues.push('No brand context detected');
      suggestions.push('Include brand personality and context');
    }
    
    // Check prompt length
    if (prompt.length < 100) {
      issues.push('Prompt may be too short');
      suggestions.push('Add more descriptive elements and atmosphere');
    }
    
    if (prompt.length > 2000) {
      issues.push('Prompt may be too long');
      suggestions.push('Focus on key elements and remove redundancy');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}
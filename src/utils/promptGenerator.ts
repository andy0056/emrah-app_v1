interface FormData {
  brand: string;
  product: string;
  productWidth: number;
  productDepth: number;
  productHeight: number;
  frontFaceCount: number;
  backToBackCount: number;
  standType: string;
  materials: string[];
  standBaseColor: string;
  standWidth: number;
  standDepth: number;
  standHeight: number;
  shelfWidth: number;
  shelfDepth: number;
  shelfCount: number;
  description: string;
}

import { EnhancedPromptGenerator } from './enhancedPromptGenerator';

// Legacy wrapper class that uses the new EnhancedPromptGenerator
export class PromptGenerator {
  private static enhancedGenerator = new EnhancedPromptGenerator();

  // NEW: Trinity-optimized prompts (MAXIMUM 50 WORDS)
  static generateTrinityPrompt(formData: FormData): string {
    // Critical details only - materials simplified
    const materials = formData.materials.map(m => m.split(' ')[0]).join('/');
    
    return `${formData.standType} display, ${formData.standWidth}x${formData.standDepth}x${formData.standHeight}cm, ${materials}, ${formData.standBaseColor}, ${formData.shelfCount} shelves, ${formData.frontFaceCount}x${formData.backToBackCount} ${formData.product} products, retail environment, photorealistic`;
  }

  static generateTrinityPrompts(formData: FormData) {
    const base = PromptGenerator.generateTrinityPrompt(formData);
    return {
      frontView: `${base}, front view, orthographic`,
      storeView: `${base}, store aisle view, wide angle`,
      threeQuarterView: `${base}, three-quarter view, hero angle`
    };
  }

  // Legacy methods that delegate to the new system
  static generateAdvancedFrontViewPrompt = (formData: FormData) => 
    PromptGenerator.enhancedGenerator.generateFrontView(formData);
  
  static generateAdvancedStoreViewPrompt = (formData: FormData) => 
    PromptGenerator.enhancedGenerator.generateStoreView(formData);
  
  static generateAdvancedThreeQuarterViewPrompt = (formData: FormData) => 
    PromptGenerator.enhancedGenerator.generateThreeQuarterView(formData);
  
  static generateAllAdvancedPrompts = (formData: FormData) => 
    PromptGenerator.enhancedGenerator.generateAllCreativePrompts(formData);

  // Backward compatibility aliases
  static generateFrontViewPrompt = PromptGenerator.generateAdvancedFrontViewPrompt;
  static generateStoreViewPrompt = PromptGenerator.generateAdvancedStoreViewPrompt;
  static generateThreeQuarterViewPrompt = PromptGenerator.generateAdvancedThreeQuarterViewPrompt;
  static generateAllPrompts = PromptGenerator.generateAllAdvancedPrompts;

  // NEW: Creative prompt generation using improved templates
  static generateCreativePrompts = (formData: FormData) => 
    PromptGenerator.enhancedGenerator.generateAllCreativePrompts(formData);
  
  static generateCreativeFrontView = (formData: FormData) => 
    PromptGenerator.enhancedGenerator.generateFrontView(formData);
  
  static generateCreativeStoreView = (formData: FormData) => 
    PromptGenerator.enhancedGenerator.generateStoreView(formData);
  
  static generateCreativeThreeQuarterView = (formData: FormData) => 
    PromptGenerator.enhancedGenerator.generateThreeQuarterView(formData);
}
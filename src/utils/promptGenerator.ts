import { FormData } from '../types';

export class PromptGenerator {
  
  // CRITICAL: Put specifications FIRST, aesthetics LAST
  static generateFrontViewPrompt(formData: FormData): string {
    // BUILD THE PROMPT IN PRIORITY ORDER
    const specs = [
      // 1. WHAT IT IS (most important)
      `${this.getStandType(formData.standType)} POP display stand`,
      
      // 2. EXACT DIMENSIONS (critical)
      `EXACTLY ${formData.standWidth}x${formData.standDepth}x${formData.standHeight}cm`,
      
      // 3. BRAND AND PRODUCT (must be visible)
      `${formData.brand} brand`,
      `displaying ${formData.product} products`,
      
      // 4. STRUCTURE (important)
      `${formData.shelfCount} shelves`,
      `${formData.frontFaceCount} products across front`,
      `${formData.backToBackCount} products deep`,
      
      // 5. MATERIALS AND COLOR (important)
      `${formData.materials[0]} construction`,
      `${formData.standBaseColor} color scheme`,
      
      // 6. VIEW (critical for correct angle)
      `front orthographic view`,
      `straight-on perspective`,
      
      // 7. QUALITY (nice to have)
      `photorealistic`,
      `professional product photography`,
      `studio lighting`
    ];

    return specs.join(', ');
  }

  static generateStoreViewPrompt(formData: FormData): string {
    const specs = [
      // Store context FIRST
      `retail store aisle setting`,
      
      // Then the stand
      `${this.getStandType(formData.standType)} display`,
      `${formData.standWidth}cm wide`,
      `${formData.standHeight}cm tall`,
      
      // Brand visibility
      `${formData.brand} ${formData.product} products clearly visible`,
      `${formData.shelfCount} shelves fully stocked`,
      
      // Environment
      `fluorescent store lighting`,
      `other products on nearby shelves`,
      `wide angle view`,
      `photorealistic`
    ];

    return specs.join(', ');
  }

  static generateThreeQuarterViewPrompt(formData: FormData): string {
    const specs = [
      // Angle FIRST
      `three-quarter angle view`,
      
      // What it is
      `${this.getStandType(formData.standType)} display stand`,
      
      // Critical specs
      `${formData.standWidth}x${formData.standDepth}x${formData.standHeight}cm`,
      `${formData.brand} branding`,
      `${formData.product} products arranged`,
      
      // Structure
      `${formData.materials.join('/')} materials`,
      `${formData.standBaseColor} base color`,
      `${formData.shelfCount} tier design`,
      
      // Quality
      `hero shot angle`,
      `professional photography`,
      `dramatic lighting`
    ];

    return specs.join(', ');
  }

  static getStandType(standType: string): string {
    const types: Record<string, string> = {
      'Ayaklı Stant (Floor Stand)': 'floor-standing',
      'Masa Üstü Stant (Tabletop Stand)': 'countertop',
      'Duvar Stantı (Wall Mount Stand)': 'wall-mounted',
      'Köşe Stantı (Corner Stand)': 'corner',
      'Dönen Stant (Rotating Stand)': 'rotating',
      'Çok Katlı Stant (Multi-tier Stand)': 'multi-tier'
    };
    return types[standType] || standType;
  }

  static generateAllPrompts(formData: FormData) {
    return {
      frontView: this.generateFrontViewPrompt(formData),
      storeView: this.generateStoreViewPrompt(formData),
      threeQuarterView: this.generateThreeQuarterViewPrompt(formData)
    };
  }

  static generateAdvancedThreeQuarterViewPrompt = PromptGenerator.generateThreeQuarterViewPrompt;
  static generateAllAdvancedPrompts = PromptGenerator.generateAllPrompts;
}
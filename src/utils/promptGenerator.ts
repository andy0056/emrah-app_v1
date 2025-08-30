import { FormData } from '../types';

export class PromptGenerator {
  
  // CRITICAL: Put specifications FIRST, aesthetics LAST
  static generateFrontViewPrompt(formData: FormData): string {
    // BUILD THE PROMPT IN PRIORITY ORDER
    const specs = [
      // 1. WHAT IT IS (most important)
      `${this.getStandType(formData.standType)} POP display stand`,
      `no branding`,
      `no products`,
      
      // 2. EXACT DIMENSIONS (critical)
      `EXACTLY ${formData.standWidth}x${formData.standDepth}x${formData.standHeight}cm`,
      
      // 3. STRUCTURE (important)
      `${formData.shelfCount} shelves`,
      `empty shelves`,
      
      // 4. MATERIALS AND COLOR (important)
      `${formData.materials[0]} construction`,
      `${formData.standBaseColor} color scheme`,

      // 5. VIEW (critical for correct angle)
      `front orthographic view`,
      `straight-on perspective`,
      
      // 6. QUALITY (nice to have)
      `photorealistic`,
      `professional product photography`,
      `studio lighting`,
      `clean display surfaces`,
      `no text`
    ];

    return specs.join(', ');
  }

  static generateStoreViewPrompt(formData: FormData): string {
    const specs = [
      // Store context FIRST
      `retail store aisle setting`,
      `no branding`,
      `no products`,
      
      // Then the stand
      `${this.getStandType(formData.standType)} display`,
      `${formData.standWidth}cm wide`,
      `${formData.standHeight}cm tall`,

      `${formData.shelfCount} shelves`,
      `empty shelves`,
      
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
      `no branding`,
      `no products`,
      
      // What it is
      `${this.getStandType(formData.standType)} display stand`,
      
      // Critical specs
      `${formData.standWidth}x${formData.standDepth}x${formData.standHeight}cm`,
      
      // Structure
      `${formData.materials.join('/')} materials`,
      `${formData.standBaseColor} base color`,
      `${formData.shelfCount} tier design`,
      
      // Quality
      `hero shot angle`,
      `professional photography`,
      `dramatic lighting`,
      `empty shelves`,
      `clean display surfaces`,
      `no text`
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

  // Legacy method aliases for backward compatibility
  static generateAdvancedThreeQuarterViewPrompt = PromptGenerator.generateThreeQuarterViewPrompt;
  static generateAllAdvancedPrompts = PromptGenerator.generateAllPrompts;
}
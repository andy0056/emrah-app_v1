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

export class PromptGenerator {
  private static getMaterialDescription(materials: string[]): string {
    const materialMap: Record<string, string> = {
      'Metal': 'powder-coated steel with satin finish',
      'Ahşap (Wood)': 'natural wood grain with clear protective coating',
      'Plastik (Plastic)': 'injection-molded ABS with smooth surface',
      'Cam (Glass)': 'tempered glass with anti-reflective coating',
      'Karton (Cardboard)': 'high-strength corrugated cardboard with laminated surface',
      'Akrilik (Acrylic)': 'clear cast acrylic with polished edges',
      'MDF': 'high-density MDF with melamine surface',
      'Alüminyum (Aluminum)': 'brushed aluminum with anodized finish'
    };

    return materials.map(material => materialMap[material] || material.toLowerCase()).join(', ');
  }

  private static getStandTypeDescription(standType: string): string {
    const typeMap: Record<string, string> = {
      'Ayaklı Stant (Floor Stand)': 'floor',
      'Masa Üstü Stant (Tabletop Stand)': 'tabletop',
      'Duvar Stantı (Wall Mount Stand)': 'wall-mounted',
      'Köşe Stantı (Corner Stand)': 'corner',
      'Dönen Stant (Rotating Stand)': 'rotating floor',
      'Çok Katlı Stant (Multi-tier Stand)': 'multi-tier floor'
    };

    return typeMap[standType] || 'floor';
  }

  private static getInnovationHint(description: string, brand: string): string {
    // Extract innovation keywords from description
    const keywords = description.toLowerCase();
    if (keywords.includes('premium') || keywords.includes('luxury')) {
      return 'premium edge-lit acrylic header with subtle brand embossing';
    }
    if (keywords.includes('modern') || keywords.includes('tech')) {
      return 'sleek perforated side panels with geometric brand motif';
    }
    if (keywords.includes('eco') || keywords.includes('sustainable')) {
      return 'sustainable bamboo accent strips with laser-etched brand elements';
    }
    if (keywords.includes('colorful') || keywords.includes('vibrant')) {
      return 'color-changing LED strip integration along shelf edges';
    }
    return `sculpted header canopy featuring ${brand} brand identity elements`;
  }

  static generateAdvancedFrontViewPrompt(formData: FormData): string {
    const materials = this.getMaterialDescription(formData.materials);
    const standType = this.getStandTypeDescription(formData.standType);
    const innovationHint = this.getInnovationHint(formData.description, formData.brand);
    
    // Calculate product capacity
    const across = formData.frontFaceCount;
    const deep = formData.backToBackCount;
    const shelves = formData.shelfCount;

    return `Photorealistic product visualization of a ${standType} POP stand for ${formData.brand}, modeled strictly to scale.
External stand dimensions: ${formData.standWidth}×${formData.standDepth}×${formData.standHeight} cm. Product unit: ${formData.productWidth}×${formData.productDepth}×${formData.productHeight} cm. Must fit capacity exactly: ${across} across × ${deep} deep × ${shelves} shelves.
Materials and finishes: ${materials}. PBR realism with tight tolerances, chamfered edges, clean factory-fresh surfaces, controlled reflections.
Brand colorway: ${formData.standBaseColor}. Place the ${formData.brand} logo only on approved zones (header panel, base front), preserve clear space, no stretching or distortion.
Composition and lighting: Neutral studio front view with orthographic feel, evenly lit with polarized softboxes, ~6500K white balance; 35 mm full-frame lens, f/8, ISO 100, tack-sharp focus.
Physics and feasibility: No floating or unanchored parts; plausible hidden brackets/fasteners; realistic shelf and panel thickness; safe center of gravity; no impossible overhangs.
Innovation (feasible WOW): Include ONE signature, manufacturable hero feature: ${innovationHint}.
Quality: No watermarks or extra text, no extra logos beyond specified zones, respect proportions; do not alter stated dimensions.
View: Front orthographic view, 9:16 aspect ratio. 4K output.`;
  }

  static generateAdvancedThreeQuarterViewPrompt(formData: FormData): string {
    const materials = this.getMaterialDescription(formData.materials);
    const standType = this.getStandTypeDescription(formData.standType);
    const innovationHint = this.getInnovationHint(formData.description, formData.brand);
    
    const across = formData.frontFaceCount;
    const deep = formData.backToBackCount;
    const shelves = formData.shelfCount;

    return `Hyper-realistic 3D render of a ${standType} POP stand for ${formData.brand}, modeled to exact scale.
Stand: ${formData.standWidth}×${formData.standDepth}×${formData.standHeight} cm; Product: ${formData.productWidth}×${formData.productDepth}×${formData.productHeight} cm; Capacity: ${across} across × ${deep} deep × ${shelves} shelves (must fit).
Materials and finishes: ${materials}. Emphasize material contrast (satin vs gloss), realistic acrylic translucency, soft micro-highlights; factory-fresh cleanliness.
Branding: ${formData.standBaseColor}. Logos only in approved zones (header panel, side panels), crisp and undistorted.
Camera and lighting: Three-quarter hero angle, 35–50 mm lens, slight perspective; key + fill + rim for separation; balanced highlights without clipping, photoreal shadows; 4K clarity.
Feasibility constraints: No levitation, plausible structure and fasteners, realistic shelf/panel thickness, safe center of gravity, buildable connections.
WOW (but practical): ONE striking, manufacturable hero feature: ${innovationHint}.
Quality: No watermarks or text overlays; preserve true-to-scale proportions and stated dimensions.
View: Three-quarter perspective, 3:4 aspect ratio.`;
  }

  static generateAdvancedStoreViewPrompt(formData: FormData): string {
    const materials = this.getMaterialDescription(formData.materials);
    const standType = this.getStandTypeDescription(formData.standType);
    const innovationHint = this.getInnovationHint(formData.description, formData.brand);
    
    const across = formData.frontFaceCount;
    const deep = formData.backToBackCount;
    const shelves = formData.shelfCount;

    return `Photorealistic supermarket aisle scene featuring the ${formData.brand} ${standType} stand at exact scale.
Stand: ${formData.standWidth}×${formData.standDepth}×${formData.standHeight} cm; Product: ${formData.productWidth}×${formData.productDepth}×${formData.productHeight} cm; Capacity: ${across} across × ${deep} deep × ${shelves} shelves (must fit).
Materials and finishes: ${materials}. Accurate brand colorway ${formData.standBaseColor}. Logos only in approved zones (header, base front), clean and sharp.
Lighting and scene: Retail ambient (fluorescent/LED) with slight falloff, soft shadows, realistic color rendering; grounded contact shadows, no floating. Nearby shelves/products present but softly de-emphasized to keep the stand hero. Modern grocery store environment with polished concrete floors, overhead lighting fixtures visible.
Physics/buildability: Plausible assembly and anchoring; realistic panel and shelf thicknesses; safe center of gravity; no impossible overhangs.
Innovative yet practical: ONE eye-catching, manufacturable feature: ${innovationHint}, fabricated with common retail methods (sheet metal, ABS, acrylic, vinyl).
Quality: No watermarks or extra text; preserve proportions and stated dimensions.
View: Wide-angle store context, 16:9 aspect ratio, shallow depth of field focusing on the stand.`;
  }

  static generateAllAdvancedPrompts(formData: FormData) {
    return {
      frontView: this.generateAdvancedFrontViewPrompt(formData),
      storeView: this.generateAdvancedStoreViewPrompt(formData),
      threeQuarterView: this.generateAdvancedThreeQuarterViewPrompt(formData)
    };
  }

  // Legacy methods for backward compatibility
  static generateFrontViewPrompt = this.generateAdvancedFrontViewPrompt;
  static generateStoreViewPrompt = this.generateAdvancedStoreViewPrompt;
  static generateThreeQuarterViewPrompt = this.generateAdvancedThreeQuarterViewPrompt;
  static generateAllPrompts = this.generateAllAdvancedPrompts;
}
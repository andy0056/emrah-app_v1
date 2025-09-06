import { FormData } from '../types';

/**
 * Optimized Prompt Generator - 30-40% shorter while maintaining impact
 * Focus on critical specifications + creative approach + manufacturability
 */
export class OptimizedPromptGenerator {
  
  static generateFrontViewPrompt(formData: FormData): string {
    const specs = this.buildCoreSpecs(formData);
    const theme = this.selectCreativeTheme();
    
    return `Professional ${this.getStandType(formData.standType)} display: ${specs.dimensions}, ${specs.shelfConfig}, ${specs.material}, ${formData.standBaseColor || '#FFFFFF'} finish.

CREATIVE: ${theme.name} - ${theme.coreDescription}

STRUCTURE: ${specs.structuralLogic}

MANUFACTURING: ${specs.manufacturingNote}

Front orthographic view, studio lighting, photorealistic, no branding/products, empty shelves, ${theme.uniqueFeature}.

Square format.`;
  }

  static generateStoreViewPrompt(formData: FormData): string {
    const specs = this.buildCoreSpecs(formData);
    const theme = this.selectCreativeTheme();
    
    return `Retail environment: ${this.getStandType(formData.standType)} display ${specs.dimensions} as store centerpiece.

DESIGN: ${theme.name} approach - ${theme.environmentDescription}

CONTEXT: Premium retail space, ${specs.visualFootprint}, fluorescent lighting, surrounding products.

${specs.customerEngagement} ${theme.retailImpact}

Wide-angle store view, photorealistic, no branding/products, focus on display prominence.

Square format.`;
  }

  static generateThreeQuarterViewPrompt(formData: FormData): string {
    const specs = this.buildCoreSpecs(formData);
    const theme = this.selectCreativeTheme();
    
    return `Three-quarter hero shot: ${this.getStandType(formData.standType)} display revolutionizing POP design.

INNOVATION: ${theme.name} - ${theme.heroDescription}

ENGINEERING: ${specs.dimensions}, ${specs.stabilityNote}, ${specs.materialTech}

${specs.designNarrative} ${theme.philosophyStatement}

Architectural photography, dramatic lighting, manufacturing-ready design, no branding/products.

Square format.`;
  }

  private static buildCoreSpecs(formData: FormData) {
    const shelfHeight = Math.floor((formData.standHeight - 20) / formData.shelfCount);
    const productsPerShelf = Math.ceil(formData.standWidth / formData.productWidth);
    const totalCapacity = productsPerShelf * formData.shelfCount * formData.backToBackCount;
    const material = formData.materials[0] || 'Metal';
    
    return {
      dimensions: `${formData.standWidth}×${formData.standDepth}×${formData.standHeight}cm`,
      shelfConfig: `${formData.shelfCount} shelves (${shelfHeight}cm spacing)`,
      material: this.getMaterialShort(material),
      structuralLogic: `${formData.standHeight}cm height divided into ${formData.shelfCount} zones for ${formData.productHeight}cm products`,
      manufacturingNote: this.getManufacturingShort(material),
      visualFootprint: `${formData.standWidth / 100}m linear space`,
      customerEngagement: `Designed for ${totalCapacity} units (${formData.frontFaceCount} front-facing).`,
      stabilityNote: `${formData.standDepth}cm base prevents tipping`,
      materialTech: this.getMaterialTech(material),
      designNarrative: `${formData.standWidth}×${formData.standDepth}×${formData.standHeight}cm geometric form balances display efficiency with visual impact.`
    };
  }

  private static getMaterialShort(material: string): string {
    const materials: Record<string, string> = {
      'Metal': 'powder-coated steel',
      'Ahşap (Wood)': 'engineered hardwood',
      'Plastik (Plastic)': 'injection-molded thermoplastic',
      'Akrilik (Acrylic)': 'laser-cut acrylic',
      'MDF': 'CNC-routed MDF'
    };
    return materials[material] || materials['Metal'];
  }

  private static getManufacturingShort(material: string): string {
    const constraints: Record<string, string> = {
      'Metal': 'Standard steel construction, welded joints, CNC mounting plates',
      'Ahşap (Wood)': 'Standard lumber dimensions, dowel/screw joinery',
      'Plastik (Plastic)': 'Injection-molded components, snap-fit assembly',
      'Akrilik (Acrylic)': 'Laser-cut sheets, solvent-welded joints',
      'MDF': 'CNC-routed panels, mechanical fasteners'
    };
    return constraints[material] || constraints['Metal'];
  }

  private static getMaterialTech(material: string): string {
    const tech: Record<string, string> = {
      'Metal': 'advanced powder coating',
      'Ahşap (Wood)': 'architectural-grade finishing',
      'Plastik (Plastic)': 'UV-stable engineering plastics',
      'Akrilik (Acrylic)': 'optical-grade acrylic',
      'MDF': 'premium laminate systems'
    };
    return tech[material] || tech['Metal'];
  }

  private static selectCreativeTheme() {
    const themes = [
      {
        name: "Parametric Architecture",
        coreDescription: "algorithmic curves within structural precision",
        environmentDescription: "computational geometry creates dynamic retail flow",
        heroDescription: "mathematical poetry applied to retail environments",
        uniqueFeature: "organic flowing curves challenge rectilinear expectations",
        retailImpact: "Mathematical proportions create subconscious visual appeal.",
        philosophyStatement: "Algorithmic beauty demonstrates technical mastery."
      },
      {
        name: "Biomimetic Structure", 
        coreDescription: "nature's engineering principles optimize material efficiency",
        environmentDescription: "organic structural rhythm creates biophilic retail comfort",
        heroDescription: "evolutionary optimization meets commercial design",
        uniqueFeature: "natural structural logic creates intrinsic visual interest",
        retailImpact: "Biophilic elements trigger positive psychological response.",
        philosophyStatement: "Natural inspiration creates superior performance."
      },
      {
        name: "Kinetic Modularity",
        coreDescription: "transformative design with subtle movement potential", 
        environmentDescription: "interactive elements create evolving visual interest",
        heroDescription: "adaptive design responding to retail dynamics",
        uniqueFeature: "movement suggestions create extended engagement",
        retailImpact: "Kinetic potential generates curiosity and interaction.",
        philosophyStatement: "Adaptive systems maintain structural integrity."
      },
      {
        name: "Geometric Deconstruction",
        coreDescription: "controlled asymmetry creates compelling visual tension",
        environmentDescription: "angular drama disrupts predictable retail patterns",
        heroDescription: "deconstructivist precision challenges design conventions",
        uniqueFeature: "geometric complexity extends viewing time",
        retailImpact: "Angular relationships create visual anchor points.",
        philosophyStatement: "Controlled disruption maintains functional integrity."
      },
      {
        name: "Material Transparency",
        coreDescription: "layered transparency creates sophisticated depth",
        environmentDescription: "material sophistication integrates with lighting design",
        heroDescription: "architectural exploration of light and material interaction",
        uniqueFeature: "transparency layers create visual sophistication",
        retailImpact: "Material depth signals premium positioning.",
        philosophyStatement: "Material honesty combined with fabrication sophistication."
      }
    ];
    
    return themes[Math.floor(Math.random() * themes.length)];
  }

  private static getStandType(standType: string): string {
    const types: Record<string, string> = {
      'Ayaklı Stant (Floor Stand)': 'floor-standing architectural',
      'Masa Üstü Stant (Tabletop Stand)': 'precision countertop',
      'Duvar Stantı (Wall Mount Stand)': 'wall-integrated',
      'Köşe Stantı (Corner Stand)': 'corner-optimized',
      'Dönen Stant (Rotating Stand)': 'rotating kinetic',
      'Çok Katlı Stant (Multi-tier Stand)': 'multi-level vertical'
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
}
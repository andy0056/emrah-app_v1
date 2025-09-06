import { FormData } from '../types';

/**
 * Advanced Prompt Generator addressing client feedback:
 * 1. Strict dimension and quantity adherence
 * 2. Non-mainstream creative designs
 * 3. Producible design validation
 * 4. Stable display types and dimensions
 */
export class AdvancedPromptGenerator {
  
  static generateFrontViewPrompt(formData: FormData): string {
    const dimensionalConstraints = this.buildDimensionalConstraints(formData);
    const creativeTheme = this.selectAdvancedCreativeTheme();
    const producibilityRules = this.getProducibilityConstraints(formData.materials);
    
    return `Professional product photography of an innovative ${this.getStandType(formData.standType)} retail display system. 

MANDATORY SPECIFICATIONS (CRITICAL):
- Exact dimensions: ${dimensionalConstraints.overallDimensions}
- Shelf configuration: ${dimensionalConstraints.shelfSpecs}
- Product capacity: ${dimensionalConstraints.productCapacity}
- Material construction: ${producibilityRules.primaryMaterial}
- Color scheme: ${formData.standBaseColor || '#FFFFFF'}
- Stand type: ${formData.standType}

CREATIVE DESIGN APPROACH - ${creativeTheme.name}:
${creativeTheme.description}

STRUCTURAL REQUIREMENTS:
${dimensionalConstraints.structuralNarrative}

PRODUCIBILITY CONSTRAINTS:
${producibilityRules.constraints}

VIEW: Perfect front orthographic view, professional studio lighting, ultra-high resolution, photorealistic detail. No branding, no products, empty display surfaces. Focus on innovative design that stands out from standard POP displays while maintaining manufacturing feasibility.

CREATIVE DIFFERENTIATION: ${creativeTheme.uniqueElements}

Format: Square aspect ratio, centered composition.`;
  }

  static generateStoreViewPrompt(formData: FormData): string {
    const dimensionalConstraints = this.buildDimensionalConstraints(formData);
    const creativeTheme = this.selectAdvancedCreativeTheme();
    const contextualRules = this.getStoreContextRules(formData.standType);
    
    return `Photorealistic wide-angle retail environment photography showing an innovative ${this.getStandType(formData.standType)} display in its natural commercial setting.

DIMENSIONAL PRECISION:
- Display footprint: ${dimensionalConstraints.footprint}
- Height clearance: ${dimensionalConstraints.heightWithContext}
- Shelf accessibility: ${dimensionalConstraints.shelfAccess}
- Product positioning: ${dimensionalConstraints.productLayout}

CREATIVE APPROACH - ${creativeTheme.name}:
${creativeTheme.environmentalIntegration}

STORE CONTEXT:
${contextualRules.description}

VISUAL HIERARCHY:
The ${formData.standWidth}cm × ${formData.standDepth}cm × ${formData.standHeight}cm display dominates the retail space with ${dimensionalConstraints.visualImpact}. ${creativeTheme.customerMagnetism} creating an irresistible focal point.

LIGHTING & ATMOSPHERE:
Professional retail lighting emphasizes the display's unique architecture while maintaining practical visibility for customer interaction.

VIEW: Wide-angle store perspective showing the display in context with surrounding retail elements. No branding, no products, focus on the stand's innovative design impact.

Format: Square aspect ratio, environmental context.`;
  }

  static generateThreeQuarterViewPrompt(formData: FormData): string {
    const dimensionalConstraints = this.buildDimensionalConstraints(formData);
    const creativeTheme = this.selectAdvancedCreativeTheme();
    const engineeringSpecs = this.getEngineeringConstraints(formData);
    
    return `Museum-quality three-quarter perspective photography of an avant-garde ${this.getStandType(formData.standType)} retail display that revolutionizes POP design standards.

PRECISION ENGINEERING:
- Overall envelope: ${dimensionalConstraints.overallDimensions}
- Structural system: ${engineeringSpecs.framework}
- Weight distribution: ${engineeringSpecs.stability}
- Assembly logic: ${engineeringSpecs.modularity}

CREATIVE REVOLUTION - ${creativeTheme.name}:
${creativeTheme.heroDescription}

DIMENSIONAL MASTERY:
${dimensionalConstraints.threedimensionalNarrative}

MATERIAL INNOVATION:
${this.getAdvancedMaterialTreatment(formData.materials)} with ${creativeTheme.materialInnovation}

DESIGN PHILOSOPHY:
This display transcends traditional POP conventions through ${creativeTheme.designPhilosophy}, while maintaining strict adherence to manufacturing constraints and retail functionality.

LIGHTING DRAMA:
Professional architectural photography lighting reveals every innovative detail, emphasizing the interplay between form, function, and manufacturing precision.

VIEW: Dynamic three-quarter angle showcasing the complete design story, structural relationships, and innovative details. No branding, no products, emphasis on architectural photography quality.

MANUFACTURABILITY: All design elements conform to standard production methods with ${formData.materials.join(' and ')} construction.

Format: Square aspect ratio, hero composition.`;
  }

  private static buildDimensionalConstraints(formData: FormData) {
    const shelfHeight = Math.floor((formData.standHeight - 20) / formData.shelfCount); // 20cm for base/top
    const productsPerShelf = Math.ceil(formData.standWidth / formData.productWidth);
    const totalProductCapacity = productsPerShelf * formData.shelfCount * formData.backToBackCount;
    
    return {
      overallDimensions: `${formData.standWidth}cm W × ${formData.standDepth}cm D × ${formData.standHeight}cm H`,
      footprint: `${formData.standWidth}cm × ${formData.standDepth}cm floor space`,
      shelfSpecs: `${formData.shelfCount} shelves, each ${formData.shelfWidth}cm × ${formData.shelfDepth}cm × ${shelfHeight}cm spacing`,
      productCapacity: `designed for ${totalProductCapacity} units (${productsPerShelf} per shelf, ${formData.backToBackCount} rows deep)`,
      heightWithContext: `${formData.standHeight}cm total height (eye-level optimization)`,
      shelfAccess: `shelf spacing optimized for ${formData.productHeight}cm tall products`,
      productLayout: `${formData.frontFaceCount} front-facing units per shelf row`,
      visualImpact: `commanding ${formData.standWidth / 100}m of linear retail space`,
      structuralNarrative: `The ${formData.standHeight}cm vertical architecture is divided into ${formData.shelfCount} functional zones, each precisely ${shelfHeight}cm tall to accommodate ${formData.productHeight}cm products with optimal visibility`,
      threedimensionalNarrative: `The ${formData.standWidth}×${formData.standDepth}×${formData.standHeight}cm form creates a sophisticated geometric relationship between horizontal display planes and vertical structural elements`
    };
  }

  private static getProducibilityConstraints(materials: string[]) {
    const primaryMaterial = materials[0] || 'Metal';
    
    const constraints: Record<string, any> = {
      'Metal': {
        primaryMaterial: 'powder-coated steel framework with welded joints',
        constraints: 'Standard tube steel construction (25×25mm), CNC-cut mounting plates, standard hardware fasteners. Maximum unsupported span: 80cm. All joints accessible for assembly.'
      },
      'Ahşap (Wood)': {
        primaryMaterial: 'engineered hardwood with veneer finish',
        constraints: 'Standard lumber dimensions, dowel/screw joinery, edge-banded panels. Moisture-sealed finish. All cuts standard workshop equipment.'
      },
      'Plastik (Plastic)': {
        primaryMaterial: 'injection-molded thermoplastic components',
        constraints: 'Standard mold dimensions, snap-fit assemblies, UV-stable resins. Draft angles 2°+, wall thickness 3mm+.'
      },
      'Akrilik (Acrylic)': {
        primaryMaterial: 'laser-cut acrylic with polished edges',
        constraints: 'Standard sheet thicknesses (3-10mm), laser-cut tolerances, solvent-welded joints. Stress relief required.'
      },
      'MDF': {
        primaryMaterial: 'CNC-routed MDF with laminate finish',
        constraints: 'Standard sheet sizes (122×244cm), routed edges, mechanical fasteners. Sealed edges to prevent moisture.'
      }
    };
    
    return constraints[primaryMaterial] || constraints['Metal'];
  }

  private static selectAdvancedCreativeTheme() {
    const themes = [
      {
        name: "Parametric Architecture",
        description: "Inspired by contemporary parametric design, featuring algorithmic curves and mathematical precision in structural elements",
        uniqueElements: "Computational geometry creates organic flowing curves within rigid structural framework, challenging traditional rectilinear POP expectations",
        environmentalIntegration: "The parametric curves create dynamic shadows and visual rhythm that draws customers through mathematical beauty",
        heroDescription: "Architectural photography captures the mathematical poetry of computational design applied to retail environments",
        customerMagnetism: "Mathematical curves create subconscious visual appeal through golden ratio proportions",
        materialInnovation: "precision-bent elements that showcase manufacturing sophistication",
        designPhilosophy: "algorithmic beauty that demonstrates technical mastery while maintaining human-scale accessibility"
      },
      {
        name: "Biomimetic Structure",
        description: "Drawing from natural structural systems - honeycomb efficiency, tree branching, crystalline growth patterns",
        uniqueElements: "Natural structural logic creates intrinsic visual interest while optimizing material usage and structural efficiency",
        environmentalIntegration: "Organic structural rhythm creates subconscious comfort and biophilic appeal in retail environments",
        heroDescription: "Scientific photography reveals nature's engineering principles applied to commercial design challenges",
        customerMagnetism: "Biophilic design elements trigger positive psychological response through natural pattern recognition",
        materialInnovation: "bio-inspired structural joints that demonstrate engineering innovation",
        designPhilosophy: "evolutionary optimization principles that create superior performance through natural inspiration"
      },
      {
        name: "Kinetic Modularity",
        description: "Modular system with subtle movement potential - rotating elements, adjustable components, transformative configurations",
        uniqueElements: "Interactive design elements that suggest movement and adaptability, breaking static display conventions",
        environmentalIntegration: "Kinetic potential creates dynamic visual interest that evolves throughout the day with customer interaction",
        heroDescription: "Industrial design photography emphasizes mechanical precision and movement potential in every joint and connection",
        customerMagnetism: "Subtle movement suggestions create curiosity and extended visual engagement",
        materialInnovation: "precision-engineered pivot points and adjustment mechanisms",
        designPhilosophy: "adaptive design that responds to changing retail needs while maintaining structural integrity"
      },
      {
        name: "Geometric Deconstruction",
        description: "Deconstructivist approach with intentional asymmetry, angular intersections, and geometric complexity",
        uniqueElements: "Controlled chaos through geometric precision - angles that shouldn't work but create compelling visual tension",
        environmentalIntegration: "Angular drama creates powerful visual anchor points that disrupt predictable retail rhythms",
        heroDescription: "Architectural photography captures the controlled tension between order and disruption in three-dimensional space",
        customerMagnetism: "Geometric complexity creates extended viewing time as the eye explores angular relationships",
        materialInnovation: "complex angular joints that showcase precision manufacturing capabilities",
        designPhilosophy: "deconstructivist principles that challenge expectations while maintaining functional integrity"
      },
      {
        name: "Material Transparency",
        description: "Explores transparency, translucency, and material layering to create depth and visual lightness",
        uniqueElements: "Layered transparency creates visual depth and sophisticated material interaction that transcends basic construction",
        environmentalIntegration: "Material transparency allows the display to integrate with lighting design and surrounding visual elements",
        heroDescription: "Architectural photography captures light transmission, reflection, and refraction through multiple material layers",
        customerMagnetism: "Material sophistication signals premium brand positioning and design consciousness",
        materialInnovation: "precision-layered transparent and translucent elements",
        designPhilosophy: "material honesty combined with sophisticated fabrication techniques"
      }
    ];
    
    return themes[Math.floor(Math.random() * themes.length)];
  }

  private static getStoreContextRules(standType: string) {
    const contexts: Record<string, any> = {
      'Ayaklı Stant (Floor Stand)': {
        description: "Premium retail environment with 3.5m ceiling height, polished concrete floors, contemporary lighting systems. The display commands significant floor real estate as a destination fixture."
      },
      'Masa Üstü Stant (Tabletop Stand)': {
        description: "High-end checkout counter environment with premium materials, integrated POS systems, and carefully curated impulse purchase ecosystem."
      },
      'Duvar Stantı (Wall Mount Stand)': {
        description: "Sophisticated wall-mounted installation integrated with retail architecture, complementing existing shelving systems and wayfinding elements."
      }
    };
    
    return contexts[standType] || contexts['Ayaklı Stant (Floor Stand)'];
  }

  private static getEngineeringConstraints(formData: FormData) {
    const materials = formData.materials[0] || 'Metal';
    
    return {
      framework: `${materials.toLowerCase()} structural system optimized for ${formData.standHeight}cm height and ${formData.shelfCount}-shelf load distribution`,
      stability: `engineered base dimensions (${formData.standDepth}cm depth) prevent tipping while minimizing footprint`,
      modularity: `component system allows field assembly with standard tools and hardware`
    };
  }

  private static getAdvancedMaterialTreatment(materials: string[]) {
    const treatments: Record<string, string> = {
      'Metal': 'Precision-engineered steel framework with advanced powder coating technology',
      'Ahşap (Wood)': 'Sustainably-sourced hardwood with architectural-grade finishing',
      'Plastik (Plastic)': 'Engineering-grade thermoplastics with advanced UV stabilization',
      'Akrilik (Acrylic)': 'Optical-grade acrylic with precision-polished edges',
      'MDF': 'High-density engineered substrate with premium laminate systems'
    };
    
    const primary = materials[0] || 'Metal';
    return treatments[primary] || treatments['Metal'];
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
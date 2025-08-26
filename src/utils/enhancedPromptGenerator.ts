import { BrandPersonalityEngine } from './brandPersonalityEngine';
import { MetaphorLibrary } from './metaphorLibrary';
import { InnovationEngine } from './innovationEngine';
import { PromptOptimizer } from './promptOptimizer';

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

export class EnhancedPromptGenerator {
  private brandEngine: BrandPersonalityEngine;
  private metaphorLib: MetaphorLibrary;
  private innovationEngine: InnovationEngine;

  constructor() {
    this.brandEngine = new BrandPersonalityEngine();
    this.metaphorLib = new MetaphorLibrary();
    this.innovationEngine = new InnovationEngine();
  }

  /**
   * Convert dimensions to creative proportional descriptions
   * NEVER mention exact measurements!
   */
  private getProportionalDescription(data: FormData): {
    scale: string;
    proportion: string;
    presence: string;
    footprint: string;
  } {
    const heightRatio = data.standHeight / data.standWidth;
    const aspectRatio = data.standWidth / data.standDepth;
    const volumePresence = (data.standWidth * data.standDepth * data.standHeight) / 1000000; // cubic meters

    // Scale description based on height
    let scale = '';
    if (data.standHeight < 50) {
      scale = 'intimate countertop scale that invites close inspection';
    } else if (data.standHeight < 100) {
      scale = 'approachable mid-height display at comfortable browsing level';
    } else if (data.standHeight < 150) {
      scale = 'confident eye-level presence commanding attention';
    } else {
      scale = 'towering flagship display creating a retail landmark';
    }

    // Proportion description based on ratios
    let proportion = '';
    if (heightRatio > 4) {
      proportion = 'elegantly slender silhouette reaching skyward';
    } else if (heightRatio > 2.5) {
      proportion = 'balanced vertical stance with graceful proportions';
    } else if (heightRatio > 1.5) {
      proportion = 'robust and stable form with substantial presence';
    } else {
      proportion = 'wide horizontal emphasis creating a display stage';
    }

    // Presence based on volume
    let presence = '';
    if (volumePresence < 0.05) {
      presence = 'compact efficiency maximizing every cubic inch';
    } else if (volumePresence < 0.15) {
      presence = 'space-conscious design fitting seamlessly in tight aisles';
    } else if (volumePresence < 0.3) {
      presence = 'commanding retail footprint creating a destination';
    } else {
      presence = 'monumental scale transforming the retail landscape';
    }

    // Footprint description
    let footprint = '';
    if (aspectRatio > 2) {
      footprint = 'linear arrangement perfect for aisle end-caps';
    } else if (aspectRatio > 1.3) {
      footprint = 'rectangular footprint optimized for corner placement';
    } else {
      footprint = 'square stance creating 360-degree shopping experience';
    }

    return { scale, proportion, presence, footprint };
  }

  /**
   * Generate concise shelf specification 
   */
  private getShelfSpec(data: FormData): string {
    const brand = this.brandEngine.getPersonality(data.brand);
    const shelfCount = data.shelfCount;
    const productTotal = data.frontFaceCount * data.backToBackCount;
    
    return `${shelfCount} ${brand.primaryTrait} shelves holding ${productTotal} ${data.product} units (${data.frontFaceCount} front-facing)`;
  }

  /**
   * Generate material descriptions that inspire rather than specify
   */
  private getMaterialNarrative(materials: string[], brand: string): string {
    const brandPersonality = this.brandEngine.getPersonality(brand);
    const materialStories: Record<string, Record<string, string>> = {
      'Metal': {
        'premium': 'brushed titanium-finish metal exuding luxury',
        'energetic': 'powder-coated steel in electric colors pulsing with energy',
        'trustworthy': 'satin-finish aluminum conveying reliability',
        'playful': 'glossy metallic surfaces reflecting joy',
        'default': 'sleek metallic framework'
      },
      'Ahşap (Wood)': {
        'premium': 'rich walnut grain with hand-rubbed finish',
        'energetic': 'light bamboo bringing natural dynamism',
        'trustworthy': 'solid oak conveying heritage and stability',
        'playful': 'colorful laminated birch with visible grain',
        'default': 'warm wood tones'
      },
      'Akrilik (Acrylic)': {
        'premium': 'crystal-clear acrylic with diamond-polished edges',
        'energetic': 'fluorescent edge-lit acrylic glowing with vitality',
        'trustworthy': 'frosted acrylic providing gentle diffusion',
        'playful': 'rainbow-tinted acrylic creating prismatic effects',
        'default': 'pristine acrylic elements'
      },
      'Plastik (Plastic)': {
        'premium': 'high-grade polymer with silk-touch finish',
        'energetic': 'translucent plastic with internal light diffusion',
        'trustworthy': 'durable composite materials built to last',
        'playful': 'colorful injection-molded elements',
        'default': 'modern polymer construction'
      },
      'Cam (Glass)': {
        'premium': 'architectural glass with beveled edges',
        'energetic': 'tempered glass with subtle tinting',
        'trustworthy': 'safety glass providing clear visibility',
        'playful': 'colored glass creating rainbow effects',
        'default': 'transparent glass panels'
      },
      'Karton (Cardboard)': {
        'premium': 'sustainable honeycomb cardboard with premium lamination',
        'energetic': 'corrugated cardboard with vibrant printing',
        'trustworthy': 'eco-friendly cardboard construction',
        'playful': 'colorful cardboard with playful patterns',
        'default': 'sturdy cardboard structure'
      },
      'MDF': {
        'premium': 'precision-cut MDF with melamine finish',
        'energetic': 'painted MDF in energetic colors',
        'trustworthy': 'high-density MDF providing stability',
        'playful': 'colored MDF with rounded edges',
        'default': 'smooth MDF construction'
      },
      'Alüminyum (Aluminum)': {
        'premium': 'anodized aluminum with brushed finish',
        'energetic': 'powder-coated aluminum in vibrant hues',
        'trustworthy': 'industrial-grade aluminum framework',
        'playful': 'colored aluminum with polished accents',
        'default': 'lightweight aluminum structure'
      }
    };

    const narratives = materials.map(material => {
      const materialMap = materialStories[material] || materialStories['Metal'];
      return materialMap[brandPersonality.primaryTrait] || materialMap['default'];
    });

    return this.combineWithFlow(narratives);
  }

  /**
   * Combine elements with natural language flow
   */
  private combineWithFlow(elements: string[]): string {
    if (elements.length === 1) return elements[0];
    if (elements.length === 2) return `${elements[0]} harmonizing with ${elements[1]}`;
    
    const last = elements.pop();
    return `${elements.join(', ')}, unified by ${last}`;
  }

  /**
   * Generate the hero innovation feature
   */
  private generateHeroFeature(data: FormData): string {
    const brand = this.brandEngine.getPersonality(data.brand);
    const context = this.extractContext(data.description);
    
    return this.innovationEngine.generateFeature({
      brand: data.brand,
      brandTraits: brand,
      context: context,
      materials: data.materials,
      standType: data.standType
    });
  }

  /**
   * Extract context from description
   */
  private extractContext(description: string): string[] {
    const contexts = [];
    const desc = description.toLowerCase();
    
    if (desc.includes('ışık') || desc.includes('led') || desc.includes('light')) {
      contexts.push('illuminated');
    }
    if (desc.includes('premium') || desc.includes('luxury') || desc.includes('özel')) {
      contexts.push('premium');
    }
    if (desc.includes('yenilik') || desc.includes('innovat') || desc.includes('modern')) {
      contexts.push('innovative');
    }
    if (desc.includes('dikkat') || desc.includes('attention') || desc.includes('göze')) {
      contexts.push('attention-grabbing');
    }
    if (desc.includes('300 adet') || desc.includes('mass') || desc.includes('çok')) {
      contexts.push('scalable');
    }
    
    return contexts;
  }

  /**
   * Generate arrangement pattern based on brand and product
   */
  private getArrangementPattern(data: FormData): string {
    const brand = this.brandEngine.getPersonality(data.brand);
    const productCount = data.frontFaceCount * data.backToBackCount * data.shelfCount;
    
    const patterns: Record<string, string[]> = {
      'premium': [
        'products displayed like precious gems in a jewelry case',
        'minimalist grid creating breathing space between each item',
        'museum-quality presentation with spotlight emphasis'
      ],
      'energetic': [
        'dynamic cascade of products creating visual motion',
        'explosive burst pattern radiating from center',
        'zigzag arrangement generating kinetic energy'
      ],
      'trustworthy': [
        'perfectly aligned rows conveying order and reliability',
        'systematic grid ensuring every product is accessible',
        'tiered presentation allowing clear visibility'
      ],
      'playful': [
        'products dancing in a playful spiral',
        'rainbow arc arrangement creating visual delight',
        'checkerboard pattern adding graphic interest'
      ]
    };
    
    const brandPatterns = patterns[brand.primaryTrait] || patterns['trustworthy'];
    const selectedPattern = brandPatterns[Math.floor(Math.random() * brandPatterns.length)];
    
    if (productCount > 20) {
      return `${selectedPattern}, creating abundance through repetition`;
    }
    return selectedPattern;
  }

  /**
   * Generate shelf structure descriptions based on form specifications
   */
  private getShelfStructure(data: FormData): string {
    const brand = this.brandEngine.getPersonality(data.brand);
    const shelfCount = data.shelfCount;
    const proportions = this.getProportionalDescription(data);
    
    let shelfDescription = '';
    
    // Base description based on shelf count
    if (shelfCount === 1) {
      shelfDescription = 'featuring a single prominent display platform';
    } else if (shelfCount === 2) {
      shelfDescription = 'with dual-tier shelving creating visual hierarchy';
    } else if (shelfCount <= 4) {
      shelfDescription = `showcasing multiple tiered levels cascading elegantly`;
    } else {
      shelfDescription = `with abundant multi-level shelving creating a tower of product presentation`;
    }
    
    // Add brand-specific shelf styling
    const shelfStyles: Record<string, string[]> = {
      'premium': [
        'floating glass shelves with invisible supports',
        'curved acrylic platforms that seem to defy gravity', 
        'individually spotlit display ledges',
        'museum-style stepped platforms'
      ],
      'energetic': [
        'angular geometric shelves creating dynamic rhythm',
        'LED-backlit platforms pulsing with brand energy',
        'zigzag shelf arrangement generating visual motion',
        'explosive starburst shelf configuration'
      ],
      'trustworthy': [
        'systematically arranged horizontal platforms',
        'sturdy, reliable shelving with clean lines',
        'perfectly aligned display levels',
        'methodical tier structure ensuring accessibility'
      ],
      'playful': [
        'organically curved shelves like flower petals',
        'rainbow-arranged platforms in ascending heights',
        'whimsical stepped levels creating visual dance',
        'artistic shelf curves suggesting movement'
      ]
    };
    
    const shelfStyleOptions = shelfStyles[brand.primaryTrait] || shelfStyles['trustworthy'];
    const selectedStyle = shelfStyleOptions[Math.floor(Math.random() * shelfStyleOptions.length)];
    
    return `${shelfDescription}, ${selectedStyle}`;
  }

  /**
   * Generate product arrangement based on shelf specifications
   */
  private getProductShelfArrangement(data: FormData): string {
    const brand = this.brandEngine.getPersonality(data.brand);
    const totalProducts = data.frontFaceCount * data.backToBackCount;
    const shelfCount = data.shelfCount;
    const productsPerShelf = Math.ceil(totalProducts / shelfCount);
    
    let arrangementBase = '';
    
    if (shelfCount === 1) {
      arrangementBase = `${totalProducts} ${data.product} units arranged across the single display platform`;
    } else {
      arrangementBase = `${data.product} units thoughtfully distributed across ${shelfCount} levels, with approximately ${productsPerShelf} products per tier`;
    }
    
    const arrangementStyles: Record<string, string[]> = {
      'premium': [
        'each product positioned with museum-quality precision',
        'products nestled in individual spotlight zones',
        'curated placement allowing each item to shine'
      ],
      'energetic': [
        'products creating dynamic visual flow between levels',
        'explosive arrangement radiating energy upward',
        'kinetic product placement suggesting constant motion'
      ],
      'trustworthy': [
        'systematic product organization ensuring easy selection',
        'orderly arrangement conveying reliability and accessibility',
        'methodical placement creating clear product visibility'
      ],
      'playful': [
        'products dancing between levels in joyful choreography',
        'whimsical arrangement creating visual storytelling',
        'playful product placement inviting discovery'
      ]
    };
    
    const styleOptions = arrangementStyles[brand.primaryTrait] || arrangementStyles['trustworthy'];
    const selectedStyle = styleOptions[Math.floor(Math.random() * styleOptions.length)];
    
    return `${arrangementBase}, ${selectedStyle}`;
  }
  /**
   * Generate store environment based on brand and product type
   */
  private getStoreEnvironment(data: FormData): string {
    // Standalone display placement options - randomize for variety
    const placements = [
      'positioned strategically at the store entrance creating an immediate brand impact',
      'placed as an island display in the main aisle drawing traffic from all directions',
      'stationed at the aisle end-cap commanding attention from the primary traffic flow',
      'positioned near checkout creating last-minute purchase opportunity',
      'placed in the center aisle as a destination shopping experience'
    ];
    
    const storeTypes = {
      'Coca-Cola': 'bustling supermarket weekend atmosphere, bright fluorescent lighting with natural daylight streaming from skylights',
      'Monster Energy': 'modern convenience store with urban energy, neon accent lighting, city street visible through large windows',
      'NIVEA': 'pristine pharmacy beauty section, soft LED track lighting, clean white tile floors creating gentle reflections',
      'PANTENE': 'upscale beauty retailer atmosphere, warm directional spotlights, polished floors and mirror accents amplifying space',
      'Whiskey': 'premium liquor store ambiance, rich wood fixtures, amber lighting creating sophisticated atmosphere',
      'paradontax': 'bright health-focused pharmacy environment, clinical white surfaces with trust-building blue accents'
    };
    
    const selectedPlacement = placements[Math.floor(Math.random() * placements.length)];
    const storeAtmosphere = storeTypes[data.brand] || 'modern retail environment with bright, welcoming atmosphere';
    
    return `${storeAtmosphere}. The standalone ${data.brand} display is ${selectedPlacement}`;
  }

  /**
   * Generate randomized creative angles for 3/4 view variety
   */
  private getCreativeAngle(data: FormData): string {
    const angles = [
      'dynamic three-quarter view from slightly above, emphasizing architectural presence',
      'dramatic low-angle perspective making the display appear monumental and inspiring',
      'elegant side-angle revealing both depth and brand storytelling elements', 
      'sculptural view from customer\'s approach angle, showing discovery journey',
      'artistic three-quarter composition highlighting material interplay and shadows',
      'retail photography angle that captures both function and visual poetry'
    ];
    
    return angles[Math.floor(Math.random() * angles.length)];
  }

  /**
   * Generate varied lighting scenarios for uniqueness
   */
  private getLightingScenario(): string {
    const scenarios = [
      'Dramatic studio lighting with key light from upper left, fill from right, and rim lighting defining edges',
      'Cinematic lighting setup with soft key light, subtle fill, and dramatic rim highlighting the silhouette',
      'Professional retail photography lighting emphasizing materials and creating gentle shadows',
      'Artistic lighting with controlled contrast, revealing texture details and dimensional depth',
      'Commercial visualization lighting that makes products glow while showcasing structure',
      'Gallery-quality lighting that treats the display as both functional furniture and art piece'
    ];
    
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  /**
   * Generate concise, specification-focused prompts
   */
  public generateFrontView(data: FormData): string {
    const brand = this.brandEngine.getPersonality(data.brand);
    const heroFeature = this.generateHeroFeature(data);
    const shelfSpec = this.getShelfSpec(data);
    
    return `${data.standType} ${data.brand} POP display stand, front view. 
STRUCTURE: ${data.standBaseColor} ${data.materials[0]} frame with ${heroFeature}.
SHELVES: ${shelfSpec}.
STYLE: ${brand.visualStyle}, photorealistic, commercial quality, white studio backdrop.`;

  public generateStoreView(data: FormData): string {
    const environment = this.getStoreEnvironment(data);
    const shelfSpec = this.getShelfSpec(data);
    const heroFeature = this.generateHeroFeature(data);
    
    return `${environment}. 
STANDALONE DISPLAY: Independent ${data.brand} ${data.standType} with ${heroFeature}.
SHELVES: ${shelfSpec}, clearly separate from store fixtures.
    const brand = this.brandEngine.getPersonality(data.brand);
    const creativeAngle = this.getCreativeAngle(data);
    const shelfSpec = this.getShelfSpec(data);
    const heroFeature = this.generateHeroFeature(data);
    
    return `${creativeAngle} of ${data.brand} ${data.standType}.
DESIGN: ${data.standBaseColor} ${data.materials[0]} construction with ${heroFeature}.
SHELVES: ${shelfSpec} clearly visible and accessible.
LIGHTING: ${this.getLightingScenario()}, ${brand.visualStyle} aesthetic.`;
  }

  /**
   * Generate all three prompts at once
   */
  public generateAllCreativePrompts(data: FormData): {
    frontView: string;
    storeView: string;
    threeQuarterView: string;
  } {
    return {
      frontView: this.generateFrontView(data),
      storeView: this.generateStoreView(data),
      threeQuarterView: this.generateThreeQuarterView(data)
    };
  }

  /**
   * Generate optimized prompts for Imagen 4
   */
  public generateOptimizedPrompts(data: FormData): {
    frontView: string;
    storeView: string;
    threeQuarterView: string;
    negativePrompt: string;
  } {
    const basePrompts = this.generateAllCreativePrompts(data);
    
    return {
      frontView: PromptOptimizer.optimizeForImagen4(basePrompts.frontView),
      storeView: PromptOptimizer.optimizeForImagen4(basePrompts.storeView),
      threeQuarterView: PromptOptimizer.optimizeForImagen4(basePrompts.threeQuarterView),
      negativePrompt: PromptOptimizer.generateNegativePrompt()
    };
  }

  /**
   * Generate negative prompts to exclude unwanted elements
   */
  public generateNegativePrompt(): string {
    return PromptOptimizer.generateNegativePrompt();
  }

  // Legacy method aliases for backward compatibility
  public generateBrandFirstPrompt = this.generateFrontView;
  public generateEnvironmentFirstPrompt = this.generateStoreView;
  public generateDesignHeroPrompt = this.generateThreeQuarterView;
  public generateHeroShotPrompt = this.generateFrontView;
  public generateStoreContextPrompt = this.generateStoreView;
  public generateBeautyShotPrompt = this.generateThreeQuarterView;
}
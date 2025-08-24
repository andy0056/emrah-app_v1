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
   * Generate store environment based on brand and product type
   */
  private getStoreEnvironment(data: FormData): string {
    const environments: Record<string, string> = {
      'Coca-Cola': 'bustling supermarket with the energy of weekend shopping, fluorescent lights mixing with natural daylight from skylights',
      'Monster Energy': 'modern convenience store with neon accents, urban street visible through glass storefront',
      'NIVEA': 'pristine pharmacy beauty section with soft LED track lighting, white tile floors reflecting gentle illumination',
      'PANTENE': 'upscale beauty retailer with warm spotlights, marble flooring, and mirrors amplifying the space',
      'Flormar': 'vibrant cosmetics boutique with artistic lighting and colorful displays creating energy',
      'Avon': 'elegant beauty section with sophisticated lighting and refined atmosphere',
      'Whiskey': 'premium liquor store with dark wood fixtures, amber lighting, leather and brass accents',
      'paradontax': 'bright health-focused pharmacy, clinical white with trust-building blue accents'
    };
    
    // Try direct match first, then partial match
    let environment = environments[data.brand];
    if (!environment) {
      const brandLower = data.brand.toLowerCase();
      for (const [key, env] of Object.entries(environments)) {
        if (key.toLowerCase().includes(brandLower) || brandLower.includes(key.toLowerCase())) {
          environment = env;
          break;
        }
      }
    }
    
    return environment || 'modern retail environment with bright, welcoming atmosphere';
  }

  /**
   * Main prompt generation methods
   */
  public generateFrontView(data: FormData): string {
    const brand = this.brandEngine.getPersonality(data.brand);
    const proportions = this.getProportionalDescription(data);
    const materials = this.getMaterialNarrative(data.materials, data.brand);
    const heroFeature = this.generateHeroFeature(data);
    const arrangement = this.getArrangementPattern(data);
    const metaphor = this.metaphorLib.getMetaphor(data.brand, 'architecture');
    
    const prompt = `${brand.visualStyle} ${data.brand} display stand photographed in pristine studio conditions. The ${proportions.proportion} structure features ${heroFeature}, embodying the brand's ${brand.adjectives[0]} spirit. ${materials} construction creates ${metaphor}. ${data.product} products arranged in ${arrangement}. Professional product photography with pure white infinity backdrop, soft graduated shadows anchoring the base. The design feels ${brand.adjectives.slice(0, 2).join(' and ')} while maintaining ${proportions.scale}. Photorealistic commercial visualization, no technical annotations, no dimension lines, no measurement indicators.`;
    
    return PromptOptimizer.cleanPrompt(prompt);
  }

  public generateStoreView(data: FormData): string {
    const brand = this.brandEngine.getPersonality(data.brand);
    const proportions = this.getProportionalDescription(data);
    const environment = this.getStoreEnvironment(data);
    const heroFeature = this.generateHeroFeature(data);
    const materials = this.getMaterialNarrative(data.materials, data.brand);
    
    const prompt = `${environment}, featuring ${data.brand}'s ${proportions.scale} display as the hero. The stand's ${heroFeature} immediately captures attention from the main aisle. ${materials} construction harmonizes with the retail environment while standing out through ${brand.colors[0]} brand accents. Real shoppers browsing nearby provide scale and context, their movement slightly blurred to keep focus on the display. Natural retail lighting creates authentic shadows and reflections. The ${proportions.footprint} fits perfectly in the space while maintaining ${brand.adjectives[0]} presence. Wide-angle retail photography, shallow depth of field, no technical overlays.`;
    
    return PromptOptimizer.cleanPrompt(prompt);
  }

  public generateThreeQuarterView(data: FormData): string {
    const brand = this.brandEngine.getPersonality(data.brand);
    const proportions = this.getProportionalDescription(data);
    const materials = this.getMaterialNarrative(data.materials, data.brand);
    const heroFeature = this.generateHeroFeature(data);
    const metaphor = this.metaphorLib.getMetaphor(data.brand, 'sculpture');
    const arrangement = this.getArrangementPattern(data);
    
    const prompt = `Sculptural ${data.brand} display viewed from dynamic three-quarter angle, revealing ${heroFeature} in full dimension. The ${proportions.proportion} form suggests ${metaphor}, while ${materials} construction creates rich interplay of surfaces and textures. ${data.product} products create ${arrangement}, visible from multiple angles. Dramatic studio lighting with key light from upper left, fill from right, and rim lighting defining edges. The ${proportions.presence} commands attention while maintaining ${brand.adjectives[1]} sophistication. Premium visualization quality with subtle reflections on studio floor, no measurement indicators or technical annotations.`;
    
    return PromptOptimizer.cleanPrompt(prompt);
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
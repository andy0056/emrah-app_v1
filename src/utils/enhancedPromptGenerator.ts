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

interface BrandProfile {
  category: 'beverage' | 'beauty' | 'pharmaceutical' | 'food' | 'electronics' | 'fashion' | 'generic';
  personality: string;
  adjectives: string[];
  signature_elements: string[];
  material_preferences: string[];
  metaphors: string[];
  attention_grabbers: string[];
  color_themes: string[];
}

interface ProportionalDescription {
  height_category: string;
  width_description: string;
  interaction_style: string;
}

export class EnhancedPromptGenerator {
  private static readonly BRAND_PROFILES: Record<string, BrandProfile> = {
    'coca-cola': {
      category: 'beverage',
      personality: 'refreshing and energetic',
      adjectives: ['refreshing', 'energetic', 'joyful', 'timeless', 'vibrant'],
      signature_elements: ['wave-shaped header', 'curved ribbon design', 'frosted cooler-inspired panels', 'cascading bottle arrangement'],
      material_preferences: ['sleek metal', 'frosted acrylic', 'brushed aluminum'],
      metaphors: ['vintage cooler', 'refreshing waterfall', 'flowing ribbon', 'ice-cold refreshment station'],
      attention_grabbers: ['LED backlighting that mimics ice glow', 'wave patterns', 'cascading arrangement'],
      color_themes: ['vibrant red', 'classic red and white', 'ice-blue accents']
    },
    'monster': {
      category: 'beverage',
      personality: 'rebellious and energetic',
      adjectives: ['edgy', 'bold', 'rebellious', 'high-energy', 'aggressive'],
      signature_elements: ['angular black structure', 'claw-mark cutouts', 'LED accent strips', 'geometric patterns'],
      material_preferences: ['matte black metal', 'brushed steel', 'industrial aluminum'],
      metaphors: ['energy fortress', 'power station', 'urban jungle', 'adrenaline chamber'],
      attention_grabbers: ['green LED accents', 'angular geometry', 'industrial textures'],
      color_themes: ['matte black', 'electric green', 'metallic silver']
    },
    'nivea': {
      category: 'beauty',
      personality: 'clean and trustworthy',
      adjectives: ['clean', 'trustworthy', 'gentle', 'caring', 'pure'],
      signature_elements: ['curved white shelving', 'spa-like atmosphere', 'flowing organic forms', 'cloud-inspired design'],
      material_preferences: ['pristine white acrylic', 'soft-touch materials', 'clear glass'],
      metaphors: ['spa station', 'care sanctuary', 'cloud formation', 'wellness oasis'],
      attention_grabbers: ['soft blue lighting', 'curved organic forms', 'pristine white surfaces'],
      color_themes: ['pristine white', 'deep blue', 'soft silver']
    },
    'pantene': {
      category: 'beauty',
      personality: 'luxurious and transformative',
      adjectives: ['luxurious', 'transformative', 'premium', 'golden', 'radiant'],
      signature_elements: ['waterfall arrangement', 'golden shimmer panels', 'tiered display', 'flowing hair-inspired curves'],
      material_preferences: ['golden metal', 'glossy acrylic', 'mirror surfaces'],
      metaphors: ['golden waterfall', 'salon station', 'beauty transformation center', 'hair temple'],
      attention_grabbers: ['golden shimmer effects', 'cascading arrangement', 'mirror reflections'],
      color_themes: ['golden yellow', 'champagne gold', 'warm bronze']
    },
    'flormar': {
      category: 'beauty',
      personality: 'feminine and colorful',
      adjectives: ['feminine', 'colorful', 'playful', 'artistic', 'vibrant'],
      signature_elements: ['flower-petal tiers', 'color gradient displays', 'artistic curves', 'blooming design'],
      material_preferences: ['rose-gold metal', 'colored acrylic', 'mirror elements'],
      metaphors: ['blooming flower', 'artist palette', 'jewelry box', 'beauty garden'],
      attention_grabbers: ['petal-shaped shelving', 'color gradients', 'artistic arrangements'],
      color_themes: ['rose gold', 'rainbow gradient', 'soft pastels']
    },
    'avon': {
      category: 'beauty',
      personality: 'elegant and accessible',
      adjectives: ['elegant', 'accessible', 'sophisticated', 'timeless', 'refined'],
      signature_elements: ['vanity mirror design', 'elegant curves', 'jewelry-inspired details', 'refined presentation'],
      material_preferences: ['elegant metals', 'mirror surfaces', 'refined plastics'],
      metaphors: ['vanity table', 'jewelry display', 'beauty boutique', 'elegant showcase'],
      attention_grabbers: ['mirror elements', 'elegant lighting', 'sophisticated arrangements'],
      color_themes: ['elegant silver', 'soft gold', 'classic black']
    }
  };

  private static readonly STYLE_MODIFIERS = {
    premium: 'Architectural photography style, subtle reflections, premium materials, Vogue aesthetic',
    mass_market: 'Bright and approachable, Target/Walmart friendly, value-focused presentation',
    innovation: 'Concept store aesthetic, Apple Store minimalism, future retail vision',
    practical: 'IKEA-style efficiency, modular appearance, clearly assembled from standard components'
  };

  private static readonly NEGATIVE_PROMPTS = `
Exclude: technical drawings, CAD renders, dimension lines, measurement text, blueprint style, wireframe, schematic, ruler markings, grid overlays, annotation arrows, technical specifications, engineering diagrams, floating text, watermarks
`.trim();

  private static getBrandProfile(brand: string): BrandProfile {
    const normalizedBrand = brand.toLowerCase().replace(/[^a-z]/g, '');
    
    // Direct match
    if (this.BRAND_PROFILES[normalizedBrand]) {
      return this.BRAND_PROFILES[normalizedBrand];
    }
    
    // Partial match
    for (const [key, profile] of Object.entries(this.BRAND_PROFILES)) {
      if (normalizedBrand.includes(key) || key.includes(normalizedBrand)) {
        return profile;
      }
    }
    
    // Generic fallback based on common brand patterns
    if (normalizedBrand.includes('beauty') || normalizedBrand.includes('cosmetic')) {
      return {
        category: 'beauty',
        personality: 'elegant and refined',
        adjectives: ['elegant', 'refined', 'premium', 'sophisticated'],
        signature_elements: ['curved design', 'mirror accents', 'premium finishes'],
        material_preferences: ['premium metals', 'glass elements', 'refined surfaces'],
        metaphors: ['beauty sanctuary', 'premium showcase', 'elegant display'],
        attention_grabbers: ['premium finishes', 'elegant lighting', 'sophisticated design'],
        color_themes: ['premium silver', 'elegant gold', 'sophisticated black']
      };
    }
    
    // Generic professional fallback
    return {
      category: 'generic',
      personality: 'professional and reliable',
      adjectives: ['professional', 'reliable', 'clean', 'modern', 'functional'],
      signature_elements: ['clean lines', 'modern structure', 'functional design', 'professional appearance'],
      material_preferences: ['clean metal', 'modern plastic', 'professional finishes'],
      metaphors: ['modern showcase', 'professional display', 'clean presentation', 'contemporary stand'],
      attention_grabbers: ['clean design', 'modern aesthetics', 'professional appearance'],
      color_themes: ['professional silver', 'clean white', 'modern black']
    };
  }

  private static getProportionalDescription(formData: FormData): ProportionalDescription {
    const height = formData.standHeight;
    const width = formData.standWidth;
    const ratio = height / width;
    
    let height_category: string;
    if (height <= 80) height_category = 'Intimate display that draws customers in for closer inspection';
    else if (height <= 150) height_category = 'Comfortable browsing height that invites interaction';
    else height_category = 'Tower-like presence that commands attention at eye level and above';
    
    let width_description: string;
    if (width <= 25) width_description = 'Space-efficient design that fits seamlessly in tight retail aisles';
    else if (width <= 50) width_description = 'Well-proportioned display area that balances presence with practicality';
    else width_description = 'Generous display area that creates a destination within the store';
    
    let interaction_style: string;
    if (ratio >= 3) interaction_style = 'vertical focus encouraging upward browsing';
    else if (ratio >= 2) interaction_style = 'balanced proportions for comfortable product selection';
    else interaction_style = 'horizontal emphasis for easy product comparison';
    
    return { height_category, width_description, interaction_style };
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private static getMaterialDescription(materials: string[], brandProfile: BrandProfile): string {
    if (materials.length === 0) return brandProfile.material_preferences[0] || 'modern materials';
    
    const materialMap: Record<string, string> = {
      'Metal': 'sleek metal framework',
      'Ahşap (Wood)': 'warm wood elements',
      'Plastik (Plastic)': 'modern polymer construction',
      'Cam (Glass)': 'crystal-clear glass panels',
      'Karton (Cardboard)': 'sustainable cardboard structure',
      'Akrilik (Acrylic)': 'premium acrylic surfaces',
      'MDF': 'refined composite construction',
      'Alüminyum (Aluminum)': 'brushed aluminum framework'
    };
    
    const descriptions = materials.map(m => materialMap[m] || m.toLowerCase());
    return descriptions.length === 1 ? descriptions[0] : `${descriptions.slice(0, -1).join(', ')} with ${descriptions[descriptions.length - 1]}`;
  }

  private static getStoreEnvironment(standType: string): { store_type: string; location: string; atmosphere: string } {
    const environments = {
      'Ayaklı Stant (Floor Stand)': {
        store_type: 'modern supermarket',
        location: 'positioned at the end-cap creating a branded zone',
        atmosphere: 'bright retail environment with the stand naturally commanding attention'
      },
      'Masa Üstü Stant (Tabletop Stand)': {
        store_type: 'premium convenience store',
        location: 'placed at the checkout counter for impulse purchases',
        atmosphere: 'intimate retail space where the compact display creates perfect browsing moments'
      },
      'Duvar Stantı (Wall Mount Stand)': {
        store_type: 'modern pharmacy',
        location: 'mounted between product categories as a bridge display',
        atmosphere: 'clean retail environment where the wall display adds vertical interest'
      }
    };
    
    return environments[standType as keyof typeof environments] || environments['Ayaklı Stant (Floor Stand)'];
  }

  // Template A: Brand-First Front View
  static generateBrandFirstPrompt(formData: FormData): string {
    const brandProfile = this.getBrandProfile(formData.brand);
    const proportions = this.getProportionalDescription(formData);
    const signature_element = this.getRandomElement(brandProfile.signature_elements);
    const material = this.getMaterialDescription(formData.materials, brandProfile);
    const adjectives = brandProfile.adjectives.slice(0, 2).join(' and ');
    const color_theme = this.getRandomElement(brandProfile.color_themes);
    
    return `Premium ${formData.brand} display stand showcasing ${formData.product} in a clean studio setting. The stand features a distinctive ${signature_element} that embodies ${formData.brand}'s identity. ${material} with ${color_theme} accents creates visual hierarchy. Products arranged in an eye-catching pattern that draws attention. Professional product photography, bright even lighting, pure white background. The design feels ${adjectives} while maintaining retail practicality. ${proportions.height_category} with ${proportions.interaction_style}. Sharp focus, commercial quality, no technical annotations.

${this.NEGATIVE_PROMPTS}`;
  }

  // Template B: Environment-First Store Context
  static generateEnvironmentFirstPrompt(formData: FormData): string {
    const brandProfile = this.getBrandProfile(formData.brand);
    const storeEnv = this.getStoreEnvironment(formData.standType);
    const hero_feature = this.getRandomElement(brandProfile.signature_elements);
    const attention_grabber = this.getRandomElement(brandProfile.attention_grabbers);
    const metaphor = this.getRandomElement(brandProfile.metaphors);
    
    return `${storeEnv.store_type} featuring an innovative ${formData.brand} display that naturally stands out. The ${formData.standType.toLowerCase()} showcases ${formData.product} with a unique ${hero_feature} that catches shoppers' attention from the aisle. ${storeEnv.atmosphere} ${storeEnv.location}. Real shoppers browsing nearby, the stand fits the space perfectly while commanding attention through ${attention_grabber}. The design suggests a ${metaphor} while remaining unmistakably functional for retail use. Natural retail lighting, lived-in atmosphere, the display feels both ${brandProfile.personality.split(' ').join(' and ')}.

${this.NEGATIVE_PROMPTS}`;
  }

  // Template C: Design-Hero Three-Quarter View
  static generateDesignHeroPrompt(formData: FormData): string {
    const brandProfile = this.getBrandProfile(formData.brand);
    const proportions = this.getProportionalDescription(formData);
    const defining_feature = this.getRandomElement(brandProfile.signature_elements);
    const material = this.getMaterialDescription(formData.materials, brandProfile);
    const visual_effect = this.getRandomElement(brandProfile.attention_grabbers);
    const metaphor = this.getRandomElement(brandProfile.metaphors);
    const key_design_element = this.getRandomElement(brandProfile.signature_elements);
    
    const pattern_description = formData.shelfCount > 1 
      ? `${formData.frontFaceCount} across in multiple tiers creating rhythm and abundance`
      : `${formData.frontFaceCount} across creating perfect symmetry`;
    
    return `Striking ${formData.brand} retail display viewed from a dynamic angle, revealing its sculptural ${defining_feature}. The ${material} structure creates ${visual_effect} while maintaining perfect product visibility. ${formData.product} arranged to create ${pattern_description}. Dramatic studio lighting emphasizes the ${key_design_element}, creating subtle shadows that enhance dimensionality. The overall form suggests ${metaphor} while remaining unmistakably functional for retail use. ${proportions.height_category} with sophisticated ${proportions.interaction_style}. Premium visualization quality, no measurement indicators.

${this.NEGATIVE_PROMPTS}`;
  }

  // Main method to generate all three views
  static generateAllCreativePrompts(formData: FormData) {
    return {
      frontView: this.generateBrandFirstPrompt(formData),
      storeView: this.generateEnvironmentFirstPrompt(formData),
      threeQuarterView: this.generateDesignHeroPrompt(formData)
    };
  }

  // Individual generators (for backward compatibility)
  static generateHeroShotPrompt = this.generateBrandFirstPrompt;
  static generateStoreContextPrompt = this.generateEnvironmentFirstPrompt;
  static generateBeautyShotPrompt = this.generateDesignHeroPrompt;

  // Utility method to get style modifier
  static getStyleModifier(style: 'premium' | 'mass_market' | 'innovation' | 'practical'): string {
    return this.STYLE_MODIFIERS[style];
  }

  // Method to analyze and improve prompts based on brand
  static analyzeBrandFit(brand: string, generatedImages: any[], userRatings?: number[]) {
    const brandProfile = this.getBrandProfile(brand);
    
    return {
      brandCategory: brandProfile.category,
      personality: brandProfile.personality,
      averageRating: userRatings ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length : 0,
      suggestions: [
        `Try emphasizing ${brandProfile.metaphors[0]} in future prompts`,
        `Consider highlighting ${brandProfile.signature_elements[0]} more prominently`,
        `Experiment with ${brandProfile.color_themes[0]} color schemes`
      ]
    };
  }
}
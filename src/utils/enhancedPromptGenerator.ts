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

interface BrandPersonality {
  personality: string;
  vibe: string;
  materialStyle: string;
  creativeElements: string[];
}

interface CreativeSuggestion {
  element: string;
  description: string;
}

export class EnhancedPromptGenerator {
  private static readonly BRAND_PERSONALITIES: Record<string, BrandPersonality> = {
    'coca-cola': {
      personality: 'timeless optimism',
      vibe: 'Classic Americana meets modern minimalism',
      materialStyle: 'Sleek metal frame with warm wood accents',
      creativeElements: [
        'a subtle wave pattern that echoes the Coca-Cola ribbon',
        'LED backlighting that makes bottles glow like amber',
        'vintage-inspired crown molding with modern twist',
        'holographic brand elements that shift with viewing angle'
      ]
    },
    'monster': {
      personality: 'rebellious energy',
      vibe: 'Dark intensity meets electric excitement',
      materialStyle: 'Matte black metal with electric green accents',
      creativeElements: [
        'laser-cut claw marks revealing neon backlighting',
        'pulsing LED strips that sync with music',
        'angular geometric cutouts casting dramatic shadows',
        'kinetic elements that move when products are taken'
      ]
    },
    'pepsi': {
      personality: 'youthful boldness',
      vibe: 'Contemporary cool meets street culture',
      materialStyle: 'High-gloss blue surfaces with chrome details',
      creativeElements: [
        'color-shifting panels that change from blue to red',
        'integrated sound reactive lighting',
        'urban-inspired geometric patterns',
        'interactive touch points with brand sounds'
      ]
    },
    'red bull': {
      personality: 'extreme precision',
      vibe: 'Aviation engineering meets energy culture',
      materialStyle: 'Brushed aluminum with precision-cut details',
      creativeElements: [
        'wing-inspired canopy with subtle brand integration',
        'precision-machined aluminum honeycomb patterns',
        'gravity-defying product arrangement',
        'adrenaline-inducing LED chase sequences'
      ]
    }
  };

  private static readonly CREATIVE_SUGGESTIONS: CreativeSuggestion[] = [
    { element: 'crown-like header', description: 'that catches and refracts light beautifully' },
    { element: 'subtle brand pattern perforations', description: 'creating mesmerizing shadow play' },
    { element: 'color-changing elements', description: 'based on viewing angle and ambient light' },
    { element: 'integrated product dispensing mechanism', description: 'that feels almost magical' },
    { element: 'optical illusion in the side panels', description: 'making the structure appear to float' },
    { element: 'kinetic element', description: 'triggered by product removal for interactive engagement' },
    { element: 'gradient lighting system', description: 'that shifts colors throughout the day' },
    { element: 'sculptural brand logo integration', description: 'that becomes part of the structural design' }
  ];

  private static readonly HEIGHT_CATEGORIES = {
    compact: { range: [100, 130], description: 'compact waist-high' },
    tall: { range: [130, 160], description: 'tall floor-standing' },
    tower: { range: [160, 180], description: 'tower format' },
    monolithic: { range: [180, 300], description: 'monolithic presence' }
  };

  private static getBrandPersonality(brand: string): BrandPersonality {
    const normalizedBrand = brand.toLowerCase().replace(/[^a-z]/g, '');
    
    // Direct matches
    if (this.BRAND_PERSONALITIES[normalizedBrand]) {
      return this.BRAND_PERSONALITIES[normalizedBrand];
    }
    
    // Partial matches
    for (const [key, personality] of Object.entries(this.BRAND_PERSONALITIES)) {
      if (normalizedBrand.includes(key) || key.includes(normalizedBrand)) {
        return personality;
      }
    }
    
    // Generic fallback
    return {
      personality: 'premium sophistication',
      vibe: 'Modern elegance meets retail innovation',
      materialStyle: 'Clean lines with premium materials',
      creativeElements: [
        'subtle brand embossing with premium finishes',
        'integrated LED strips for gentle product illumination',
        'geometric brand pattern integration',
        'color-coordinated accent lighting'
      ]
    };
  }

  private static getHeightCategory(height: number): string {
    if (height <= 130) return this.HEIGHT_CATEGORIES.compact.description;
    if (height <= 160) return this.HEIGHT_CATEGORIES.tall.description;
    if (height <= 180) return this.HEIGHT_CATEGORIES.tower.description;
    return this.HEIGHT_CATEGORIES.monolithic.description;
  }

  private static getAspectRatioDescription(width: number, height: number): string {
    const ratio = height / width;
    if (ratio >= 4) return 'slender and elegant';
    if (ratio >= 3) return 'classically proportioned';
    if (ratio >= 2) return 'sturdy and substantial';
    return 'broad and commanding';
  }

  private static getMaterialNarrative(materials: string[]): string {
    const materialMap: Record<string, string> = {
      'Metal': 'industrial precision',
      'Ahşap (Wood)': 'organic warmth',
      'Plastik (Plastic)': 'modern versatility',
      'Cam (Glass)': 'crystal clarity',
      'Karton (Cardboard)': 'sustainable innovation',
      'Akrilik (Acrylic)': 'contemporary transparency',
      'MDF': 'refined craftsmanship',
      'Alüminyum (Aluminum)': 'aerospace-grade elegance'
    };

    if (materials.length === 1) {
      return materialMap[materials[0]] || 'premium materials';
    }

    const primaryMaterials = materials.slice(0, 2).map(m => materialMap[m] || m.toLowerCase());
    return `${primaryMaterials.join(' meets ')}, creating sophisticated contrast`;
  }

  private static getRandomCreativeElement(brandElements: string[]): string {
    const allElements = [...brandElements, ...this.CREATIVE_SUGGESTIONS.map(s => s.element + ' ' + s.description)];
    return allElements[Math.floor(Math.random() * allElements.length)];
  }

  private static getStoreContext(standType: string): { storeType: string; aisleType: string; sceneDescription: string } {
    const contexts = {
      'Ayaklı Stant (Floor Stand)': {
        storeType: 'modern supermarket',
        aisleType: 'main beverage',
        sceneDescription: 'Mid-morning rush, natural light streaming through windows, creating dynamic shadows'
      },
      'Masa Üstü Stant (Tabletop Stand)': {
        storeType: 'premium convenience store',
        aisleType: 'checkout counter',
        sceneDescription: 'Evening atmosphere, warm LED lighting, customers making impulse purchase decisions'
      },
      'Duvar Stantı (Wall Mount Stand)': {
        storeType: 'urban market',
        aisleType: 'end-cap display',
        sceneDescription: 'Peak shopping hours, fluorescent lighting mixing with product illumination'
      }
    };

    return contexts[standType as keyof typeof contexts] || contexts['Ayaklı Stant (Floor Stand)'];
  }

  // Template 1: Hero Shot (Front View)
  static generateHeroShotPrompt(formData: FormData): string {
    const brandPersonality = this.getBrandPersonality(formData.brand);
    const heightCategory = this.getHeightCategory(formData.standHeight);
    const aspectRatio = this.getAspectRatioDescription(formData.standWidth, formData.standHeight);
    const materialNarrative = this.getMaterialNarrative(formData.materials);
    const creativeElement = this.getRandomCreativeElement(brandPersonality.creativeElements);

    return `Create a stunning ${formData.brand} retail display stand that celebrates the brand's essence.

Design Brief:
- Feature: ${formData.product} in a ${heightCategory} format
- Vibe: ${brandPersonality.vibe}
- Proportions: Stand is ${aspectRatio}, shelving that naturally fits ${formData.frontFaceCount} products across
- Materials: ${brandPersonality.materialStyle} with ${materialNarrative}
- Hero Element: One unexpected design flourish that makes shoppers stop - ${creativeElement}

Brand personality: ${brandPersonality.personality} - ${formData.description}

Style: Professional product photography, clean retail environment, natural lighting that makes the products glow. The stand should feel premium yet approachable, innovative yet buildable. Shot in 9:16 portrait format emphasizing the full height and elegance of the design.

Absolutely no dimension lines, measurements, technical annotations, or CAD elements. Pure retail theater.`;
  }

  // Template 2: In-Store Context
  static generateStoreContextPrompt(formData: FormData): string {
    const brandPersonality = this.getBrandPersonality(formData.brand);
    const storeContext = this.getStoreContext(formData.standType);
    const heightReference = formData.standHeight > 150 ? 'shoulder height' : 'waist height';
    const arrangementStyle = formData.shelfCount > 2 ? 'in a dynamic cascade' : 'in perfect symmetry';
    const creativeElement = this.getRandomCreativeElement(brandPersonality.creativeElements);

    return `${formData.brand} display stand in a busy ${storeContext.storeType}, capturing a real shopping moment.

Scene Setup:
- The ${formData.product} display as the hero in a ${storeContext.aisleType} aisle
- Stand design: ${brandPersonality.materialStyle} construction that fits naturally in the space
- Scale hint: The stand reaches about ${heightReference} with products arranged ${arrangementStyle}
- Ambient story: ${storeContext.sceneDescription}
- Special touch: ${creativeElement}

Brand essence: ${brandPersonality.personality} - embodying the spirit of ${formData.description}

Photographic style: Documentary retail photography, authentic store lighting, slight motion blur of shoppers passing by. Shot in 16:9 cinematic format showing the stand commanding attention in its natural environment. The stand should feel like it belongs but also commands attention.

No measurements, no CAD overlays, no technical annotations. Just pure retail theater in action.`;
  }

  // Template 3: Beauty Shot (3/4 View)
  static generateBeautyShotPrompt(formData: FormData): string {
    const brandPersonality = this.getBrandPersonality(formData.brand);
    const materialNarrative = this.getMaterialNarrative(formData.materials);
    const shelfArrangement = formData.shelfCount > 1 ? `${formData.shelfCount} tiers creating visual rhythm` : 'a single, impactful shelf level';
    const creativeElement = this.getRandomCreativeElement(brandPersonality.creativeElements);

    return `Sculptural ${formData.brand} display stand photographed as retail art.

Design Concept:
- Form: A ${formData.standType.toLowerCase()} display for ${formData.product} that balances function with visual impact
- Structure: ${brandPersonality.materialStyle} supporting ${shelfArrangement}
- Material story: ${materialNarrative} telling the brand's premium narrative
- Proportions: Products nestle perfectly, about ${formData.frontFaceCount} across, creating satisfying repetition
- Signature element: ${creativeElement}

Brand soul: ${brandPersonality.personality} - ${formData.description}

Photography: Three-quarter angle revealing depth and craftsmanship, studio lighting that celebrates materials and textures, subtle reflections and shadows. Shot in 3:4 format perfect for detailed appreciation. This is retail furniture as sculpture.

Keep it real - no floating parts, no impossible physics, no technical annotations, no dimension lines. Just pure design poetry.`;
  }

  // Generate all prompts using the new creative approach
  static generateAllCreativePrompts(formData: FormData) {
    return {
      frontView: this.generateHeroShotPrompt(formData),
      storeView: this.generateStoreContextPrompt(formData),
      threeQuarterView: this.generateBeautyShotPrompt(formData)
    };
  }

  // Analyze prompt effectiveness (for future optimization)
  static analyzePromptQuality(formData: FormData, generatedImages: any[], userRatings?: number[]) {
    const brandPersonality = this.getBrandPersonality(formData.brand);
    
    return {
      brandAlignment: brandPersonality.personality,
      creativityScore: userRatings ? userRatings.reduce((a, b) => a + b, 0) / userRatings.length : 0,
      suggestions: [
        'Try different creative elements for variation',
        'Experiment with lighting descriptions',
        'Adjust material narratives based on brand'
      ]
    };
  }
}
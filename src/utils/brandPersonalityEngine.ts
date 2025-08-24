export interface BrandPersonality {
  primaryTrait: 'premium' | 'energetic' | 'trustworthy' | 'playful';
  adjectives: string[];
  colors: string[];
  materials: string[];
  metaphors: string[];
  visualStyle: string;
  heroFeatures: string[];
}

export class BrandPersonalityEngine {
  private personalities: Map<string, BrandPersonality>;

  constructor() {
    this.personalities = new Map();
    this.initializePersonalities();
  }

  private initializePersonalities() {
    this.personalities.set('Coca-Cola', {
      primaryTrait: 'energetic',
      adjectives: ['refreshing', 'joyful', 'iconic', 'vibrant', 'effervescent'],
      colors: ['Coca-Cola red', 'arctic white', 'carbonation silver'],
      materials: ['glossy surfaces', 'refrigerated metal', 'condensation-effect glass'],
      metaphors: [
        'frozen moment of refreshment',
        'happiness fountain',
        'celebration tower'
      ],
      visualStyle: 'Iconic',
      heroFeatures: [
        'dynamic wave ribbon wrapping around the structure like the Coca-Cola logo',
        'bottle-cap shaped platforms creating playful display levels',
        'polar bear silhouette cutouts with backlit ice-blue glow'
      ]
    });

    this.personalities.set('Monster Energy', {
      primaryTrait: 'energetic',
      adjectives: ['explosive', 'edgy', 'powerful', 'rebellious', 'electric'],
      colors: ['monster green', 'matte black', 'electric lime'],
      materials: ['industrial mesh', 'raw metal', 'neon acrylic'],
      metaphors: [
        'caged beast ready to unleash',
        'lightning bolt frozen in time',
        'energy reactor core'
      ],
      visualStyle: 'Aggressive',
      heroFeatures: [
        'claw-slash cutouts revealing pulsing green LED underglow',
        'angular geometric frame suggesting barely-contained energy',
        'hydraulic-inspired pistons as structural elements'
      ]
    });

    this.personalities.set('NIVEA', {
      primaryTrait: 'trustworthy',
      adjectives: ['caring', 'pure', 'gentle', 'reliable', 'nurturing'],
      colors: ['NIVEA blue', 'cloud white', 'skin tone beige'],
      materials: ['smooth plastics', 'frosted glass', 'soft-touch surfaces'],
      metaphors: [
        'protective embrace',
        'morning dew freshness',
        'spa sanctuary'
      ],
      visualStyle: 'Clean and caring',
      heroFeatures: [
        'curved shelves mimicking the iconic NIVEA tin shape',
        'water droplet-inspired tiered platforms',
        'soft-glow halo lighting creating wellness ambiance'
      ]
    });

    this.personalities.set('PANTENE', {
      primaryTrait: 'premium',
      adjectives: ['luxurious', 'transformative', 'golden', 'radiant', 'professional'],
      colors: ['golden yellow', 'champagne gold', 'warm bronze'],
      materials: ['golden metal', 'glossy acrylic', 'mirror surfaces'],
      metaphors: [
        'golden waterfall',
        'salon station',
        'beauty transformation center'
      ],
      visualStyle: 'Luxurious',
      heroFeatures: [
        'waterfall arrangement with golden shimmer panels',
        'tiered display mimicking flowing hair',
        'mirror reflections creating infinite beauty'
      ]
    });

    this.personalities.set('Flormar', {
      primaryTrait: 'playful',
      adjectives: ['feminine', 'colorful', 'artistic', 'vibrant', 'creative'],
      colors: ['rose gold', 'rainbow gradient', 'soft pastels'],
      materials: ['rose-gold metal', 'colored acrylic', 'mirror elements'],
      metaphors: [
        'blooming flower',
        'artist palette',
        'jewelry box'
      ],
      visualStyle: 'Feminine and artistic',
      heroFeatures: [
        'flower-petal tiers creating organic display levels',
        'color gradient displays showcasing product range',
        'artistic curves inspired by makeup brushes'
      ]
    });

    this.personalities.set('Avon', {
      primaryTrait: 'premium',
      adjectives: ['elegant', 'sophisticated', 'timeless', 'refined', 'accessible'],
      colors: ['elegant silver', 'soft gold', 'classic black'],
      materials: ['elegant metals', 'mirror surfaces', 'refined plastics'],
      metaphors: [
        'vanity table',
        'jewelry display',
        'beauty boutique'
      ],
      visualStyle: 'Elegant and sophisticated',
      heroFeatures: [
        'vanity mirror design with elegant lighting',
        'jewelry-inspired details and refined presentation',
        'sophisticated curves suggesting luxury'
      ]
    });

    // Add whiskey brands
    this.personalities.set('Whiskey', {
      primaryTrait: 'premium',
      adjectives: ['sophisticated', 'aged', 'masculine', 'crafted', 'distinguished'],
      colors: ['amber gold', 'rich brown', 'copper bronze'],
      materials: ['dark wood', 'brass accents', 'leather details'],
      metaphors: [
        'gentleman\'s library',
        'master distiller\'s cabinet',
        'aged oak barrel'
      ],
      visualStyle: 'Distinguished and masculine',
      heroFeatures: [
        'barrel-stave inspired shelving with brass accents',
        'amber backlighting mimicking aged spirits',
        'leather-wrapped display elements'
      ]
    });

    this.personalities.set('paradontax', {
      primaryTrait: 'trustworthy',
      adjectives: ['clinical', 'effective', 'professional', 'trusted', 'reliable'],
      colors: ['medical white', 'trust blue', 'health green'],
      materials: ['clean white surfaces', 'medical-grade plastics', 'clear acrylic'],
      metaphors: [
        'dental clinic cabinet',
        'health sanctuary',
        'professional care station'
      ],
      visualStyle: 'Clinical and trustworthy',
      heroFeatures: [
        'clean geometric lines suggesting medical precision',
        'soft blue LED accents conveying trust',
        'hygienic white surfaces with anti-microbial finish'
      ]
    });

    // Add default personality
    this.addDefaultPersonality();
  }

  private addDefaultPersonality() {
    this.personalities.set('default', {
      primaryTrait: 'trustworthy',
      adjectives: ['professional', 'modern', 'appealing', 'functional'],
      colors: ['brand colors', 'complementary accents'],
      materials: ['quality materials', 'durable surfaces'],
      metaphors: ['retail showcase', 'product stage'],
      visualStyle: 'Contemporary',
      heroFeatures: ['distinctive branded header design', 'innovative product arrangement']
    });
  }

  public getPersonality(brand: string): BrandPersonality {
    // Normalize brand name for lookup
    const normalizedBrand = brand.trim();
    
    // Direct match
    if (this.personalities.has(normalizedBrand)) {
      return this.personalities.get(normalizedBrand)!;
    }
    
    // Case-insensitive partial match
    const brandLower = normalizedBrand.toLowerCase();
    for (const [key, personality] of this.personalities.entries()) {
      if (key.toLowerCase().includes(brandLower) || brandLower.includes(key.toLowerCase())) {
        return personality;
      }
    }
    
    // Category-based fallback
    if (brandLower.includes('beauty') || brandLower.includes('cosmetic') || brandLower.includes('makeup')) {
      return this.personalities.get('Avon')!;
    }
    if (brandLower.includes('energy') || brandLower.includes('drink')) {
      return this.personalities.get('Monster Energy')!;
    }
    if (brandLower.includes('health') || brandLower.includes('medical') || brandLower.includes('pharma')) {
      return this.personalities.get('paradontax')!;
    }
    
    return this.personalities.get('default')!;
  }
}
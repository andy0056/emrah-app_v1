import { BrandPersonality } from './brandPersonalityEngine';

interface InnovationRequest {
  brand: string;
  brandTraits: BrandPersonality;
  context: string[];
  materials: string[];
  standType: string;
}

export class InnovationEngine {
  private innovations: Map<string, string[]>;

  constructor() {
    this.innovations = new Map();
    this.initializeInnovations();
  }

  private initializeInnovations() {
    // Context-based innovations
    this.innovations.set('illuminated', [
      'edge-lit acrylic shelves creating floating product illusion',
      'programmable LED strips responding to customer proximity',
      'backlit brand graphics with subtle color transitions',
      'fiber optic starfield effect in header panel',
      'holographic brand projection with motion sensors',
      'color-changing LED underglow synchronized to brand colors'
    ]);

    this.innovations.set('premium', [
      'laser-etched brand story on brushed metal panels',
      'velvet-lined product cradles with individual spotlights',
      'museum-quality glass cases with anti-reflective coating',
      'gold-leaf accents on logo elements',
      'hand-polished natural stone base with brand inscription',
      'precision-machined metal joints showcasing craftsmanship'
    ]);

    this.innovations.set('innovative', [
      'kinetic elements powered by customer interaction',
      'holographic brand projection above display',
      'shape-memory alloy elements that transform hourly',
      'augmented reality markers integrated into design',
      'motion-activated product information displays',
      'smart sensors tracking customer engagement patterns'
    ]);

    this.innovations.set('attention-grabbing', [
      'oversized 3D product replica crowning the display',
      'mirror-finish surfaces creating infinite product reflections',
      'color-changing thermochromic panels responding to touch',
      'mechanical flip-dot display showing dynamic messages',
      'rotating display elements creating constant visual motion',
      'interactive sound design responding to product selection'
    ]);

    this.innovations.set('scalable', [
      'modular snap-together framework for easy assembly',
      'flat-pack design with tool-free construction',
      'standardized components allowing multiple configurations',
      'nested shipping design reducing transport volume by 70%',
      'magnetic connection system for quick reconfiguration',
      'stackable modules adapting to different space requirements'
    ]);

    // Brand-specific premium innovations
    this.innovations.set('coca-cola-premium', [
      'vintage Coca-Cola cooler reinterpreted with modern LED cooling effects',
      'bottle-shaped apertures in the frame revealing hidden LED lighting',
      'curved ribbon element wrapping the structure like the logo',
      'frost-effect glass panels suggesting ice-cold refreshment'
    ]);

    this.innovations.set('monster-premium', [
      'claw-mark cutouts revealing pulsing neon underglow',
      'industrial cable management creating aesthetic structural elements',
      'angular geometric joints suggesting barely-contained energy',
      'matte black powder coating with selective glossy brand elements'
    ]);

    this.innovations.set('beauty-premium', [
      'integrated vanity mirror elements with professional lighting',
      'product testing stations with hygienic surface materials',
      'color-matched LED backlighting showcasing product ranges',
      'curved organic forms suggesting natural beauty'
    ]);
  }

  public generateFeature(request: InnovationRequest): string {
    const contextFeatures: string[] = [];
    
    // Collect all relevant innovations based on context
    request.context.forEach(ctx => {
      const features = this.innovations.get(ctx);
      if (features) {
        contextFeatures.push(...features);
      }
    });

    // Add brand-specific premium features if available
    const brandSpecificKey = `${request.brand.toLowerCase().replace(/\s+/g, '-')}-premium`;
    const brandFeatures = this.innovations.get(brandSpecificKey);
    if (brandFeatures) {
      contextFeatures.push(...brandFeatures);
    }

    // Add trait-specific features
    const traitFeatures = this.innovations.get(`${request.brandTraits.primaryTrait}-premium`);
    if (traitFeatures) {
      contextFeatures.push(...traitFeatures);
    }

    // If no context matches, use brand-specific innovation
    if (contextFeatures.length === 0) {
      return this.generateBrandSpecificFeature(request.brand, request.materials, request.brandTraits);
    }

    // Select and customize the best feature
    const selectedFeature = contextFeatures[Math.floor(Math.random() * contextFeatures.length)];
    return this.customizeFeature(selectedFeature, request.brand, request.brandTraits);
  }

  private generateBrandSpecificFeature(brand: string, materials: string[], brandTraits: BrandPersonality): string {
    const materialFeature = materials.includes('Metal') ? 'precision-cut metal' : 
                          materials.includes('Ahşap (Wood)') ? 'artisan-crafted wood' : 
                          materials.includes('Akrilik (Acrylic)') ? 'crystal-clear acrylic' :
                          'innovative composite';
    
    const brandElement = brandTraits.heroFeatures[0] || 'distinctive branded element';
    
    return `${materialFeature} framework featuring ${brandElement} that embodies ${brand}'s signature style`;
  }

  private customizeFeature(feature: string, brand: string, brandTraits: BrandPersonality): string {
    // Add brand-specific customization
    let customizedFeature = feature.replace(/brand/g, brand);
    
    // Add color customization
    if (brandTraits.colors.length > 0) {
      customizedFeature = customizedFeature.replace(/color-changing/g, `${brandTraits.colors[0]} color-shifting`);
      customizedFeature = customizedFeature.replace(/LED/g, `${brandTraits.colors[0]} LED`);
    }
    
    // Add material-specific enhancements
    if (brandTraits.materials.length > 0) {
      const primaryMaterial = brandTraits.materials[0];
      customizedFeature = customizedFeature.replace(/surfaces/g, `${primaryMaterial} surfaces`);
    }
    
    return customizedFeature;
  }

  /**
   * Generate multiple innovation options for A/B testing
   */
  public generateMultipleFeatures(request: InnovationRequest, count: number = 3): string[] {
    const features: string[] = [];
    const usedFeatures = new Set<string>();
    
    for (let i = 0; i < count; i++) {
      let feature = this.generateFeature(request);
      let attempts = 0;
      
      // Ensure uniqueness
      while (usedFeatures.has(feature) && attempts < 10) {
        feature = this.generateFeature(request);
        attempts++;
      }
      
      features.push(feature);
      usedFeatures.add(feature);
    }
    
    return features;
  }

  /**
   * Rate the feasibility of an innovation feature
   */
  public rateFeasibility(feature: string): {
    feasibility: 'high' | 'medium' | 'low';
    cost: 'low' | 'medium' | 'high';
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    const feasibilityIndicators = {
      high: ['modular', 'snap-together', 'LED', 'acrylic', 'metal', 'magnetic'],
      medium: ['kinetic', 'programmable', 'sensor', 'thermochromic'],
      low: ['holographic', 'augmented reality', 'shape-memory', 'AI-powered']
    };

    const costIndicators = {
      low: ['plastic', 'cardboard', 'simple', 'standard'],
      medium: ['LED', 'metal', 'acrylic', 'magnetic'],
      high: ['gold-leaf', 'museum-quality', 'precision-machined', 'holographic']
    };

    const complexityIndicators = {
      simple: ['flat-pack', 'snap-together', 'modular', 'magnetic'],
      moderate: ['LED', 'sensor', 'programmable', 'kinetic'],
      complex: ['holographic', 'AI', 'augmented reality', 'shape-memory']
    };

    // Analyze feature text
    const featureLower = feature.toLowerCase();
    
    let feasibility: 'high' | 'medium' | 'low' = 'high';
    let cost: 'low' | 'medium' | 'high' = 'low';
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';

    // Determine feasibility
    if (feasibilityIndicators.low.some(indicator => featureLower.includes(indicator))) {
      feasibility = 'low';
    } else if (feasibilityIndicators.medium.some(indicator => featureLower.includes(indicator))) {
      feasibility = 'medium';
    }

    // Determine cost
    if (costIndicators.high.some(indicator => featureLower.includes(indicator))) {
      cost = 'high';
    } else if (costIndicators.medium.some(indicator => featureLower.includes(indicator))) {
      cost = 'medium';
    }

    // Determine complexity
    if (complexityIndicators.complex.some(indicator => featureLower.includes(indicator))) {
      complexity = 'complex';
    } else if (complexityIndicators.moderate.some(indicator => featureLower.includes(indicator))) {
      complexity = 'moderate';
    }

    return { feasibility, cost, complexity };
  }
}
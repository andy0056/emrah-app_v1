import { FormData } from '../types';
import { ProductionDesignService } from './productionDesignService';
import { GroundedGenerationService } from './groundedGenerationService';

export interface CreativeZone {
  id: string;
  name: string;
  canUseCreative: boolean;
  constraints: string;
  suggestions: string[];
  costImpact: 'low' | 'medium' | 'high';
  manufacturingComplexity: 'simple' | 'moderate' | 'complex';
}

export interface HybridDesignResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  mode: 'hybrid';
  baseStructure: {
    template: any;
    manufacturabilityScore: number;
  };
  creativeElements: {
    zones: CreativeZone[];
    appliedEnhancements: string[];
    additionalCost: number;
    additionalTime: number;
  };
  manufacturability: {
    base: string;
    accents: string;
    additionalCost: string;
    totalScore: number;
  };
  metadata: {
    processingTime: number;
    approach: 'hybrid';
  };
}

export class HybridDesignService {

  static async generateHybridDesign(
    formData: FormData,
    brandAssetUrls: string[] = [],
    options: {
      creativityLevel?: 'conservative' | 'moderate' | 'innovative';
      focusAreas?: string[];
      budgetConstraint?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<HybridDesignResult> {
    const startTime = Date.now();

    console.log('🚀 Starting Hybrid Design Generation:', {
      creativityLevel: options.creativityLevel || 'moderate',
      focusAreas: options.focusAreas || [],
      budgetConstraint: options.budgetConstraint || 'medium'
    });

    try {
      // Step 1: Generate manufacturable base using production service
      console.log('🏗️ Generating production-ready base structure...');
      const baseStructure = await ProductionDesignService.generateProductionReady(
        formData,
        {
          referenceStyle: 'minimal',
          includeAssemblyGuide: false
        }
      );

      // Step 2: Identify safe creative opportunities
      const creativeZones = this.identifyCreativeOpportunities(formData, options);

      // Step 3: Apply creative elements within manufacturing constraints
      const enhancedDesign = await this.applyCreativeAccents(
        formData,
        baseStructure,
        creativeZones,
        brandAssetUrls,
        options
      );

      // Step 4: Calculate impact and costs
      const creativeImpact = this.calculateCreativeImpact(creativeZones, options);

      const result: HybridDesignResult = {
        images: enhancedDesign.images,
        mode: 'hybrid',
        baseStructure: {
          template: baseStructure.template,
          manufacturabilityScore: baseStructure.manufacturability.score
        },
        creativeElements: {
          zones: creativeZones,
          appliedEnhancements: this.getAppliedEnhancements(creativeZones, options),
          additionalCost: creativeImpact.additionalCost,
          additionalTime: creativeImpact.additionalTime
        },
        manufacturability: {
          base: 'standard production methods',
          accents: 'additional finishing processes',
          additionalCost: `${creativeImpact.costPercentage}% above base`,
          totalScore: Math.max(60, baseStructure.manufacturability.score - creativeImpact.complexityPenalty)
        },
        metadata: {
          processingTime: Date.now() - startTime,
          approach: 'hybrid'
        }
      };

      console.log('✅ Hybrid Design Complete:', {
        baseScore: result.baseStructure.manufacturabilityScore,
        totalScore: result.manufacturability.totalScore,
        additionalCost: result.creativeElements.additionalCost,
        processingTime: result.metadata.processingTime
      });

      return result;

    } catch (error) {
      console.error('❌ Hybrid design generation failed:', error);
      throw error;
    }
  }

  private static identifyCreativeOpportunities(
    formData: FormData,
    options: any
  ): CreativeZone[] {
    const material = formData.materials[0];
    const creativityLevel = options.creativityLevel || 'moderate';

    const zones: CreativeZone[] = [
      {
        id: 'header_zone',
        name: 'Header Graphics Zone',
        canUseCreative: true,
        constraints: 'Must not affect structural integrity',
        suggestions: this.getHeaderSuggestions(material, creativityLevel),
        costImpact: 'low',
        manufacturingComplexity: 'simple'
      },
      {
        id: 'shelf_edges',
        name: 'Shelf Edge Details',
        canUseCreative: true,
        constraints: 'Maximum 5cm extension from shelf',
        suggestions: this.getShelfEdgeSuggestions(material, creativityLevel),
        costImpact: 'medium',
        manufacturingComplexity: 'moderate'
      },
      {
        id: 'side_panels',
        name: 'Side Panel Graphics',
        canUseCreative: material !== 'Karton (Cardboard)' || creativityLevel === 'innovative',
        constraints: 'Must be flat-fabricatable',
        suggestions: this.getSidePanelSuggestions(material, creativityLevel),
        costImpact: material === 'Metal' ? 'high' : 'medium',
        manufacturingComplexity: material === 'Metal' ? 'complex' : 'moderate'
      },
      {
        id: 'lighting',
        name: 'Integrated Lighting',
        canUseCreative: creativityLevel !== 'conservative' && formData.standHeight > 100,
        constraints: 'Must use low-voltage LED systems',
        suggestions: this.getLightingSuggestions(material, creativityLevel),
        costImpact: 'high',
        manufacturingComplexity: 'complex'
      },
      {
        id: 'base_accents',
        name: 'Base Accent Features',
        canUseCreative: formData.standDepth > 30,
        constraints: 'Cannot compromise stability',
        suggestions: this.getBaseAccentSuggestions(material, creativityLevel),
        costImpact: 'low',
        manufacturingComplexity: 'simple'
      }
    ];

    // Filter based on budget constraints
    if (options.budgetConstraint === 'low') {
      return zones.filter(zone => zone.costImpact === 'low');
    } else if (options.budgetConstraint === 'medium') {
      return zones.filter(zone => zone.costImpact !== 'high');
    }

    return zones;
  }

  private static getHeaderSuggestions(material: string, creativityLevel: string): string[] {
    const baseSuggestions = ['Large format printing', 'Logo embossing', 'Color gradients'];

    const suggestions = {
      conservative: baseSuggestions,
      moderate: [...baseSuggestions, 'LED backlighting', 'Textured finishes', 'Metallic accents'],
      innovative: [...baseSuggestions, 'LED backlighting', 'Textured finishes', 'Metallic accents',
                  'Interactive displays', 'Color-changing elements', 'Holographic effects']
    };

    const materialSpecific = {
      'Metal': ['Laser etching', 'Anodized colors', 'Brushed finishes'],
      'Ahşap (Wood)': ['Wood burning', 'Staining effects', 'Carved details'],
      'Karton (Cardboard)': ['Spot varnish', 'Foil stamping', 'Embossed patterns'],
      'Plastik (Plastic)': ['In-mold graphics', 'Textured surfaces', 'Translucent effects']
    };

    return [...(suggestions[creativityLevel] || suggestions.moderate),
            ...(materialSpecific[material] || [])];
  }

  private static getShelfEdgeSuggestions(material: string, creativityLevel: string): string[] {
    const base = ['LED strip lighting', 'Branded edge banding', 'Price channel integration'];

    if (creativityLevel === 'innovative') {
      return [...base, 'Dynamic lighting effects', 'Digital price displays', 'Sensor-activated features'];
    } else if (creativityLevel === 'moderate') {
      return [...base, 'Color-coded zones', 'Magnetic accessories'];
    }

    return base.slice(0, 2); // Conservative approach
  }

  private static getSidePanelSuggestions(material: string, creativityLevel: string): string[] {
    const suggestions = {
      'Metal': ['Perforated patterns', 'Powder coat graphics', 'Vinyl applications'],
      'Ahşap (Wood)': ['Laser cut patterns', 'Vinyl graphics', 'Carved elements'],
      'Karton (Cardboard)': ['Die-cut windows', 'Layered graphics', 'Fold-out elements'],
      'Plastik (Plastic)': ['Molded textures', 'Translucent panels', 'Color variations']
    };

    const baseSuggestions = suggestions[material] || suggestions['Metal'];

    if (creativityLevel === 'innovative') {
      return [...baseSuggestions, 'Interactive elements', 'Augmented reality markers', 'Smart surfaces'];
    }

    return baseSuggestions;
  }

  private static getLightingSuggestions(material: string, creativityLevel: string): string[] {
    const base = ['LED edge lighting', 'Header backlighting', 'Shelf accent lighting'];

    if (creativityLevel === 'innovative') {
      return [...base, 'Color-changing RGB strips', 'Motion-activated zones', 'Smart lighting controls'];
    } else if (creativityLevel === 'moderate') {
      return [...base, 'Programmable sequences', 'Brand color themes'];
    }

    return base.slice(0, 2);
  }

  private static getBaseAccentSuggestions(material: string, creativityLevel: string): string[] {
    const suggestions = ['Logo floor decal', 'Base trim lighting', 'Colored base elements'];

    if (creativityLevel === 'innovative') {
      return [...suggestions, 'Projected brand elements', 'Interactive floor graphics'];
    }

    return suggestions;
  }

  private static async applyCreativeAccents(
    formData: FormData,
    baseStructure: any,
    creativeZones: CreativeZone[],
    brandAssetUrls: string[],
    options: any
  ) {
    // Create enhanced prompt that combines manufacturability with creativity
    const creativePrompt = this.buildHybridPrompt(formData, baseStructure, creativeZones, options);

    // Use grounded generation with creative elements enabled
    const result = await GroundedGenerationService.generateGroundedDisplay(
      formData,
      brandAssetUrls,
      {
        model: 'nano-banana', // Better for brand integration and creative elements
        preserveStructure: true, // Keep base manufacturability
        includeBrandAssets: brandAssetUrls.length > 0,
        showJoinery: true,
        perspective: '3quarter',
        enableDFMValidation: true
      }
    );

    return result;
  }

  private static buildHybridPrompt(
    formData: FormData,
    baseStructure: any,
    creativeZones: CreativeZone[],
    options: any
  ): string {
    const creativityLevel = options.creativityLevel || 'moderate';
    const activeZones = creativeZones.filter(zone => zone.canUseCreative);

    // Build base prompt
    const basePromptSections = [
      // Base manufacturing requirements
      "HYBRID DESIGN APPROACH:",
      "- Maintain ALL structural requirements from base template",
      "- Apply creative enhancements only in approved zones",
      "- Preserve manufacturability and cost targets",
      "",

      // Base structure preservation
      `BASE STRUCTURE: ${baseStructure.template.name}`,
      `- Dimensions: ${formData.standWidth}×${formData.standHeight}×${formData.standDepth}cm`,
      `- Material: ${formData.materials[0]}`,
      `- Assembly: ${baseStructure.template.constraints?.assembly_complexity || 'moderate'}`,
      "",

      // Creative enhancement zones
      "CREATIVE ENHANCEMENT ZONES:",
      ...activeZones.map(zone =>
        `- ${zone.name}: ${zone.suggestions.slice(0, 2).join(', ')}`
      ),
      "",

      // Creativity level guidelines
      `CREATIVITY LEVEL: ${creativityLevel.toUpperCase()}`,
      this.getCreativityGuidelines(creativityLevel),
      "",

      // Manufacturing constraints
      "MANUFACTURING CONSTRAINTS:",
      "- All creative elements must use standard fabrication methods",
      "- No structural modifications to base design",
      "- Maximum 25% cost increase over base",
      "- Maintain assembly simplicity",
      "",

      // Visual requirements
      "VISUAL REQUIREMENTS:",
      "- Professional retail appearance",
      "- Balance innovation with practicality",
      "- Show creative elements clearly but subtly",
      "- Maintain brand consistency",
      "- Clean, implementable design"
    ];

    const basePrompt = basePromptSections.join('\n');

    // Return base prompt directly for hybrid design
    return basePrompt;
  }

  private static getCreativityGuidelines(creativityLevel: string): string {
    const guidelines = {
      conservative: "- Subtle enhancements only\n- Focus on proven techniques\n- Minimal risk approach",
      moderate: "- Balanced innovation and practicality\n- Use established creative methods\n- Moderate enhancement visibility",
      innovative: "- Push creative boundaries\n- Explore new techniques\n- Bold but manufacturable features"
    };

    return guidelines[creativityLevel] || guidelines.moderate;
  }

  private static getAppliedEnhancements(creativeZones: CreativeZone[], options: any): string[] {
    const activeZones = creativeZones.filter(zone => zone.canUseCreative);
    const creativityLevel = options.creativityLevel || 'moderate';

    const enhancements: string[] = [];

    activeZones.forEach(zone => {
      const suggestionCount = creativityLevel === 'conservative' ? 1 :
                             creativityLevel === 'moderate' ? 2 : 3;

      enhancements.push(...zone.suggestions.slice(0, suggestionCount));
    });

    return enhancements;
  }

  private static calculateCreativeImpact(creativeZones: CreativeZone[], options: any) {
    const activeZones = creativeZones.filter(zone => zone.canUseCreative);

    const costMultipliers = { low: 5, medium: 15, high: 30 };
    const timeMultipliers = { simple: 10, moderate: 25, complex: 45 };

    let additionalCost = 0;
    let additionalTime = 0;
    let complexityPenalty = 0;

    activeZones.forEach(zone => {
      additionalCost += costMultipliers[zone.costImpact];
      additionalTime += timeMultipliers[zone.manufacturingComplexity];

      if (zone.manufacturingComplexity === 'complex') {
        complexityPenalty += 5;
      } else if (zone.manufacturingComplexity === 'moderate') {
        complexityPenalty += 2;
      }
    });

    const creativityLevel = options.creativityLevel || 'moderate';
    const creativityMultiplier = {
      conservative: 0.7,
      moderate: 1.0,
      innovative: 1.4
    };

    return {
      additionalCost: Math.ceil(additionalCost * creativityMultiplier[creativityLevel]),
      additionalTime: Math.ceil(additionalTime * creativityMultiplier[creativityLevel]),
      complexityPenalty,
      costPercentage: Math.ceil((additionalCost * creativityMultiplier[creativityLevel]) / 10) // Rough percentage
    };
  }

  // Quick hybrid assessment without full generation
  static async assessHybridOpportunities(formData: FormData) {
    const creativeZones = this.identifyCreativeOpportunities(formData, { creativityLevel: 'moderate' });
    const impact = this.calculateCreativeImpact(creativeZones, { creativityLevel: 'moderate' });

    return {
      availableZones: creativeZones.length,
      recommendedEnhancements: creativeZones
        .filter(zone => zone.canUseCreative && zone.costImpact !== 'high')
        .map(zone => zone.name),
      estimatedAdditionalCost: impact.additionalCost,
      estimatedAdditionalTime: impact.additionalTime,
      feasibilityScore: Math.max(60, 100 - impact.complexityPenalty * 3)
    };
  }

  // Generate multiple hybrid variations
  static async generateHybridVariations(
    formData: FormData,
    brandAssetUrls: string[] = []
  ) {
    const variations = ['conservative', 'moderate', 'innovative'] as const;
    const results = [];

    for (const creativityLevel of variations) {
      try {
        const result = await this.generateHybridDesign(formData, brandAssetUrls, {
          creativityLevel,
          budgetConstraint: 'medium'
        });

        results.push({
          level: creativityLevel,
          ...result
        });
      } catch (error) {
        console.warn(`Failed to generate ${creativityLevel} variation:`, error);
      }
    }

    return results;
  }
}
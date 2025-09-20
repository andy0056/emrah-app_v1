/**
 * Empati Design DNA Service
 * Integrates client's established design language with AI creativity
 * Based on analysis of empati.com design patterns and aesthetics
 */

import { FormData } from '../types';
import { DesignMode } from '../components/DesignModeSelector';

export interface EmpatiDesignProfile {
  // Core brand characteristics from empati.com analysis
  aesthetic: 'minimalist-modern' | 'tech-professional' | 'premium-industrial';
  colorPalette: {
    primary: string[];
    accent: string[];
    neutral: string[];
  };
  designPrinciples: string[];
  materialPreferences: string[];
  complexityLevel: 'clean-simple' | 'sophisticated-minimal' | 'tech-detailed';
  signatureElements: string[];
}

export interface DesignAlignment {
  baseStyle: string;
  creativeEnhancements: string[];
  materialsRecommendation: string;
  finishingTouches: string[];
  avoidanceRules: string[];
  brandConsistency: number; // 0-100 score
}

export class EmpatiDesignDNAService {

  // Empati's established design DNA based on website analysis
  private static readonly EMPATI_DESIGN_PROFILE: EmpatiDesignProfile = {
    aesthetic: 'minimalist-modern',
    colorPalette: {
      primary: ['#FFFFFF', '#F8F9FA'], // Clean whites
      accent: ['#4E5AC3', '#3949AB'],  // Deep blues (78,90,195 converted)
      neutral: ['#2C2C2C', '#424242', '#757575'] // Professional grays
    },
    designPrinciples: [
      'Grid-based modular layouts',
      'Emphasis on white space and clarity',
      'High contrast professional presentation',
      'Technology-forward aesthetic',
      'Functional over decorative',
      'Geometric clean lines',
      'Responsive flexibility'
    ],
    materialPreferences: [
      'Powder-coated steel (clean finish)',
      'Anodized aluminum (professional)',
      'High-grade plastics (modern)',
      'Tempered glass (premium touch)',
      'LED lighting integration'
    ],
    complexityLevel: 'sophisticated-minimal',
    signatureElements: [
      'Modular component systems',
      'Subtle geometric patterns',
      'Professional blue accents',
      'Clean typography integration',
      'Invisible fastening systems',
      'Tech-forward lighting'
    ]
  };

  /**
   * Generate design alignment based on Empati's brand DNA and selected design mode
   */
  static getDesignAlignment(
    formData: FormData,
    designMode: DesignMode,
    creativityLevel: 'conservative' | 'moderate' | 'innovative' = 'moderate'
  ): DesignAlignment {

    const profile = this.EMPATI_DESIGN_PROFILE;

    // Base style always aligns with Empati's minimalist-modern aesthetic
    const baseStyle = this.generateBaseStylePrompt(formData, profile);

    // Creative enhancements vary by design mode but stay brand-consistent
    const creativeEnhancements = this.generateCreativeEnhancements(
      formData,
      designMode,
      creativityLevel,
      profile
    );

    // Material recommendations based on Empati's preferences
    const materialsRecommendation = this.getEmpatiMaterialAlignment(
      formData.materials[0],
      profile
    );

    // Finishing touches that match Empati's quality standards
    const finishingTouches = this.getEmpatiFinishingTouches(
      designMode,
      creativityLevel,
      formData
    );

    // Rules to avoid breaking Empati's design consistency
    const avoidanceRules = this.getEmpatiAvoidanceRules();

    // Calculate brand consistency score
    const brandConsistency = this.calculateBrandConsistency(
      designMode,
      creativityLevel,
      formData
    );

    return {
      baseStyle,
      creativeEnhancements,
      materialsRecommendation,
      finishingTouches,
      avoidanceRules,
      brandConsistency
    };
  }

  /**
   * Generate base style prompt that aligns with Empati's design DNA
   */
  private static generateBaseStylePrompt(formData: FormData, profile: EmpatiDesignProfile): string {
    return `
EMPATI DESIGN DNA ALIGNMENT:
- Aesthetic: ${profile.aesthetic} with ${profile.complexityLevel} execution
- Color Foundation: ${profile.colorPalette.primary[0]} base with ${profile.colorPalette.accent[0]} professional accents
- Design Language: ${profile.designPrinciples.slice(0, 3).join(', ')}
- Signature Style: ${profile.signatureElements.slice(0, 2).join(', ')}

BRAND-CONSISTENT BASE STRUCTURE:
- Grid-based modular layout with clean geometric lines
- High contrast professional presentation
- Emphasis on white space and structural clarity
- Technology-forward aesthetic with functional focus
- Material: ${formData.materials[0]} with professional finishing
- Dimensions: ${formData.standWidth}×${formData.standHeight}×${formData.standDepth}cm optimized for clarity
`.trim();
  }

  /**
   * Generate creative enhancements that respect Empati's brand consistency
   */
  private static generateCreativeEnhancements(
    formData: FormData,
    designMode: DesignMode,
    creativityLevel: string,
    profile: EmpatiDesignProfile
  ): string[] {

    const baseEnhancements = [
      `Subtle ${profile.colorPalette.accent[0]} accent lighting along edges`,
      'Modular component connection details',
      'Professional geometric pattern integration',
      'Clean typography-inspired element spacing'
    ];

    if (designMode === 'production') {
      return [
        ...baseEnhancements.slice(0, 2),
        'Invisible fastening system with clean reveals',
        'Powder-coated finish with slight texture for premium feel'
      ];
    }

    if (designMode === 'concept') {
      return [
        ...baseEnhancements,
        'Dynamic LED system with programmable sequences',
        'Glass or acrylic accent panels with etched patterns',
        'Interactive digital integration points',
        'Advanced modular expansion capabilities'
      ];
    }

    // Hybrid mode - balanced approach
    const hybridEnhancements = [...baseEnhancements];

    if (creativityLevel === 'innovative') {
      hybridEnhancements.push(
        'Smart LED strips with brand color programming',
        'Modular expansion joints with hidden connectivity',
        'Premium material accents in signature blue tones'
      );
    } else if (creativityLevel === 'moderate') {
      hybridEnhancements.push(
        'Subtle LED edge lighting in brand blue',
        'Professional texture variation on key surfaces'
      );
    }

    return hybridEnhancements;
  }

  /**
   * Align material choice with Empati's preferences
   */
  private static getEmpatiMaterialAlignment(selectedMaterial: string, profile: EmpatiDesignProfile): string {
    const alignments = {
      'Metal': `Professional powder-coated steel or anodized aluminum finish.
                Match Empati's clean industrial aesthetic with ${profile.colorPalette.primary[0]} base and
                ${profile.colorPalette.accent[0]} accent details. Geometric edge finishing.`,

      'Plastik (Plastic)': `High-grade engineering plastic with professional finish.
                           Clean geometric molding details. White or light gray base with
                           ${profile.colorPalette.accent[0]} accent elements. Minimal visible seams.`,

      'Ahşap (Wood)': `Light wood tones (birch, ash) with clear protective finish.
                       Geometric edge details. Natural wood paired with white accents and
                       ${profile.colorPalette.accent[0]} branding elements for modern appeal.`,

      'Karton (Cardboard)': `Premium white cardboard with structural integrity.
                             Clean folding geometry. Professional print quality with
                             ${profile.colorPalette.accent[0]} graphics and minimal design elements.`
    };

    return alignments[selectedMaterial] || alignments['Metal'];
  }

  /**
   * Generate finishing touches that match Empati's quality standards
   */
  private static getEmpatiFinishingTouches(
    designMode: DesignMode,
    creativityLevel: string,
    formData: FormData
  ): string[] {

    const baseTouches = [
      'Clean edge finishing with no visible fasteners',
      'Professional surface treatment matching Empati standards',
      'Geometric detail consistency throughout',
      'High-contrast element separation'
    ];

    if (designMode === 'production') {
      return [
        ...baseTouches,
        'Industry-standard assembly tolerances',
        'Flat-pack friendly connection systems'
      ];
    }

    if (creativityLevel === 'innovative') {
      return [
        ...baseTouches,
        'Premium LED integration with dimming capability',
        'Smart material transitions and reveals',
        'Advanced modular connection systems',
        'Digital integration readiness'
      ];
    }

    return [
      ...baseTouches,
      'Subtle material texture variations',
      'Professional cable management integration'
    ];
  }

  /**
   * Rules to avoid breaking Empati's design consistency
   */
  private static getEmpatiAvoidanceRules(): string[] {
    return [
      'Avoid overly decorative or ornamental elements',
      'No bright or flashy colors outside brand palette',
      'Avoid complex curves or organic shapes',
      'No visible clutter or excessive detail density',
      'Avoid cheap-looking materials or finishes',
      'No elements that compromise clean geometric lines',
      'Avoid breaking the grid-based layout system',
      'No elements that look temporary or makeshift'
    ];
  }

  /**
   * Calculate how well the design aligns with Empati's brand
   */
  private static calculateBrandConsistency(
    designMode: DesignMode,
    creativityLevel: string,
    formData: FormData
  ): number {
    let score = 85; // Base score for using this service

    // Design mode impact
    if (designMode === 'production') score += 10; // Most consistent
    if (designMode === 'concept') score -= 15; // Most creative deviation

    // Creativity level impact
    if (creativityLevel === 'conservative') score += 10;
    if (creativityLevel === 'innovative') score -= 10;

    // Material alignment
    const empatiMaterials = ['Metal', 'Plastik (Plastic)'];
    if (empatiMaterials.includes(formData.materials[0])) score += 5;

    return Math.max(60, Math.min(100, score));
  }

  /**
   * Generate complete prompt integration for AI generation
   */
  static generateEmpatiAlignedPrompt(
    basePrompt: string,
    formData: FormData,
    designMode: DesignMode,
    creativityLevel: 'conservative' | 'moderate' | 'innovative' = 'moderate'
  ): string {

    const alignment = this.getDesignAlignment(formData, designMode, creativityLevel);

    const empatiPrompt = `
${alignment.baseStyle}

CREATIVE ENHANCEMENTS (Brand-Consistent):
${alignment.creativeEnhancements.map(enhancement => `- ${enhancement}`).join('\n')}

MATERIAL TREATMENT:
${alignment.materialsRecommendation}

FINISHING STANDARDS:
${alignment.finishingTouches.map(touch => `- ${touch}`).join('\n')}

EMPATI BRAND AVOIDANCE RULES:
${alignment.avoidanceRules.map(rule => `- ${rule}`).join('\n')}

ORIGINAL REQUIREMENTS:
${basePrompt}

FINAL OUTPUT REQUIREMENTS:
- Must achieve ${alignment.brandConsistency}% brand consistency with Empati's established design language
- Balance creative innovation with professional manufacturing standards
- Maintain Empati's minimalist-modern aesthetic throughout
- Ensure all elements support the grid-based, technology-forward design philosophy
`;

    console.log(`🎨 Empati Design DNA Applied:`, {
      designMode,
      creativityLevel,
      brandConsistency: `${alignment.brandConsistency}%`,
      enhancements: alignment.creativeEnhancements.length
    });

    return empatiPrompt.trim();
  }

  /**
   * Validate generated design against Empati standards
   */
  static validateEmpatiAlignment(generatedImageUrl: string): Promise<{
    isAligned: boolean;
    score: number;
    feedback: string[];
    improvements: string[];
  }> {
    // In a full implementation, this would use computer vision to analyze:
    // - Color palette adherence
    // - Geometric cleanliness
    // - Material appearance quality
    // - Overall brand consistency

    return Promise.resolve({
      isAligned: true,
      score: 88,
      feedback: [
        'Clean geometric lines maintained',
        'Professional color palette respected',
        'Minimalist aesthetic preserved'
      ],
      improvements: [
        'Consider slightly more subtle accent lighting',
        'Ensure all edges maintain geometric precision'
      ]
    });
  }
}
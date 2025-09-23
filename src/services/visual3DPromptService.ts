/**
 * Visual 3D Prompt Service
 *
 * Integrates 3D scale references with existing dimensional intelligence
 * to create the most accurate AI prompts possible
 */

import { SmartPromptGenerator, type FormDataWithDimensions } from '../utils/smartPromptGenerator';
import { mergeWithDefaults } from '../utils/formDataMapper';
import type { CapturedViews } from '../hooks/useSceneCapture';
import type { FormData } from '../types';

export interface Visual3DPromptRequest {
  formData: FormData;
  capturedViews: CapturedViews;
  viewType: 'front' | 'store' | 'three-quarter';
  creativeMode: 'refined' | 'advanced' | 'optimized' | 'validated';
}

export interface Visual3DPromptResult {
  enhancedPrompt: string;
  referenceImages: string[];
  dimensionalAnalysis: any;
  scaleAccuracy: {
    humanScale: boolean;
    productScale: boolean;
    displayScale: boolean;
    overallConfidence: number;
  };
  metadata: {
    generatedAt: number;
    promptLength: number;
    hasVisualReferences: boolean;
    hasDimensionalIntelligence: boolean;
  };
}

export class Visual3DPromptService {
  /**
   * Generate enhanced prompts combining 3D visual references with dimensional intelligence
   */
  static async generateVisuallyEnhancedPrompt(
    request: Visual3DPromptRequest
  ): Promise<Visual3DPromptResult> {
    const { formData, capturedViews, viewType, creativeMode } = request;

    console.log('🎯 Generating visually enhanced prompt with 3D scale references');

    try {
      // 1. Generate dimensional intelligence analysis
      const dimensionalData = mergeWithDefaults(formData, formData.product);
      const intelligentPrompts = SmartPromptGenerator.generateIntelligentPrompts(dimensionalData);

      // 2. Extract scale reference data from captured views
      const scaleReferences = capturedViews.metadata.scaleReferences;

      // 3. Validate scale accuracy
      const scaleAccuracy = this.validateScaleAccuracy(scaleReferences, dimensionalData);

      // 4. Generate base prompt using existing intelligent system
      let basePrompt: string;
      switch (viewType) {
        case 'front':
          basePrompt = intelligentPrompts.frontView;
          break;
        case 'store':
          basePrompt = intelligentPrompts.storeView;
          break;
        case 'three-quarter':
        default:
          basePrompt = intelligentPrompts.threeQuarterView;
          break;
      }

      // 5. Enhance with visual scale context
      const visualScaleEnhancement = this.generateVisualScaleEnhancement(
        capturedViews,
        intelligentPrompts.analysis,
        viewType
      );

      // 6. Apply creative mode enhancements
      const creativeModeEnhancement = this.applyCreativeModeWithVisuals(
        creativeMode,
        capturedViews,
        intelligentPrompts.analysis
      );

      // 7. Combine all enhancements
      const enhancedPrompt = this.combineEnhancements(
        basePrompt,
        visualScaleEnhancement,
        creativeModeEnhancement,
        scaleAccuracy
      );

      // 8. Prepare reference images for AI input
      const referenceImages = this.selectReferenceImages(capturedViews, viewType);

      console.log('✅ Visual 3D prompt generated successfully', {
        promptLength: enhancedPrompt.length,
        scaleConfidence: scaleAccuracy.overallConfidence,
        referenceImageCount: referenceImages.length
      });

      return {
        enhancedPrompt,
        referenceImages,
        dimensionalAnalysis: intelligentPrompts.analysis,
        scaleAccuracy,
        metadata: {
          generatedAt: Date.now(),
          promptLength: enhancedPrompt.length,
          hasVisualReferences: referenceImages.length > 0,
          hasDimensionalIntelligence: true
        }
      };

    } catch (error) {
      console.error('Failed to generate visually enhanced prompt:', error);
      throw new Error(`Visual 3D prompt generation failed: ${error}`);
    }
  }

  /**
   * Validate scale accuracy between 3D scene and form data
   */
  private static validateScaleAccuracy(
    scaleReferences: CapturedViews['metadata']['scaleReferences'],
    dimensionalData: FormDataWithDimensions
  ) {
    // Check if product dimensions match
    const productMatch = (
      Math.abs(scaleReferences.productDimensions.width - dimensionalData.productWidth) < 1 &&
      Math.abs(scaleReferences.productDimensions.height - dimensionalData.productHeight) < 1 &&
      Math.abs(scaleReferences.productDimensions.depth - dimensionalData.productDepth) < 1
    );

    // Check if display dimensions match
    const displayMatch = (
      Math.abs(scaleReferences.displayDimensions.width - dimensionalData.standWidth) < 2 &&
      Math.abs(scaleReferences.displayDimensions.height - dimensionalData.standHeight) < 2 &&
      Math.abs(scaleReferences.displayDimensions.depth - dimensionalData.standDepth) < 2
    );

    // Human scale is always valid (175cm reference)
    const humanScale = scaleReferences.humanHeight === 175;

    // Calculate overall confidence
    const matchCount = [productMatch, displayMatch, humanScale].filter(Boolean).length;
    const overallConfidence = matchCount / 3;

    return {
      humanScale,
      productScale: productMatch,
      displayScale: displayMatch,
      overallConfidence
    };
  }

  /**
   * Generate visual scale enhancement text
   */
  private static generateVisualScaleEnhancement(
    capturedViews: CapturedViews,
    dimensionalAnalysis: any,
    viewType: string
  ): string {
    const { scaleReferences } = capturedViews.metadata;
    const layout = dimensionalAnalysis.calculatedLayout;

    return `
VISUAL SCALE CONTEXT:
The reference images show precise scale relationships with a human figure (${scaleReferences.humanHeight}cm) providing absolute scale reference. The product (${scaleReferences.productDimensions.width}×${scaleReferences.productDimensions.height}×${scaleReferences.productDimensions.depth}cm) and display bounds (${scaleReferences.displayDimensions.width}×${scaleReferences.displayDimensions.height}×${scaleReferences.displayDimensions.depth}cm) are positioned to show exact proportional relationships.

CALCULATED LAYOUT INTEGRATION:
- ${layout.productsPerShelf} products per shelf in ${layout.shelfRows}×${layout.shelfColumns} arrangement
- ${layout.productSpacing}cm spacing between products for accessibility
- Total capacity: ${layout.totalProductCapacity} products across all shelves

SCALE ACCURACY REQUIREMENTS:
Maintain the exact proportional relationships shown in the reference images. The human figure establishes absolute scale - all other elements must be proportionally accurate to this 175cm reference. Product size and display dimensions must match the spatial relationships demonstrated in the 3D scene.`;
  }

  /**
   * Apply creative mode enhancements with visual context
   */
  private static applyCreativeModeWithVisuals(
    creativeMode: string,
    capturedViews: CapturedViews,
    dimensionalAnalysis: any
  ): string {
    const utilization = dimensionalAnalysis.spaceUtilization;
    const constraints = dimensionalAnalysis.manufacturingConstraints;

    const baseModeText = {
      refined: 'Balanced creative approach with visual scale accuracy',
      advanced: 'Advanced photorealistic rendering with precise dimensional relationships',
      optimized: 'Streamlined design optimized for both visual impact and manufacturing',
      validated: 'Strict compliance with both visual scale references and manufacturing constraints'
    };

    const modeText = baseModeText[creativeMode as keyof typeof baseModeText] || baseModeText.refined;

    return `
CREATIVE MODE: ${creativeMode.toUpperCase()} WITH VISUAL INTELLIGENCE
${modeText}. The design must respect both the visual scale relationships shown in reference images and the calculated dimensional constraints:

- Space utilization: ${utilization.efficiency} (${utilization.standUsagePercent}%)
- Manufacturing constraints: ${constraints.length} items to address
- Visual consistency: All elements must maintain reference image proportions
${creativeMode === 'validated' ? '- Strict validation: Zero tolerance for scale or manufacturing deviations' : ''}
${creativeMode === 'advanced' ? '- Enhanced realism: Museum-quality documentation with perfect scale accuracy' : ''}
${creativeMode === 'optimized' ? '- Efficiency focus: Optimal design with minimal complexity while maintaining scale accuracy' : ''}`;
  }

  /**
   * Combine all prompt enhancements
   */
  private static combineEnhancements(
    basePrompt: string,
    visualEnhancement: string,
    creativeModeEnhancement: string,
    scaleAccuracy: any
  ): string {
    const accuracyWarning = scaleAccuracy.overallConfidence < 0.8
      ? '\n\n⚠️ SCALE ACCURACY WARNING: Some dimensional mismatches detected between 3D scene and form data. Prioritize visual reference proportions.'
      : '\n\n✅ SCALE VALIDATION: All dimensional references verified accurate.';

    return `${basePrompt}

${visualEnhancement}

${creativeModeEnhancement}${accuracyWarning}

FINAL INSTRUCTION: Generate a design that perfectly matches the scale relationships shown in the reference images while incorporating all calculated dimensional and manufacturing requirements. Visual scale accuracy is paramount.`;
  }

  /**
   * Select appropriate reference images based on view type
   */
  private static selectReferenceImages(
    capturedViews: CapturedViews,
    viewType: string
  ): string[] {
    switch (viewType) {
      case 'front':
        return [capturedViews.front];
      case 'store':
        // Store view benefits from multiple angles for context
        return [capturedViews.front, capturedViews.side];
      case 'three-quarter':
      default:
        return [capturedViews.threeQuarter];
    }
  }

  /**
   * Generate comparison analysis between traditional and visual prompts
   */
  static generatePromptComparison(
    traditionalPrompt: string,
    visualPrompt: Visual3DPromptResult
  ) {
    return {
      traditional: {
        length: traditionalPrompt.length,
        hasScaleReferences: traditionalPrompt.includes('cm') || traditionalPrompt.includes('dimensions'),
        hasVisualContext: false,
        scaleAccuracy: 'text-based (limited)'
      },
      visual: {
        length: visualPrompt.enhancedPrompt.length,
        hasScaleReferences: true,
        hasVisualContext: true,
        scaleAccuracy: `${(visualPrompt.scaleAccuracy.overallConfidence * 100).toFixed(1)}% verified`,
        referenceImages: visualPrompt.referenceImages.length
      },
      improvement: {
        scaleAccuracy: visualPrompt.scaleAccuracy.overallConfidence,
        visualContext: 'Added 3D scale references',
        dimensionalIntelligence: 'Enhanced with calculated layouts'
      }
    };
  }
}
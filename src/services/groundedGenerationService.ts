import { FormData } from '../types';
import { TemplateSelector, TemplateSelectionResult } from './templateSelector';
import { StructureGuideGenerator } from './guide/structureGuideGenerator';
import { GroundedImageGeneration, GroundedGenerationRequest } from './fal/groundedImageGeneration';
import { StructuredPromptScaffold } from './prompt/structuredPromptScaffold';
import { DFMValidator } from '../domain/rules/dfm';

export interface GroundedGenerationOptions {
  model?: 'seedream-v4' | 'nano-banana' | 'flux-kontext';
  preserveStructure?: boolean;
  includeBrandAssets?: boolean;
  showJoinery?: boolean;
  perspective?: '3quarter' | 'orthographic_front' | 'orthographic_side';
  enableDFMValidation?: boolean;
  creativeMode?: 'refined' | 'advanced' | 'optimized' | 'validated';
}

export interface GroundedGenerationResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  template: {
    id: string;
    name: string;
    archetype: string;
  };
  manufacturability: {
    score: number;
    isManufacturable: boolean;
    issues: Array<{
      severity: string;
      category: string;
      message: string;
    }>;
  };
  structureGuide: {
    svg: string;
    metadata: any;
  };
  prompt: {
    used: string;
    negative: string;
  };
  metadata: {
    processingTime: number;
    model: string;
    structurePreserved: boolean;
    templateMatchScore: number;
  };
}

export class GroundedGenerationService {

  /**
   * Main entry point - replaces traditional T2I generation with grounded approach
   */
  static async generateGroundedDisplay(
    formData: FormData,
    brandAssetUrls: string[] = [],
    options: GroundedGenerationOptions = {}
  ): Promise<GroundedGenerationResponse> {
    const startTime = Date.now();

    console.log('🏗️ Starting Grounded Generation Pipeline:', {
      standType: formData.standType,
      dimensions: `${formData.standWidth}×${formData.standHeight}×${formData.standDepth}cm`,
      shelfCount: formData.shelfCount,
      options
    });

    try {
      // Step 1: Select optimal template based on requirements
      const templateResult = await this.selectAndValidateTemplate(formData);

      if ('error' in templateResult) {
        throw new Error(`Template selection failed: ${templateResult.error}`);
      }

      console.log('✅ Template Selected:', {
        template: templateResult.template.id,
        matchScore: templateResult.matchScore,
        manufacturabilityScore: templateResult.manufacturabilityReport.score
      });

      // Step 2: Generate structure guide from template
      const structureGuide = await this.generateStructureGuide(
        templateResult.template,
        formData,
        options.perspective || '3quarter'
      );

      console.log('✅ Structure Guide Generated:', {
        perspective: options.perspective || '3quarter',
        dimensions: structureGuide.metadata.dimensions
      });

      // Step 3: Create grounded generation request
      const generationRequest = await this.buildGenerationRequest(
        templateResult.template,
        formData,
        structureGuide,
        brandAssetUrls,
        options
      );

      console.log('✅ Generation Request Built:', {
        model: generationRequest.model,
        preserveStructure: generationRequest.preserveStructure,
        hasBrandAssets: !!generationRequest.brandAssetUrls?.length
      });

      // Step 4: Generate images using structure-aware models
      const generationResult = await GroundedImageGeneration.generateWithStructureGuide(generationRequest);

      console.log('✅ Images Generated:', {
        count: generationResult.images.length,
        model: generationResult.model_used,
        processingTime: generationResult.processing_time_ms
      });

      // Step 5: Validate results (optional)
      if (options.enableDFMValidation && generationResult.images.length > 0) {
        const validation = await GroundedImageGeneration.validateGeneratedImage(
          generationResult.images[0].url,
          templateResult.template
        );
        console.log('✅ DFM Validation:', validation);
      }

      // Step 6: Compile response
      const response: GroundedGenerationResponse = {
        images: generationResult.images,
        template: {
          id: templateResult.template.id,
          name: templateResult.template.name,
          archetype: templateResult.template.archetype_id
        },
        manufacturability: {
          score: templateResult.manufacturabilityReport.score,
          isManufacturable: templateResult.manufacturabilityReport.isManufacturable,
          issues: templateResult.manufacturabilityReport.issues.map(issue => ({
            severity: issue.severity,
            category: issue.category,
            message: issue.message
          }))
        },
        structureGuide: {
          svg: structureGuide.svg,
          metadata: structureGuide.metadata
        },
        prompt: {
          used: generationResult.prompt_used,
          negative: '' // Add negative prompt if needed
        },
        metadata: {
          processingTime: Date.now() - startTime,
          model: generationResult.model_used,
          structurePreserved: generationResult.manufacturability_preserved,
          templateMatchScore: templateResult.matchScore
        }
      };

      console.log('🎯 Grounded Generation Complete:', {
        totalTime: response.metadata.processingTime,
        manufacturabilityScore: response.manufacturability.score,
        templateMatch: response.metadata.templateMatchScore
      });

      return response;

    } catch (error) {
      console.error('❌ Grounded Generation Failed:', error);
      throw error;
    }
  }

  private static async selectAndValidateTemplate(formData: FormData): Promise<TemplateSelectionResult> {
    // Pre-validate form data
    const validation = await TemplateSelector.validateRequirements(formData);
    if (!validation.isValid) {
      throw new Error(`Form validation failed: ${validation.issues.join(', ')}`);
    }

    // Select optimal template
    const result = await TemplateSelector.selectTemplate(formData);

    if ('error' in result) {
      throw new Error(result.error);
    }

    return result;
  }

  private static async generateStructureGuide(
    template: any,
    formData: FormData,
    perspective: '3quarter' | 'orthographic_front' | 'orthographic_side'
  ) {
    // Generate structure guide from template
    const guide = await StructureGuideGenerator.generateGuide(template, {
      perspective,
      showDimensions: true,
      showJoinery: true,
      showFoldLines: true,
      exportFormat: 'svg'
    });

    return guide;
  }

  private static async buildGenerationRequest(
    template: any,
    formData: FormData,
    structureGuide: any,
    brandAssetUrls: string[],
    options: GroundedGenerationOptions
  ): Promise<GroundedGenerationRequest> {
    // Determine optimal model if not specified
    const model = options.model || GroundedImageGeneration.selectOptimalModel({
      brandAssetUrls,
      preserveStructure: options.preserveStructure !== false // Default to true
    });

    return {
      template,
      structureGuide,
      formData,
      brandAssetUrls: brandAssetUrls.length > 0 ? brandAssetUrls : undefined,
      model,
      preserveStructure: options.preserveStructure !== false,
      creativeMode: options.creativeMode || 'refined'
    };
  }

  /**
   * Legacy compatibility method - converts old prompt-based generation to grounded approach
   */
  static async upgradeFromLegacyPrompt(
    prompt: string,
    formData: FormData,
    brandAssetUrls: string[] = []
  ): Promise<GroundedGenerationResponse> {
    console.log('🔄 Upgrading legacy prompt to grounded generation:', prompt.substring(0, 100) + '...');

    // Detect intent from legacy prompt
    const options: GroundedGenerationOptions = {
      preserveStructure: !prompt.includes('creative') && !prompt.includes('artistic'),
      includeBrandAssets: brandAssetUrls.length > 0,
      showJoinery: prompt.includes('joint') || prompt.includes('assembly') || prompt.includes('construction'),
      perspective: prompt.includes('front') ? 'orthographic_front' :
                  prompt.includes('side') ? 'orthographic_side' : '3quarter',
      enableDFMValidation: true
    };

    return this.generateGroundedDisplay(formData, brandAssetUrls, options);
  }

  /**
   * Quick structure guide generation without full image generation
   */
  static async generateStructureGuideOnly(
    formData: FormData,
    perspective: '3quarter' | 'orthographic_front' | 'orthographic_side' = '3quarter'
  ) {
    const templateResult = await TemplateSelector.selectTemplate(formData);

    if ('error' in templateResult) {
      throw new Error(`Template selection failed: ${templateResult.error}`);
    }

    return StructureGuideGenerator.generateGuide(templateResult.template, {
      perspective,
      showDimensions: true,
      showJoinery: true,
      showFoldLines: true,
      exportFormat: 'svg'
    });
  }

  /**
   * Validate manufacturability without generation
   */
  static async validateManufacturability(formData: FormData) {
    const templateResult = await TemplateSelector.selectTemplate(formData);

    if ('error' in templateResult) {
      return {
        isValid: false,
        score: 0,
        issues: [templateResult.error],
        template: null
      };
    }

    return {
      isValid: templateResult.manufacturabilityReport.isManufacturable,
      score: templateResult.manufacturabilityReport.score,
      issues: templateResult.manufacturabilityReport.issues.map(i => i.message),
      template: {
        id: templateResult.template.id,
        name: templateResult.template.name,
        archetype: templateResult.template.archetype_id
      }
    };
  }

  /**
   * Get available models and their recommended use cases
   */
  static getAvailableModels() {
    return [
      {
        id: 'seedream-v4',
        name: 'SeedReam v4 Edit',
        description: 'Best for structure preservation and manufacturing accuracy',
        recommended_for: ['structure_preservation', 'manufacturing_validation', 'precise_editing'],
        preserves_structure: 'excellent'
      },
      {
        id: 'nano-banana',
        name: 'Gemini 2.5 Flash Image (Nano Banana)',
        description: 'Best for brand asset integration and multi-image fusion',
        recommended_for: ['brand_integration', 'multi_image_fusion', 'logo_placement'],
        preserves_structure: 'good'
      },
      {
        id: 'flux-kontext',
        name: 'FLUX.1 Kontext',
        description: 'Good for compositional editing and creative interpretation',
        recommended_for: ['creative_interpretation', 'artistic_finishing', 'style_transfer'],
        preserves_structure: 'moderate'
      }
    ];
  }
}
import { FormData } from '../types';
import { mapStandTypeToArchetype, getArchetype, ArchetypeId } from '../domain/templates/archetypes';
import { findBestTemplate, DisplayTemplate } from '../domain/templates/templateLibrary';
import { DFMValidator, ManufacturabilityReport } from '../domain/rules/dfm';

export interface TemplateSelectionResult {
  template: DisplayTemplate;
  archetype: ArchetypeId;
  manufacturabilityReport: ManufacturabilityReport;
  matchScore: number; // 0-100, how well the template fits the requirements
  adjustments?: string[]; // Suggested modifications to improve fit
}

export interface TemplateSelectionError {
  error: string;
  suggestions: string[];
  fallbackOptions?: DisplayTemplate[];
}

export class TemplateSelector {

  static async selectTemplate(formData: FormData): Promise<TemplateSelectionResult | TemplateSelectionError> {
    try {
      // 1. Map stand type to buildable archetype
      const archetypeId = mapStandTypeToArchetype(formData.standType);
      const archetype = getArchetype(archetypeId);

      if (!archetype) {
        return {
          error: `Unknown archetype for stand type: ${formData.standType}`,
          suggestions: ['Try a different stand type', 'Check supported stand types'],
          fallbackOptions: []
        };
      }

      // 2. Convert form dimensions to mm for template matching
      const targetDimensions = {
        width_mm: formData.standWidth * 10,
        height_mm: formData.standHeight * 10,
        depth_mm: formData.standDepth * 10
      };

      // 3. Validate basic constraints before template search
      const formValidation = DFMValidator.validateFormData({
        standWidth: formData.standWidth,
        standHeight: formData.standHeight,
        standDepth: formData.standDepth,
        shelfCount: formData.shelfCount,
        materials: formData.materials
      });

      // Check for critical issues that would block any template
      const criticalIssues = formValidation.filter(issue => issue.severity === 'critical');
      if (criticalIssues.length > 0) {
        return {
          error: 'Form data has critical manufacturability issues',
          suggestions: criticalIssues.map(issue => issue.suggestion || issue.message),
          fallbackOptions: []
        };
      }

      // 4. Find best matching template
      const template = findBestTemplate(archetypeId, targetDimensions, formData.shelfCount);

      if (!template) {
        return {
          error: `No suitable template found for ${archetype.name} with specified dimensions`,
          suggestions: [
            'Try reducing dimensions to fit standard templates',
            'Consider a different stand type',
            'Adjust shelf count to match available templates'
          ],
          fallbackOptions: []
        };
      }

      // 5. Run DFM validation on selected template
      const manufacturabilityReport = DFMValidator.validateTemplate(template);

      // 6. Calculate match score
      const matchScore = this.calculateMatchScore(template, formData, targetDimensions);

      // 7. Generate adjustment suggestions if needed
      const adjustments = this.generateAdjustmentSuggestions(template, formData, manufacturabilityReport);

      // 8. Check if template is viable
      if (!manufacturabilityReport.isManufacturable) {
        return {
          error: 'Selected template has critical manufacturability issues',
          suggestions: manufacturabilityReport.issues
            .filter(issue => issue.severity === 'critical')
            .map(issue => issue.suggestion || issue.message),
          fallbackOptions: []
        };
      }

      console.log('✅ Template Selected:', {
        template: template.id,
        archetype: archetypeId,
        matchScore,
        manufacturabilityScore: manufacturabilityReport.score,
        adjustments: adjustments.length
      });

      return {
        template,
        archetype: archetypeId,
        manufacturabilityReport,
        matchScore,
        adjustments: adjustments.length > 0 ? adjustments : undefined
      };

    } catch (error) {
      console.error('Template selection failed:', error);
      return {
        error: `Template selection failed: ${error}`,
        suggestions: ['Try again with different specifications', 'Check form data validity'],
        fallbackOptions: []
      };
    }
  }

  private static calculateMatchScore(
    template: DisplayTemplate,
    formData: FormData,
    targetDimensions: { width_mm: number; height_mm: number; depth_mm: number }
  ): number {
    let score = 100;

    // Dimension match (40% of score)
    const dimScore = this.calculateDimensionMatch(template.overall_dimensions, targetDimensions);
    score -= (1 - dimScore) * 40;

    // Shelf count match (25% of score)
    const shelfDiff = Math.abs(template.product_capacity.shelf_count - formData.shelfCount);
    const shelfScore = Math.max(0, 1 - (shelfDiff / formData.shelfCount));
    score -= (1 - shelfScore) * 25;

    // Material match (20% of score)
    const materialMatch = this.calculateMaterialMatch(template.material.type, formData.materials);
    score -= (1 - materialMatch) * 20;

    // Complexity match (15% of score) - prefer simpler for retail
    const complexityBonus = template.constraints.assembly_complexity === 'simple' ? 1 :
                           template.constraints.assembly_complexity === 'moderate' ? 0.7 : 0.4;
    score -= (1 - complexityBonus) * 15;

    return Math.max(0, Math.min(100, score));
  }

  private static calculateDimensionMatch(
    templateDims: { width_mm: number; height_mm: number; depth_mm: number },
    targetDims: { width_mm: number; height_mm: number; depth_mm: number }
  ): number {
    const widthRatio = Math.min(templateDims.width_mm, targetDims.width_mm) /
                      Math.max(templateDims.width_mm, targetDims.width_mm);
    const heightRatio = Math.min(templateDims.height_mm, targetDims.height_mm) /
                       Math.max(templateDims.height_mm, targetDims.height_mm);
    const depthRatio = Math.min(templateDims.depth_mm, targetDims.depth_mm) /
                      Math.max(templateDims.depth_mm, targetDims.depth_mm);

    return (widthRatio + heightRatio + depthRatio) / 3;
  }

  private static calculateMaterialMatch(templateMaterial: string, formMaterials: string[]): number {
    // Simple material mapping - could be enhanced
    const materialMap: Record<string, string[]> = {
      'EB_flute_cardboard': ['cardboard', 'karton', 'corrugated'],
      'MDF': ['mdf', 'wood', 'ahşap'],
      'acrylic': ['acrylic', 'plastic', 'plexiglass'],
      'metal': ['metal', 'steel', 'aluminum'],
      'plastic': ['plastic', 'pvc', 'polystyrene']
    };

    const templateMaterialKeys = materialMap[templateMaterial] || [templateMaterial];

    for (const formMaterial of formMaterials) {
      for (const key of templateMaterialKeys) {
        if (formMaterial.toLowerCase().includes(key.toLowerCase())) {
          return 1.0;
        }
      }
    }

    return 0.3; // Partial match if no exact match
  }

  private static generateAdjustmentSuggestions(
    template: DisplayTemplate,
    formData: FormData,
    manufacturabilityReport: ManufacturabilityReport
  ): string[] {
    const suggestions: string[] = [];

    // Dimension adjustments
    const targetDims = {
      width_mm: formData.standWidth * 10,
      height_mm: formData.standHeight * 10,
      depth_mm: formData.standDepth * 10
    };

    const widthDiff = Math.abs(template.overall_dimensions.width_mm - targetDims.width_mm);
    const heightDiff = Math.abs(template.overall_dimensions.height_mm - targetDims.height_mm);
    const depthDiff = Math.abs(template.overall_dimensions.depth_mm - targetDims.depth_mm);

    if (widthDiff > 50) {
      suggestions.push(`Consider adjusting width to ${template.overall_dimensions.width_mm / 10}cm for better template fit`);
    }
    if (heightDiff > 100) {
      suggestions.push(`Consider adjusting height to ${template.overall_dimensions.height_mm / 10}cm for better template fit`);
    }
    if (depthDiff > 50) {
      suggestions.push(`Consider adjusting depth to ${template.overall_dimensions.depth_mm / 10}cm for better template fit`);
    }

    // Shelf count adjustments
    if (template.product_capacity.shelf_count !== formData.shelfCount) {
      suggestions.push(`Template optimized for ${template.product_capacity.shelf_count} shelves (you specified ${formData.shelfCount})`);
    }

    // Add manufacturability warnings as suggestions
    manufacturabilityReport.issues
      .filter(issue => issue.severity === 'warning' && issue.suggestion)
      .forEach(issue => {
        if (issue.suggestion) {
          suggestions.push(issue.suggestion);
        }
      });

    return suggestions;
  }

  // Helper method to get template without full selection process
  static async getTemplateById(templateId: string): Promise<DisplayTemplate | null> {
    const { getTemplate } = await import('../domain/templates/templateLibrary');
    return getTemplate(templateId);
  }

  // Get all available templates for a specific archetype
  static async getTemplatesForStandType(standType: string): Promise<DisplayTemplate[]> {
    const archetypeId = mapStandTypeToArchetype(standType);
    const { getTemplatesByArchetype } = await import('../domain/templates/templateLibrary');
    return getTemplatesByArchetype(archetypeId);
  }

  // Quick validation without full template selection
  static async validateRequirements(formData: FormData): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Basic dimension checks
    if (formData.standWidth < 10 || formData.standWidth > 300) {
      issues.push('Stand width should be between 10-300cm');
    }
    if (formData.standHeight < 20 || formData.standHeight > 250) {
      issues.push('Stand height should be between 20-250cm');
    }
    if (formData.standDepth < 10 || formData.standDepth > 150) {
      issues.push('Stand depth should be between 10-150cm');
    }

    // Shelf count validation
    if (formData.shelfCount < 1 || formData.shelfCount > 8) {
      issues.push('Shelf count should be between 1-8 shelves');
    }

    // Material validation
    if (!formData.materials || formData.materials.length === 0) {
      issues.push('At least one material must be specified');
    }

    // Archetype validation
    const archetypeId = mapStandTypeToArchetype(formData.standType);
    const archetype = getArchetype(archetypeId);
    if (!archetype) {
      issues.push(`Unsupported stand type: ${formData.standType}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
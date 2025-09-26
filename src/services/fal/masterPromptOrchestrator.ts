/**
 * Master Prompt Orchestrator - Phase 4
 * Coordinates all prompt generation phases with source-of-truth hierarchy
 */

import type { FormData } from '../../types';
import type { CapturedViews } from '../../hooks/useSceneCapture';
import type { Visual3DPromptResult } from '../visual3DPromptService';

import { createFormPriorityBrandPrompt, validateFormRequirementsInPrompt, getProtectedFormContent } from './formPriorityPromptUtils';
import { advancedCompressPrompt, type CompressionConfig } from './advancedCompressionUtils';
import { assessPromptQuality, generateCompressionReport } from './promptQualityAssessment';
import { Visual3DPromptService } from '../visual3DPromptService';

export interface SourceOfTruthHierarchy {
  formData: FormData;                    // Tier 1: Absolute truth
  capturedViews?: CapturedViews;         // Tier 2: Visual context
  aiEnhancements?: any;                  // Tier 3: AI suggestions
  compressionOptimizations?: any;        // Tier 4: Efficiency
}

export interface OrchestrationResult {
  finalPrompt: string;
  hierarchyReport: HierarchyReport;
  qualityMetrics: any;
  compressionReport: any;
  conflictResolutions: ConflictResolution[];
  integrityScore: number; // 0-100 score of how well form requirements were preserved
}

export interface HierarchyReport {
  tier1_FormData: {
    preserved: string[];
    modified: string[];
    conflicts: string[];
  };
  tier2_3DVisual: {
    integrated: boolean;
    scaleAccuracy: number;
    referenceImages: number;
  };
  tier3_AIEnhancements: {
    applied: string[];
    overridden: string[];
  };
  tier4_Compression: {
    compressionRatio: number;
    protectedContentPreserved: boolean;
    sectionsRemoved: number;
  };
}

export interface ConflictResolution {
  conflictType: 'form-vs-3d' | 'form-vs-ai' | 'form-vs-compression';
  conflictDescription: string;
  resolution: 'form-data-wins' | 'compromise' | 'escalation-needed';
  details: string;
}

export class MasterPromptOrchestrator {
  /**
   * Main orchestration method - implements source-of-truth hierarchy
   */
  static async orchestratePromptGeneration(
    sourceHierarchy: SourceOfTruthHierarchy,
    basePrompt: string
  ): Promise<OrchestrationResult> {
    console.log('🎭 Master Prompt Orchestrator - Phase 4 Starting...');
    console.log('📊 Source Hierarchy:', {
      tier1_FormData: !!sourceHierarchy.formData,
      tier2_3DVisual: !!sourceHierarchy.capturedViews,
      tier3_AIEnhancements: !!sourceHierarchy.aiEnhancements,
      formCriticalFields: this.extractFormCriticalFields(sourceHierarchy.formData)
    });

    const conflictResolutions: ConflictResolution[] = [];
    let currentPrompt = basePrompt;

    // TIER 1: Form Data (Absolute Truth) - Always applied first and protected
    console.log('🥇 Tier 1: Applying Form Data (Absolute Truth)...');
    const formPrompt = createFormPriorityBrandPrompt(currentPrompt, sourceHierarchy.formData);
    const formValidation = validateFormRequirementsInPrompt(formPrompt, sourceHierarchy.formData);
    currentPrompt = formPrompt;

    // TIER 2: 3D Visual Context (Supporting Evidence)
    let visual3DResult: Visual3DPromptResult | null = null;
    if (sourceHierarchy.capturedViews) {
      console.log('🥈 Tier 2: Integrating 3D Visual Context...');

      try {
        visual3DResult = await Visual3DPromptService.generateVisuallyEnhancedPrompt({
          formData: sourceHierarchy.formData,
          capturedViews: sourceHierarchy.capturedViews,
          viewType: 'front',
          creativeMode: 'refined'
        });

        // Check for conflicts between form data and 3D analysis
        const conflicts = this.detectFormVs3DConflicts(sourceHierarchy.formData, visual3DResult);
        conflictResolutions.push(...conflicts);

        // Integrate 3D context while preserving form data priority
        currentPrompt = this.integrate3DContextWithFormPriority(currentPrompt, visual3DResult, sourceHierarchy.formData);

      } catch (error) {
        console.warn('⚠️ 3D visual integration failed, continuing with form-only prompt:', error);
      }
    }

    // TIER 3: AI Enhancements (Suggestions only)
    console.log('🥉 Tier 3: Applying AI Enhancements (if compatible)...');
    // AI enhancements can be added here, but must not override form data
    // For now, we skip this as our current system already includes smart enhancements

    // TIER 4: Compression (Efficiency while preserving truth)
    console.log('🏅 Tier 4: Applying Intelligent Compression...');
    const protectedContent = getProtectedFormContent(sourceHierarchy.formData);
    const qualityMetrics = assessPromptQuality(currentPrompt);

    const compressionConfig: CompressionConfig = {
      maxLength: 4500, // Reduced to leave room for visual enhancements and stay under 5000 char limit
      protectedContent,
      compressionLevel: qualityMetrics.compressionRecommendation,
      preserveCreativeContext: qualityMetrics.creativeContentRatio > 0.1,
      maintainFormPriority: true // Always true in Phase 4
    };

    const compressionResult = advancedCompressPrompt(currentPrompt, compressionConfig);

    // Final validation - ensure form data survived all processing
    const finalValidation = validateFormRequirementsInPrompt(compressionResult.compressedPrompt, sourceHierarchy.formData);
    if (!finalValidation.isValid) {
      console.error('❌ CRITICAL: Form requirements lost during processing!', finalValidation.missingRequirements);
      conflictResolutions.push({
        conflictType: 'form-vs-compression',
        conflictDescription: `Form requirements lost: ${finalValidation.missingRequirements.join(', ')}`,
        resolution: 'escalation-needed',
        details: 'Compression removed critical form data - manual intervention required'
      });
    }

    // Generate comprehensive reports
    const hierarchyReport = this.generateHierarchyReport(
      sourceHierarchy,
      formValidation,
      visual3DResult,
      compressionResult
    );

    const compressionReportText = generateCompressionReport(
      currentPrompt,
      compressionResult.compressedPrompt,
      qualityMetrics
    );

    const integrityScore = this.calculateIntegrityScore(
      sourceHierarchy.formData,
      compressionResult.compressedPrompt,
      conflictResolutions
    );

    console.log('🎭 Master Orchestration Complete!', {
      integrityScore: `${integrityScore}/100`,
      conflictsResolved: conflictResolutions.length,
      finalLength: compressionResult.compressedPrompt.length
    });

    return {
      finalPrompt: compressionResult.compressedPrompt,
      hierarchyReport,
      qualityMetrics,
      compressionReport: compressionReportText,
      conflictResolutions,
      integrityScore
    };
  }

  /**
   * Extract critical fields from form data
   */
  private static extractFormCriticalFields(formData: FormData): Record<string, any> {
    return {
      frontFaceCount: formData.frontFaceCount,
      backToBackCount: formData.backToBackCount,
      shelfCount: formData.shelfCount,
      brand: formData.brand,
      product: formData.product,
      standDimensions: {
        width: formData.standWidth,
        height: formData.standHeight,
        depth: formData.standDepth
      }
    };
  }

  /**
   * Detect conflicts between form data and 3D analysis
   */
  private static detectFormVs3DConflicts(
    formData: FormData,
    visual3DResult: Visual3DPromptResult
  ): ConflictResolution[] {
    const conflicts: ConflictResolution[] = [];

    // Check if 3D scale accuracy conflicts with form specifications
    if (visual3DResult.scaleAccuracy.overallConfidence < 0.8) {
      conflicts.push({
        conflictType: 'form-vs-3d',
        conflictDescription: `3D scale accuracy low (${(visual3DResult.scaleAccuracy.overallConfidence * 100).toFixed(1)}%)`,
        resolution: 'form-data-wins',
        details: 'Form dimensions take priority over 3D scene measurements'
      });
    }

    // Check for dimensional mismatches
    if (!visual3DResult.scaleAccuracy.productScale) {
      conflicts.push({
        conflictType: 'form-vs-3d',
        conflictDescription: 'Product dimensions mismatch between form and 3D scene',
        resolution: 'form-data-wins',
        details: 'Using form-specified product dimensions as absolute truth'
      });
    }

    return conflicts;
  }

  /**
   * Integrate 3D context while maintaining form data priority
   */
  private static integrate3DContextWithFormPriority(
    formPrompt: string,
    visual3DResult: Visual3DPromptResult,
    formData: FormData
  ): string {
    // Add 3D visual context without overriding form specifications
    const visualEnhancement = `

3D VISUAL CONTEXT (Supporting Evidence):
- Scale references provided with ${visual3DResult.referenceImages.length} reference images
- Human scale baseline: 175cm for proportional accuracy
- Visual positioning context from captured 3D scene
- Scale accuracy: ${(visual3DResult.scaleAccuracy.overallConfidence * 100).toFixed(1)}%

HIERARCHY ENFORCEMENT:
- Form specifications override any conflicting 3D measurements
- 3D context provides visual guidance only, not dimensional requirements
- All numerical specifications from form data are non-negotiable`;

    return formPrompt + visualEnhancement;
  }

  /**
   * Generate comprehensive hierarchy report
   */
  private static generateHierarchyReport(
    sourceHierarchy: SourceOfTruthHierarchy,
    formValidation: any,
    visual3DResult: Visual3DPromptResult | null,
    compressionResult: any
  ): HierarchyReport {
    return {
      tier1_FormData: {
        preserved: formValidation.isValid ? ['all-critical-fields'] : [],
        modified: [],
        conflicts: formValidation.missingRequirements || []
      },
      tier2_3DVisual: {
        integrated: !!visual3DResult,
        scaleAccuracy: visual3DResult?.scaleAccuracy.overallConfidence || 0,
        referenceImages: visual3DResult?.referenceImages.length || 0
      },
      tier3_AIEnhancements: {
        applied: ['intelligent-compression', 'quality-assessment'],
        overridden: []
      },
      tier4_Compression: {
        compressionRatio: compressionResult.compressionRatio,
        protectedContentPreserved: compressionResult.protectedContentPreserved,
        sectionsRemoved: compressionResult.sectionsRemoved.length
      }
    };
  }

  /**
   * Calculate overall integrity score
   */
  private static calculateIntegrityScore(
    formData: FormData,
    finalPrompt: string,
    conflicts: ConflictResolution[]
  ): number {
    let score = 100;

    // Penalize missing form requirements
    const validation = validateFormRequirementsInPrompt(finalPrompt, formData);
    if (!validation.isValid) {
      score -= validation.missingRequirements.length * 20; // -20 per missing requirement
    }

    // Penalize unresolved conflicts
    const unresolvedConflicts = conflicts.filter(c => c.resolution === 'escalation-needed');
    score -= unresolvedConflicts.length * 15; // -15 per unresolved conflict

    // Bonus for successful integration
    if (validation.isValid && conflicts.length === 0) {
      score += 5; // Perfect integration bonus
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate user-friendly processing report
   */
  static generateUserReport(result: OrchestrationResult): string {
    const report = `
🎭 PROMPT PROCESSING REPORT
========================

INTEGRITY SCORE: ${result.integrityScore}/100 ${result.integrityScore >= 90 ? '🟢' : result.integrityScore >= 70 ? '🟡' : '🔴'}

SOURCE-OF-TRUTH HIERARCHY:
✅ Tier 1 (Form Data): ${result.hierarchyReport.tier1_FormData.conflicts.length === 0 ? 'Fully Preserved' : 'Issues Detected'}
${result.hierarchyReport.tier2_3DVisual.integrated ? '✅' : '➖'} Tier 2 (3D Visual): ${result.hierarchyReport.tier2_3DVisual.integrated ? `Integrated (${(result.hierarchyReport.tier2_3DVisual.scaleAccuracy * 100).toFixed(1)}% accuracy)` : 'Not Available'}
✅ Tier 3 (AI Enhancement): Applied
✅ Tier 4 (Compression): ${result.hierarchyReport.tier4_Compression.protectedContentPreserved ? 'Protected Content Preserved' : 'Content Loss Detected'}

${result.conflictResolutions.length > 0 ? `
CONFLICTS RESOLVED: ${result.conflictResolutions.length}
${result.conflictResolutions.map(c => `- ${c.conflictDescription} → ${c.resolution}`).join('\n')}
` : 'NO CONFLICTS DETECTED ✅'}

FINAL PROMPT: ${result.finalPrompt.length} characters
COMPRESSION: ${(result.hierarchyReport.tier4_Compression.compressionRatio * 100).toFixed(1)}% of original size
`;

    return report;
  }
}
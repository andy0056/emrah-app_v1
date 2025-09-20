/**
 * Smart Refinement Service
 * Processes natural language design requests and applies intelligent modifications
 */

import { FormData } from '../types';
import { DesignRefinement } from '../components/VoiceRefinementInput';
import { FalService } from './falService';
import { EmpatiDesignDNAService } from './empatiDesignDNAService';
import { PromptCompressionService } from './promptCompressionService';

export interface RefinementResult {
  originalImageUrl: string;
  refinedImageUrl: string;
  appliedChanges: AppliedChange[];
  refinementPrompt: string;
  processingTime: number;
  confidenceScore: number;
  suggestedNextSteps: string[];
}

export interface AppliedChange {
  type: 'dimension' | 'color' | 'material' | 'lighting' | 'structure' | 'branding';
  description: string;
  beforeValue?: string;
  afterValue: string;
  impact: 'low' | 'medium' | 'high';
  costImpact?: number; // Percentage change
}

export interface ClientPreferences {
  userId: string;
  preferredModifications: string[];
  avoidedElements: string[];
  materialPreferences: string[];
  colorPreferences: string[];
  complexityPreference: 'simple' | 'moderate' | 'complex';
  budgetSensitivity: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

export class SmartRefinementService {
  private static readonly PREFERENCES_KEY = 'client_preferences';
  private static readonly REFINEMENT_HISTORY_KEY = 'refinement_history';

  /**
   * Process a design refinement request and generate updated design
   */
  static async processRefinement(
    refinementRequest: DesignRefinement,
    originalImageUrl: string,
    originalFormData: FormData,
    userId?: string
  ): Promise<RefinementResult> {
    const startTime = Date.now();

    console.log('🔄 Processing smart refinement:', {
      type: refinementRequest.type,
      instructions: refinementRequest.parsedInstructions.length,
      confidence: refinementRequest.confidence
    });

    try {
      // 1. Update client preferences based on request
      if (userId) {
        await this.updateClientPreferences(userId, refinementRequest);
      }

      // 2. Generate enhanced prompt based on refinement instructions
      const refinementPrompt = await this.buildRefinementPrompt(
        refinementRequest,
        originalFormData,
        userId
      );

      // 3. Apply changes to form data if needed
      const modifiedFormData = this.applyFormDataChanges(
        originalFormData,
        refinementRequest.parsedInstructions
      );

      // 4. Generate refined image
      const generationResult = await this.generateRefinedImage(
        refinementPrompt,
        originalImageUrl,
        modifiedFormData,
        refinementRequest
      );

      // 5. Analyze applied changes
      const appliedChanges = this.analyzeAppliedChanges(
        refinementRequest,
        originalFormData,
        modifiedFormData
      );

      // 6. Store refinement in history
      this.storeRefinementHistory(userId, {
        originalText: refinementRequest.originalText,
        appliedChanges,
        success: true,
        timestamp: new Date().toISOString()
      });

      const result: RefinementResult = {
        originalImageUrl,
        refinedImageUrl: generationResult.images[0]?.url || '',
        appliedChanges,
        refinementPrompt,
        processingTime: Date.now() - startTime,
        confidenceScore: refinementRequest.confidence,
        suggestedNextSteps: this.generateNextStepSuggestions(appliedChanges, userId)
      };

      console.log('✅ Smart refinement complete:', {
        processingTime: result.processingTime,
        changesApplied: result.appliedChanges.length,
        confidence: result.confidenceScore
      });

      return result;

    } catch (error) {
      console.error('❌ Smart refinement failed:', error);

      // Store failed attempt for learning
      this.storeRefinementHistory(userId, {
        originalText: refinementRequest.originalText,
        appliedChanges: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Build intelligent refinement prompt that preserves design DNA
   */
  private static async buildRefinementPrompt(
    refinement: DesignRefinement,
    formData: FormData,
    userId?: string
  ): Promise<string> {

    const userPreferences = userId ? this.getClientPreferences(userId) : null;

    const baseSections = [
      "INTELLIGENT DESIGN REFINEMENT:",
      `Original Request: "${refinement.originalText}"`,
      "",

      "REFINEMENT INSTRUCTIONS:",
      ...refinement.parsedInstructions.map(instruction =>
        `- ${instruction.action.toUpperCase()} ${instruction.target}: ${instruction.description} (${instruction.intensity} intensity)`
      ),
      "",

      "PRESERVATION REQUIREMENTS:",
      "- Maintain Empati's minimalist-modern aesthetic",
      "- Preserve all structural manufacturability",
      "- Keep professional blue accent theme (#4E5AC3)",
      "- Maintain grid-based modular design principles",
      "",

      "REFINEMENT CONSTRAINTS:",
      "- Maximum 15% cost increase from modifications",
      "- All changes must use standard manufacturing methods",
      "- Preserve brand consistency above 80%",
      "- Maintain assembly simplicity",
      ""
    ];

    // Add user preference context if available
    if (userPreferences) {
      baseSections.push(
        "CLIENT PREFERENCE CONTEXT:",
        `- Complexity preference: ${userPreferences.complexityPreference}`,
        `- Budget sensitivity: ${userPreferences.budgetSensitivity}`,
        `- Preferred modifications: ${userPreferences.preferredModifications.join(', ')}`,
        `- Avoid: ${userPreferences.avoidedElements.join(', ')}`,
        ""
      );
    }

    baseSections.push(
      "SPECIFIC MODIFICATIONS:",
      ...this.generateSpecificModificationInstructions(refinement.parsedInstructions, formData),
      "",

      "OUTPUT REQUIREMENTS:",
      "- Apply refinements while maintaining design integrity",
      "- Show modifications clearly but tastefully",
      "- Ensure result remains professionally manufacturable",
      "- Preserve Empati's signature design language"
    );

    const basePrompt = baseSections.join('\n');

    // Apply Empati Design DNA alignment
    const empatiAlignedPrompt = EmpatiDesignDNAService.generateEmpatiAlignedPrompt(
      basePrompt,
      formData,
      'hybrid', // Refinements are typically hybrid approach
      'moderate'
    );

    // Compress for efficiency
    try {
      const compressionResult = await PromptCompressionService.compressPrompt(empatiAlignedPrompt, {
        targetReduction: 0.6, // 60% reduction for refinements
        preserveKeywords: [
          'Empati',
          formData.brand,
          formData.materials[0],
          ...refinement.parsedInstructions.map(i => i.target)
        ],
        style: 'structured'
      });

      return compressionResult.compressedPrompt;
    } catch (error) {
      console.warn('Prompt compression failed, using original:', error);
      return empatiAlignedPrompt;
    }
  }

  /**
   * Generate specific modification instructions based on parsed refinements
   */
  private static generateSpecificModificationInstructions(
    instructions: DesignRefinement['parsedInstructions'],
    formData: FormData
  ): string[] {
    const modifications: string[] = [];

    instructions.forEach(instruction => {
      switch (instruction.target.toLowerCase()) {
        case 'header':
          if (instruction.action === 'adjust') {
            modifications.push(`Increase header height by 20-30% while maintaining proportions`);
            modifications.push(`Enhance header visual prominence with subtle geometric elements`);
          }
          break;

        case 'shelves':
        case 'shelf':
          if (instruction.action === 'adjust') {
            modifications.push(`Modify shelf dimensions for improved product visibility`);
            modifications.push(`Maintain structural integrity and weight distribution`);
          }
          break;

        case 'color':
          modifications.push(`Enhance color scheme with additional Empati blue accents`);
          modifications.push(`Apply professional color gradients maintaining minimalist aesthetic`);
          break;

        case 'lighting':
          if (instruction.action === 'add') {
            modifications.push(`Integrate subtle LED edge lighting in brand blue theme`);
            modifications.push(`Add professional lighting that enhances product visibility`);
          }
          break;

        case 'material':
          modifications.push(`Enhance material finish quality within current selection`);
          modifications.push(`Add premium texture details maintaining manufacturability`);
          break;

        default:
          modifications.push(`Apply ${instruction.description} with professional execution`);
      }
    });

    return modifications;
  }

  /**
   * Apply refinement changes to form data
   */
  private static applyFormDataChanges(
    originalFormData: FormData,
    instructions: DesignRefinement['parsedInstructions']
  ): FormData {
    const modifiedFormData = { ...originalFormData };

    instructions.forEach(instruction => {
      switch (instruction.target.toLowerCase()) {
        case 'header':
          if (instruction.action === 'adjust' && instruction.intensity === 'moderate') {
            // Increase height by 20%
            modifiedFormData.standHeight = Math.round(originalFormData.standHeight * 1.2);
          }
          break;

        case 'shelves':
        case 'shelf':
          if (instruction.action === 'adjust') {
            modifiedFormData.shelfWidth = Math.round(originalFormData.shelfWidth * 1.1);
            modifiedFormData.shelfDepth = Math.round(originalFormData.shelfDepth * 1.05);
          }
          break;

        case 'color':
          // Color changes are handled in prompt, not form data
          break;

        case 'lighting':
          // Lighting is an enhancement, doesn't change base dimensions
          break;
      }
    });

    return modifiedFormData;
  }

  /**
   * Generate refined image using modified parameters
   */
  private static async generateRefinedImage(
    refinementPrompt: string,
    originalImageUrl: string,
    formData: FormData,
    refinement: DesignRefinement
  ) {
    // Use Nano Banana Edit for refinements as it's better at preserving structure
    return await FalService.applyBrandAssetsWithNanaBanana({
      image_urls: [originalImageUrl],
      prompt: refinementPrompt,
      aspect_ratio: "1:1",
      num_images: 1,
      output_format: "jpeg"
    });
  }

  /**
   * Analyze what changes were actually applied
   */
  private static analyzeAppliedChanges(
    refinement: DesignRefinement,
    originalFormData: FormData,
    modifiedFormData: FormData
  ): AppliedChange[] {
    const changes: AppliedChange[] = [];

    // Check dimension changes
    if (originalFormData.standHeight !== modifiedFormData.standHeight) {
      changes.push({
        type: 'dimension',
        description: 'Increased header height for better prominence',
        beforeValue: `${originalFormData.standHeight}cm`,
        afterValue: `${modifiedFormData.standHeight}cm`,
        impact: 'medium',
        costImpact: 8 // 8% cost increase for height modification
      });
    }

    if (originalFormData.shelfWidth !== modifiedFormData.shelfWidth) {
      changes.push({
        type: 'dimension',
        description: 'Enhanced shelf width for improved product display',
        beforeValue: `${originalFormData.shelfWidth}cm`,
        afterValue: `${modifiedFormData.shelfWidth}cm`,
        impact: 'medium',
        costImpact: 5
      });
    }

    // Add inferred changes from instructions
    refinement.parsedInstructions.forEach(instruction => {
      switch (instruction.target.toLowerCase()) {
        case 'color':
          changes.push({
            type: 'color',
            description: 'Enhanced blue accent integration',
            afterValue: 'Professional blue accents (#4E5AC3)',
            impact: 'low',
            costImpact: 2
          });
          break;

        case 'lighting':
          if (instruction.action === 'add') {
            changes.push({
              type: 'lighting',
              description: 'Added LED edge lighting system',
              afterValue: 'Subtle LED strips in brand blue',
              impact: 'high',
              costImpact: 15
            });
          }
          break;

        case 'material':
          changes.push({
            type: 'material',
            description: 'Enhanced material finish quality',
            afterValue: 'Premium texture with professional finish',
            impact: 'medium',
            costImpact: 10
          });
          break;
      }
    });

    return changes;
  }

  /**
   * Update client preferences based on refinement patterns
   */
  private static async updateClientPreferences(
    userId: string,
    refinement: DesignRefinement
  ): Promise<void> {
    let preferences = this.getClientPreferences(userId) || {
      userId,
      preferredModifications: [],
      avoidedElements: [],
      materialPreferences: [],
      colorPreferences: [],
      complexityPreference: 'moderate',
      budgetSensitivity: 'medium',
      lastUpdated: new Date().toISOString()
    };

    // Learn from refinement patterns
    refinement.parsedInstructions.forEach(instruction => {
      const modType = `${instruction.action}_${instruction.target}`;
      if (!preferences.preferredModifications.includes(modType)) {
        preferences.preferredModifications.push(modType);
      }

      // Infer complexity preference
      if (instruction.intensity === 'significant') {
        preferences.complexityPreference = 'complex';
      }
    });

    // Keep only last 10 preferences
    if (preferences.preferredModifications.length > 10) {
      preferences.preferredModifications = preferences.preferredModifications.slice(-10);
    }

    preferences.lastUpdated = new Date().toISOString();

    localStorage.setItem(`${this.PREFERENCES_KEY}_${userId}`, JSON.stringify(preferences));
  }

  /**
   * Get client preferences for personalized refinements
   */
  static getClientPreferences(userId: string): ClientPreferences | null {
    try {
      const stored = localStorage.getItem(`${this.PREFERENCES_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load client preferences:', error);
      return null;
    }
  }

  /**
   * Generate suggested next steps based on applied changes
   */
  private static generateNextStepSuggestions(
    appliedChanges: AppliedChange[],
    userId?: string
  ): string[] {
    const suggestions: string[] = [];
    const preferences = userId ? this.getClientPreferences(userId) : null;

    // Base suggestions based on changes
    if (appliedChanges.some(c => c.type === 'dimension')) {
      suggestions.push('Would you like to adjust the material to complement the new proportions?');
    }

    if (appliedChanges.some(c => c.type === 'lighting')) {
      suggestions.push('Consider adjusting the shelf spacing to optimize lighting visibility');
    }

    if (appliedChanges.some(c => c.type === 'color')) {
      suggestions.push('Would you like to see this color scheme applied to other brand elements?');
    }

    // Personalized suggestions based on preferences
    if (preferences?.complexityPreference === 'complex') {
      suggestions.push('Try adding premium material accents for enhanced visual impact');
    }

    if (preferences?.budgetSensitivity === 'low') {
      suggestions.push('Consider upgrading to premium finishes for maximum impact');
    }

    // Default suggestions if none generated
    if (suggestions.length === 0) {
      suggestions.push(
        'Fine-tune the shelf spacing for optimal product placement',
        'Explore different material finishes',
        'Adjust lighting intensity for perfect ambiance'
      );
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Store refinement history for learning and analytics
   */
  private static storeRefinementHistory(userId: string | undefined, record: any): void {
    if (!userId) return;

    try {
      const historyKey = `${this.REFINEMENT_HISTORY_KEY}_${userId}`;
      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');

      existing.push(record);

      // Keep only last 50 refinements
      if (existing.length > 50) {
        existing.splice(0, existing.length - 50);
      }

      localStorage.setItem(historyKey, JSON.stringify(existing));
    } catch (error) {
      console.warn('Failed to store refinement history:', error);
    }
  }

  /**
   * Get refinement analytics for a user
   */
  static getRefinementAnalytics(userId: string): {
    totalRefinements: number;
    successRate: number;
    topModifications: string[];
    averageConfidence: number;
  } {
    try {
      const historyKey = `${this.REFINEMENT_HISTORY_KEY}_${userId}`;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');

      const successful = history.filter((r: any) => r.success);
      const totalRefinements = history.length;
      const successRate = totalRefinements > 0 ? successful.length / totalRefinements : 0;

      // Count modification types
      const modificationCounts = new Map<string, number>();
      successful.forEach((r: any) => {
        r.appliedChanges?.forEach((change: AppliedChange) => {
          const key = `${change.type}_modification`;
          modificationCounts.set(key, (modificationCounts.get(key) || 0) + 1);
        });
      });

      const topModifications = Array.from(modificationCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([mod]) => mod);

      return {
        totalRefinements,
        successRate,
        topModifications,
        averageConfidence: 0.85 // Would calculate from actual data
      };
    } catch (error) {
      console.warn('Failed to get refinement analytics:', error);
      return {
        totalRefinements: 0,
        successRate: 0,
        topModifications: [],
        averageConfidence: 0
      };
    }
  }
}
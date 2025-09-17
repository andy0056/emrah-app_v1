import { FeedbackService, FeedbackAnalytics } from './feedbackService';
import { ABTestingService } from './abTestingService';

export interface PromptOptimization {
  id: string;
  name: string;
  description: string;
  modifiers: string[];
  weight: number; // 0-1, how much this optimization should be applied
  performanceImpact: number; // Measured improvement from feedback
  minSampleSize: number; // Minimum samples needed before applying
  currentSamples: number;
  isActive: boolean;
  confidence: number; // Statistical confidence in this optimization
}

export interface DynamicPromptWeights {
  brandIntensity: number; // 0-1, how aggressive brand integration should be
  productDensity: number; // 0-1, how full shelves should be
  realismFocus: number; // 0-1, emphasis on photorealism vs artistic
  technicalPrecision: number; // 0-1, focus on specification adherence
  visualDrama: number; // 0-1, dramatic vs subtle presentation
}

export class PromptOptimizationService {
  private static readonly OPTIMIZATIONS_KEY = 'prompt_optimizations';
  private static readonly WEIGHTS_KEY = 'dynamic_prompt_weights';

  // Initialize with baseline optimizations
  static readonly BASELINE_OPTIMIZATIONS: PromptOptimization[] = [
    {
      id: 'aggressive_branding',
      name: 'Aggressive Branding',
      description: 'Increase brand prominence when brand integration scores are low',
      modifiers: [
        'MAXIMUM BRAND VISIBILITY',
        'OVERSIZED LOGO PLACEMENT',
        'BRAND IMMERSION EXPERIENCE'
      ],
      weight: 0.3,
      performanceImpact: 0,
      minSampleSize: 5,
      currentSamples: 0,
      isActive: true,
      confidence: 0
    },
    {
      id: 'enhanced_product_density',
      name: 'Enhanced Product Density',
      description: 'Increase shelf density when visual impact scores are low',
      modifiers: [
        'ABUNDANT PRODUCT DISPLAY',
        'FULLY STOCKED PREMIUM PRESENTATION',
        'RICH PRODUCT VARIETY'
      ],
      weight: 0.4,
      performanceImpact: 0,
      minSampleSize: 5,
      currentSamples: 0,
      isActive: true,
      confidence: 0
    },
    {
      id: 'premium_realism',
      name: 'Premium Realism',
      description: 'Enhance photorealism when quality scores are low',
      modifiers: [
        'HYPERREALISTIC COMMERCIAL PHOTOGRAPHY',
        'FLAGSHIP STORE QUALITY PRESENTATION',
        'PREMIUM RETAIL ENVIRONMENT'
      ],
      weight: 0.2,
      performanceImpact: 0,
      minSampleSize: 5,
      currentSamples: 0,
      isActive: true,
      confidence: 0
    },
    {
      id: 'technical_accuracy',
      name: 'Technical Accuracy',
      description: 'Emphasize specification adherence when prompt following is poor',
      modifiers: [
        'ENGINEERING PRECISION',
        'EXACT DIMENSIONAL ACCURACY',
        'MANUFACTURING SPECIFICATION COMPLIANCE'
      ],
      weight: 0.5,
      performanceImpact: 0,
      minSampleSize: 5,
      currentSamples: 0,
      isActive: true,
      confidence: 0
    }
  ];

  // Calculate dynamic weights based on feedback patterns
  static calculateDynamicWeights(): DynamicPromptWeights {
    const analytics = FeedbackService.getAnalytics();
    const preferences = analytics.clientPreferences;

    // Base weights
    let weights: DynamicPromptWeights = {
      brandIntensity: 0.5,
      productDensity: 0.5,
      realismFocus: 0.5,
      technicalPrecision: 0.5,
      visualDrama: 0.3
    };

    // Adjust based on client feedback patterns
    if (analytics.totalFeedbacks >= 5) {
      // Brand intensity: increase if brand integration feedback is consistently low
      weights.brandIntensity = Math.min(1.0,
        0.3 + (5 - preferences.brandIntegrationImportance) * 0.15
      );

      // Product density: adjust based on visual quality feedback
      weights.productDensity = Math.min(1.0,
        0.3 + (5 - preferences.visualQualityImportance) * 0.15
      );

      // Realism focus: increase if realism scores are low
      weights.realismFocus = Math.min(1.0,
        0.3 + (5 - preferences.realismAccuracyImportance) * 0.15
      );

      // Technical precision: increase if prompt adherence is low
      weights.technicalPrecision = Math.min(1.0,
        0.3 + (5 - preferences.promptAdherenceImportance) * 0.15
      );

      // Visual drama: moderate based on overall satisfaction
      weights.visualDrama = Math.min(1.0,
        0.2 + (analytics.averageRating < 3.5 ? 0.3 : 0.1)
      );
    }

    // Store calculated weights
    localStorage.setItem(this.WEIGHTS_KEY, JSON.stringify(weights));

    console.log('📊 Dynamic weights calculated:', weights);
    return weights;
  }

  // Get active optimizations based on feedback patterns
  static getActiveOptimizations(): PromptOptimization[] {
    const stored = localStorage.getItem(this.OPTIMIZATIONS_KEY);
    const optimizations = stored ? JSON.parse(stored) : [...this.BASELINE_OPTIMIZATIONS];

    // Update optimizations based on recent feedback
    this.updateOptimizationPerformance(optimizations);

    return optimizations.filter(opt => opt.isActive && opt.currentSamples >= opt.minSampleSize);
  }

  // Apply optimizations to a prompt
  static optimizePrompt(basePrompt: string, userContext?: any): string {
    const weights = this.calculateDynamicWeights();
    const optimizations = this.getActiveOptimizations();

    let optimizedPrompt = basePrompt;

    // Apply brand intensity optimization
    if (weights.brandIntensity > 0.6) {
      const brandOpt = optimizations.find(opt => opt.id === 'aggressive_branding');
      if (brandOpt && brandOpt.confidence > 0.5) {
        optimizedPrompt += `\n\nBRAND INTENSITY OPTIMIZATION: ${brandOpt.modifiers.join(', ')}`;
      }
    }

    // Apply product density optimization
    if (weights.productDensity > 0.6) {
      const densityOpt = optimizations.find(opt => opt.id === 'enhanced_product_density');
      if (densityOpt && densityOpt.confidence > 0.5) {
        optimizedPrompt += `\n\nPRODUCT DENSITY OPTIMIZATION: ${densityOpt.modifiers.join(', ')}`;
      }
    }

    // Apply realism optimization
    if (weights.realismFocus > 0.6) {
      const realismOpt = optimizations.find(opt => opt.id === 'premium_realism');
      if (realismOpt && realismOpt.confidence > 0.5) {
        optimizedPrompt += `\n\nREALISM OPTIMIZATION: ${realismOpt.modifiers.join(', ')}`;
      }
    }

    // Apply technical precision optimization
    if (weights.technicalPrecision > 0.6) {
      const techOpt = optimizations.find(opt => opt.id === 'technical_accuracy');
      if (techOpt && techOpt.confidence > 0.5) {
        optimizedPrompt += `\n\nTECHNICAL OPTIMIZATION: ${techOpt.modifiers.join(', ')}`;
      }
    }

    // Add dynamic emphasis based on weights
    if (weights.visualDrama > 0.5) {
      optimizedPrompt += '\n\nVISUAL IMPACT: Create dramatic, attention-grabbing presentation that commands customer attention';
    }

    console.log('🎯 Prompt optimized with dynamic weights:', {
      brandIntensity: weights.brandIntensity,
      productDensity: weights.productDensity,
      realismFocus: weights.realismFocus,
      technicalPrecision: weights.technicalPrecision,
      optimizationsApplied: optimizations.filter(opt => opt.confidence > 0.5).length
    });

    return optimizedPrompt;
  }

  // Record optimization effectiveness when feedback is received
  static recordOptimizationFeedback(optimizationIds: string[], feedback: any): void {
    const optimizations = this.getStoredOptimizations();

    optimizationIds.forEach(optId => {
      const optimization = optimizations.find(opt => opt.id === optId);
      if (optimization) {
        optimization.currentSamples++;

        // Calculate performance impact
        const feedbackScore = (
          (feedback.rating || 0) +
          (feedback.brandIntegration || 0) +
          (feedback.promptAdherence || 0) +
          (feedback.visualQuality || 0) +
          (feedback.realismAccuracy || 0)
        ) / 5;

        // Update performance impact using exponential moving average
        if (optimization.performanceImpact === 0) {
          optimization.performanceImpact = feedbackScore;
        } else {
          optimization.performanceImpact = (optimization.performanceImpact * 0.7) + (feedbackScore * 0.3);
        }

        // Update confidence based on sample size and consistency
        optimization.confidence = Math.min(1.0,
          (optimization.currentSamples / 20) * (optimization.performanceImpact / 5)
        );

        // Adjust weight based on performance
        if (optimization.performanceImpact > 3.5) {
          optimization.weight = Math.min(1.0, optimization.weight + 0.1);
        } else if (optimization.performanceImpact < 2.5) {
          optimization.weight = Math.max(0.1, optimization.weight - 0.1);
        }

        // Deactivate poor-performing optimizations
        if (optimization.performanceImpact < 2.0 && optimization.currentSamples >= 10) {
          optimization.isActive = false;
        }
      }
    });

    localStorage.setItem(this.OPTIMIZATIONS_KEY, JSON.stringify(optimizations));
    console.log('📊 Optimization feedback recorded for:', optimizationIds);
  }

  // Get optimization recommendations for the user
  static getOptimizationRecommendations(): {
    modelRecommendation: 'seedream-v4' | 'nano-banana';
    promptStrategy: string;
    focusAreas: string[];
    confidence: number;
  } {
    const analytics = FeedbackService.getAnalytics();
    const weights = this.calculateDynamicWeights();

    // Model recommendation based on feedback patterns
    const modelRecommendation = FeedbackService.getRecommendedModel({});

    // Determine prompt strategy
    let promptStrategy = 'balanced';
    if (weights.brandIntensity > 0.7) {
      promptStrategy = 'brand-aggressive';
    } else if (weights.technicalPrecision > 0.7) {
      promptStrategy = 'technical-focused';
    } else if (weights.realismFocus > 0.7) {
      promptStrategy = 'premium-realistic';
    }

    // Identify focus areas that need improvement
    const focusAreas: string[] = [];
    if (analytics.clientPreferences.brandIntegrationImportance < 3.5) {
      focusAreas.push('Brand Integration');
    }
    if (analytics.clientPreferences.promptAdherenceImportance < 3.5) {
      focusAreas.push('Specification Accuracy');
    }
    if (analytics.clientPreferences.visualQualityImportance < 3.5) {
      focusAreas.push('Visual Quality');
    }
    if (analytics.clientPreferences.realismAccuracyImportance < 3.5) {
      focusAreas.push('Realism');
    }

    const confidence = analytics.totalFeedbacks >= 10 ? 0.8 : analytics.totalFeedbacks >= 5 ? 0.6 : 0.3;

    return {
      modelRecommendation,
      promptStrategy,
      focusAreas,
      confidence
    };
  }

  // Export optimization data for analysis
  static exportOptimizationData(): any {
    return {
      optimizations: this.getStoredOptimizations(),
      weights: this.calculateDynamicWeights(),
      recommendations: this.getOptimizationRecommendations(),
      exportedAt: new Date().toISOString()
    };
  }

  // Helper methods
  private static getStoredOptimizations(): PromptOptimization[] {
    const stored = localStorage.getItem(this.OPTIMIZATIONS_KEY);
    return stored ? JSON.parse(stored) : [...this.BASELINE_OPTIMIZATIONS];
  }

  private static updateOptimizationPerformance(optimizations: PromptOptimization[]): void {
    // This would be called periodically to update optimization performance
    // For now, we'll store the updated optimizations
    localStorage.setItem(this.OPTIMIZATIONS_KEY, JSON.stringify(optimizations));
  }

  // Clear all optimization data (for development)
  static clearOptimizationData(): void {
    localStorage.removeItem(this.OPTIMIZATIONS_KEY);
    localStorage.removeItem(this.WEIGHTS_KEY);
    console.log('🗑️ All optimization data cleared');
  }

  // Initialize the service
  static initialize(): void {
    // Initialize A/B testing
    ABTestingService.initializeDefaultTest();

    // Initialize optimizations if they don't exist
    const stored = localStorage.getItem(this.OPTIMIZATIONS_KEY);
    if (!stored) {
      localStorage.setItem(this.OPTIMIZATIONS_KEY, JSON.stringify(this.BASELINE_OPTIMIZATIONS));
    }

    console.log('🚀 Prompt Optimization Service initialized');
  }
}
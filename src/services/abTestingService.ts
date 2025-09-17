import { FeedbackService } from './feedbackService';

export interface PromptVariant {
  id: string;
  name: string;
  description: string;
  promptModifiers: {
    brandIntegrationStyle: string;
    productPlacementApproach: string;
    visualQualityFocus: string;
    realismEmphasis: string;
  };
  weight: number; // 0-1, how often this variant should be used
  performanceScore: number; // Calculated from feedback
  testStartDate: string;
  isActive: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused';
  variants: PromptVariant[];
  targetSampleSize: number;
  currentSampleSize: number;
  hypothesis: string;
  successMetric: 'overall_rating' | 'brand_integration' | 'prompt_adherence' | 'visual_quality';
  results?: {
    winningVariant: string;
    confidenceLevel: number;
    improvementPercentage: number;
    statisticalSignificance: boolean;
  };
}

export class ABTestingService {
  private static readonly TESTS_KEY = 'ab_tests';
  private static readonly ASSIGNMENTS_KEY = 'user_variant_assignments';
  private static readonly RESULTS_KEY = 'ab_test_results';

  // Initialize A/B testing service
  static initialize(): void {
    const existingTests = this.getAllTests();

    if (existingTests.length === 0) {
      // Create initial A/B tests
      this.createDefaultTests();
      console.log('🧪 A/B Testing service initialized with default tests');
    }
  }

  // Create default A/B tests
  private static createDefaultTests(): void {
    // Test 1: Brand Integration Approaches
    this.createTest({
      name: 'Brand Integration Strategy',
      description: 'Testing different approaches to brand integration in product displays',
      startDate: new Date().toISOString(),
      variants: [
        this.DEFAULT_VARIANTS[0], // Control
        this.DEFAULT_VARIANTS[1], // High-Impact
        this.DEFAULT_VARIANTS[2]  // Subtle
      ],
      targetSampleSize: 50,
      hypothesis: 'High-impact brand integration will lead to better brand recognition scores',
      successMetric: 'brand_integration'
    });

    // Test 2: Visual Quality vs Realism
    this.createTest({
      name: 'Visual Quality Focus',
      description: 'Testing premium visual approaches vs realistic product presentation',
      startDate: new Date().toISOString(),
      variants: [
        this.DEFAULT_VARIANTS[0], // Control
        this.DEFAULT_VARIANTS[3]  // Premium Focus
      ],
      targetSampleSize: 40,
      hypothesis: 'Premium visual focus will improve overall satisfaction ratings',
      successMetric: 'visual_quality'
    });
  }

  // Predefined prompt variants for testing
  static readonly DEFAULT_VARIANTS: PromptVariant[] = [
    {
      id: 'control_v1',
      name: 'Control (Current)',
      description: 'Current prompt approach with standard brand integration',
      promptModifiers: {
        brandIntegrationStyle: 'CLIENT-PRIORITY BRAND INTEGRATION',
        productPlacementApproach: 'Position actual branded products as hero elements on every shelf level',
        visualQualityFocus: 'professional product photography studio lighting',
        realismEmphasis: 'photorealistic, commercial retail environment'
      },
      weight: 0.5,
      performanceScore: 0,
      testStartDate: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'aggressive_v1',
      name: 'Aggressive Branding',
      description: 'More aggressive brand integration with emphasis on logo prominence',
      promptModifiers: {
        brandIntegrationStyle: 'MAXIMUM BRAND DOMINANCE INTEGRATION',
        productPlacementApproach: 'Flood every surface with branded products, create brand immersion experience',
        visualQualityFocus: 'premium luxury retail photography with dramatic lighting',
        realismEmphasis: 'hyperrealistic brand showcase, flagship store quality'
      },
      weight: 0.2,
      performanceScore: 0,
      testStartDate: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'subtle_v1',
      name: 'Subtle Integration',
      description: 'More subtle, sophisticated brand integration approach',
      promptModifiers: {
        brandIntegrationStyle: 'ELEGANT BRAND INTEGRATION',
        productPlacementApproach: 'Curated product placement with premium retail aesthetics',
        visualQualityFocus: 'minimalist luxury retail photography, clean composition',
        realismEmphasis: 'sophisticated retail environment, upscale commercial presentation'
      },
      weight: 0.2,
      performanceScore: 0,
      testStartDate: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'technical_v1',
      name: 'Technical Precision',
      description: 'Focus on technical accuracy and specification adherence',
      promptModifiers: {
        brandIntegrationStyle: 'SPECIFICATION-DRIVEN BRAND INTEGRATION',
        productPlacementApproach: 'Precise product positioning following exact dimensional requirements',
        visualQualityFocus: 'technical documentation photography, engineering precision',
        realismEmphasis: 'manufacturing-accurate display, production-ready specifications'
      },
      weight: 0.1,
      performanceScore: 0,
      testStartDate: new Date().toISOString(),
      isActive: true
    }
  ];

  // Create a new A/B test
  static createTest(test: Omit<ABTest, 'id' | 'currentSampleSize' | 'status'>): string {
    const testWithId: ABTest = {
      ...test,
      id: this.generateId(),
      currentSampleSize: 0,
      status: 'active'
    };

    const tests = this.getAllTests();
    tests.push(testWithId);
    localStorage.setItem(this.TESTS_KEY, JSON.stringify(tests));

    console.log('🧪 A/B Test created:', testWithId.name);
    return testWithId.id;
  }

  // Get all tests
  static getAllTests(): ABTest[] {
    const stored = localStorage.getItem(this.TESTS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Get active tests
  static getActiveTests(): ABTest[] {
    return this.getAllTests().filter(test => test.status === 'active');
  }

  // Get variant for a user (consistent assignment)
  static getVariantForUser(userId: string, testId?: string): PromptVariant {
    const assignments = this.getUserAssignments();
    const assignmentKey = testId ? `${testId}_${userId}` : userId;

    // Check if user already has an assignment
    if (assignments[assignmentKey]) {
      const variant = this.findVariantById(assignments[assignmentKey]);
      if (variant && variant.isActive) {
        return variant;
      }
    }

    // Assign new variant based on weights
    const activeVariants = this.getActiveVariants();
    const selectedVariant = this.selectVariantByWeight(activeVariants);

    // Store assignment
    assignments[assignmentKey] = selectedVariant.id;
    localStorage.setItem(this.ASSIGNMENTS_KEY, JSON.stringify(assignments));

    console.log('🎯 Variant assigned:', {
      userId,
      variant: selectedVariant.name,
      testId
    });

    return selectedVariant;
  }

  // Apply variant to prompt
  static applyVariantToPrompt(basePrompt: string, variant: PromptVariant): string {
    const modifiedPrompt = basePrompt
      .replace(/CLIENT-PRIORITY BRAND INTEGRATION/g, variant.promptModifiers.brandIntegrationStyle)
      .replace(/Position actual branded products as hero elements on every shelf level/g, variant.promptModifiers.productPlacementApproach);

    // Add variant-specific modifiers
    const variantEnhancements = `

VARIANT MODIFICATIONS (${variant.name}):
- VISUAL APPROACH: ${variant.promptModifiers.visualQualityFocus}
- REALISM STANDARD: ${variant.promptModifiers.realismEmphasis}
- BRAND STRATEGY: ${variant.promptModifiers.brandIntegrationStyle}`;

    return modifiedPrompt + variantEnhancements;
  }

  // Record test result (when feedback is received)
  static recordTestResult(variantId: string, feedback: any): void {
    const tests = this.getAllTests();
    let updated = false;

    tests.forEach(test => {
      const variant = test.variants.find(v => v.id === variantId);
      if (variant) {
        test.currentSampleSize++;
        this.updateVariantPerformance(variant, feedback);
        updated = true;

        // Check if test should be concluded
        if (test.currentSampleSize >= test.targetSampleSize) {
          this.concludeTest(test);
        }
      }
    });

    if (updated) {
      localStorage.setItem(this.TESTS_KEY, JSON.stringify(tests));
    }
  }

  // Update variant performance based on feedback
  private static updateVariantPerformance(variant: PromptVariant, feedback: any): void {
    // Calculate performance score based on feedback
    const overallScore = feedback.rating || 0;
    const brandScore = feedback.brandIntegration || 0;
    const adherenceScore = feedback.promptAdherence || 0;
    const qualityScore = feedback.visualQuality || 0;

    // Weighted average (can be adjusted based on what we want to optimize for)
    const newScore = (overallScore * 0.4) + (brandScore * 0.3) + (adherenceScore * 0.2) + (qualityScore * 0.1);

    // Update performance score (exponential moving average)
    variant.performanceScore = variant.performanceScore === 0
      ? newScore
      : (variant.performanceScore * 0.8) + (newScore * 0.2);
  }

  // Conclude test and determine winner
  private static concludeTest(test: ABTest): void {
    test.status = 'completed';
    test.endDate = new Date().toISOString();

    // Find winning variant
    const winningVariant = test.variants.reduce((best, current) =>
      current.performanceScore > best.performanceScore ? current : best
    );

    const controlVariant = test.variants.find(v => v.id.includes('control'));
    const improvementPercentage = controlVariant
      ? ((winningVariant.performanceScore - controlVariant.performanceScore) / controlVariant.performanceScore) * 100
      : 0;

    test.results = {
      winningVariant: winningVariant.id,
      confidenceLevel: this.calculateConfidence(test),
      improvementPercentage,
      statisticalSignificance: Math.abs(improvementPercentage) > 5 && test.currentSampleSize >= 30
    };

    console.log('🏆 A/B Test concluded:', {
      testName: test.name,
      winner: winningVariant.name,
      improvement: `${improvementPercentage.toFixed(1)}%`,
      significant: test.results.statisticalSignificance
    });

    // Auto-update weights based on results
    if (test.results.statisticalSignificance) {
      this.updateVariantWeights(test);
    }
  }

  // Update variant weights based on test results
  private static updateVariantWeights(test: ABTest): void {
    const totalPerformance = test.variants.reduce((sum, v) => sum + v.performanceScore, 0);

    test.variants.forEach(variant => {
      // Assign weight based on performance
      variant.weight = variant.performanceScore / totalPerformance;

      // Ensure minimum weight for continued testing
      variant.weight = Math.max(variant.weight, 0.05);
    });

    // Normalize weights to sum to 1
    const weightSum = test.variants.reduce((sum, v) => sum + v.weight, 0);
    test.variants.forEach(variant => {
      variant.weight = variant.weight / weightSum;
    });
  }

  // Get test analytics
  static getTestAnalytics(): {
    activeTests: number;
    completedTests: number;
    totalVariantsTested: number;
    bestPerformingVariant: PromptVariant | null;
    averageImprovement: number;
  } {
    const allTests = this.getAllTests();
    const completedTests = allTests.filter(t => t.status === 'completed');
    const activeTests = allTests.filter(t => t.status === 'active');

    const allVariants = this.getActiveVariants();
    const bestVariant = allVariants.reduce((best, current) =>
      current.performanceScore > best.performanceScore ? current : best
    , allVariants[0] || null);

    const improvements = completedTests
      .filter(t => t.results?.statisticalSignificance)
      .map(t => t.results!.improvementPercentage);

    const averageImprovement = improvements.length > 0
      ? improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length
      : 0;

    return {
      activeTests: activeTests.length,
      completedTests: completedTests.length,
      totalVariantsTested: allVariants.length,
      bestPerformingVariant: bestVariant,
      averageImprovement
    };
  }

  // Helper methods
  private static getUserAssignments(): Record<string, string> {
    const stored = localStorage.getItem(this.ASSIGNMENTS_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private static getActiveVariants(): PromptVariant[] {
    // Return default variants for now - in production, these would come from active tests
    return this.DEFAULT_VARIANTS.filter(v => v.isActive);
  }

  private static findVariantById(id: string): PromptVariant | null {
    return this.getActiveVariants().find(v => v.id === id) || null;
  }

  private static selectVariantByWeight(variants: PromptVariant[]): PromptVariant {
    const random = Math.random();
    let cumulativeWeight = 0;

    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to first variant
    return variants[0] || this.DEFAULT_VARIANTS[0];
  }

  private static calculateConfidence(test: ABTest): number {
    // Simplified confidence calculation
    const sampleSize = test.currentSampleSize;
    if (sampleSize < 10) return 0;
    if (sampleSize < 30) return 0.8;
    if (sampleSize < 100) return 0.9;
    return 0.95;
  }

  private static generateId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize default test
  static initializeDefaultTest(): void {
    const existingTests = this.getAllTests();
    if (existingTests.length === 0) {
      this.createTest({
        name: 'Brand Integration Optimization',
        description: 'Testing different approaches to brand integration in AI-generated displays',
        startDate: new Date().toISOString(),
        variants: this.DEFAULT_VARIANTS,
        targetSampleSize: 50,
        hypothesis: 'More aggressive brand integration will improve client satisfaction',
        successMetric: 'brand_integration'
      });
    }
  }

  // Clear all test data (for development)
  static clearAllTests(): void {
    localStorage.removeItem(this.TESTS_KEY);
    localStorage.removeItem(this.ASSIGNMENTS_KEY);
    console.log('🗑️ All A/B test data cleared');
  }
}
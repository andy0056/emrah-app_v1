export interface ImageFeedback {
  id: string;
  imageUrl: string;
  imageType: 'frontView' | 'storeView' | 'threeQuarterView';
  model: 'seedream-v4' | 'nano-banana';
  promptVersion: string;
  rating: 1 | 2 | 3 | 4 | 5; // 1-5 star rating
  feedback: 'loved' | 'liked' | 'neutral' | 'disliked' | 'rejected';
  comments?: string;
  timestamp: string;
  projectId: string;
  userId: string;

  // Detailed feedback categories
  brandIntegration: 1 | 2 | 3 | 4 | 5; // How well brand assets were integrated
  promptAdherence: 1 | 2 | 3 | 4 | 5; // How well it followed the prompt
  visualQuality: 1 | 2 | 3 | 4 | 5; // Overall visual quality
  realismAccuracy: 1 | 2 | 3 | 4 | 5; // How realistic/accurate the display looks

  // Metadata for learning
  formData: import('../types').FormData; // The form data used for generation
  promptUsed: string; // The actual prompt sent to AI
  generationTime: number; // Time taken to generate
}

export interface FeedbackAnalytics {
  totalFeedbacks: number;
  averageRating: number;
  modelPerformance: {
    'seedream-v4': {
      averageRating: number;
      count: number;
      strongPoints: string[];
      weakPoints: string[];
    };
    'nano-banana': {
      averageRating: number;
      count: number;
      strongPoints: string[];
      weakPoints: string[];
    };
  };
  promptEffectiveness: {
    [promptVersion: string]: {
      averageRating: number;
      count: number;
      bestPerformingAspects: string[];
    };
  };
  clientPreferences: {
    brandIntegrationImportance: number;
    promptAdherenceImportance: number;
    visualQualityImportance: number;
    realismAccuracyImportance: number;
  };
}

export class FeedbackService {
  private static readonly STORAGE_KEY = 'client_image_feedback';
  private static readonly ANALYTICS_KEY = 'feedback_analytics';

  // Store feedback for an image
  static async recordFeedback(feedback: Omit<ImageFeedback, 'id' | 'timestamp'>): Promise<string> {
    const feedbackWithId: ImageFeedback = {
      ...feedback,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    // Store in localStorage (in production, this would be sent to your backend)
    const existingFeedbacks = this.getAllFeedbacks();
    existingFeedbacks.push(feedbackWithId);

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingFeedbacks));

    // Update analytics
    this.updateAnalytics(feedbackWithId);

    // Record for evolution tracking
    try {
      const { PromptEvolutionService } = await import('./promptEvolutionService');
      PromptEvolutionService.recordPromptUsage(feedback.promptUsed, feedbackWithId);
    } catch (error) {
      console.warn('Evolution tracking failed:', error);
    }

    // Record for A/B testing if applicable
    try {
      const { ABTestingService } = await import('./abTestingService');

      // Try to extract variant ID from prompt or metadata
      const variantId = this.extractVariantIdFromPrompt(feedback.promptUsed);
      if (variantId) {
        ABTestingService.recordTestResult(variantId, feedbackWithId);
        console.log('🧪 A/B test result recorded for variant:', variantId);
      }
    } catch (error) {
      console.warn('A/B test recording failed:', error);
    }

    console.log('📊 Feedback recorded:', {
      model: feedback.model,
      rating: feedback.rating,
      feedback: feedback.feedback,
      imageType: feedback.imageType
    });

    return feedbackWithId.id;
  }

  // Get all feedbacks
  static getAllFeedbacks(): ImageFeedback[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Get feedback for a specific image
  static getFeedbackForImage(imageUrl: string): ImageFeedback | null {
    const feedbacks = this.getAllFeedbacks();
    return feedbacks.find(f => f.imageUrl === imageUrl) || null;
  }

  // Get analytics
  static getAnalytics(): FeedbackAnalytics {
    const stored = localStorage.getItem(this.ANALYTICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // Return default analytics if none exist
    return {
      totalFeedbacks: 0,
      averageRating: 0,
      modelPerformance: {
        'seedream-v4': { averageRating: 0, count: 0, strongPoints: [], weakPoints: [] },
        'nano-banana': { averageRating: 0, count: 0, strongPoints: [], weakPoints: [] }
      },
      promptEffectiveness: {},
      clientPreferences: {
        brandIntegrationImportance: 0,
        promptAdherenceImportance: 0,
        visualQualityImportance: 0,
        realismAccuracyImportance: 0
      }
    };
  }

  // Update analytics when new feedback is received
  private static updateAnalytics(feedback: ImageFeedback): void {
    const analytics = this.getAnalytics();
    const feedbacks = this.getAllFeedbacks();

    // Update overall stats
    analytics.totalFeedbacks = feedbacks.length;
    analytics.averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;

    // Update model performance
    const modelFeedbacks = feedbacks.filter(f => f.model === feedback.model);
    const modelAnalytics = analytics.modelPerformance[feedback.model];
    modelAnalytics.count = modelFeedbacks.length;
    modelAnalytics.averageRating = modelFeedbacks.reduce((sum, f) => sum + f.rating, 0) / modelFeedbacks.length;

    // Analyze strong/weak points based on detailed ratings
    const highRatedFeedbacks = modelFeedbacks.filter(f => f.rating >= 4);
    const lowRatedFeedbacks = modelFeedbacks.filter(f => f.rating <= 2);

    modelAnalytics.strongPoints = this.extractStrongPoints(highRatedFeedbacks);
    modelAnalytics.weakPoints = this.extractWeakPoints(lowRatedFeedbacks);

    // Update prompt effectiveness
    const promptFeedbacks = feedbacks.filter(f => f.promptVersion === feedback.promptVersion);
    if (!analytics.promptEffectiveness[feedback.promptVersion]) {
      analytics.promptEffectiveness[feedback.promptVersion] = {
        averageRating: 0,
        count: 0,
        bestPerformingAspects: []
      };
    }

    const promptAnalytics = analytics.promptEffectiveness[feedback.promptVersion];
    promptAnalytics.count = promptFeedbacks.length;
    promptAnalytics.averageRating = promptFeedbacks.reduce((sum, f) => sum + f.rating, 0) / promptFeedbacks.length;
    promptAnalytics.bestPerformingAspects = this.extractBestAspects(promptFeedbacks);

    // Update client preferences (importance weights)
    analytics.clientPreferences = {
      brandIntegrationImportance: feedbacks.reduce((sum, f) => sum + f.brandIntegration, 0) / feedbacks.length,
      promptAdherenceImportance: feedbacks.reduce((sum, f) => sum + f.promptAdherence, 0) / feedbacks.length,
      visualQualityImportance: feedbacks.reduce((sum, f) => sum + f.visualQuality, 0) / feedbacks.length,
      realismAccuracyImportance: feedbacks.reduce((sum, f) => sum + f.realismAccuracy, 0) / feedbacks.length
    };

    localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(analytics));
  }

  // Get recommended model based on feedback patterns
  static getRecommendedModel(formData: any): 'seedream-v4' | 'nano-banana' {
    const analytics = this.getAnalytics();

    if (analytics.totalFeedbacks < 10) {
      // Not enough data, use default logic
      return 'seedream-v4'; // Default to SeedReam for better brand integration
    }

    const seedreamPerf = analytics.modelPerformance['seedream-v4'];
    const nanaBananaPerf = analytics.modelPerformance['nano-banana'];

    // Weight the decision based on client preferences and model performance
    const seedreamScore = seedreamPerf.averageRating * (seedreamPerf.count / analytics.totalFeedbacks);
    const nanaBananaScore = nanaBananaPerf.averageRating * (nanaBananaPerf.count / analytics.totalFeedbacks);

    return seedreamScore >= nanaBananaScore ? 'seedream-v4' : 'nano-banana';
  }

  // Get optimized prompt modifiers based on feedback
  static getPromptOptimizations(): {
    brandIntegrationModifiers: string[];
    productPlacementModifiers: string[];
    visualQualityModifiers: string[];
  } {
    const analytics = this.getAnalytics();
    const preferences = analytics.clientPreferences;

    const brandIntegrationModifiers: string[] = [];
    const productPlacementModifiers: string[] = [];
    const visualQualityModifiers: string[] = [];

    // Adjust based on what clients value most
    if (preferences.brandIntegrationImportance >= 4) {
      brandIntegrationModifiers.push('MAXIMUM BRAND PROMINENCE');
      brandIntegrationModifiers.push('BOLD LOGO PLACEMENT');
    }

    if (preferences.promptAdherenceImportance >= 4) {
      productPlacementModifiers.push('PRECISE SPECIFICATION FOLLOWING');
      productPlacementModifiers.push('EXACT DIMENSION ADHERENCE');
    }

    if (preferences.visualQualityImportance >= 4) {
      visualQualityModifiers.push('PREMIUM PHOTOGRAPHY QUALITY');
      visualQualityModifiers.push('STUDIO LIGHTING EXCELLENCE');
    }

    return {
      brandIntegrationModifiers,
      productPlacementModifiers,
      visualQualityModifiers
    };
  }

  // Helper methods
  private static generateId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static extractStrongPoints(feedbacks: ImageFeedback[]): string[] {
    const points: string[] = [];

    feedbacks.forEach(f => {
      if (f.brandIntegration >= 4) points.push('Brand Integration');
      if (f.promptAdherence >= 4) points.push('Prompt Following');
      if (f.visualQuality >= 4) points.push('Visual Quality');
      if (f.realismAccuracy >= 4) points.push('Realism');
    });

    // Return unique points sorted by frequency
    const uniquePoints = [...new Set(points)];
    return uniquePoints.slice(0, 3); // Top 3
  }

  private static extractWeakPoints(feedbacks: ImageFeedback[]): string[] {
    const points: string[] = [];

    feedbacks.forEach(f => {
      if (f.brandIntegration <= 2) points.push('Brand Integration');
      if (f.promptAdherence <= 2) points.push('Prompt Following');
      if (f.visualQuality <= 2) points.push('Visual Quality');
      if (f.realismAccuracy <= 2) points.push('Realism');
    });

    const uniquePoints = [...new Set(points)];
    return uniquePoints.slice(0, 3); // Top 3 weaknesses
  }

  private static extractBestAspects(feedbacks: ImageFeedback[]): string[] {
    const aspects: string[] = [];

    feedbacks.forEach(f => {
      if (f.rating >= 4) {
        if (f.brandIntegration >= 4) aspects.push('Brand Integration');
        if (f.promptAdherence >= 4) aspects.push('Prompt Adherence');
        if (f.visualQuality >= 4) aspects.push('Visual Quality');
      }
    });

    return [...new Set(aspects)].slice(0, 3);
  }

  // Export feedback data (for analysis)
  static exportFeedbackData(): string {
    const feedbacks = this.getAllFeedbacks();
    const analytics = this.getAnalytics();

    return JSON.stringify({
      feedbacks,
      analytics,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  // Extract variant ID from prompt
  private static extractVariantIdFromPrompt(prompt: string): string | null {
    // Look for variant markers in the prompt
    const variantMatch = prompt.match(/VARIANT MODIFICATIONS \(([^)]+)\)/);
    if (variantMatch) {
      const variantName = variantMatch[1];

      // Map variant names to IDs
      const variantNameMap: { [name: string]: string } = {
        'Control (Current)': 'control_v1',
        'High-Impact Brand': 'high_impact_v1',
        'Subtle Elegance': 'subtle_elegance_v1',
        'Premium Focus': 'premium_focus_v1'
      };

      return variantNameMap[variantName] || null;
    }

    // Fallback: look for specific modifiers that indicate variants
    if (prompt.includes('MAXIMUM BRAND PROMINENCE') && prompt.includes('DRAMATIC OVERSIZED')) {
      return 'high_impact_v1';
    }
    if (prompt.includes('ELEGANT BRAND PLACEMENT') && prompt.includes('SOPHISTICATED SUBTLE')) {
      return 'subtle_elegance_v1';
    }
    if (prompt.includes('PREMIUM BRAND EXPERIENCE') && prompt.includes('LUXURY SHOWCASE')) {
      return 'premium_focus_v1';
    }

    return null; // Default/control variant
  }

  // Clear all feedback (for testing)
  static clearAllFeedback(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.ANALYTICS_KEY);
    console.log('🗑️ All feedback data cleared');
  }
}
import { FeedbackService } from './feedbackService';

export interface BrandAssetAnalysis {
  logoComplexity: 'simple' | 'moderate' | 'complex';
  logoColors: string[];
  logoStyle: 'text' | 'icon' | 'combination' | 'emblem';

  productType: 'packaged' | 'beverage' | 'food' | 'electronics' | 'beauty' | 'other';
  productShape: 'cylindrical' | 'rectangular' | 'irregular' | 'bottle';
  productColors: string[];

  keyVisualType?: 'lifestyle' | 'product' | 'brand' | 'campaign';
  keyVisualComplexity?: 'simple' | 'detailed' | 'complex';

  overallComplexity: number; // 1-10
  brandIntegrationDifficulty: number; // 1-10
  recommendedModel: 'seedream-v4' | 'nano-banana';
  confidence: number; // 0-1
  reasoning: string[];
}

export interface ModelPerformanceProfile {
  'seedream-v4': {
    strengths: string[];
    weaknesses: string[];
    optimalAssetTypes: string[];
    averageRating: number;
    brandIntegrationScore: number;
  };
  'nano-banana': {
    strengths: string[];
    weaknesses: string[];
    optimalAssetTypes: string[];
    averageRating: number;
    brandIntegrationScore: number;
  };
}

export class BrandAssetAnalysisService {

  // Analyze brand assets to understand their characteristics
  static async analyzeBrandAssets(assetUrls: string[]): Promise<BrandAssetAnalysis> {
    const analysis: BrandAssetAnalysis = {
      logoComplexity: 'moderate',
      logoColors: [],
      logoStyle: 'combination',
      productType: 'other',
      productShape: 'rectangular',
      productColors: [],
      overallComplexity: 5,
      brandIntegrationDifficulty: 5,
      recommendedModel: 'seedream-v4',
      confidence: 0.7,
      reasoning: []
    };

    // For now, we'll use heuristic analysis based on URL patterns and feedback history
    // In a production system, this would use image analysis APIs

    try {
      // Analyze logo (first asset)
      if (assetUrls.length > 0) {
        const logoAnalysis = await this.analyzeLogoAsset(assetUrls[0]);
        analysis.logoComplexity = logoAnalysis.complexity;
        analysis.logoStyle = logoAnalysis.style;
        analysis.logoColors = logoAnalysis.colors;
      }

      // Analyze product (second asset)
      if (assetUrls.length > 1) {
        const productAnalysis = await this.analyzeProductAsset(assetUrls[1]);
        analysis.productType = productAnalysis.type;
        analysis.productShape = productAnalysis.shape;
        analysis.productColors = productAnalysis.colors;
      }

      // Analyze key visual (third asset, if present)
      if (assetUrls.length > 2) {
        const keyVisualAnalysis = await this.analyzeKeyVisualAsset(assetUrls[2]);
        analysis.keyVisualType = keyVisualAnalysis.type;
        analysis.keyVisualComplexity = keyVisualAnalysis.complexity;
      }

      // Calculate overall complexity
      analysis.overallComplexity = this.calculateOverallComplexity(analysis);
      analysis.brandIntegrationDifficulty = this.calculateIntegrationDifficulty(analysis);

      // Get model recommendation
      const recommendation = this.getModelRecommendation(analysis);
      analysis.recommendedModel = recommendation.model;
      analysis.confidence = recommendation.confidence;
      analysis.reasoning = recommendation.reasoning;

    } catch (error) {
      console.warn('⚠️ Brand asset analysis failed, using defaults:', error);
      // Fallback to default analysis
    }

    // Reduced logging for performance
    if (import.meta.env.DEV) {
      console.log('🔍 Brand analysis:', analysis.recommendedModel, `(${(analysis.confidence * 100).toFixed(0)}%)`);
    }

    return analysis;
  }

  // Analyze logo asset characteristics
  private static async analyzeLogoAsset(logoUrl: string): Promise<{
    complexity: 'simple' | 'moderate' | 'complex';
    style: 'text' | 'icon' | 'combination' | 'emblem';
    colors: string[];
  }> {

    // Heuristic analysis based on URL patterns and common brand characteristics
    let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
    let style: 'text' | 'icon' | 'combination' | 'emblem' = 'combination';
    const colors: string[] = [];

    // Analyze filename for clues
    const filename = logoUrl.toLowerCase();

    // Brand complexity indicators
    if (filename.includes('coca-cola') || filename.includes('pepsi') || filename.includes('nike')) {
      complexity = 'simple'; // Well-known brands often have simple, recognizable logos
      style = 'text';
    } else if (filename.includes('logo') || filename.includes('brand')) {
      complexity = 'moderate';
      style = 'combination';
    }

    // Try to fetch and analyze the image
    try {
      const response = await fetch(logoUrl, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('svg')) {
        complexity = 'complex'; // SVGs often contain complex vector graphics
        style = 'icon';
      } else if (contentType?.includes('png')) {
        // PNG with transparency suggests icon or emblem
        style = 'icon';
      }
    } catch (error) {
      // Unable to fetch, use defaults
    }

    return { complexity, style, colors };
  }

  // Analyze product asset characteristics
  private static async analyzeProductAsset(productUrl: string): Promise<{
    type: 'packaged' | 'beverage' | 'food' | 'electronics' | 'beauty' | 'other';
    shape: 'cylindrical' | 'rectangular' | 'irregular' | 'bottle';
    colors: string[];
  }> {

    let type: 'packaged' | 'beverage' | 'food' | 'electronics' | 'beauty' | 'other' = 'other';
    let shape: 'cylindrical' | 'rectangular' | 'irregular' | 'bottle' = 'rectangular';
    const colors: string[] = [];

    const filename = productUrl.toLowerCase();

    // Product type analysis
    if (filename.includes('bottle') || filename.includes('drink') || filename.includes('beverage')) {
      type = 'beverage';
      shape = 'bottle';
    } else if (filename.includes('can') || filename.includes('soda')) {
      type = 'beverage';
      shape = 'cylindrical';
    } else if (filename.includes('box') || filename.includes('package')) {
      type = 'packaged';
      shape = 'rectangular';
    } else if (filename.includes('food')) {
      type = 'food';
      shape = 'irregular';
    } else if (filename.includes('electronics') || filename.includes('device')) {
      type = 'electronics';
      shape = 'rectangular';
    } else if (filename.includes('cosmetic') || filename.includes('beauty')) {
      type = 'beauty';
      shape = 'bottle';
    }

    return { type, shape, colors };
  }

  // Analyze key visual asset characteristics
  private static async analyzeKeyVisualAsset(keyVisualUrl: string): Promise<{
    type: 'lifestyle' | 'product' | 'brand' | 'campaign';
    complexity: 'simple' | 'detailed' | 'complex';
  }> {

    let type: 'lifestyle' | 'product' | 'brand' | 'campaign' = 'brand';
    let complexity: 'simple' | 'detailed' | 'complex' = 'detailed';

    const filename = keyVisualUrl.toLowerCase();

    if (filename.includes('lifestyle') || filename.includes('scene')) {
      type = 'lifestyle';
      complexity = 'complex';
    } else if (filename.includes('product')) {
      type = 'product';
      complexity = 'detailed';
    } else if (filename.includes('campaign') || filename.includes('ad')) {
      type = 'campaign';
      complexity = 'complex';
    }

    return { type, complexity };
  }

  // Calculate overall complexity score
  private static calculateOverallComplexity(analysis: BrandAssetAnalysis): number {
    let score = 5; // Base score

    // Logo complexity impact
    switch (analysis.logoComplexity) {
      case 'simple': score -= 1; break;
      case 'complex': score += 2; break;
    }

    // Product type impact
    switch (analysis.productType) {
      case 'beverage': score -= 1; break; // Beverages are generally simpler
      case 'electronics': score += 1; break; // Electronics can be complex
      case 'beauty': score += 1; break; // Beauty products often have complex packaging
    }

    // Key visual impact
    if (analysis.keyVisualComplexity === 'complex') {
      score += 2;
    } else if (analysis.keyVisualComplexity === 'simple') {
      score -= 1;
    }

    // Logo style impact
    switch (analysis.logoStyle) {
      case 'text': score -= 1; break; // Text logos are simpler to integrate
      case 'emblem': score += 2; break; // Emblems are complex
    }

    return Math.max(1, Math.min(10, score));
  }

  // Calculate brand integration difficulty
  private static calculateIntegrationDifficulty(analysis: BrandAssetAnalysis): number {
    let difficulty = analysis.overallComplexity;

    // Asset combination difficulty
    const assetCount = [
      analysis.logoComplexity,
      analysis.productType,
      analysis.keyVisualType
    ].filter(Boolean).length;

    if (assetCount >= 3) {
      difficulty += 2; // Multiple assets increase difficulty
    }

    // Product shape impact on integration
    switch (analysis.productShape) {
      case 'irregular': difficulty += 1; break;
      case 'bottle': difficulty += 0.5; break;
    }

    return Math.max(1, Math.min(10, difficulty));
  }

  // Get model recommendation based on analysis
  static getModelRecommendation(analysis: BrandAssetAnalysis): {
    model: 'seedream-v4' | 'nano-banana';
    confidence: number;
    reasoning: string[];
  } {

    const reasoning: string[] = [];
    let seedreamScore = 0;
    let nanaBananaScore = 0;

    // Get historical performance data
    const feedbackAnalytics = FeedbackService.getAnalytics();
    const modelPerformance = feedbackAnalytics.modelPerformance;

    // Base scores from historical performance
    if (feedbackAnalytics.totalFeedbacks >= 5) {
      seedreamScore += modelPerformance['seedream-v4'].averageRating;
      nanaBananaScore += modelPerformance['nano-banana'].averageRating;
    } else {
      // Default scores when insufficient data
      seedreamScore = 4.0;
      nanaBananaScore = 3.8;
    }

    // Adjust based on complexity
    if (analysis.overallComplexity >= 7) {
      seedreamScore += 1.5;
      reasoning.push('High complexity assets favor advanced multi-image processing');
    } else if (analysis.overallComplexity <= 4) {
      nanaBananaScore += 1.0;
      reasoning.push('Simple assets work well with streamlined processing');
    }

    // Adjust based on integration difficulty
    if (analysis.brandIntegrationDifficulty >= 7) {
      seedreamScore += 1.0;
      reasoning.push('Complex brand integration benefits from precise control');
    }

    // Adjust based on asset types
    if (analysis.keyVisualType === 'lifestyle' || analysis.keyVisualType === 'campaign') {
      seedreamScore += 0.8;
      reasoning.push('Complex visual assets require sophisticated integration');
    }

    if (analysis.logoStyle === 'emblem') {
      seedreamScore += 0.6;
      reasoning.push('Emblem logos require precise placement control');
    }

    // Product type considerations
    switch (analysis.productType) {
      case 'beverage':
        nanaBananaScore += 0.5;
        reasoning.push('Beverage displays have proven patterns');
        break;
      case 'electronics':
      case 'beauty':
        seedreamScore += 0.5;
        reasoning.push('Premium product categories benefit from advanced processing');
        break;
    }

    // Determine winner and confidence
    const totalScore = seedreamScore + nanaBananaScore;
    const winnerScore = Math.max(seedreamScore, nanaBananaScore);
    const confidence = (winnerScore / totalScore) * 0.8 + 0.2; // Min confidence of 0.2

    const recommendedModel = seedreamScore > nanaBananaScore ? 'seedream-v4' : 'nano-banana';

    // Add confidence-based reasoning
    if (confidence > 0.8) {
      reasoning.push('High confidence recommendation based on asset analysis');
    } else if (confidence < 0.6) {
      reasoning.push('Moderate confidence - either model could work well');
    }

    // Reduced logging for performance
    if (import.meta.env.DEV) {
      console.log('🎯 Model rec:', recommendedModel, confidence.toFixed(2));
    }

    return {
      model: recommendedModel,
      confidence: Math.min(0.95, confidence), // Cap confidence at 95%
      reasoning
    };
  }

  // Get model performance profiles based on feedback
  static getModelPerformanceProfiles(): ModelPerformanceProfile {
    const feedbackAnalytics = FeedbackService.getAnalytics();

    return {
      'seedream-v4': {
        strengths: [
          'Complex brand asset integration',
          'Multi-image processing',
          'Precise logo placement',
          'Premium visual quality'
        ],
        weaknesses: [
          'Longer processing time',
          'May over-complicate simple designs',
          'Requires more brand assets for optimal results'
        ],
        optimalAssetTypes: [
          'Complex logos',
          'Multiple brand assets',
          'Lifestyle imagery',
          'Premium products'
        ],
        averageRating: feedbackAnalytics.modelPerformance['seedream-v4'].averageRating || 4.2,
        brandIntegrationScore: 4.5
      },
      'nano-banana': {
        strengths: [
          'Fast processing',
          'Clean, streamlined results',
          'Good for simple brand assets',
          'Consistent output quality'
        ],
        weaknesses: [
          'Limited complex asset handling',
          'Less precise brand placement',
          'May simplify complex designs'
        ],
        optimalAssetTypes: [
          'Simple logos',
          'Text-based branding',
          'Standard product shots',
          'Straightforward displays'
        ],
        averageRating: feedbackAnalytics.modelPerformance['nano-banana'].averageRating || 3.9,
        brandIntegrationScore: 3.8
      }
    };
  }

  // Record asset analysis feedback for learning
  static recordAssetFeedback(
    assetAnalysis: BrandAssetAnalysis,
    modelUsed: 'seedream-v4' | 'nano-banana',
    feedback: any
  ): void {

    // Store the relationship between asset characteristics and performance
    const feedbackRecord = {
      timestamp: new Date().toISOString(),
      assetAnalysis,
      modelUsed,
      performance: {
        overallRating: feedback.rating,
        brandIntegration: feedback.brandIntegration,
        visualQuality: feedback.visualQuality
      }
    };

    // In a production system, this would be stored in a proper database
    const existingRecords = JSON.parse(localStorage.getItem('asset_feedback_records') || '[]');
    existingRecords.push(feedbackRecord);

    // Keep only the last 100 records
    if (existingRecords.length > 100) {
      existingRecords.splice(0, existingRecords.length - 100);
    }

    localStorage.setItem('asset_feedback_records', JSON.stringify(existingRecords));

    if (import.meta.env.DEV) {
      console.log('📊 Feedback:', modelUsed, feedback.rating);
    }
  }

  // Get insights for asset optimization
  static getAssetOptimizationInsights(): {
    recommendations: string[];
    patterns: string[];
    confidence: number;
  } {

    const records = JSON.parse(localStorage.getItem('asset_feedback_records') || '[]');

    if (records.length < 5) {
      return {
        recommendations: ['Insufficient data for asset optimization insights'],
        patterns: [],
        confidence: 0.1
      };
    }

    const recommendations: string[] = [];
    const patterns: string[] = [];

    // Analyze patterns
    const highPerformingRecords = records.filter((r: any) => r.performance.overallRating >= 4);
    const lowPerformingRecords = records.filter((r: any) => r.performance.overallRating <= 2);

    // High performance patterns
    if (highPerformingRecords.length > 0) {
      const avgComplexity = highPerformingRecords.reduce((sum: number, r: any) =>
        sum + r.assetAnalysis.overallComplexity, 0) / highPerformingRecords.length;

      patterns.push(`High-performing assets average ${avgComplexity.toFixed(1)}/10 complexity`);
    }

    // Recommendations based on patterns
    if (lowPerformingRecords.length > highPerformingRecords.length) {
      recommendations.push('Consider simplifying brand assets for better AI processing');
      recommendations.push('Focus on high-contrast logos and clear product images');
    }

    const confidence = Math.min(0.9, records.length / 50);

    return {
      recommendations,
      patterns,
      confidence
    };
  }
}
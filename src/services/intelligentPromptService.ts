import { FormData } from '../types';
import { FeedbackService } from './feedbackService';

export interface FormAnalysis {
  brandPriority: 'high' | 'medium' | 'low';
  productFocus: 'hero' | 'variety' | 'volume';
  retailEnvironment: 'premium' | 'mainstream' | 'value';
  displayPurpose: 'awareness' | 'sales' | 'information';
  visualStyle: 'dramatic' | 'elegant' | 'functional';
  complexityLevel: 'simple' | 'moderate' | 'complex';
}

export interface ClientIntent {
  primaryObjective: 'brand_dominance' | 'product_showcase' | 'space_efficiency' | 'cost_effectiveness';
  secondaryObjectives: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  qualityExpectation: 'premium' | 'commercial' | 'functional';
  timeToMarket: 'urgent' | 'standard' | 'flexible';
}

export interface IntelligentPromptConfig {
  coreStrategy: string;
  emphasisAreas: string[];
  avoidancePatterns: string[];
  visualDirectives: string[];
  brandIntegrationLevel: number; // 1-10
  technicalPrecisionLevel: number; // 1-10
  creativeLiberty: number; // 1-10
}

export class IntelligentPromptService {

  // Analyze form data to understand client intent
  static analyzeFormData(formData: FormData): FormAnalysis {
    const analysis: FormAnalysis = {
      brandPriority: 'medium',
      productFocus: 'variety',
      retailEnvironment: 'mainstream',
      displayPurpose: 'sales',
      visualStyle: 'elegant',
      complexityLevel: 'moderate'
    };

    // Analyze brand priority based on multiple signals
    let brandSignals = 0;

    // Strong brand indicators
    if (formData.brand && formData.brand.length > 15) brandSignals += 2; // Detailed brand name
    if (formData.description && formData.description.includes('premium')) brandSignals += 2;
    if (formData.description && formData.description.includes('luxury')) brandSignals += 3;
    if (formData.materials && formData.materials.includes('Alüminyum (Aluminum)')) brandSignals += 1;
    if (formData.materials && formData.materials.includes('Cam (Glass)')) brandSignals += 2;
    if (formData.standType && formData.standType.includes('Floor')) brandSignals += 1;

    analysis.brandPriority = brandSignals >= 4 ? 'high' : brandSignals >= 2 ? 'medium' : 'low';

    // Analyze product focus
    if (formData.shelfCount === 1) {
      analysis.productFocus = 'hero'; // Single shelf = hero product focus
    } else if (formData.shelfCount >= 4) {
      analysis.productFocus = 'variety'; // Many shelves = variety showcase
    } else if (formData.frontFaceCount && formData.frontFaceCount >= 6) {
      analysis.productFocus = 'volume'; // High face count = volume focus
    }

    // Analyze retail environment
    const premiumIndicators = [
      formData.materials?.includes('Cam (Glass)'),
      formData.materials?.includes('Alüminyum (Aluminum)'),
      formData.standBaseColor === '#000000' || formData.standBaseColor === '#ffffff',
      formData.standHeight && formData.standHeight >= 150
    ].filter(Boolean).length;

    analysis.retailEnvironment = premiumIndicators >= 3 ? 'premium' :
                                premiumIndicators >= 1 ? 'mainstream' : 'value';

    // Analyze display purpose
    if (formData.standType && formData.standType.includes('Counter')) {
      analysis.displayPurpose = 'awareness'; // Counter displays for awareness
    } else if (formData.shelfCount && formData.shelfCount >= 3) {
      analysis.displayPurpose = 'sales'; // Multiple shelves for sales
    } else {
      analysis.displayPurpose = 'information'; // Simple displays for info
    }

    // Analyze visual style preference
    if (analysis.brandPriority === 'high') {
      analysis.visualStyle = 'dramatic'; // High brand priority = dramatic
    } else if (analysis.retailEnvironment === 'premium') {
      analysis.visualStyle = 'elegant'; // Premium environment = elegant
    } else {
      analysis.visualStyle = 'functional'; // Default = functional
    }

    // Analyze complexity level
    const complexityFactors = [
      formData.shelfCount && formData.shelfCount > 3,
      formData.materials && formData.materials.length > 1,
      formData.standType && formData.standType.includes('Wall'),
      formData.exampleStands && formData.exampleStands.length > 0
    ].filter(Boolean).length;

    analysis.complexityLevel = complexityFactors >= 3 ? 'complex' :
                              complexityFactors >= 1 ? 'moderate' : 'simple';

    return analysis;
  }

  // Infer client intent from form data and context
  static inferClientIntent(formData: FormData, analysis: FormAnalysis): ClientIntent {
    let primaryObjective: ClientIntent['primaryObjective'] = 'product_showcase';

    // Determine primary objective
    if (analysis.brandPriority === 'high') {
      primaryObjective = 'brand_dominance';
    } else if (analysis.productFocus === 'volume' || (formData.shelfCount && formData.shelfCount >= 4)) {
      primaryObjective = 'space_efficiency';
    } else if (formData.materials && formData.materials.includes('Plastik (Plastic)')) {
      primaryObjective = 'cost_effectiveness';
    }

    // Determine secondary objectives
    const secondaryObjectives: string[] = [];
    if (primaryObjective !== 'brand_dominance' && analysis.brandPriority !== 'low') {
      secondaryObjectives.push('brand_visibility');
    }
    if (primaryObjective !== 'space_efficiency' && formData.shelfCount && formData.shelfCount >= 3) {
      secondaryObjectives.push('product_variety');
    }
    if (analysis.retailEnvironment === 'premium') {
      secondaryObjectives.push('premium_presentation');
    }
    if (analysis.displayPurpose === 'sales') {
      secondaryObjectives.push('purchase_influence');
    }

    // Determine risk tolerance
    let riskTolerance: ClientIntent['riskTolerance'] = 'moderate';
    if (analysis.brandPriority === 'high' && analysis.retailEnvironment === 'premium') {
      riskTolerance = 'conservative'; // High-value brands are conservative
    } else if (analysis.visualStyle === 'dramatic') {
      riskTolerance = 'aggressive'; // Dramatic style suggests risk tolerance
    }

    // Determine quality expectation
    let qualityExpectation: ClientIntent['qualityExpectation'] = 'commercial';
    if (analysis.retailEnvironment === 'premium') {
      qualityExpectation = 'premium';
    } else if (primaryObjective === 'cost_effectiveness') {
      qualityExpectation = 'functional';
    }

    // Determine time to market (inferred from complexity)
    let timeToMarket: ClientIntent['timeToMarket'] = 'standard';
    if (analysis.complexityLevel === 'simple') {
      timeToMarket = 'urgent'; // Simple displays suggest urgency
    } else if (analysis.complexityLevel === 'complex') {
      timeToMarket = 'flexible'; // Complex displays allow more time
    }

    return {
      primaryObjective,
      secondaryObjectives,
      riskTolerance,
      qualityExpectation,
      timeToMarket
    };
  }

  // Generate intelligent prompt configuration
  static generatePromptConfig(
    formData: FormData,
    analysis: FormAnalysis,
    intent: ClientIntent
  ): IntelligentPromptConfig {

    let coreStrategy = '';
    const emphasisAreas: string[] = [];
    const avoidancePatterns: string[] = [];
    const visualDirectives: string[] = [];

    // Core strategy based on primary objective
    switch (intent.primaryObjective) {
      case 'brand_dominance':
        coreStrategy = 'BRAND SUPREMACY APPROACH: Maximize brand visibility and recognition through dominant logo placement, brand color integration, and cohesive brand storytelling across all display surfaces';
        emphasisAreas.push('Logo prominence on multiple surfaces');
        emphasisAreas.push('Brand color dominance in structural elements');
        emphasisAreas.push('Cohesive brand narrative');
        break;

      case 'product_showcase':
        coreStrategy = 'PRODUCT HERO STRATEGY: Elevate products as the primary visual focus with strategic placement, optimal lighting, and compelling product presentation that drives purchase intent';
        emphasisAreas.push('Hero product positioning at eye level');
        emphasisAreas.push('Product variety and abundance');
        emphasisAreas.push('Clear product visibility and accessibility');
        break;

      case 'space_efficiency':
        coreStrategy = 'MAXIMUM UTILIZATION APPROACH: Optimize every inch of display space for product capacity while maintaining visual appeal and customer accessibility';
        emphasisAreas.push('Dense but organized product arrangement');
        emphasisAreas.push('Vertical space optimization');
        emphasisAreas.push('Multi-tier product hierarchy');
        break;

      case 'cost_effectiveness':
        coreStrategy = 'SMART VALUE ENGINEERING: Achieve maximum visual impact and functionality using efficient materials and streamlined design without compromising brand integrity';
        emphasisAreas.push('Clean, efficient design lines');
        emphasisAreas.push('Material optimization');
        emphasisAreas.push('Functional simplicity');
        break;
    }

    // Add secondary objective emphasis
    intent.secondaryObjectives.forEach(objective => {
      switch (objective) {
        case 'brand_visibility':
          emphasisAreas.push('Strategic brand element placement');
          break;
        case 'product_variety':
          emphasisAreas.push('Diverse product category representation');
          break;
        case 'premium_presentation':
          emphasisAreas.push('Luxury retail aesthetics');
          visualDirectives.push('Premium materials and finishes');
          break;
        case 'purchase_influence':
          emphasisAreas.push('Call-to-action visual elements');
          visualDirectives.push('Compelling product positioning');
          break;
      }
    });

    // Visual directives based on analysis
    switch (analysis.visualStyle) {
      case 'dramatic':
        visualDirectives.push('Bold, attention-grabbing presentation');
        visualDirectives.push('High contrast lighting and shadows');
        visualDirectives.push('Dynamic angular composition');
        break;
      case 'elegant':
        visualDirectives.push('Sophisticated, refined aesthetics');
        visualDirectives.push('Subtle lighting with premium ambiance');
        visualDirectives.push('Clean lines and balanced proportions');
        break;
      case 'functional':
        visualDirectives.push('Clear, straightforward presentation');
        visualDirectives.push('Even, practical lighting');
        visualDirectives.push('Efficient, no-nonsense design');
        break;
    }

    // Avoidance patterns based on risk tolerance
    switch (intent.riskTolerance) {
      case 'conservative':
        avoidancePatterns.push('Avoid experimental or unconventional designs');
        avoidancePatterns.push('Minimize artistic interpretation');
        avoidancePatterns.push('Stick to proven retail display conventions');
        break;
      case 'aggressive':
        avoidancePatterns.push('Avoid generic or template-like appearance');
        avoidancePatterns.push('Minimize conservative design elements');
        avoidancePatterns.push('Push beyond standard retail conventions');
        break;
      case 'moderate':
        avoidancePatterns.push('Balance innovation with proven approaches');
        avoidancePatterns.push('Avoid both extreme conservatism and radical experimentation');
        break;
    }

    // Calculate precision levels
    const brandIntegrationLevel = analysis.brandPriority === 'high' ? 9 :
                                 analysis.brandPriority === 'medium' ? 6 : 3;

    const technicalPrecisionLevel = analysis.complexityLevel === 'complex' ? 9 :
                                   analysis.complexityLevel === 'moderate' ? 6 : 4;

    const creativeLiberty = intent.riskTolerance === 'aggressive' ? 8 :
                           intent.riskTolerance === 'moderate' ? 5 : 3;

    return {
      coreStrategy,
      emphasisAreas,
      avoidancePatterns,
      visualDirectives,
      brandIntegrationLevel,
      technicalPrecisionLevel,
      creativeLiberty
    };
  }

  // Generate the final intelligent prompt
  static generateIntelligentPrompt(
    basePrompt: string,
    formData: FormData
  ): {
    enhancedPrompt: string;
    analysis: FormAnalysis;
    intent: ClientIntent;
    config: IntelligentPromptConfig;
  } {

    const analysis = this.analyzeFormData(formData);
    const intent = this.inferClientIntent(formData, analysis);
    const config = this.generatePromptConfig(formData, analysis, intent);

    // Build the enhanced prompt
    let enhancedPrompt = basePrompt;

    // Add core strategy
    enhancedPrompt += `\n\n${config.coreStrategy}`;

    // Add emphasis areas
    if (config.emphasisAreas.length > 0) {
      enhancedPrompt += `\n\nKEY EMPHASIS AREAS:\n${config.emphasisAreas.map(area => `- ${area}`).join('\n')}`;
    }

    // Add visual directives
    if (config.visualDirectives.length > 0) {
      enhancedPrompt += `\n\nVISUAL DIRECTIVES:\n${config.visualDirectives.map(directive => `- ${directive}`).join('\n')}`;
    }

    // Add avoidance patterns
    if (config.avoidancePatterns.length > 0) {
      enhancedPrompt += `\n\nAVOID:\n${config.avoidancePatterns.map(pattern => `- ${pattern}`).join('\n')}`;
    }

    // Add precision calibration
    enhancedPrompt += `\n\nPRECISION CALIBRATION:`;
    enhancedPrompt += `\n- Brand Integration Intensity: ${config.brandIntegrationLevel}/10`;
    enhancedPrompt += `\n- Technical Specification Adherence: ${config.technicalPrecisionLevel}/10`;
    enhancedPrompt += `\n- Creative Interpretation Liberty: ${config.creativeLiberty}/10`;

    // Add intelligent context based on learning
    const feedbackAnalytics = FeedbackService.getAnalytics();
    if (feedbackAnalytics.totalFeedbacks >= 5) {
      const learningInsights = this.generateLearningInsights(analysis, intent, feedbackAnalytics);
      if (learningInsights) {
        enhancedPrompt += `\n\n${learningInsights}`;
      }
    }

    console.log('🧠 Intelligent prompt generated:', {
      primaryObjective: intent.primaryObjective,
      brandPriority: analysis.brandPriority,
      visualStyle: analysis.visualStyle,
      riskTolerance: intent.riskTolerance,
      emphasisCount: config.emphasisAreas.length
    });

    return {
      enhancedPrompt,
      analysis,
      intent,
      config
    };
  }

  // Generate learning insights from feedback patterns
  private static generateLearningInsights(
    analysis: FormAnalysis,
    intent: ClientIntent,
    analytics: any
  ): string | null {

    const insights: string[] = [];

    // Brand integration insights
    if (analytics.clientPreferences.brandIntegrationImportance < 3.5 && analysis.brandPriority === 'high') {
      insights.push('LEARNING INSIGHT: Previous high-brand projects showed preference for subtler integration - balance prominence with sophistication');
    }

    // Visual quality insights
    if (analytics.clientPreferences.visualQualityImportance > 4.2) {
      insights.push('LEARNING INSIGHT: Clients consistently value premium visual presentation - emphasize lighting, composition, and material quality');
    }

    // Prompt adherence insights
    if (analytics.clientPreferences.promptAdherenceImportance > 4.0) {
      insights.push('LEARNING INSIGHT: Specification accuracy is critical - prioritize dimensional precision and material authenticity');
    }

    // Model performance insights
    if (analytics.modelPerformance['seedream-v4'].averageRating > analytics.modelPerformance['nano-banana'].averageRating + 0.5) {
      insights.push('LEARNING INSIGHT: Complex brand integration scenarios perform better with advanced multi-image processing');
    }

    return insights.length > 0 ? `ADAPTIVE LEARNING INSIGHTS:\n${insights.map(insight => `- ${insight}`).join('\n')}` : null;
  }

  // Get recommendation for prompt approach
  static getPromptRecommendation(formData: FormData): {
    recommendedApproach: 'conservative' | 'balanced' | 'creative';
    confidence: number;
    reasoning: string[];
  } {

    const analysis = this.analyzeFormData(formData);
    const intent = this.inferClientIntent(formData, analysis);

    let recommendedApproach: 'conservative' | 'balanced' | 'creative' = 'balanced';
    const reasoning: string[] = [];
    let confidence = 0.7;

    // Determine approach based on analysis
    if (intent.riskTolerance === 'conservative' || analysis.brandPriority === 'high') {
      recommendedApproach = 'conservative';
      reasoning.push('High brand value requires proven approaches');
      reasoning.push('Conservative risk tolerance indicated');
      confidence = 0.85;
    } else if (intent.riskTolerance === 'aggressive' && analysis.visualStyle === 'dramatic') {
      recommendedApproach = 'creative';
      reasoning.push('Client signals openness to bold visual approaches');
      reasoning.push('Dramatic style preference detected');
      confidence = 0.8;
    } else {
      reasoning.push('Balanced approach optimal for mainstream retail');
      reasoning.push('Moderate complexity and risk tolerance');
    }

    // Adjust confidence based on data completeness
    const dataCompleteness = [
      formData.brand,
      formData.product,
      formData.materials?.length,
      formData.standType,
      formData.description
    ].filter(Boolean).length / 5;

    confidence *= dataCompleteness;

    return {
      recommendedApproach,
      confidence,
      reasoning
    };
  }
}
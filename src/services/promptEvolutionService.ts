import { FeedbackService, ImageFeedback } from './feedbackService';
import { ABTestingService } from './abTestingService';
import { PromptOptimizationService } from './promptOptimizationService';

export interface PromptEvolutionPattern {
  id: string;
  pattern: string;
  description: string;
  successRate: number;
  usage: number;
  contexts: string[]; // When this pattern works best
  alternatives: string[]; // Alternative patterns to try
  generation: number; // Evolutionary generation
  parentPatterns?: string[]; // Patterns this evolved from
  confidence: number;
  lastUpdated: string;
}

export interface EvolutionMetrics {
  totalGenerations: number;
  activePatterns: number;
  avgSuccessRate: number;
  topPerformingPatterns: PromptEvolutionPattern[];
  recentEvolutions: {
    pattern: string;
    improvement: number;
    timestamp: string;
  }[];
  convergenceStatus: 'evolving' | 'converging' | 'stable';
}

export interface PromptDNA {
  brandIntegrationGenes: string[];
  productPlacementGenes: string[];
  visualStyleGenes: string[];
  technicalGenes: string[];
  creativityGenes: string[];
  fitness: number; // Overall performance score
  generation: number;
}

export class PromptEvolutionService {
  private static readonly PATTERNS_KEY = 'evolution_patterns';
  private static readonly DNA_KEY = 'prompt_dna';
  private static readonly METRICS_KEY = 'evolution_metrics';

  // Initialize with baseline patterns
  static readonly SEED_PATTERNS: PromptEvolutionPattern[] = [
    {
      id: 'dominant_branding',
      pattern: 'Feature brand logo as primary visual anchor on multiple display surfaces',
      description: 'Strong brand prominence approach',
      successRate: 0.75,
      usage: 0,
      contexts: ['high-brand-priority', 'premium-retail'],
      alternatives: ['subtle_branding', 'integrated_branding'],
      generation: 0,
      confidence: 0.6,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'product_hero',
      pattern: 'Position actual branded products as hero elements on every shelf level with front-facing labels',
      description: 'Product-focused display strategy',
      successRate: 0.80,
      usage: 0,
      contexts: ['product-showcase', 'sales-focused'],
      alternatives: ['product_variety', 'product_density'],
      generation: 0,
      confidence: 0.7,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'premium_lighting',
      pattern: 'professional product photography studio lighting with dramatic shadows',
      description: 'High-end visual presentation',
      successRate: 0.70,
      usage: 0,
      contexts: ['premium-brands', 'luxury-retail'],
      alternatives: ['natural_lighting', 'commercial_lighting'],
      generation: 0,
      confidence: 0.65,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'technical_precision',
      pattern: 'EXACTLY following dimensional specifications with engineering precision',
      description: 'Specification adherence focus',
      successRate: 0.85,
      usage: 0,
      contexts: ['technical-accuracy', 'manufacturing'],
      alternatives: ['adaptive_dimensions', 'proportional_scaling'],
      generation: 0,
      confidence: 0.8,
      lastUpdated: new Date().toISOString()
    }
  ];

  // Record actual prompt usage and performance
  static recordPromptUsage(promptUsed: string, feedback: ImageFeedback): void {
    const patterns = this.getAllPatterns();
    const metrics = this.getEvolutionMetrics();

    // Analyze which patterns were used in this prompt
    const usedPatterns = this.identifyPatternsInPrompt(promptUsed);

    // Update pattern performance based on feedback
    usedPatterns.forEach(patternId => {
      const pattern = patterns.find(p => p.id === patternId);
      if (pattern) {
        const oldFitness = pattern.successRate * pattern.usage || 0;
        pattern.usage += 1;

        // Calculate new success rate based on feedback
        const feedbackScore = this.calculateFeedbackScore(feedback);
        const newFitness = oldFitness + feedbackScore;
        pattern.successRate = newFitness / pattern.usage;
        pattern.confidence = Math.min(0.95, pattern.usage / 10); // Confidence grows with usage
        pattern.lastUpdated = new Date().toISOString();

        console.log(`🧬 Pattern '${pattern.id}' evolved: ${(pattern.successRate * 100).toFixed(1)}% success rate (${pattern.usage} uses)`);
      }
    });

    // Save updated patterns
    localStorage.setItem(this.PATTERNS_KEY, JSON.stringify(patterns));

    // Record this evolution step
    this.recordEvolutionStep(promptUsed, usedPatterns, feedback);

    // Trigger mutation if conditions are met
    if (patterns.some(p => p.usage > 5 && p.successRate < 0.4)) {
      this.mutateUnderperformingPatterns();
    }
  }

  // Calculate feedback score from 0-1
  private static calculateFeedbackScore(feedback: ImageFeedback): number {
    const overallWeight = 0.4;
    const brandWeight = 0.25;
    const qualityWeight = 0.2;
    const adherenceWeight = 0.15;

    return (
      (feedback.rating / 5) * overallWeight +
      (feedback.brandIntegration / 5) * brandWeight +
      (feedback.visualQuality / 5) * qualityWeight +
      (feedback.promptAdherence / 5) * adherenceWeight
    );
  }

  // Identify which patterns were likely used in a prompt
  private static identifyPatternsInPrompt(prompt: string): string[] {
    const patterns = this.getAllPatterns();
    const usedPatterns: string[] = [];

    patterns.forEach(pattern => {
      // Check if pattern keywords appear in the prompt
      const keywords = pattern.pattern.toLowerCase().split(' ').filter(w => w.length > 3);
      const promptLower = prompt.toLowerCase();

      let matchScore = 0;
      keywords.forEach(keyword => {
        if (promptLower.includes(keyword)) {
          matchScore += 1;
        }
      });

      // If enough keywords match, consider this pattern used
      if (matchScore >= Math.min(3, keywords.length * 0.4)) {
        usedPatterns.push(pattern.id);
      }
    });

    return usedPatterns;
  }

  // Record an evolution step for tracking
  private static recordEvolutionStep(prompt: string, patterns: string[], feedback: ImageFeedback): void {
    const steps = this.getEvolutionHistory();
    const step = {
      id: `evolution_${Date.now()}`,
      timestamp: new Date().toISOString(),
      prompt: prompt.substring(0, 200) + '...', // Store truncated prompt
      patternsUsed: patterns,
      feedbackScore: this.calculateFeedbackScore(feedback),
      rating: feedback.rating,
      generation: this.getCurrentGeneration()
    };

    steps.push(step);

    // Keep only last 50 steps to avoid storage bloat
    if (steps.length > 50) {
      steps.splice(0, steps.length - 50);
    }

    localStorage.setItem('evolution_history', JSON.stringify(steps));
  }

  // Mutate underperforming patterns
  private static mutateUnderperformingPatterns(): void {
    const patterns = this.getAllPatterns();
    const underperformers = patterns.filter(p => p.usage > 5 && p.successRate < 0.4);

    underperformers.forEach(pattern => {
      const mutations = this.generateMutations(pattern);
      mutations.forEach(mutation => {
        patterns.push(mutation);
        console.log(`🧬 Mutated pattern '${pattern.id}' → '${mutation.id}'`);
      });
    });

    localStorage.setItem(this.PATTERNS_KEY, JSON.stringify(patterns));
  }

  // Generate mutations of a pattern
  private static generateMutations(pattern: PromptEvolutionPattern): PromptEvolutionPattern[] {
    const mutations: PromptEvolutionPattern[] = [];
    const mutationTypes = ['intensify', 'soften', 'combine', 'specialize'];

    mutationTypes.forEach(type => {
      const mutation = this.createMutation(pattern, type);
      if (mutation) {
        mutations.push(mutation);
      }
    });

    return mutations.slice(0, 2); // Limit to 2 mutations per pattern
  }

  // Create a specific type of mutation
  private static createMutation(parent: PromptEvolutionPattern, type: string): PromptEvolutionPattern | null {
    const generation = parent.generation + 1;

    switch (type) {
      case 'intensify':
        return {
          id: `${parent.id}_intense_gen${generation}`,
          pattern: this.intensifyPattern(parent.pattern),
          description: `Intensified version of ${parent.description}`,
          successRate: 0,
          usage: 0,
          contexts: parent.contexts,
          alternatives: [parent.id],
          generation,
          parentPatterns: [parent.id],
          confidence: 0,
          lastUpdated: new Date().toISOString()
        };

      case 'soften':
        return {
          id: `${parent.id}_subtle_gen${generation}`,
          pattern: this.softenPattern(parent.pattern),
          description: `Subtler version of ${parent.description}`,
          successRate: 0,
          usage: 0,
          contexts: parent.contexts,
          alternatives: [parent.id],
          generation,
          parentPatterns: [parent.id],
          confidence: 0,
          lastUpdated: new Date().toISOString()
        };

      default:
        return null;
    }
  }

  // Pattern mutation methods
  private static intensifyPattern(pattern: string): string {
    return pattern
      .replace(/feature/gi, 'prominently showcase')
      .replace(/display/gi, 'dramatically highlight')
      .replace(/position/gi, 'strategically dominate with')
      .replace(/with/gi, 'with maximum impact and');
  }

  private static softenPattern(pattern: string): string {
    return pattern
      .replace(/prominently/gi, 'subtly')
      .replace(/dramatically/gi, 'gently')
      .replace(/maximum/gi, 'balanced')
      .replace(/EXACTLY/gi, 'approximately')
      .replace(/dominant/gi, 'integrated');
  }

  // Get evolution history
  static getEvolutionHistory(): any[] {
    const stored = localStorage.getItem('evolution_history');
    return stored ? JSON.parse(stored) : [];
  }

  // Get current generation number
  static getCurrentGeneration(): number {
    const patterns = this.getAllPatterns();
    return Math.max(...patterns.map(p => p.generation), 0);
  }

  // Get all patterns (stored + baseline)
  static getAllPatterns(): PromptEvolutionPattern[] {
    const stored = localStorage.getItem(this.PATTERNS_KEY);
    const patterns = stored ? JSON.parse(stored) : [...this.SEED_PATTERNS];
    return patterns;
  }

  // Get stored patterns
  private static getStoredPatterns(): PromptEvolutionPattern[] {
    return this.getAllPatterns();
  }

  // Get evolution metrics
  static getEvolutionMetrics(): EvolutionMetrics {
    const patterns = this.getAllPatterns();
    const history = this.getEvolutionHistory();

    const activePatterns = patterns.filter(p => p.usage > 0 && p.isActive !== false);
    const totalGenerations = Math.max(...patterns.map(p => p.generation), 0) + 1;

    return {
      totalGenerations,
      activePatterns: activePatterns.length,
      avgSuccessRate: activePatterns.length > 0 ?
        activePatterns.reduce((sum, p) => sum + p.successRate, 0) / activePatterns.length : 0,
      topPerformingPatterns: patterns
        .filter(p => p.usage > 0)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5),
      recentEvolutions: history.slice(-10).map(h => ({
        pattern: h.patternsUsed.join(', '),
        improvement: (h.feedbackScore - 0.5) * 100,
        timestamp: h.timestamp
      })),
      convergenceStatus: this.determineConvergenceStatus(patterns, history)
    };
  }

  // Determine convergence status
  private static determineConvergenceStatus(patterns: PromptEvolutionPattern[], history: any[]): 'evolving' | 'converging' | 'stable' {
    if (history.length < 5) return 'evolving';

    const recentScores = history.slice(-5).map(h => h.feedbackScore);
    const trend = recentScores[recentScores.length - 1] - recentScores[0];

    if (trend > 0.1) return 'evolving';
    if (Math.abs(trend) < 0.05) return 'stable';
    return 'converging';
  }

  // Evolve patterns based on feedback (enhanced)
  static evolvePatterns(): void {
    const patterns = this.getStoredPatterns();
    const feedbacks = FeedbackService.getAllFeedbacks();

    if (feedbacks.length < 10) {
      console.log('🧬 Insufficient feedback for evolution (need at least 10)');
      return;
    }

    const newPatterns: PromptEvolutionPattern[] = [];
    let evolutionOccurred = false;

    patterns.forEach(pattern => {
      // Update pattern performance based on recent feedback
      this.updatePatternPerformance(pattern, feedbacks);

      // Try to evolve high-performing patterns
      if (pattern.successRate > 0.8 && pattern.usage >= 5) {
        const evolved = this.mutatePattern(pattern);
        if (evolved) {
          newPatterns.push(evolved);
          evolutionOccurred = true;
          console.log('🧬 Pattern evolved:', {
            parent: pattern.id,
            child: evolved.id,
            generation: evolved.generation
          });
        }
      }

      // Crossover with other successful patterns
      if (pattern.successRate > 0.75 && Math.random() < 0.3) {
        const partner = this.findCrossoverPartner(pattern, patterns);
        if (partner) {
          const offspring = this.crossoverPatterns(pattern, partner);
          if (offspring) {
            newPatterns.push(offspring);
            evolutionOccurred = true;
          }
        }
      }
    });

    // Add new patterns to the gene pool
    if (newPatterns.length > 0) {
      const allPatterns = [...patterns, ...newPatterns];

      // Selection pressure: keep only the best patterns
      const survivors = this.selectSurvivors(allPatterns);

      localStorage.setItem(this.PATTERNS_KEY, JSON.stringify(survivors));

      console.log('🧬 Evolution complete:', {
        newPatterns: newPatterns.length,
        totalSurvivors: survivors.length,
        avgFitness: survivors.reduce((sum, p) => sum + p.successRate, 0) / survivors.length
      });
    }

    // Update evolution metrics
    this.updateEvolutionMetrics(evolutionOccurred);
  }

  // Mutate a pattern to create a new variant
  private static mutatePattern(pattern: PromptEvolutionPattern): PromptEvolutionPattern | null {
    const mutations = [
      // Brand integration mutations
      {
        from: 'primary visual anchor',
        to: 'dominant focal point',
        type: 'intensity_increase'
      },
      {
        from: 'multiple display surfaces',
        to: 'all visible surfaces and backgrounds',
        type: 'scope_expansion'
      },
      // Product placement mutations
      {
        from: 'hero elements on every shelf',
        to: 'cascading product hierarchy across all levels',
        type: 'structure_enhancement'
      },
      {
        from: 'front-facing labels',
        to: 'optimal angle product presentation',
        type: 'presentation_optimization'
      },
      // Visual style mutations
      {
        from: 'studio lighting',
        to: 'cinematic lighting with depth',
        type: 'quality_enhancement'
      },
      {
        from: 'dramatic shadows',
        to: 'atmospheric lighting effects',
        type: 'style_evolution'
      },
      // Technical mutations
      {
        from: 'EXACTLY following',
        to: 'PRECISELY maintaining',
        type: 'language_refinement'
      },
      {
        from: 'engineering precision',
        to: 'manufacturing accuracy with tolerances',
        type: 'technical_advancement'
      }
    ];

    // Apply random mutation
    const mutation = mutations[Math.floor(Math.random() * mutations.length)];

    if (pattern.pattern.includes(mutation.from)) {
      const mutatedPattern = pattern.pattern.replace(mutation.from, mutation.to);

      return {
        id: `${pattern.id}_m${pattern.generation + 1}`,
        pattern: mutatedPattern,
        description: `${pattern.description} (${mutation.type})`,
        successRate: pattern.successRate * 0.9, // Start with slightly lower success rate
        usage: 0,
        contexts: [...pattern.contexts],
        alternatives: [...pattern.alternatives, pattern.id],
        generation: pattern.generation + 1,
        parentPatterns: [pattern.id],
        confidence: 0.5, // Low confidence for new mutations
        lastUpdated: new Date().toISOString()
      };
    }

    return null;
  }

  // Crossover two patterns to create offspring
  private static crossoverPatterns(
    parent1: PromptEvolutionPattern,
    parent2: PromptEvolutionPattern
  ): PromptEvolutionPattern | null {

    // Extract key components from each pattern
    const p1Words = parent1.pattern.split(' ');
    const p2Words = parent2.pattern.split(' ');

    // Create hybrid pattern by combining elements
    const crossoverPoint = Math.floor(p1Words.length / 2);
    const hybridPattern = [
      ...p1Words.slice(0, crossoverPoint),
      ...p2Words.slice(crossoverPoint)
    ].join(' ');

    // Combine contexts and alternatives
    const combinedContexts = [...new Set([...parent1.contexts, ...parent2.contexts])];
    const combinedAlternatives = [...new Set([...parent1.alternatives, ...parent2.alternatives])];

    return {
      id: `${parent1.id}_x_${parent2.id}_g${Math.max(parent1.generation, parent2.generation) + 1}`,
      pattern: hybridPattern,
      description: `Hybrid of ${parent1.description} and ${parent2.description}`,
      successRate: (parent1.successRate + parent2.successRate) / 2,
      usage: 0,
      contexts: combinedContexts,
      alternatives: combinedAlternatives,
      generation: Math.max(parent1.generation, parent2.generation) + 1,
      parentPatterns: [parent1.id, parent2.id],
      confidence: 0.4, // Lower confidence for crossover patterns
      lastUpdated: new Date().toISOString()
    };
  }

  // Find a suitable partner for crossover
  private static findCrossoverPartner(
    pattern: PromptEvolutionPattern,
    allPatterns: PromptEvolutionPattern[]
  ): PromptEvolutionPattern | null {

    const candidates = allPatterns.filter(p =>
      p.id !== pattern.id &&
      p.successRate > 0.7 &&
      p.generation <= pattern.generation + 1 && // Similar generations
      p.contexts.some(context => pattern.contexts.includes(context)) // Shared contexts
    );

    return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
  }

  // Select surviving patterns based on fitness
  private static selectSurvivors(patterns: PromptEvolutionPattern[]): PromptEvolutionPattern[] {
    const maxPatterns = 20; // Maximum patterns to keep

    // Sort by fitness (success rate * usage + confidence)
    const scored = patterns.map(p => ({
      pattern: p,
      fitness: (p.successRate * 0.6) + (Math.min(p.usage / 10, 1) * 0.3) + (p.confidence * 0.1)
    })).sort((a, b) => b.fitness - a.fitness);

    // Keep top performers and some diversity
    const survivors = scored.slice(0, Math.min(maxPatterns, scored.length)).map(s => s.pattern);

    // Ensure we keep at least one pattern from each context
    const contexts = [...new Set(patterns.flatMap(p => p.contexts))];
    contexts.forEach(context => {
      if (!survivors.some(s => s.contexts.includes(context))) {
        const contextPattern = patterns
          .filter(p => p.contexts.includes(context))
          .sort((a, b) => b.successRate - a.successRate)[0];

        if (contextPattern && survivors.length < maxPatterns) {
          survivors.push(contextPattern);
        }
      }
    });

    return survivors;
  }

  // Update pattern performance based on feedback
  private static updatePatternPerformance(
    pattern: PromptEvolutionPattern,
    feedbacks: ImageFeedback[]
  ): void {

    // Find feedback related to this pattern (simplified matching)
    const relatedFeedbacks = feedbacks.filter(f =>
      f.promptUsed.includes(pattern.pattern) ||
      pattern.contexts.some(context => f.promptUsed.toLowerCase().includes(context.replace('-', ' ')))
    );

    if (relatedFeedbacks.length > 0) {
      const avgRating = relatedFeedbacks.reduce((sum, f) => sum + f.rating, 0) / relatedFeedbacks.length;
      const avgBrandIntegration = relatedFeedbacks.reduce((sum, f) => sum + f.brandIntegration, 0) / relatedFeedbacks.length;

      // Update success rate using exponential moving average
      const newSuccessRate = (avgRating + avgBrandIntegration) / 10; // Convert to 0-1 scale
      pattern.successRate = (pattern.successRate * 0.7) + (newSuccessRate * 0.3);

      pattern.usage += relatedFeedbacks.length;
      pattern.confidence = Math.min(1.0, pattern.confidence + (relatedFeedbacks.length * 0.1));
      pattern.lastUpdated = new Date().toISOString();
    }
  }

  // Get best patterns for current context
  static getBestPatternsForContext(context: string): PromptEvolutionPattern[] {
    const patterns = this.getStoredPatterns();

    return patterns
      .filter(p => p.contexts.includes(context) && p.successRate > 0.6)
      .sort((a, b) => (b.successRate * b.confidence) - (a.successRate * a.confidence))
      .slice(0, 3); // Top 3 patterns
  }

  // Generate evolved prompt based on learned patterns
  static generateEvolvedPrompt(basePrompt: string, contexts: string[]): string {
    let evolvedPrompt = basePrompt;

    contexts.forEach(context => {
      const bestPatterns = this.getBestPatternsForContext(context);

      bestPatterns.forEach(pattern => {
        if (Math.random() < pattern.confidence) {
          // Apply pattern enhancement
          evolvedPrompt += `\n\nEVOLVED ENHANCEMENT (${pattern.description}): ${pattern.pattern}`;
        }
      });
    });

    // Add evolutionary metadata
    const metrics = this.getEvolutionMetrics();
    if (metrics.convergenceStatus === 'stable') {
      evolvedPrompt += '\n\nEVOLUTIONARY STATUS: Stable patterns optimized through client feedback';
    }

    return evolvedPrompt;
  }

  // Record feedback for pattern evolution
  static recordEvolutionFeedback(feedback: ImageFeedback): void {
    // Trigger evolution periodically
    const feedbacks = FeedbackService.getAllFeedbacks();

    if (feedbacks.length % 10 === 0) { // Evolve every 10 feedbacks
      this.evolvePatterns();
    }

    console.log('🧬 Evolution feedback recorded, total feedback count:', feedbacks.length);
  }


  // Update evolution metrics
  private static updateEvolutionMetrics(evolutionOccurred: boolean): void {
    const metrics = this.getEvolutionMetrics();
    const patterns = this.getStoredPatterns();

    if (evolutionOccurred) {
      metrics.totalGenerations++;
      metrics.recentEvolutions.push({
        pattern: 'Multiple patterns evolved',
        improvement: 0.05, // Estimated improvement
        timestamp: new Date().toISOString()
      });

      // Keep only recent evolutions (last 10)
      metrics.recentEvolutions = metrics.recentEvolutions.slice(-10);
    }

    metrics.activePatterns = patterns.length;
    metrics.avgSuccessRate = patterns.reduce((sum, p) => sum + p.successRate, 0) / patterns.length;
    metrics.topPerformingPatterns = patterns
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    // Determine convergence status
    const recentGenerations = metrics.totalGenerations;
    if (recentGenerations < 3) {
      metrics.convergenceStatus = 'evolving';
    } else if (recentGenerations < 10) {
      metrics.convergenceStatus = 'converging';
    } else {
      metrics.convergenceStatus = 'stable';
    }

    localStorage.setItem(this.METRICS_KEY, JSON.stringify(metrics));
  }


  // Initialize evolution system
  static initialize(): void {
    const stored = localStorage.getItem(this.PATTERNS_KEY);
    if (!stored) {
      localStorage.setItem(this.PATTERNS_KEY, JSON.stringify(this.SEED_PATTERNS));
    }

    console.log('🧬 Prompt Evolution Service initialized');
  }

  // Export evolution data for analysis
  static exportEvolutionData(): any {
    return {
      patterns: this.getStoredPatterns(),
      metrics: this.getEvolutionMetrics(),
      feedbackCount: FeedbackService.getAllFeedbacks().length,
      exportedAt: new Date().toISOString()
    };
  }

  // Clear evolution data (for development)
  static clearEvolutionData(): void {
    localStorage.removeItem(this.PATTERNS_KEY);
    localStorage.removeItem(this.METRICS_KEY);
    console.log('🗑️ All evolution data cleared');
  }

  // Get evolution insights for users
  static getEvolutionInsights(): {
    insights: string[];
    recommendations: string[];
    performance: string;
  } {
    const metrics = this.getEvolutionMetrics();
    const patterns = this.getStoredPatterns();

    const insights: string[] = [];
    const recommendations: string[] = [];

    // Performance analysis
    const performance = `System has evolved through ${metrics.totalGenerations} generations with ${metrics.avgSuccessRate.toFixed(1)} average success rate`;

    // Generate insights
    if (metrics.totalGenerations > 5) {
      insights.push(`Prompt evolution is active with ${metrics.totalGenerations} evolutionary cycles completed`);
    }

    if (metrics.avgSuccessRate > 0.8) {
      insights.push('High-performing prompt patterns have been identified and are being optimized');
    }

    const topPattern = metrics.topPerformingPatterns[0];
    if (topPattern) {
      insights.push(`Best performing pattern: "${topPattern.description}" with ${(topPattern.successRate * 100).toFixed(1)}% success rate`);
    }

    // Generate recommendations
    if (metrics.convergenceStatus === 'evolving') {
      recommendations.push('Continue providing feedback to help patterns evolve');
    } else if (metrics.convergenceStatus === 'stable') {
      recommendations.push('Patterns have stabilized - consistently high-quality results expected');
    }

    if (metrics.activePatterns > 15) {
      recommendations.push('Consider pruning underperforming patterns for better efficiency');
    }

    return {
      insights,
      recommendations,
      performance
    };
  }
}
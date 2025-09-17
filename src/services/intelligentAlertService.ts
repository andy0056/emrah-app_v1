import { FeedbackService } from './feedbackService';
import { PromptEvolutionService } from './promptEvolutionService';
import { PromptOptimizationService } from './promptOptimizationService';
import { ABTestingService } from './abTestingService';
import { RealAnalyticsService } from './realAnalyticsService';

export interface IntelligentAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success' | 'insight';
  category: 'performance' | 'optimization' | 'user_behavior' | 'model_performance' | 'testing' | 'evolution';
  title: string;
  message: string;
  recommendation: string;
  actionRequired: boolean;
  priority: number; // 1-5, 5 being highest
  timestamp: Date;
  dataSource: string[];
  relatedMetrics: { [key: string]: number };
  actionableSteps?: string[];
  estimatedImpact?: 'low' | 'medium' | 'high';
}

export class IntelligentAlertService {
  private static readonly ALERTS_KEY = 'intelligent_alerts';
  private static readonly ALERT_HISTORY_KEY = 'alert_history';

  // Generate intelligent alerts based on real data analysis
  static generateAlerts(): IntelligentAlert[] {
    const alerts: IntelligentAlert[] = [];

    // Analyze feedback patterns
    alerts.push(...this.analyzeFeedbackPatterns());

    // Analyze model performance
    alerts.push(...this.analyzeModelPerformance());

    // Analyze optimization opportunities
    alerts.push(...this.analyzeOptimizationOpportunities());

    // Analyze A/B testing results
    alerts.push(...this.analyzeABTestingResults());

    // Analyze evolution patterns
    alerts.push(...this.analyzeEvolutionPatterns());

    // Analyze user behavior patterns
    alerts.push(...this.analyzeUserBehavior());

    // Sort by priority and recency
    alerts.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Store alerts
    this.storeAlerts(alerts);

    return alerts.slice(0, 10); // Return top 10 alerts
  }

  // Analyze feedback patterns for insights
  private static analyzeFeedbackPatterns(): IntelligentAlert[] {
    const alerts: IntelligentAlert[] = [];
    const feedbacks = FeedbackService.getAllFeedbacks();
    const analytics = FeedbackService.getAnalytics();

    if (feedbacks.length < 3) return alerts;

    // Check for declining satisfaction trend
    const recentFeedbacks = feedbacks.slice(-10);
    const oldFeedbacks = feedbacks.slice(-20, -10);

    if (recentFeedbacks.length >= 5 && oldFeedbacks.length >= 5) {
      const recentAvg = recentFeedbacks.reduce((sum, f) => sum + f.rating, 0) / recentFeedbacks.length;
      const oldAvg = oldFeedbacks.reduce((sum, f) => sum + f.rating, 0) / oldFeedbacks.length;

      if (recentAvg < oldAvg - 0.5) {
        alerts.push({
          id: `declining_satisfaction_${Date.now()}`,
          type: 'warning',
          category: 'performance',
          title: 'Declining User Satisfaction Detected',
          message: `Average rating has dropped from ${oldAvg.toFixed(1)} to ${recentAvg.toFixed(1)} in recent generations.`,
          recommendation: 'Review recent prompt changes and consider reverting optimizations that may be negatively impacting user satisfaction.',
          actionRequired: true,
          priority: 4,
          timestamp: new Date(),
          dataSource: ['feedback_analytics'],
          relatedMetrics: { 'recent_avg': recentAvg, 'previous_avg': oldAvg, 'change': recentAvg - oldAvg },
          actionableSteps: [
            'Review prompt modifications from the last 10 generations',
            'Check if specific image types are performing worse',
            'Consider rolling back recent optimization changes',
            'Increase A/B testing to identify better approaches'
          ],
          estimatedImpact: 'high'
        });
      }
    }

    // Check for consistently low brand integration scores
    const lowBrandScores = feedbacks.filter(f => f.brandIntegration <= 2);
    if (lowBrandScores.length > feedbacks.length * 0.3) {
      alerts.push({
        id: `brand_integration_issues_${Date.now()}`,
        type: 'critical',
        category: 'optimization',
        title: 'Brand Integration Performance Issues',
        message: `${Math.round((lowBrandScores.length / feedbacks.length) * 100)}% of images have low brand integration scores (≤2/5).`,
        recommendation: 'Immediately increase brand intensity weighting and review brand placement strategies.',
        actionRequired: true,
        priority: 5,
        timestamp: new Date(),
        dataSource: ['feedback_analytics'],
        relatedMetrics: {
          'low_brand_percentage': (lowBrandScores.length / feedbacks.length) * 100,
          'avg_brand_score': analytics.clientPreferences.brandIntegrationImportance
        },
        actionableSteps: [
          'Switch to SeedReam v4 for better brand integration',
          'Increase brand intensity weight to 0.8+',
          'Add more prominent brand placement modifiers',
          'Review brand asset quality and resolution'
        ],
        estimatedImpact: 'high'
      });
    }

    return alerts;
  }

  // Analyze model performance patterns
  private static analyzeModelPerformance(): IntelligentAlert[] {
    const alerts: IntelligentAlert[] = [];
    const analytics = FeedbackService.getAnalytics();
    const performanceInsights = RealAnalyticsService.getPerformanceInsights();

    const seedreamPerf = analytics.modelPerformance['seedream-v4'];
    const nanoBananaPerf = analytics.modelPerformance['nano-banana'];

    // Check if one model is significantly outperforming the other
    if (seedreamPerf.count >= 5 && nanoBananaPerf.count >= 5) {
      const performanceDiff = seedreamPerf.averageRating - nanoBananaPerf.averageRating;

      if (Math.abs(performanceDiff) > 0.7) {
        const betterModel = performanceDiff > 0 ? 'SeedReam v4' : 'Nano Banana';
        const worseModel = performanceDiff > 0 ? 'Nano Banana' : 'SeedReam v4';

        alerts.push({
          id: `model_performance_gap_${Date.now()}`,
          type: 'insight',
          category: 'model_performance',
          title: `Significant Model Performance Gap Detected`,
          message: `${betterModel} is outperforming ${worseModel} by ${Math.abs(performanceDiff).toFixed(1)} points.`,
          recommendation: `Consider using ${betterModel} as the primary model for future generations.`,
          actionRequired: false,
          priority: 3,
          timestamp: new Date(),
          dataSource: ['model_analytics'],
          relatedMetrics: {
            'seedream_rating': seedreamPerf.averageRating,
            'nano_rating': nanoBananaPerf.averageRating,
            'performance_gap': Math.abs(performanceDiff)
          },
          actionableSteps: [
            `Set ${betterModel} as default model`,
            'Update model recommendation algorithm',
            `Analyze why ${betterModel} performs better`,
            'Consider retiring underperforming model variants'
          ],
          estimatedImpact: 'medium'
        });
      }
    }

    // Check generation success rate
    if (performanceInsights.failedGenerations > 0) {
      const failureRate = performanceInsights.failedGenerations / (performanceInsights.successfulGenerations + performanceInsights.failedGenerations);

      if (failureRate > 0.1) { // More than 10% failure rate
        alerts.push({
          id: `high_failure_rate_${Date.now()}`,
          type: 'warning',
          category: 'performance',
          title: 'High Generation Failure Rate',
          message: `${Math.round(failureRate * 100)}% of image generations are failing.`,
          recommendation: 'Investigate API stability, prompt complexity, or asset quality issues.',
          actionRequired: true,
          priority: 4,
          timestamp: new Date(),
          dataSource: ['generation_timings'],
          relatedMetrics: {
            'failure_rate': failureRate * 100,
            'failed_count': performanceInsights.failedGenerations,
            'success_count': performanceInsights.successfulGenerations
          },
          actionableSteps: [
            'Check API service status and limits',
            'Review prompt complexity and length',
            'Validate brand asset URLs and formats',
            'Implement retry logic for failed generations'
          ],
          estimatedImpact: 'high'
        });
      }
    }

    return alerts;
  }

  // Analyze optimization opportunities
  private static analyzeOptimizationOpportunities(): IntelligentAlert[] {
    const alerts: IntelligentAlert[] = [];
    const weights = PromptOptimizationService.calculateDynamicWeights();
    const optimizations = PromptOptimizationService.getActiveOptimizations();

    // Check if any weights are extremely high (indicating problems)
    Object.entries(weights).forEach(([key, value]) => {
      if (value > 0.8) {
        const metricName = key.replace(/([A-Z])/g, ' $1').toLowerCase();

        alerts.push({
          id: `high_${key}_weight_${Date.now()}`,
          type: 'warning',
          category: 'optimization',
          title: `High ${metricName} Priority Detected`,
          message: `${metricName} weight is at ${(value * 100).toFixed(0)}%, indicating client dissatisfaction in this area.`,
          recommendation: `Focus immediate optimization efforts on improving ${metricName} performance.`,
          actionRequired: true,
          priority: 4,
          timestamp: new Date(),
          dataSource: ['optimization_weights'],
          relatedMetrics: { [key]: value },
          actionableSteps: [
            `Review recent feedback for ${metricName} complaints`,
            `Increase ${metricName} modifiers in prompts`,
            `Test alternative approaches for ${metricName}`,
            'Monitor improvement over next 5 generations'
          ],
          estimatedImpact: 'medium'
        });
      }
    });

    // Check if we have insufficient optimizations running
    if (optimizations.length < 3) {
      alerts.push({
        id: `low_optimization_count_${Date.now()}`,
        type: 'info',
        category: 'optimization',
        title: 'Limited Active Optimizations',
        message: `Only ${optimizations.length} optimization patterns are currently active.`,
        recommendation: 'Consider enabling more optimization patterns to improve learning speed.',
        actionRequired: false,
        priority: 2,
        timestamp: new Date(),
        dataSource: ['optimization_service'],
        relatedMetrics: { 'active_optimizations': optimizations.length },
        actionableSteps: [
          'Enable additional optimization patterns',
          'Lower confidence thresholds for pattern activation',
          'Generate more test variations',
          'Increase feedback collection efforts'
        ],
        estimatedImpact: 'low'
      });
    }

    return alerts;
  }

  // Analyze A/B testing results
  private static analyzeABTestingResults(): IntelligentAlert[] {
    const alerts: IntelligentAlert[] = [];
    const activeTests = ABTestingService.getActiveTests();
    const testAnalytics = ABTestingService.getTestAnalytics();

    // Check for completed tests with significant results
    const allTests = ABTestingService.getAllTests();
    const recentCompletedTests = allTests.filter(t =>
      t.status === 'completed' &&
      t.results?.statisticalSignificance &&
      new Date(t.endDate!).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) // Last 7 days
    );

    recentCompletedTests.forEach(test => {
      if (test.results) {
        alerts.push({
          id: `ab_test_complete_${test.id}`,
          type: 'success',
          category: 'testing',
          title: `A/B Test "${test.name}" Completed Successfully`,
          message: `Test concluded with ${test.results.improvementPercentage.toFixed(1)}% improvement. Winner: ${test.results.winningVariant}`,
          recommendation: 'Implement the winning variant as the new default approach.',
          actionRequired: true,
          priority: 3,
          timestamp: new Date(test.endDate!),
          dataSource: ['ab_testing'],
          relatedMetrics: {
            'improvement': test.results.improvementPercentage,
            'confidence': test.results.confidenceLevel,
            'sample_size': test.currentSampleSize
          },
          actionableSteps: [
            'Update default prompt templates with winning variant',
            'Document learnings from this test',
            'Plan follow-up tests to build on these insights',
            'Monitor performance after implementation'
          ],
          estimatedImpact: 'medium'
        });
      }
    });

    // Check for stalled tests
    const stalledTests = activeTests.filter(t =>
      t.currentSampleSize < t.targetSampleSize * 0.1 && // Less than 10% complete
      new Date(t.startDate).getTime() < Date.now() - (3 * 24 * 60 * 60 * 1000) // Running for 3+ days
    );

    if (stalledTests.length > 0) {
      alerts.push({
        id: `stalled_tests_${Date.now()}`,
        type: 'warning',
        category: 'testing',
        title: `${stalledTests.length} A/B Test(s) Not Collecting Data`,
        message: 'Some A/B tests have been running for days with minimal data collection.',
        recommendation: 'Review test configuration and increase user traffic to these tests.',
        actionRequired: true,
        priority: 3,
        timestamp: new Date(),
        dataSource: ['ab_testing'],
        relatedMetrics: { 'stalled_count': stalledTests.length },
        actionableSteps: [
          'Check if test variants are being properly assigned',
          'Increase traffic allocation to these tests',
          'Verify test tracking is working correctly',
          'Consider pausing ineffective tests'
        ],
        estimatedImpact: 'low'
      });
    }

    return alerts;
  }

  // Analyze evolution patterns
  private static analyzeEvolutionPatterns(): IntelligentAlert[] {
    const alerts: IntelligentAlert[] = [];
    const evolutionMetrics = PromptEvolutionService.getEvolutionMetrics();
    const patterns = PromptEvolutionService.getAllPatterns();

    // Check evolution progress
    if (evolutionMetrics.convergenceStatus === 'stable' && evolutionMetrics.avgSuccessRate < 0.7) {
      alerts.push({
        id: `evolution_stagnation_${Date.now()}`,
        type: 'warning',
        category: 'evolution',
        title: 'Evolution Process Has Stagnated',
        message: `Pattern evolution has stabilized at ${(evolutionMetrics.avgSuccessRate * 100).toFixed(0)}% success rate.`,
        recommendation: 'Introduce new mutation strategies or increase diversity to break out of local optimum.',
        actionRequired: true,
        priority: 3,
        timestamp: new Date(),
        dataSource: ['evolution_service'],
        relatedMetrics: {
          'success_rate': evolutionMetrics.avgSuccessRate,
          'active_patterns': evolutionMetrics.activePatterns
        },
        actionableSteps: [
          'Introduce new baseline patterns',
          'Increase mutation rate temporarily',
          'Force crossover between distant patterns',
          'Reset some underperforming patterns'
        ],
        estimatedImpact: 'medium'
      });
    }

    // Check for highly successful patterns
    const topPatterns = patterns.filter(p => p.usage > 10 && p.successRate > 0.85);
    if (topPatterns.length > 0) {
      alerts.push({
        id: `successful_patterns_${Date.now()}`,
        type: 'insight',
        category: 'evolution',
        title: `${topPatterns.length} High-Performance Pattern(s) Discovered`,
        message: `Found patterns with 85%+ success rates and significant usage.`,
        recommendation: 'Increase usage of these patterns and use them as seeds for new mutations.',
        actionRequired: false,
        priority: 2,
        timestamp: new Date(),
        dataSource: ['evolution_service'],
        relatedMetrics: {
          'top_patterns': topPatterns.length,
          'avg_success': topPatterns.reduce((sum, p) => sum + p.successRate, 0) / topPatterns.length
        },
        actionableSteps: [
          'Increase weight of successful patterns',
          'Create mutations based on these patterns',
          'Document what makes these patterns successful',
          'Share insights with prompt optimization service'
        ],
        estimatedImpact: 'medium'
      });
    }

    return alerts;
  }

  // Analyze user behavior patterns
  private static analyzeUserBehavior(): IntelligentAlert[] {
    const alerts: IntelligentAlert[] = [];
    const clientInsights = RealAnalyticsService.getClientInsights();

    // Check retention rate
    if (clientInsights.retentionRate < 80) {
      alerts.push({
        id: `low_retention_${Date.now()}`,
        type: 'critical',
        category: 'user_behavior',
        title: 'Low Client Retention Rate',
        message: `Client retention rate is at ${clientInsights.retentionRate.toFixed(1)}%, below the healthy threshold of 80%.`,
        recommendation: 'Investigate user experience issues and improve onboarding or satisfaction.',
        actionRequired: true,
        priority: 5,
        timestamp: new Date(),
        dataSource: ['client_analytics'],
        relatedMetrics: { 'retention_rate': clientInsights.retentionRate },
        actionableSteps: [
          'Survey clients about pain points',
          'Improve first-time user experience',
          'Implement better onboarding flow',
          'Increase prompt quality consistency'
        ],
        estimatedImpact: 'high'
      });
    }

    // Check for common request patterns
    if (clientInsights.topRequests.length > 0) {
      const topRequest = clientInsights.topRequests[0];
      alerts.push({
        id: `top_request_insight_${Date.now()}`,
        type: 'insight',
        category: 'user_behavior',
        title: `Top Client Request: ${topRequest}`,
        message: `"${topRequest}" is the most common improvement request from clients.`,
        recommendation: 'Prioritize optimization efforts in this area to meet client needs.',
        actionRequired: false,
        priority: 2,
        timestamp: new Date(),
        dataSource: ['client_analytics'],
        relatedMetrics: { 'top_request_frequency': 1 },
        actionableSteps: [
          `Focus next optimization cycle on ${topRequest.toLowerCase()}`,
          'Create specific A/B tests for this area',
          'Gather more detailed feedback about client needs',
          'Update prompt templates to address this request'
        ],
        estimatedImpact: 'medium'
      });
    }

    return alerts;
  }

  // Store alerts
  private static storeAlerts(alerts: IntelligentAlert[]): void {
    localStorage.setItem(this.ALERTS_KEY, JSON.stringify(alerts));

    // Also maintain alert history
    const history = this.getAlertHistory();
    history.push(...alerts.map(alert => ({
      ...alert,
      generated_at: new Date().toISOString()
    })));

    // Keep only last 100 alerts in history
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }

    localStorage.setItem(this.ALERT_HISTORY_KEY, JSON.stringify(history));
  }

  // Get stored alerts
  static getAlerts(): IntelligentAlert[] {
    const stored = localStorage.getItem(this.ALERTS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Get alert history
  static getAlertHistory(): any[] {
    const stored = localStorage.getItem(this.ALERT_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Dismiss an alert
  static dismissAlert(alertId: string): void {
    const alerts = this.getAlerts().filter(alert => alert.id !== alertId);
    localStorage.setItem(this.ALERTS_KEY, JSON.stringify(alerts));
  }

  // Clear all alerts
  static clearAlerts(): void {
    localStorage.removeItem(this.ALERTS_KEY);
  }
}
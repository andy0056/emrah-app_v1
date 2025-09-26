/**
 * End-to-End Quality Assurance - Phase 4
 * Comprehensive validation system for the entire prompt generation pipeline
 */

import type { FormData } from '../../types';
import type { CapturedViews } from '../../hooks/useSceneCapture';
import type { OrchestrationResult } from './masterPromptOrchestrator';
import { validateFormRequirementsInPrompt } from './formPriorityPromptUtils';

export interface E2EQualityReport {
  overallScore: number; // 0-100
  passedTests: string[];
  failedTests: string[];
  warnings: string[];
  criticalIssues: string[];
  recommendations: string[];
  detailedMetrics: {
    formDataIntegrity: number;
    visualContextAccuracy: number;
    promptOptimization: number;
    compressionEfficiency: number;
    hierarchyCompliance: number;
  };
}

export interface QualityTestSuite {
  formDataTests: boolean[];
  visualContextTests: boolean[];
  hierarchyTests: boolean[];
  compressionTests: boolean[];
  integrationTests: boolean[];
}

export class EndToEndQualityAssurance {
  /**
   * Run comprehensive quality assurance on the entire pipeline
   */
  static runComprehensiveQA(
    originalFormData: FormData,
    capturedViews: CapturedViews | null,
    orchestrationResult: OrchestrationResult,
    finalPrompt: string
  ): E2EQualityReport {
    console.log('🔍 Running End-to-End Quality Assurance...');

    const testSuite = this.runTestSuite(originalFormData, capturedViews, orchestrationResult, finalPrompt);
    const metrics = this.calculateDetailedMetrics(testSuite, orchestrationResult);
    const analysis = this.analyzeResults(testSuite, metrics);

    const overallScore = this.calculateOverallScore(metrics);

    console.log(`🔍 E2E Quality Score: ${overallScore}/100`, {
      formDataIntegrity: `${metrics.formDataIntegrity}/100`,
      visualContextAccuracy: `${metrics.visualContextAccuracy}/100`,
      hierarchyCompliance: `${metrics.hierarchyCompliance}/100`
    });

    return {
      overallScore,
      passedTests: analysis.passed,
      failedTests: analysis.failed,
      warnings: analysis.warnings,
      criticalIssues: analysis.critical,
      recommendations: this.generateRecommendations(testSuite, metrics),
      detailedMetrics: metrics
    };
  }

  /**
   * Run comprehensive test suite
   */
  private static runTestSuite(
    formData: FormData,
    capturedViews: CapturedViews | null,
    orchestrationResult: OrchestrationResult,
    finalPrompt: string
  ): QualityTestSuite {
    return {
      formDataTests: this.runFormDataTests(formData, finalPrompt),
      visualContextTests: this.runVisualContextTests(capturedViews, finalPrompt),
      hierarchyTests: this.runHierarchyTests(orchestrationResult),
      compressionTests: this.runCompressionTests(orchestrationResult, finalPrompt),
      integrationTests: this.runIntegrationTests(formData, orchestrationResult, finalPrompt)
    };
  }

  /**
   * Test form data integrity
   */
  private static runFormDataTests(formData: FormData, finalPrompt: string): boolean[] {
    const tests: boolean[] = [];

    // Test 1: Critical numerical values preserved
    if (formData.frontFaceCount) {
      tests.push(finalPrompt.includes(formData.frontFaceCount.toString()));
    }

    // Test 2: Back-to-back count preserved
    if (formData.backToBackCount) {
      tests.push(finalPrompt.includes(formData.backToBackCount.toString()));
    }

    // Test 3: Shelf count preserved
    if (formData.shelfCount) {
      tests.push(finalPrompt.includes(formData.shelfCount.toString()));
    }

    // Test 4: Brand name preserved
    if (formData.brand) {
      tests.push(finalPrompt.toLowerCase().includes(formData.brand.toLowerCase()));
    }

    // Test 5: Product name preserved
    if (formData.product) {
      tests.push(finalPrompt.toLowerCase().includes(formData.product.toLowerCase()));
    }

    // Test 6: Critical keywords present
    const criticalKeywords = ['EXACTLY', 'NON-NEGOTIABLE', 'CRITICAL'];
    tests.push(criticalKeywords.some(keyword => finalPrompt.includes(keyword)));

    // Test 7: Form validation passes
    const validation = validateFormRequirementsInPrompt(finalPrompt, formData);
    tests.push(validation.isValid);

    return tests;
  }

  /**
   * Test visual context integration
   */
  private static runVisualContextTests(capturedViews: CapturedViews | null, finalPrompt: string): boolean[] {
    const tests: boolean[] = [];

    if (capturedViews) {
      // Test 1: Scale reference mentioned
      tests.push(finalPrompt.includes('scale') || finalPrompt.includes('reference'));

      // Test 2: 3D context acknowledged
      tests.push(finalPrompt.includes('3D') || finalPrompt.includes('visual'));

      // Test 3: Proportional relationships mentioned
      tests.push(finalPrompt.includes('proportion') || finalPrompt.includes('relationship'));

      // Test 4: Human scale baseline mentioned
      tests.push(finalPrompt.includes('175cm') || finalPrompt.includes('human'));
    } else {
      // No visual context available - pass by default
      tests.push(true, true, true, true);
    }

    return tests;
  }

  /**
   * Test hierarchy compliance
   */
  private static runHierarchyTests(orchestrationResult: OrchestrationResult): boolean[] {
    const tests: boolean[] = [];

    // Test 1: High integrity score
    tests.push(orchestrationResult.integrityScore >= 80);

    // Test 2: Form data tier preserved
    tests.push(orchestrationResult.hierarchyReport.tier1_FormData.conflicts.length === 0);

    // Test 3: Conflicts properly resolved
    const unresolvedConflicts = orchestrationResult.conflictResolutions.filter(
      c => c.resolution === 'escalation-needed'
    );
    tests.push(unresolvedConflicts.length === 0);

    // Test 4: Protected content survived compression
    tests.push(orchestrationResult.hierarchyReport.tier4_Compression.protectedContentPreserved);

    return tests;
  }

  /**
   * Test compression effectiveness
   */
  private static runCompressionTests(orchestrationResult: OrchestrationResult, finalPrompt: string): boolean[] {
    const tests: boolean[] = [];

    // Test 1: Within length limits
    tests.push(finalPrompt.length <= 4800);

    // Test 2: Reasonable compression ratio
    const compressionRatio = orchestrationResult.hierarchyReport.tier4_Compression.compressionRatio;
    tests.push(compressionRatio >= 0.6 && compressionRatio <= 1.0); // 60-100% of original

    // Test 3: Protected content preserved
    tests.push(orchestrationResult.hierarchyReport.tier4_Compression.protectedContentPreserved);

    // Test 4: Not over-compressed
    tests.push(finalPrompt.length >= 1000); // Minimum viable length

    return tests;
  }

  /**
   * Test system integration
   */
  private static runIntegrationTests(
    formData: FormData,
    orchestrationResult: OrchestrationResult,
    finalPrompt: string
  ): boolean[] {
    const tests: boolean[] = [];

    // Test 1: All phases completed successfully
    tests.push(orchestrationResult.integrityScore > 0);

    // Test 2: No critical system failures
    tests.push(orchestrationResult.conflictResolutions.every(c => c.resolution !== 'escalation-needed'));

    // Test 3: Prompt is coherent (not fragmented)
    const sentences = finalPrompt.split('.').length;
    const words = finalPrompt.split(' ').length;
    tests.push(words / sentences > 5 && words / sentences < 50); // Reasonable sentence length

    // Test 4: Brand integration successful
    if (formData.brand) {
      tests.push(finalPrompt.toLowerCase().includes('brand'));
    } else {
      tests.push(true);
    }

    return tests;
  }

  /**
   * Calculate detailed metrics
   */
  private static calculateDetailedMetrics(
    testSuite: QualityTestSuite,
    orchestrationResult: OrchestrationResult
  ): E2EQualityReport['detailedMetrics'] {
    const calculatePercentage = (tests: boolean[]) =>
      tests.length > 0 ? (tests.filter(Boolean).length / tests.length) * 100 : 100;

    return {
      formDataIntegrity: calculatePercentage(testSuite.formDataTests),
      visualContextAccuracy: calculatePercentage(testSuite.visualContextTests),
      promptOptimization: orchestrationResult.qualityMetrics?.contentDensity * 100 || 0,
      compressionEfficiency: calculatePercentage(testSuite.compressionTests),
      hierarchyCompliance: calculatePercentage(testSuite.hierarchyTests)
    };
  }

  /**
   * Analyze test results
   */
  private static analyzeResults(
    testSuite: QualityTestSuite,
    metrics: E2EQualityReport['detailedMetrics']
  ) {
    const passed: string[] = [];
    const failed: string[] = [];
    const warnings: string[] = [];
    const critical: string[] = [];

    // Form data analysis
    if (metrics.formDataIntegrity >= 90) {
      passed.push('Form data integrity excellent');
    } else if (metrics.formDataIntegrity >= 70) {
      warnings.push('Form data integrity good but could be improved');
    } else {
      critical.push('Form data integrity compromised');
    }

    // Visual context analysis
    if (metrics.visualContextAccuracy >= 80) {
      passed.push('Visual context integration successful');
    } else if (metrics.visualContextAccuracy >= 50) {
      warnings.push('Visual context integration partial');
    } else {
      failed.push('Visual context integration failed');
    }

    // Hierarchy compliance analysis
    if (metrics.hierarchyCompliance >= 90) {
      passed.push('Source-of-truth hierarchy perfectly maintained');
    } else if (metrics.hierarchyCompliance >= 70) {
      warnings.push('Source-of-truth hierarchy mostly maintained');
    } else {
      critical.push('Source-of-truth hierarchy violated');
    }

    // Compression analysis
    if (metrics.compressionEfficiency >= 80) {
      passed.push('Compression optimally balanced');
    } else {
      warnings.push('Compression could be optimized further');
    }

    return { passed, failed, warnings, critical };
  }

  /**
   * Calculate overall quality score
   */
  private static calculateOverallScore(metrics: E2EQualityReport['detailedMetrics']): number {
    // Weighted scoring - form data integrity is most important
    const weights = {
      formDataIntegrity: 0.4,      // 40% - most critical
      hierarchyCompliance: 0.25,   // 25% - very important
      visualContextAccuracy: 0.15, // 15% - important
      compressionEfficiency: 0.1,  // 10% - moderate
      promptOptimization: 0.1      // 10% - moderate
    };

    return Math.round(
      metrics.formDataIntegrity * weights.formDataIntegrity +
      metrics.hierarchyCompliance * weights.hierarchyCompliance +
      metrics.visualContextAccuracy * weights.visualContextAccuracy +
      metrics.compressionEfficiency * weights.compressionEfficiency +
      metrics.promptOptimization * weights.promptOptimization
    );
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(
    testSuite: QualityTestSuite,
    metrics: E2EQualityReport['detailedMetrics']
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.formDataIntegrity < 90) {
      recommendations.push('Strengthen form data preservation mechanisms');
    }

    if (metrics.hierarchyCompliance < 85) {
      recommendations.push('Review source-of-truth hierarchy implementation');
    }

    if (metrics.compressionEfficiency < 75) {
      recommendations.push('Optimize compression algorithm to better preserve critical content');
    }

    if (metrics.visualContextAccuracy < 70) {
      recommendations.push('Improve 3D visual context integration');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performing optimally - maintain current standards');
    }

    return recommendations;
  }

  /**
   * Generate quality assurance report for monitoring
   */
  static generateQAReport(report: E2EQualityReport): string {
    return `
🔍 END-TO-END QUALITY ASSURANCE REPORT
=====================================

OVERALL SCORE: ${report.overallScore}/100 ${report.overallScore >= 90 ? '🟢 EXCELLENT' : report.overallScore >= 70 ? '🟡 GOOD' : '🔴 NEEDS IMPROVEMENT'}

DETAILED METRICS:
✅ Form Data Integrity: ${report.detailedMetrics.formDataIntegrity.toFixed(1)}%
✅ Hierarchy Compliance: ${report.detailedMetrics.hierarchyCompliance.toFixed(1)}%
✅ Visual Context Accuracy: ${report.detailedMetrics.visualContextAccuracy.toFixed(1)}%
✅ Compression Efficiency: ${report.detailedMetrics.compressionEfficiency.toFixed(1)}%
✅ Prompt Optimization: ${report.detailedMetrics.promptOptimization.toFixed(1)}%

TESTS PASSED: ${report.passedTests.length}
${report.passedTests.map(test => `✅ ${test}`).join('\n')}

${report.failedTests.length > 0 ? `
TESTS FAILED: ${report.failedTests.length}
${report.failedTests.map(test => `❌ ${test}`).join('\n')}
` : ''}

${report.warnings.length > 0 ? `
WARNINGS: ${report.warnings.length}
${report.warnings.map(warning => `⚠️ ${warning}`).join('\n')}
` : ''}

${report.criticalIssues.length > 0 ? `
CRITICAL ISSUES: ${report.criticalIssues.length}
${report.criticalIssues.map(issue => `🚨 ${issue}`).join('\n')}
` : ''}

RECOMMENDATIONS:
${report.recommendations.map(rec => `💡 ${rec}`).join('\n')}
`;
  }
}
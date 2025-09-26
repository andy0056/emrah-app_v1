/**
 * End-to-End Quality Assurance Tests
 */

import { EndToEndQualityAssurance } from '../endToEndQualityAssurance';

const mockFormData = {
  brand: 'Test Brand',
  product: 'Test Product',
  frontFaceCount: 1,
  backToBackCount: 12,
  shelfCount: 1,
  standWidth: 100,
  standHeight: 200,
  standDepth: 50
};

const mockCapturedViews = {
  front: 'mock-front-view',
  side: 'mock-side-view',
  top: 'mock-top-view'
};

const mockOrchestrationResult = {
  finalPrompt: 'Test prompt with exact specifications: 1 front face, 12 back-to-back products, 1 shelf',
  hierarchyReport: {
    tier1_FormData: {
      preserved: ['frontFaceCount', 'backToBackCount', 'shelfCount'],
      modified: [],
      conflicts: []
    },
    tier2_3DVisual: {
      integrated: true,
      scaleAccuracy: 0.95,
      referenceImages: 2
    },
    tier3_AIEnhancements: {
      applied: ['intelligent-compression'],
      overridden: []
    },
    tier4_Compression: {
      compressionRatio: 0.8,
      protectedContentPreserved: true,
      sectionsRemoved: 2
    }
  },
  qualityMetrics: {
    contentDensity: 0.9,
    redundancyScore: 0.3,
    formSpecificityScore: 0.8,
    creativeContentRatio: 0.2,
    overallQuality: 'high'
  },
  compressionReport: 'Mock compression report',
  conflictResolutions: [],
  integrityScore: 95
};

describe('EndToEndQualityAssurance', () => {
  describe('runComprehensiveQA', () => {
    it('should generate high-quality report for perfect implementation', () => {
      const report = EndToEndQualityAssurance.runComprehensiveQA(
        mockFormData,
        mockCapturedViews,
        mockOrchestrationResult,
        mockOrchestrationResult.finalPrompt
      );

      expect(report.overallScore).toBeGreaterThan(85);
      expect(report.detailedMetrics.formDataIntegrity).toBeGreaterThan(90);
      expect(report.detailedMetrics.hierarchyCompliance).toBeGreaterThan(90);
      expect(report.passedTests).toContain('Form data integrity excellent');
      expect(report.criticalIssues).toHaveLength(0);
    });

    it('should detect form data integrity issues', () => {
      const corruptedPrompt = 'Generic prompt without specific values';

      const report = EndToEndQualityAssurance.runComprehensiveQA(
        mockFormData,
        mockCapturedViews,
        mockOrchestrationResult,
        corruptedPrompt
      );

      expect(report.overallScore).toBeLessThan(70);
      expect(report.detailedMetrics.formDataIntegrity).toBeLessThan(50);
      expect(report.criticalIssues).toContain('Form data integrity compromised');
    });

    it('should validate visual context integration', () => {
      const report = EndToEndQualityAssurance.runComprehensiveQA(
        mockFormData,
        mockCapturedViews,
        mockOrchestrationResult,
        mockOrchestrationResult.finalPrompt
      );

      expect(report.detailedMetrics.visualContextAccuracy).toBeGreaterThan(75);
      expect(report.passedTests).toContain('Visual context integration successful');
    });

    it('should handle missing visual context gracefully', () => {
      const report = EndToEndQualityAssurance.runComprehensiveQA(
        mockFormData,
        null, // No captured views
        mockOrchestrationResult,
        mockOrchestrationResult.finalPrompt
      );

      // Should not penalize for missing optional visual context
      expect(report.detailedMetrics.visualContextAccuracy).toBe(100);
      expect(report.overallScore).toBeGreaterThan(80);
    });

    it('should validate compression efficiency', () => {
      const report = EndToEndQualityAssurance.runComprehensiveQA(
        mockFormData,
        mockCapturedViews,
        mockOrchestrationResult,
        mockOrchestrationResult.finalPrompt
      );

      expect(report.detailedMetrics.compressionEfficiency).toBeGreaterThan(75);
      expect(report.passedTests).toContain('Compression optimally balanced');
    });

    it('should generate actionable recommendations', () => {
      // Create a scenario with room for improvement
      const imperfectResult = {
        ...mockOrchestrationResult,
        integrityScore: 70,
        hierarchyReport: {
          ...mockOrchestrationResult.hierarchyReport,
          tier4_Compression: {
            ...mockOrchestrationResult.hierarchyReport.tier4_Compression,
            compressionRatio: 0.5, // Poor compression
            protectedContentPreserved: false
          }
        }
      };

      const report = EndToEndQualityAssurance.runComprehensiveQA(
        mockFormData,
        mockCapturedViews,
        imperfectResult,
        mockOrchestrationResult.finalPrompt
      );

      expect(report.recommendations).toContain('Optimize compression algorithm to better preserve critical content');
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should properly weight form data integrity', () => {
      // Test that form data integrity has the highest weight (40%)
      const reportWithGoodForm = EndToEndQualityAssurance.runComprehensiveQA(
        mockFormData,
        mockCapturedViews,
        {
          ...mockOrchestrationResult,
          hierarchyReport: {
            ...mockOrchestrationResult.hierarchyReport,
            tier1_FormData: {
              preserved: ['all'],
              modified: [],
              conflicts: []
            }
          }
        },
        'Perfect prompt with 1 front face, 12 back-to-back, 1 shelf'
      );

      const reportWithBadForm = EndToEndQualityAssurance.runComprehensiveQA(
        mockFormData,
        mockCapturedViews,
        {
          ...mockOrchestrationResult,
          hierarchyReport: {
            ...mockOrchestrationResult.hierarchyReport,
            tier1_FormData: {
              preserved: [],
              modified: [],
              conflicts: ['frontFaceCount', 'backToBackCount']
            }
          }
        },
        'Generic prompt without specific values'
      );

      expect(reportWithGoodForm.overallScore - reportWithBadForm.overallScore).toBeGreaterThan(30);
    });
  });

  describe('generateQAReport', () => {
    it('should generate comprehensive readable report', () => {
      const qaResult = EndToEndQualityAssurance.runComprehensiveQA(
        mockFormData,
        mockCapturedViews,
        mockOrchestrationResult,
        mockOrchestrationResult.finalPrompt
      );

      const report = EndToEndQualityAssurance.generateQAReport(qaResult);

      expect(report).toContain('END-TO-END QUALITY ASSURANCE REPORT');
      expect(report).toContain(`OVERALL SCORE: ${qaResult.overallScore}/100`);
      expect(report).toContain('DETAILED METRICS:');
      expect(report).toContain('Form Data Integrity:');
      expect(report).toContain('RECOMMENDATIONS:');
    });

    it('should include appropriate status indicators', () => {
      const excellentResult = {
        ...mockOrchestrationResult,
        overallScore: 95,
        passedTests: ['Form data integrity excellent'],
        failedTests: [],
        warnings: [],
        criticalIssues: [],
        recommendations: ['System performing optimally'],
        detailedMetrics: {
          formDataIntegrity: 100,
          hierarchyCompliance: 95,
          visualContextAccuracy: 90,
          compressionEfficiency: 85,
          promptOptimization: 88
        }
      };

      const report = EndToEndQualityAssurance.generateQAReport(excellentResult);

      expect(report).toContain('🟢 EXCELLENT');
      expect(report).toContain('NO CONFLICTS DETECTED ✅');
    });
  });
});
import { FormData } from '../types';

export interface QualityCheck {
  id: string;
  category: 'manufacturing' | 'design' | 'compliance' | 'brand' | 'safety';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation: string;
  autoFixable: boolean;
  confidence: number;
  estimatedImpact: {
    cost: number;
    timeline: string;
    quality: 'positive' | 'negative' | 'neutral';
  };
}

export interface QualityReport {
  overallScore: number;
  criticalIssues: number;
  checks: QualityCheck[];
  manufacturabilityScore: number;
  brandAlignmentScore: number;
  complianceScore: number;
  summary: string;
  recommendations: string[];
  generatedAt: Date;
}

export class QualityAssuranceService {
  private static readonly MANUFACTURING_STANDARDS = {
    minThickness: { steel: 1.5, aluminum: 2.0, acrylic: 3.0 },
    maxDimensions: { width: 3000, height: 2000, depth: 500 },
    tolerances: { cutting: 0.5, drilling: 0.1, welding: 1.0 },
    finishes: ['powder_coating', 'anodizing', 'painting', 'printing']
  };

  private static readonly BRAND_GUIDELINES = {
    empati: {
      colors: ['#4E5AC3', '#FFFFFF', '#F8F9FA', '#2C2C2C'],
      fonts: ['modern', 'clean', 'professional'],
      principles: ['minimalist', 'grid-based', 'high-contrast'],
      forbidden: ['gradient-heavy', 'decorative-fonts', 'busy-patterns']
    }
  };

  static async performQualityInspection(
    formData: FormData,
    generatedImages: string[] = [],
    designChanges: any[] = []
  ): Promise<QualityReport> {
    const checks: QualityCheck[] = [];

    // Manufacturing feasibility checks
    checks.push(...await this.checkManufacturingFeasibility(formData));

    // Design quality checks
    checks.push(...await this.checkDesignQuality(formData, generatedImages));

    // Brand alignment checks
    checks.push(...await this.checkBrandAlignment(formData));

    // Compliance checks
    checks.push(...await this.checkCompliance(formData));

    // Safety checks
    checks.push(...await this.checkSafety(formData));

    // Calculate scores
    const overallScore = this.calculateOverallScore(checks);
    const manufacturabilityScore = this.calculateCategoryScore(checks, 'manufacturing');
    const brandAlignmentScore = this.calculateCategoryScore(checks, 'brand');
    const complianceScore = this.calculateCategoryScore(checks, 'compliance');

    const criticalIssues = checks.filter(c => c.severity === 'critical').length;

    return {
      overallScore,
      criticalIssues,
      checks: checks.sort((a, b) => this.getSeverityWeight(a.severity) - this.getSeverityWeight(b.severity)),
      manufacturabilityScore,
      brandAlignmentScore,
      complianceScore,
      summary: this.generateSummary(checks, overallScore),
      recommendations: this.generateRecommendations(checks),
      generatedAt: new Date()
    };
  }

  private static async checkManufacturingFeasibility(formData: FormData): Promise<QualityCheck[]> {
    const checks: QualityCheck[] = [];

    // Material thickness check
    if (formData.material && formData.dimensions) {
      const material = formData.material.toLowerCase();
      const minThickness = this.MANUFACTURING_STANDARDS.minThickness[material as keyof typeof this.MANUFACTURING_STANDARDS.minThickness];

      if (minThickness && formData.thickness && formData.thickness < minThickness) {
        checks.push({
          id: 'thickness-insufficient',
          category: 'manufacturing',
          severity: 'high',
          title: 'Insufficient Material Thickness',
          description: `${formData.thickness}mm thickness is below minimum ${minThickness}mm for ${material}`,
          recommendation: `Increase thickness to at least ${minThickness}mm or consider alternative materials`,
          autoFixable: true,
          confidence: 0.95,
          estimatedImpact: {
            cost: 15,
            timeline: '1-2 days',
            quality: 'positive'
          }
        });
      }
    }

    // Dimension feasibility
    if (formData.dimensions) {
      const { width, height, depth } = formData.dimensions;
      const maxDim = this.MANUFACTURING_STANDARDS.maxDimensions;

      if (width > maxDim.width || height > maxDim.height || (depth && depth > maxDim.depth)) {
        checks.push({
          id: 'dimensions-excessive',
          category: 'manufacturing',
          severity: 'critical',
          title: 'Dimensions Exceed Manufacturing Limits',
          description: `Dimensions ${width}×${height}×${depth || 'N/A'}mm exceed standard manufacturing capabilities`,
          recommendation: 'Consider modular design or alternative manufacturing approach',
          autoFixable: false,
          confidence: 0.98,
          estimatedImpact: {
            cost: 40,
            timeline: '1-2 weeks',
            quality: 'negative'
          }
        });
      }
    }

    // Complexity analysis
    const complexity = this.analyzeDesignComplexity(formData);
    if (complexity.score > 0.8) {
      checks.push({
        id: 'complexity-high',
        category: 'manufacturing',
        severity: 'medium',
        title: 'High Manufacturing Complexity',
        description: `Design complexity score: ${(complexity.score * 100).toFixed(0)}%`,
        recommendation: 'Simplify design elements or expect increased production time and costs',
        autoFixable: false,
        confidence: 0.75,
        estimatedImpact: {
          cost: 25,
          timeline: '3-5 days',
          quality: 'neutral'
        }
      });
    }

    return checks;
  }

  private static async checkDesignQuality(formData: FormData, images: string[]): Promise<QualityCheck[]> {
    const checks: QualityCheck[] = [];

    // Resolution and quality checks for images
    for (let i = 0; i < images.length; i++) {
      // Simulate image quality analysis
      const qualityScore = Math.random() * 0.4 + 0.6; // 0.6-1.0 range

      if (qualityScore < 0.7) {
        checks.push({
          id: `image-quality-${i}`,
          category: 'design',
          severity: 'medium',
          title: 'Low Image Quality Detected',
          description: `Generated image ${i + 1} has quality score of ${(qualityScore * 100).toFixed(0)}%`,
          recommendation: 'Regenerate with higher quality settings or manual refinement',
          autoFixable: true,
          confidence: 0.85,
          estimatedImpact: {
            cost: 5,
            timeline: '30 minutes',
            quality: 'positive'
          }
        });
      }
    }

    // Typography and readability
    if (formData.text && formData.text.length > 0) {
      const readabilityIssues = this.checkTextReadability(formData.text);
      if (readabilityIssues.length > 0) {
        checks.push({
          id: 'text-readability',
          category: 'design',
          severity: 'medium',
          title: 'Text Readability Issues',
          description: `Found ${readabilityIssues.length} readability concerns`,
          recommendation: 'Adjust font size, contrast, or text placement for better readability',
          autoFixable: true,
          confidence: 0.80,
          estimatedImpact: {
            cost: 10,
            timeline: '1-2 hours',
            quality: 'positive'
          }
        });
      }
    }

    // Color contrast and accessibility
    if (formData.colors && formData.colors.length >= 2) {
      const contrastRatio = this.calculateColorContrast(formData.colors[0], formData.colors[1]);
      if (contrastRatio < 4.5) {
        checks.push({
          id: 'color-contrast-low',
          category: 'design',
          severity: 'high',
          title: 'Insufficient Color Contrast',
          description: `Contrast ratio ${contrastRatio.toFixed(1)}:1 is below WCAG standards (4.5:1)`,
          recommendation: 'Adjust colors to improve contrast for better accessibility',
          autoFixable: true,
          confidence: 0.92,
          estimatedImpact: {
            cost: 5,
            timeline: '30 minutes',
            quality: 'positive'
          }
        });
      }
    }

    return checks;
  }

  private static async checkBrandAlignment(formData: FormData): Promise<QualityCheck[]> {
    const checks: QualityCheck[] = [];
    const brandGuidelines = this.BRAND_GUIDELINES.empati;

    // Color alignment check
    if (formData.colors) {
      const alignedColors = formData.colors.filter(color =>
        brandGuidelines.colors.some(brandColor =>
          this.colorSimilarity(color, brandColor) > 0.8
        )
      );

      if (alignedColors.length / formData.colors.length < 0.5) {
        checks.push({
          id: 'brand-color-misalignment',
          category: 'brand',
          severity: 'medium',
          title: 'Colors Not Aligned with Brand Guidelines',
          description: `Only ${alignedColors.length}/${formData.colors.length} colors match brand palette`,
          recommendation: 'Adjust color scheme to better align with Empati brand guidelines',
          autoFixable: true,
          confidence: 0.88,
          estimatedImpact: {
            cost: 8,
            timeline: '1 hour',
            quality: 'positive'
          }
        });
      }
    }

    // Design principle alignment
    const designPrincipleScore = this.evaluateDesignPrinciples(formData, brandGuidelines.principles);
    if (designPrincipleScore < 0.7) {
      checks.push({
        id: 'design-principle-misalignment',
        category: 'brand',
        severity: 'medium',
        title: 'Design Principles Misalignment',
        description: `Design principle alignment score: ${(designPrincipleScore * 100).toFixed(0)}%`,
        recommendation: 'Incorporate more minimalist and grid-based design elements',
        autoFixable: true,
        confidence: 0.75,
        estimatedImpact: {
          cost: 15,
          timeline: '2-3 hours',
          quality: 'positive'
        }
      });
    }

    return checks;
  }

  private static async checkCompliance(formData: FormData): Promise<QualityCheck[]> {
    const checks: QualityCheck[] = [];

    // Safety compliance for display materials
    if (formData.material) {
      const material = formData.material.toLowerCase();
      if (['acrylic', 'plastic'].includes(material) && formData.useCase?.includes('indoor')) {
        // Check for fire safety compliance
        checks.push({
          id: 'fire-safety-check',
          category: 'compliance',
          severity: 'high',
          title: 'Fire Safety Compliance Required',
          description: `${formData.material} displays require fire safety certification for indoor use`,
          recommendation: 'Ensure materials meet local fire safety standards or consider alternatives',
          autoFixable: false,
          confidence: 0.90,
          estimatedImpact: {
            cost: 20,
            timeline: '1 week',
            quality: 'neutral'
          }
        });
      }
    }

    // Accessibility compliance
    if (formData.text && formData.text.length > 0) {
      const accessibilityScore = this.checkAccessibilityCompliance(formData);
      if (accessibilityScore < 0.8) {
        checks.push({
          id: 'accessibility-compliance',
          category: 'compliance',
          severity: 'medium',
          title: 'Accessibility Standards Not Met',
          description: `Accessibility compliance score: ${(accessibilityScore * 100).toFixed(0)}%`,
          recommendation: 'Improve text size, contrast, and layout for better accessibility',
          autoFixable: true,
          confidence: 0.85,
          estimatedImpact: {
            cost: 12,
            timeline: '2-4 hours',
            quality: 'positive'
          }
        });
      }
    }

    return checks;
  }

  private static async checkSafety(formData: FormData): Promise<QualityCheck[]> {
    const checks: QualityCheck[] = [];

    // Structural safety
    if (formData.dimensions && formData.material) {
      const stabilityRisk = this.assessStructuralStability(formData);
      if (stabilityRisk > 0.6) {
        checks.push({
          id: 'structural-stability',
          category: 'safety',
          severity: 'high',
          title: 'Structural Stability Concern',
          description: `High stability risk detected (${(stabilityRisk * 100).toFixed(0)}%)`,
          recommendation: 'Add reinforcement or adjust dimensions for better stability',
          autoFixable: true,
          confidence: 0.82,
          estimatedImpact: {
            cost: 18,
            timeline: '1-2 days',
            quality: 'positive'
          }
        });
      }
    }

    // Edge safety for interactive displays
    if (formData.interactive && formData.material) {
      checks.push({
        id: 'edge-safety',
        category: 'safety',
        severity: 'medium',
        title: 'Edge Safety for Interactive Display',
        description: 'Interactive displays require rounded edges for user safety',
        recommendation: 'Apply edge rounding or padding to all user-accessible edges',
        autoFixable: true,
        confidence: 0.95,
        estimatedImpact: {
          cost: 8,
          timeline: '1 day',
          quality: 'positive'
        }
      });
    }

    return checks;
  }

  // Helper methods
  private static analyzeDesignComplexity(formData: FormData): { score: number; factors: string[] } {
    let complexity = 0;
    const factors: string[] = [];

    if (formData.shapes && formData.shapes.length > 3) {
      complexity += 0.2;
      factors.push('Multiple shapes');
    }

    if (formData.colors && formData.colors.length > 4) {
      complexity += 0.15;
      factors.push('Many colors');
    }

    if (formData.text && formData.text.length > 50) {
      complexity += 0.1;
      factors.push('Extensive text');
    }

    if (formData.interactive) {
      complexity += 0.25;
      factors.push('Interactive elements');
    }

    if (formData.lighting?.includes('LED')) {
      complexity += 0.2;
      factors.push('LED lighting');
    }

    return { score: Math.min(complexity, 1), factors };
  }

  private static checkTextReadability(text: string): string[] {
    const issues: string[] = [];

    if (text.length > 100) {
      issues.push('Text too long for display format');
    }

    if (!/[A-Z]/.test(text) && text.length > 20) {
      issues.push('Consider title case for better readability');
    }

    const words = text.split(' ');
    const longWords = words.filter(word => word.length > 12);
    if (longWords.length > 2) {
      issues.push('Multiple long words may affect readability');
    }

    return issues;
  }

  private static calculateColorContrast(color1: string, color2: string): number {
    // Simplified contrast calculation
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.replace('#', ''), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };

    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  private static colorSimilarity(color1: string, color2: string): number {
    // Simplified color similarity calculation
    const hex1 = parseInt(color1.replace('#', ''), 16);
    const hex2 = parseInt(color2.replace('#', ''), 16);

    const r1 = (hex1 >> 16) & 0xff;
    const g1 = (hex1 >> 8) & 0xff;
    const b1 = hex1 & 0xff;

    const r2 = (hex2 >> 16) & 0xff;
    const g2 = (hex2 >> 8) & 0xff;
    const b2 = hex2 & 0xff;

    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
    );

    return 1 - (distance / 441.67); // Max distance is sqrt(255^2 * 3)
  }

  private static evaluateDesignPrinciples(formData: FormData, principles: string[]): number {
    let score = 0.5; // Base score

    if (principles.includes('minimalist') && formData.colors && formData.colors.length <= 3) {
      score += 0.2;
    }

    if (principles.includes('grid-based') && formData.layout?.includes('grid')) {
      score += 0.2;
    }

    if (principles.includes('high-contrast') && formData.colors && formData.colors.length >= 2) {
      const contrast = this.calculateColorContrast(formData.colors[0], formData.colors[1]);
      if (contrast > 4.5) score += 0.1;
    }

    return Math.min(score, 1);
  }

  private static checkAccessibilityCompliance(formData: FormData): number {
    let score = 0.6; // Base score

    if (formData.colors && formData.colors.length >= 2) {
      const contrast = this.calculateColorContrast(formData.colors[0], formData.colors[1]);
      if (contrast >= 4.5) score += 0.2;
      if (contrast >= 7) score += 0.1;
    }

    if (formData.fontSize && formData.fontSize >= 16) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  private static assessStructuralStability(formData: FormData): number {
    let risk = 0;

    if (formData.dimensions) {
      const { width, height, depth } = formData.dimensions;
      const aspectRatio = height / width;

      if (aspectRatio > 2) risk += 0.3; // Too tall
      if (!depth || depth < width / 10) risk += 0.4; // Too shallow
    }

    if (formData.material === 'acrylic' && formData.thickness && formData.thickness < 5) {
      risk += 0.3; // Thin acrylic
    }

    return Math.min(risk, 1);
  }

  private static calculateOverallScore(checks: QualityCheck[]): number {
    if (checks.length === 0) return 100;

    const totalWeight = checks.reduce((sum, check) => {
      const weight = this.getSeverityWeight(check.severity);
      return sum + weight;
    }, 0);

    const maxPossibleWeight = checks.length * this.getSeverityWeight('critical');
    return Math.max(0, 100 - (totalWeight / maxPossibleWeight) * 100);
  }

  private static calculateCategoryScore(checks: QualityCheck[], category: string): number {
    const categoryChecks = checks.filter(c => c.category === category);
    if (categoryChecks.length === 0) return 100;

    return this.calculateOverallScore(categoryChecks);
  }

  private static getSeverityWeight(severity: QualityCheck['severity']): number {
    const weights = { critical: 50, high: 30, medium: 15, low: 5, info: 1 };
    return weights[severity];
  }

  private static generateSummary(checks: QualityCheck[], overallScore: number): string {
    const criticalCount = checks.filter(c => c.severity === 'critical').length;
    const highCount = checks.filter(c => c.severity === 'high').length;

    if (overallScore >= 90) {
      return 'Excellent quality with minimal issues. Design is ready for production.';
    } else if (overallScore >= 80) {
      return 'Good quality with minor improvements recommended before production.';
    } else if (overallScore >= 70) {
      return 'Acceptable quality but requires attention to several issues.';
    } else if (criticalCount > 0) {
      return `Critical issues detected that must be resolved before production.`;
    } else {
      return 'Significant improvements needed across multiple areas.';
    }
  }

  private static generateRecommendations(checks: QualityCheck[]): string[] {
    const recommendations: string[] = [];

    const criticalChecks = checks.filter(c => c.severity === 'critical');
    const autoFixableChecks = checks.filter(c => c.autoFixable);

    if (criticalChecks.length > 0) {
      recommendations.push('Address all critical issues immediately before proceeding');
    }

    if (autoFixableChecks.length > 0) {
      recommendations.push(`${autoFixableChecks.length} issues can be automatically fixed`);
    }

    const categories = [...new Set(checks.map(c => c.category))];
    if (categories.length > 2) {
      recommendations.push('Consider a comprehensive design review across all categories');
    }

    return recommendations;
  }

  static async autoFixIssues(checks: QualityCheck[], formData: FormData): Promise<{
    fixedChecks: string[];
    updatedFormData: FormData;
    remainingIssues: QualityCheck[];
  }> {
    const fixedChecks: string[] = [];
    const updatedFormData = { ...formData };
    const remainingIssues: QualityCheck[] = [];

    for (const check of checks) {
      if (check.autoFixable) {
        switch (check.id) {
          case 'thickness-insufficient':
            if (updatedFormData.material && updatedFormData.thickness) {
              const material = updatedFormData.material.toLowerCase();
              const minThickness = this.MANUFACTURING_STANDARDS.minThickness[material as keyof typeof this.MANUFACTURING_STANDARDS.minThickness];
              if (minThickness) {
                updatedFormData.thickness = minThickness;
                fixedChecks.push(check.id);
              }
            }
            break;

          case 'color-contrast-low':
            if (updatedFormData.colors && updatedFormData.colors.length >= 2) {
              // Auto-adjust to high contrast colors
              updatedFormData.colors = ['#FFFFFF', '#2C2C2C'];
              fixedChecks.push(check.id);
            }
            break;

          case 'brand-color-misalignment':
            if (updatedFormData.colors) {
              // Replace with Empati brand colors
              updatedFormData.colors = ['#4E5AC3', '#FFFFFF', '#F8F9FA'];
              fixedChecks.push(check.id);
            }
            break;

          default:
            remainingIssues.push(check);
        }
      } else {
        remainingIssues.push(check);
      }
    }

    return { fixedChecks, updatedFormData, remainingIssues };
  }
}
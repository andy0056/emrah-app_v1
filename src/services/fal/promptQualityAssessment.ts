/**
 * Prompt Quality Assessment
 * Analyzes prompt content to optimize compression strategies
 */

export interface PromptQualityMetrics {
  contentDensity: number; // How much essential information per character
  redundancyScore: number; // Amount of repetitive/unnecessary content
  formSpecificityScore: number; // How specific the form requirements are
  creativeContentRatio: number; // Ratio of creative vs technical content
  criticalContentRatio: number; // Ratio of critical vs optional content
  overallQuality: 'high' | 'medium' | 'low';
  compressionRecommendation: 'conservative' | 'moderate' | 'aggressive';
}

export interface ContentAnalysis {
  totalWords: number;
  uniqueWords: number;
  technicalTerms: number;
  numericalSpecs: number;
  brandMentions: number;
  redundantPhrases: number;
  criticalSections: number;
  creativeSections: number;
}

/**
 * Analyze prompt quality and recommend optimal compression strategy
 */
export function assessPromptQuality(prompt: string): PromptQualityMetrics {
  const analysis = analyzeContent(prompt);

  // Calculate metrics
  const contentDensity = calculateContentDensity(analysis, prompt.length);
  const redundancyScore = calculateRedundancyScore(analysis);
  const formSpecificityScore = calculateFormSpecificityScore(analysis, prompt);
  const creativeContentRatio = calculateCreativeRatio(analysis);
  const criticalContentRatio = calculateCriticalRatio(analysis);

  // Determine overall quality
  const qualityScore = (contentDensity + (1 - redundancyScore) + formSpecificityScore) / 3;
  const overallQuality = qualityScore > 0.7 ? 'high' : qualityScore > 0.4 ? 'medium' : 'low';

  // Recommend compression level
  const compressionRecommendation = recommendCompressionLevel(
    redundancyScore,
    criticalContentRatio,
    contentDensity
  );

  return {
    contentDensity,
    redundancyScore,
    formSpecificityScore,
    creativeContentRatio,
    criticalContentRatio,
    overallQuality,
    compressionRecommendation
  };
}

/**
 * Analyze content characteristics
 */
function analyzeContent(prompt: string): ContentAnalysis {
  const words = prompt.toLowerCase().match(/\b\w+\b/g) || [];
  const uniqueWords = new Set(words).size;

  // Technical terms
  const technicalTerms = countMatches(prompt, [
    'dimensional', 'manufacturing', 'structural', 'physics', 'calculated',
    'specifications', 'constraints', 'utilization', 'optimization'
  ]);

  // Numerical specifications
  const numericalSpecs = (prompt.match(/\b\d+(?:\.\d+)?\s*(?:cm|mm|%|products?|shelves?|levels?)\b/gi) || []).length;

  // Brand mentions
  const brandMentions = countMatches(prompt, [
    'brand', 'logo', 'product', 'visual hierarchy', 'brand integration',
    'brand assets', 'brand consistency', 'brand dominance'
  ]);

  // Redundant phrases
  const redundantPhrases = countMatches(prompt, [
    'must be', 'should be', 'need to', 'have to', 'it is important',
    'make sure', 'ensure that', 'in order to', 'for the purpose of'
  ]);

  // Critical sections (form-priority content)
  const criticalSections = countMatches(prompt, [
    'EXACTLY', 'NON-NEGOTIABLE', 'CRITICAL', 'FORM-PRIORITY',
    'ABSOLUTE', 'MANDATORY', 'REQUIRED'
  ]);

  // Creative sections
  const creativeSections = countMatches(prompt, [
    'creative', 'aesthetic', 'visual impact', 'artistic', 'style',
    'atmosphere', 'mood', 'elegant', 'sophisticated', 'appealing'
  ]);

  return {
    totalWords: words.length,
    uniqueWords,
    technicalTerms,
    numericalSpecs,
    brandMentions,
    redundantPhrases,
    criticalSections,
    creativeSections
  };
}

/**
 * Calculate content density (information per character)
 */
function calculateContentDensity(analysis: ContentAnalysis, promptLength: number): number {
  const essentialContent = analysis.technicalTerms + analysis.numericalSpecs +
                          analysis.brandMentions + analysis.criticalSections;
  const density = essentialContent / promptLength * 1000; // Scale for readability
  return Math.min(1.0, density); // Cap at 1.0
}

/**
 * Calculate redundancy score (0 = no redundancy, 1 = highly redundant)
 */
function calculateRedundancyScore(analysis: ContentAnalysis): number {
  const uniquenessRatio = analysis.uniqueWords / analysis.totalWords;
  const redundantRatio = analysis.redundantPhrases / analysis.totalWords * 10; // Scale up
  return Math.min(1.0, (1 - uniquenessRatio) + redundantRatio);
}

/**
 * Calculate form specificity score (how well form requirements are specified)
 */
function calculateFormSpecificityScore(analysis: ContentAnalysis, prompt: string): number {
  let score = 0;

  // Check for specific numerical requirements
  if (prompt.includes('EXACTLY')) score += 0.3;
  if (analysis.numericalSpecs > 3) score += 0.2;
  if (analysis.criticalSections > 0) score += 0.2;

  // Check for specific arrangement details
  if (prompt.includes('front') && prompt.includes('back')) score += 0.1;
  if (prompt.includes('shelf') && prompt.includes('product')) score += 0.1;
  if (prompt.includes('arrangement') || prompt.includes('placement')) score += 0.1;

  return Math.min(1.0, score);
}

/**
 * Calculate creative content ratio
 */
function calculateCreativeRatio(analysis: ContentAnalysis): number {
  return Math.min(1.0, analysis.creativeSections / Math.max(1, analysis.totalWords) * 100);
}

/**
 * Calculate critical content ratio
 */
function calculateCriticalRatio(analysis: ContentAnalysis): number {
  const criticalContent = analysis.criticalSections + analysis.numericalSpecs + analysis.technicalTerms;
  return Math.min(1.0, criticalContent / Math.max(1, analysis.totalWords) * 50);
}

/**
 * Recommend compression level based on content analysis
 */
function recommendCompressionLevel(
  redundancyScore: number,
  criticalContentRatio: number,
  contentDensity: number
): 'conservative' | 'moderate' | 'aggressive' {
  // High redundancy + low critical content = aggressive compression OK
  if (redundancyScore > 0.6 && criticalContentRatio < 0.3) {
    return 'aggressive';
  }

  // Medium redundancy or medium critical content = moderate compression
  if (redundancyScore > 0.4 || criticalContentRatio < 0.5) {
    return 'moderate';
  }

  // Low redundancy + high critical content = conservative compression
  return 'conservative';
}

/**
 * Count matches of terms in text (case insensitive)
 */
function countMatches(text: string, terms: string[]): number {
  let count = 0;
  const lowerText = text.toLowerCase();

  for (const term of terms) {
    const regex = new RegExp(`\\b${term.toLowerCase()}\\b`, 'g');
    const matches = lowerText.match(regex);
    if (matches) count += matches.length;
  }

  return count;
}

/**
 * Generate compression report for debugging
 */
export function generateCompressionReport(
  originalPrompt: string,
  compressedPrompt: string,
  metrics: PromptQualityMetrics
): string {
  const originalLength = originalPrompt.length;
  const compressedLength = compressedPrompt.length;
  const compressionRatio = compressedLength / originalLength;

  return `
COMPRESSION REPORT:
==================
Original Length: ${originalLength} chars
Compressed Length: ${compressedLength} chars
Compression Ratio: ${(compressionRatio * 100).toFixed(1)}%
Space Saved: ${originalLength - compressedLength} chars

QUALITY METRICS:
Content Density: ${(metrics.contentDensity * 100).toFixed(1)}%
Redundancy Score: ${(metrics.redundancyScore * 100).toFixed(1)}%
Form Specificity: ${(metrics.formSpecificityScore * 100).toFixed(1)}%
Creative Content: ${(metrics.creativeContentRatio * 100).toFixed(1)}%
Critical Content: ${(metrics.criticalContentRatio * 100).toFixed(1)}%
Overall Quality: ${metrics.overallQuality}
Recommended Compression: ${metrics.compressionRecommendation}
`;
}
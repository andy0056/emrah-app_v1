/**
 * FAL AI Service Utilities
 * Helper functions for image processing and prompt generation
 */

import { IMAGE_SIZES } from './config';
import type { FormData } from '../../types';

/**
 * Get image size configuration for aspect ratio
 */
export function getImageSize(aspectRatio: string) {
  return IMAGE_SIZES[aspectRatio as keyof typeof IMAGE_SIZES] || IMAGE_SIZES["1:1"];
}

/**
 * Generate client requirement mapping from form data
 */
export function generateClientRequirementMapping(formData: FormData): string {
  const requirements: string[] = [];

  // Brand priority mapping
  if (formData.brand) {
    requirements.push(`BRAND: ${formData.brand} must dominate visual hierarchy`);
  }

  // Product specificity
  if (formData.product && formData.description) {
    requirements.push(`PRODUCT FOCUS: ${formData.product} (${formData.description}) must be prominently displayed on every shelf`);
  }

  // Shelf count and product placement specificity
  if (formData.shelfCount) {
    const productPlacement = formData.shelfCount === 1
      ? 'single shelf must be densely packed with products at eye level'
      : formData.shelfCount === 2
      ? 'top shelf for premium products, bottom shelf for volume display'
      : formData.shelfCount === 3
      ? 'top shelf for hero products, middle for variety, bottom for volume'
      : `all ${formData.shelfCount} shelves must create stepped product hierarchy from hero (top) to volume (bottom)`;

    requirements.push(`PRODUCT PLACEMENT: ${productPlacement}`);
    requirements.push(`SHELF DENSITY: Each shelf must appear 70-90% filled with branded products, never empty or sparse`);
  }

  // Material requirements
  if (formData.materials && formData.materials.length > 0) {
    requirements.push(`MATERIAL AUTHENTICITY: Display must clearly show ${formData.materials.join(' and ')} construction`);
  }

  // Stand type specificity
  if (formData.standType) {
    requirements.push(`DISPLAY TYPE: Must be recognizable as ${formData.standType} with appropriate proportions`);
  }

  // Color scheme requirements
  if (formData.standBaseColor) {
    requirements.push(`COLOR SCHEME: ${formData.standBaseColor} base color must be prominently featured in structural elements`);
  }

  // Dimensions for realistic proportions
  if (formData.standWidth && formData.standHeight && formData.standDepth) {
    requirements.push(`PROPORTIONS: Must visually represent ${formData.standWidth}×${formData.standDepth}×${formData.standHeight}cm dimensions`);
  }

  return requirements.length > 0 ? `\n\nCLIENT REQUIREMENTS:\n${requirements.map(req => `- ${req}`).join('\n')}` : '';
}

/**
 * Transform prompt to be brand-friendly
 */
export function makeBrandFriendlyPrompt(prompt: string): string {
  return prompt
    .replace(/no branding/gi, 'with strong brand integration')
    .replace(/no products/gi, 'with featured branded products')
    .replace(/no text/gi, 'with clear brand text and logos')
    .replace(/no logos/gi, 'with prominent brand logos')
    .replace(/empty shelves/gi, 'shelves filled with branded products')
    .replace(/clean display surfaces/gi, 'branded display surfaces with logo placement')
    .replace(/minimal branding/gi, 'prominent branding')
    .replace(/subtle branding/gi, 'bold brand presence')
    .replace(/plain/gi, 'branded')
    .replace(/generic/gi, 'brand-specific');
}

/**
 * Create comprehensive brand integration prompt
 */
export function createBrandIntegrationPrompt(basePrompt: string, clientRequirements: string = ''): string {
  return `${basePrompt}

CLIENT-PRIORITY BRAND INTEGRATION:
- LOGO PROMINENCE: Feature brand logo as primary visual anchor on multiple display surfaces
- PRODUCT SHOWCASE: Position actual branded products as hero elements on every shelf level with front-facing labels
- PRODUCT DENSITY: Fill each shelf 70-90% with products, creating abundant display without overcrowding
- PRODUCT HIERARCHY: Arrange products by importance - hero products at eye level, volume products lower
- BRAND COLOR DOMINANCE: Apply brand colors as structural design elements, not just accents
- RETAIL IMPACT FOCUS: Design for maximum customer attention and purchase influence
- BRAND CONSISTENCY: Ensure cohesive brand experience across all display angles and surfaces
- COMMERCIAL VIABILITY: Balance strong branding with practical retail functionality
- ASSET UTILIZATION: Seamlessly integrate ALL provided brand assets (logo, product, key visual) as focal design elements
- VISUAL HIERARCHY: Establish clear brand dominance while maintaining structural integrity${clientRequirements}`;
}

/**
 * Create dimensionally-aware brand integration prompt using calculated layouts
 */
export function createDimensionalBrandIntegrationPrompt(
  basePrompt: string,
  dimensionalAnalysis: any,
  clientRequirements: string = ''
): string {
  const layout = dimensionalAnalysis.calculatedLayout;
  const utilization = dimensionalAnalysis.spaceUtilization;
  const constraints = dimensionalAnalysis.manufacturingConstraints;

  return `${basePrompt}

DIMENSIONAL-PRIORITY BRAND INTEGRATION:
- LOGO PROMINENCE: Feature brand logo as primary visual anchor on multiple display surfaces
- CALCULATED PRODUCT ARRANGEMENT: ${layout.productsPerShelf} products per shelf in ${layout.shelfRows}×${layout.shelfColumns} grid layout
- PHYSICS-VALIDATED DENSITY: ${utilization.shelfUsagePercent}% calculated shelf utilization (${utilization.efficiency} efficiency)
- EXACT PRODUCT CAPACITY: Total ${layout.totalProductCapacity} products across all shelves with ${layout.productSpacing}cm spacing
- STRUCTURAL REQUIREMENTS: ${constraints.length} manufacturing constraints must be addressed
- BRAND COLOR DOMINANCE: Apply brand colors as structural design elements, not just accents
- RETAIL IMPACT FOCUS: Design for maximum customer attention within physical constraints
- BRAND CONSISTENCY: Ensure cohesive brand experience across all display angles and surfaces
- MANUFACTURING VIABILITY: Balance strong branding with proven structural integrity
- ASSET UTILIZATION: Seamlessly integrate ALL provided brand assets within calculated dimensions
- DIMENSIONAL ACCURACY: ${utilization.standUsagePercent}% space utilization ensures buildable design${clientRequirements}`;
}

/**
 * Compress prompt to stay within FAL API limits while preserving key information
 */
export function compressPrompt(prompt: string, maxLength: number = 4800): string {
  if (prompt.length <= maxLength) return prompt;

  console.log(`⚠️ Compressing prompt from ${prompt.length} to ${maxLength} characters`);

  // Priority preservation order (most important content first)
  const sections = prompt.split('\n\n');
  let compressed = '';

  // Always keep the base prompt (first section)
  if (sections[0]) {
    compressed = sections[0];
  }

  // Add sections in priority order until we hit the limit
  const prioritySections = sections.slice(1).sort((a, b) => {
    // Prioritize sections with key information
    const aScore = (a.includes('BRAND:') ? 10 : 0) +
                   (a.includes('PRODUCT FOCUS:') ? 9 : 0) +
                   (a.includes('CALCULATED PLACEMENT:') ? 8 : 0) +
                   (a.includes('DIMENSIONAL ACCURACY:') ? 7 : 0) +
                   (a.includes('MATERIAL AUTHENTICITY:') ? 6 : 0);

    const bScore = (b.includes('BRAND:') ? 10 : 0) +
                   (b.includes('PRODUCT FOCUS:') ? 9 : 0) +
                   (b.includes('CALCULATED PLACEMENT:') ? 8 : 0) +
                   (b.includes('DIMENSIONAL ACCURACY:') ? 7 : 0) +
                   (b.includes('MATERIAL AUTHENTICITY:') ? 6 : 0);

    return bScore - aScore;
  });

  for (const section of prioritySections) {
    const testLength = compressed.length + section.length + 2; // +2 for \n\n
    if (testLength <= maxLength) {
      compressed += '\n\n' + section;
    } else {
      // Try to fit abbreviated version of this section
      const abbreviated = section.split('\n').slice(0, 3).join('\n');
      if (compressed.length + abbreviated.length + 2 <= maxLength) {
        compressed += '\n\n' + abbreviated;
      }
      break;
    }
  }

  console.log(`✅ Compressed prompt to ${compressed.length} characters`);
  return compressed;
}

/**
 * Generate physics-validated client requirements using dimensional analysis
 */
export function generatePhysicsValidatedRequirements(
  formData: FormData,
  dimensionalAnalysis: any
): string {
  const requirements: string[] = [];
  const layout = dimensionalAnalysis.calculatedLayout;
  const utilization = dimensionalAnalysis.spaceUtilization;
  const constraints = dimensionalAnalysis.manufacturingConstraints;

  // Brand priority with dimensional constraints
  if (formData.brand) {
    requirements.push(`BRAND: ${formData.brand} must dominate visual hierarchy within structural limits`);
  }

  // Product specificity with calculated layout
  if (formData.product && formData.description) {
    requirements.push(`PRODUCT FOCUS: ${formData.product} (${formData.description}) positioned in calculated ${layout.shelfRows}×${layout.shelfColumns} arrangement on every shelf`);
  }

  // Physics-validated shelf density (not generic 70-90%)
  if (formData.shelfCount) {
    const actualDensity = utilization.shelfUsagePercent;
    const productCapacity = layout.productsPerShelf;

    const productPlacement = formData.shelfCount === 1
      ? `single shelf with exactly ${productCapacity} products in optimal ${layout.shelfRows}×${layout.shelfColumns} grid`
      : formData.shelfCount === 2
      ? `top shelf: ${productCapacity} premium products, bottom shelf: ${productCapacity} volume products in grid layout`
      : formData.shelfCount === 3
      ? `top shelf: ${productCapacity} hero products, middle: ${productCapacity} variety, bottom: ${productCapacity} volume`
      : `all ${formData.shelfCount} shelves with ${productCapacity} products each in ${layout.shelfRows}×${layout.shelfColumns} arrangement`;

    requirements.push(`CALCULATED PLACEMENT: ${productPlacement}`);
    requirements.push(`PHYSICS-VALIDATED DENSITY: ${actualDensity}% calculated shelf utilization (${utilization.efficiency} efficiency), not generic estimates`);
    requirements.push(`SPACING REQUIREMENTS: ${layout.productSpacing}cm minimum spacing between products for access and stability`);
  }

  // Material requirements with structural validation
  if (formData.materials && formData.materials.length > 0) {
    const materialConstraints = constraints.filter(c => c.type === 'STRUCTURAL');
    const structuralNote = materialConstraints.length > 0
      ? ` with ${materialConstraints.length} structural constraints addressed`
      : ' with validated structural integrity';
    requirements.push(`MATERIAL AUTHENTICITY: Display must clearly show ${formData.materials.join(' and ')} construction${structuralNote}`);
  }

  // Stand type with dimensional accuracy
  if (formData.standType) {
    const aspectRatio = `${formData.standWidth}×${formData.standDepth}×${formData.standHeight}cm`;
    requirements.push(`DISPLAY TYPE: Must be recognizable as ${formData.standType} with exact ${aspectRatio} proportions`);
  }

  // Color scheme with space utilization note
  if (formData.standBaseColor) {
    requirements.push(`COLOR SCHEME: ${formData.standBaseColor} base color must be prominently featured in structural elements (${utilization.standUsagePercent}% space utilization)`);
  }

  // Manufacturing warnings if any
  const criticalConstraints = constraints.filter((c: any) => c.severity === 'CRITICAL');
  if (criticalConstraints.length > 0) {
    requirements.push(`CRITICAL CONSTRAINTS: ${criticalConstraints.length} manufacturing issues must be resolved: ${criticalConstraints.map((c: any) => c.suggestion).join(', ')}`);
  }

  // Dimensional validation summary
  if (dimensionalAnalysis.issues.length > 0) {
    requirements.push(`PHYSICS VALIDATION: ${dimensionalAnalysis.issues.length} dimensional issues detected - design may not be physically buildable`);
  } else {
    requirements.push(`PHYSICS VALIDATION: Design validated as physically buildable with ${layout.totalProductCapacity} total product capacity`);
  }

  return requirements.length > 0 ? '\n\nCLIENT REQUIREMENTS:\n' + requirements.map(req => `- ${req}`).join('\n') : '';
}
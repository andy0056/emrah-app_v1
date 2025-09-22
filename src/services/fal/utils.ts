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
/**
 * Form-Priority Prompt Utils
 * Treats form inputs as absolute source of truth, not suggestions
 */

import type { FormData } from '../../types';

export interface FormPriorityRequirements {
  productArrangement: string;
  brandRequirements: string;
  physicalConstraints: string;
  shelfSpecification: string;
  criticalNumbers: string;
}

/**
 * Generate form-priority requirements where user inputs are ABSOLUTE TRUTH
 */
export function generateFormPriorityRequirements(formData: FormData): FormPriorityRequirements {
  // CRITICAL NUMBERS - These are user specifications, NOT suggestions
  const criticalSpecs = [];

  if (formData.frontFaceCount) {
    criticalSpecs.push(`EXACTLY ${formData.frontFaceCount} parallel row(s) side-by-side on each shelf`);
  }

  if (formData.backToBackCount) {
    criticalSpecs.push(`EXACTLY ${formData.backToBackCount} products deep (front-to-back) in each row`);
  }

  if (formData.shelfCount) {
    criticalSpecs.push(`EXACTLY ${formData.shelfCount} shelf level(s) total`);
  }

  // PRODUCT ARRANGEMENT - Based on exact form specifications
  const arrangement = [];

  if (formData.frontFaceCount && formData.backToBackCount) {
    // CORRECTED INTERPRETATION:
    // - frontFaceCount = number of parallel rows side-by-side
    // - backToBackCount = number of products deep in each row (front-to-back)
    const totalPerShelf = formData.frontFaceCount * formData.backToBackCount;

    arrangement.push(`SHELF LAYOUT SPECIFICATION:`);
    arrangement.push(`- Number of parallel rows: ${formData.frontFaceCount} row(s) side-by-side`);
    arrangement.push(`- Products per row (depth): ${formData.backToBackCount} products lined up front-to-back`);
    arrangement.push(`- Total products per shelf: ${totalPerShelf} products`);

    // Clear arrangement description
    if (formData.frontFaceCount === 1) {
      arrangement.push(`SINGLE ROW ARRANGEMENT: One line of ${formData.backToBackCount} products placed front-to-back (no side-by-side rows)`);
    } else {
      arrangement.push(`MULTI-ROW ARRANGEMENT: ${formData.frontFaceCount} parallel rows, each with ${formData.backToBackCount} products front-to-back`);
    }

    if (formData.shelfCount > 1) {
      arrangement.push(`- Total display capacity: ${totalPerShelf * formData.shelfCount} products across ${formData.shelfCount} shelves`);
    }
  }

  // BRAND REQUIREMENTS - Mandatory, not optional
  const brand = [];
  if (formData.brand) {
    brand.push(`BRAND: ${formData.brand} must be the dominant visual element`);
  }
  if (formData.product) {
    brand.push(`PRODUCT: ${formData.product} must be clearly identifiable on every visible package`);
  }
  if (formData.description) {
    brand.push(`PRODUCT DESCRIPTION: "${formData.description}" provides context for proper representation`);
  }

  // PHYSICAL CONSTRAINTS - User-specified dimensions
  const physical = [];
  if (formData.standWidth && formData.standHeight && formData.standDepth) {
    physical.push(`DISPLAY DIMENSIONS: ${formData.standWidth}cm wide × ${formData.standHeight}cm high × ${formData.standDepth}cm deep`);
  }
  if (formData.productWidth && formData.productHeight && formData.productDepth) {
    physical.push(`PRODUCT SIZE: ${formData.productWidth}cm × ${formData.productHeight}cm × ${formData.productDepth}cm per unit`);
  }

  // SHELF SPECIFICATION - Detailed arrangement per form data
  const shelf = [];
  if (formData.shelfCount === 1) {
    shelf.push(`SINGLE SHELF DESIGN: All products on one level at optimal eye-level height`);
  } else if (formData.shelfCount > 1) {
    shelf.push(`MULTI-TIER DESIGN: ${formData.shelfCount} shelves with clear product visibility on each level`);
    shelf.push(`SHELF HIERARCHY: Distribute products to maximize visibility across all ${formData.shelfCount} levels`);
  }

  return {
    productArrangement: arrangement.join('\n'),
    brandRequirements: brand.join('\n'),
    physicalConstraints: physical.join('\n'),
    shelfSpecification: shelf.join('\n'),
    criticalNumbers: criticalSpecs.join('\n')
  };
}

/**
 * Create form-priority brand integration prompt (replaces generic brand integration)
 */
export function createFormPriorityBrandPrompt(
  basePrompt: string,
  formData: FormData
): string {
  const formReqs = generateFormPriorityRequirements(formData);

  return `${basePrompt}

FORM-PRIORITY BRAND INTEGRATION:
${formReqs.brandRequirements}

CRITICAL NUMERICAL REQUIREMENTS (NON-NEGOTIABLE):
${formReqs.criticalNumbers}

PRODUCT ARRANGEMENT SPECIFICATION:
${formReqs.productArrangement}

PHYSICAL CONSTRAINTS:
${formReqs.physicalConstraints}

SHELF SPECIFICATION:
${formReqs.shelfSpecification}

GENERATION INSTRUCTIONS:
- User form inputs are ABSOLUTE requirements, not suggestions
- Numbers specified by user (face count, back-to-back count, shelf count) must be exactly reproduced
- Brand elements must dominate visual hierarchy as specified
- Physical dimensions must be proportionally accurate
- Every shelf must show the exact product arrangement specified
- No creative interpretation of numerical specifications - follow exactly as provided

PRODUCT ARRANGEMENT VISUALIZATION RULES:
- "Front Face Count = 1" means ONE single row of products (no parallel rows)
- "Back-to-Back Count = 12" means 12 products lined up behind each other in that single row
- Products should be clearly visible from front to back in a straight line
- Avoid clustering products or creating multiple side-by-side rows when front face count is 1
- The arrangement should look like a train of products, not a grid`;
}

/**
 * Create protected content for compression (values that must never be compressed)
 */
export function getProtectedFormContent(formData: FormData): string[] {
  const protected_content = [];

  if (formData.frontFaceCount) {
    protected_content.push(`${formData.frontFaceCount} product(s) facing forward`);
    protected_content.push(`EXACTLY ${formData.frontFaceCount} front-facing`);
  }

  if (formData.backToBackCount) {
    protected_content.push(`${formData.backToBackCount} products deep`);
    protected_content.push(`EXACTLY ${formData.backToBackCount} back-to-back`);
  }

  if (formData.shelfCount) {
    protected_content.push(`${formData.shelfCount} shelf level(s)`);
    protected_content.push(`EXACTLY ${formData.shelfCount} shelves`);
  }

  if (formData.brand) {
    protected_content.push(`BRAND: ${formData.brand}`);
  }

  return protected_content;
}

/**
 * Validate that critical form requirements are preserved in final prompt
 */
export function validateFormRequirementsInPrompt(
  prompt: string,
  formData: FormData
): { isValid: boolean; missingRequirements: string[] } {
  const missing = [];

  if (formData.frontFaceCount) {
    const frontFacePattern = new RegExp(`${formData.frontFaceCount}.*front|front.*${formData.frontFaceCount}`, 'i');
    if (!frontFacePattern.test(prompt)) {
      missing.push(`Front face count: ${formData.frontFaceCount}`);
    }
  }

  if (formData.backToBackCount) {
    const backToBackPattern = new RegExp(`${formData.backToBackCount}.*back|back.*${formData.backToBackCount}|${formData.backToBackCount}.*deep`, 'i');
    if (!backToBackPattern.test(prompt)) {
      missing.push(`Back-to-back count: ${formData.backToBackCount}`);
    }
  }

  if (formData.shelfCount) {
    const shelfPattern = new RegExp(`${formData.shelfCount}.*shelf|shelf.*${formData.shelfCount}`, 'i');
    if (!shelfPattern.test(prompt)) {
      missing.push(`Shelf count: ${formData.shelfCount}`);
    }
  }

  return {
    isValid: missing.length === 0,
    missingRequirements: missing
  };
}
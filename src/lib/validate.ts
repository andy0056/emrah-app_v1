/**
 * Hard Validation Module - Math Gates
 * Prevents geometry errors before Stage-1 rendering
 */

import { Spec } from "./spec";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  measurements: {
    calculatedDepth: number;
    availableDepth: number;
    depthDifference: number;
    totalProducts: number;
  };
}

/**
 * HARD VALIDATION: Math gate that prevents invalid geometries
 * Throws errors for critical mismatches, logs warnings for potential issues
 */
export function validate(spec: Spec): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Calculate actual depth usage
  const productDepthUsed = spec.layout.depthCount * spec.product.D;
  const gapsDepthUsed = (spec.layout.depthCount - 1) * spec.layout.gapsDepth;
  const totalDepthUsed = productDepthUsed + gapsDepthUsed;

  const measurements = {
    calculatedDepth: totalDepthUsed,
    availableDepth: spec.stand.D,
    depthDifference: Math.abs(totalDepthUsed - spec.stand.D),
    totalProducts: spec.layout.columns * spec.layout.depthCount
  };

  // CRITICAL ERROR: Products exceed available depth
  if (totalDepthUsed > spec.stand.D) {
    errors.push(
      `DEPTH OVERFLOW: Products need ${totalDepthUsed}cm but stand only has ${spec.stand.D}cm available. ` +
      `Reduce product count, product depth, or increase stand depth.`
    );
  }

  // WARNING: Products use significantly less than available depth
  if (totalDepthUsed < spec.stand.D * 0.3) {
    warnings.push(
      `DEPTH UNDERUTILIZATION: Products only use ${totalDepthUsed}cm of ${spec.stand.D}cm available (${Math.round((totalDepthUsed/spec.stand.D)*100)}%). ` +
      `Consider adding more products or reducing stand depth.`
    );
  }

  // VALIDATION: Basic layout constraints (dynamic)
  if (spec.layout.columns < 1) {
    errors.push(`LAYOUT ERROR: Must have at least 1 column, got ${spec.layout.columns}.`);
  }

  if (spec.layout.depthCount < 1) {
    errors.push(`COUNT ERROR: Must have at least 1 product deep, got ${spec.layout.depthCount}.`);
  }

  if (spec.layout.gapsDepth < 0) {
    errors.push(`GAPS ERROR: Gaps cannot be negative, got ${spec.layout.gapsDepth}cm gaps.`);
  }

  // CRITICAL ERROR: Products too wide for stand (multiple columns)
  const totalWidthNeeded = spec.layout.columns * spec.product.W;
  if (totalWidthNeeded > spec.stand.W) {
    errors.push(
      `WIDTH OVERFLOW: ${spec.layout.columns} columns × ${spec.product.W}cm = ${totalWidthNeeded}cm needed, but stand only ${spec.stand.W}cm wide. ` +
      `Reduce columns, product width, or increase stand width.`
    );
  }

  // CRITICAL ERROR: Product too tall for stand
  if (spec.product.H > spec.stand.H - spec.stand.shelfThick) {
    errors.push(
      `HEIGHT OVERFLOW: Product ${spec.product.H}cm taller than available space ${spec.stand.H - spec.stand.shelfThick}cm.`
    );
  }

  // WARNING: Tight fit
  const widthClearance = spec.stand.W - spec.product.W;
  if (widthClearance < 1 && widthClearance >= 0) {
    warnings.push(`Tight width fit: Only ${widthClearance}cm clearance.`);
  }

  // WARNING: Shelf thickness seems thin
  if (spec.stand.shelfThick < 1.5) {
    warnings.push(`Thin shelf: ${spec.stand.shelfThick}cm thickness may be structurally weak.`);
  }

  // THROW on critical errors
  if (errors.length > 0) {
    const errorMessage = `VALIDATION FAILED:\n${errors.map(e => `• ${e}`).join('\n')}`;
    throw new Error(errorMessage);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    measurements
  };
}

/**
 * Validate and provide detailed report (non-throwing version)
 */
export function validateWithReport(spec: Spec): ValidationResult {
  try {
    return validate(spec);
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      warnings: [],
      measurements: {
        calculatedDepth: spec.layout.depthCount * spec.product.D,
        availableDepth: spec.stand.D,
        depthDifference: 0,
        totalProducts: spec.layout.depthCount
      }
    };
  }
}

/**
 * Quick validation check (returns boolean)
 */
export function isValid(spec: Spec): boolean {
  try {
    validate(spec);
    return true;
  } catch {
    return false;
  }
}
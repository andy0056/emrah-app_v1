/**
 * Form Data Mapping Utilities
 *
 * Maps between the main FormData interface and specialized interfaces
 * for dimensional intelligence and smart prompt generation
 */

import { FormData } from '../types';
import { FormDataWithDimensions } from './smartPromptGenerator';

/**
 * Convert FormData to FormDataWithDimensions for dimensional intelligence
 */
export function mapToFormDataWithDimensions(formData: FormData): FormDataWithDimensions {
  return {
    // Product specifications (direct mapping)
    productWidth: formData.productWidth,
    productDepth: formData.productDepth,
    productHeight: formData.productHeight,
    productFrontFaceCount: formData.frontFaceCount,
    productBackToBackCount: formData.backToBackCount,

    // Stand specifications (direct mapping)
    standWidth: formData.standWidth,
    standDepth: formData.standDepth,
    standHeight: formData.standHeight,

    // Shelf specifications (direct mapping)
    shelfWidth: formData.shelfWidth,
    shelfDepth: formData.shelfDepth,
    shelfCount: formData.shelfCount,

    // Brand information (optional fields)
    brand: formData.brand,
    product: formData.product,
    standType: formData.standType.toString(), // Convert enum to string
    materials: formData.materials.map(m => m.toString()), // Convert enum array to string array
    standBaseColor: formData.standBaseColor
  };
}

/**
 * Validate that FormData has all required dimensions for dimensional intelligence
 */
export function validateDimensionalData(formData: FormData): {
  isValid: boolean;
  missingFields: string[];
  warnings: string[];
} {
  const missingFields: string[] = [];
  const warnings: string[] = [];

  // Required product dimensions
  if (!formData.productWidth || formData.productWidth <= 0) missingFields.push('productWidth');
  if (!formData.productDepth || formData.productDepth <= 0) missingFields.push('productDepth');
  if (!formData.productHeight || formData.productHeight <= 0) missingFields.push('productHeight');
  if (!formData.frontFaceCount || formData.frontFaceCount <= 0) missingFields.push('frontFaceCount');
  if (!formData.backToBackCount || formData.backToBackCount <= 0) missingFields.push('backToBackCount');

  // Required stand dimensions
  if (!formData.standWidth || formData.standWidth <= 0) missingFields.push('standWidth');
  if (!formData.standDepth || formData.standDepth <= 0) missingFields.push('standDepth');
  if (!formData.standHeight || formData.standHeight <= 0) missingFields.push('standHeight');

  // Required shelf specifications
  if (!formData.shelfWidth || formData.shelfWidth <= 0) missingFields.push('shelfWidth');
  if (!formData.shelfDepth || formData.shelfDepth <= 0) missingFields.push('shelfDepth');
  if (!formData.shelfCount || formData.shelfCount <= 0) missingFields.push('shelfCount');

  // Dimensional warnings
  if (formData.productWidth > formData.shelfWidth) {
    warnings.push('Product width exceeds shelf width - products may not fit');
  }

  if (formData.productDepth > formData.shelfDepth) {
    warnings.push('Product depth exceeds shelf depth - products may not fit');
  }

  if (formData.shelfWidth > formData.standWidth) {
    warnings.push('Shelf width exceeds stand width - shelf may not fit in stand');
  }

  if (formData.shelfDepth > formData.standDepth) {
    warnings.push('Shelf depth exceeds stand depth - shelf may not fit in stand');
  }

  const minRequiredHeight = formData.shelfCount * (formData.productHeight + 5); // 5cm clearance
  if (minRequiredHeight > formData.standHeight) {
    warnings.push(`Stand height (${formData.standHeight}cm) may be insufficient for ${formData.shelfCount} shelves with ${formData.productHeight}cm products`);
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings
  };
}

/**
 * Get default dimensions for common product types
 * These can be used as fallbacks when dimension data is missing
 */
export function getDefaultDimensions(productType?: string): Partial<FormDataWithDimensions> {
  // Default dimensions for Ülker Çikolatalı Gofret (wafer cookies)
  const ulkerDefaults = {
    productWidth: 13,
    productDepth: 2.5,
    productHeight: 5,
    productFrontFaceCount: 1,
    productBackToBackCount: 12,

    standWidth: 15,
    standDepth: 30,
    standHeight: 30,

    shelfWidth: 15,
    shelfDepth: 15,
    shelfCount: 1
  };

  // Add more product type defaults as needed
  const defaults: Record<string, Partial<FormDataWithDimensions>> = {
    'gofret': ulkerDefaults,
    'wafer': ulkerDefaults,
    'cookie': ulkerDefaults,
    'default': ulkerDefaults
  };

  const key = productType?.toLowerCase() || 'default';
  return defaults[key] || defaults.default;
}

/**
 * Merge FormData with default dimensions for missing fields
 */
export function mergeWithDefaults(formData: FormData, productType?: string): FormDataWithDimensions {
  const defaults = getDefaultDimensions(productType);
  const mapped = mapToFormDataWithDimensions(formData);

  return {
    ...defaults,
    ...mapped,
    // Ensure required fields have values
    productWidth: mapped.productWidth || defaults.productWidth || 13,
    productDepth: mapped.productDepth || defaults.productDepth || 2.5,
    productHeight: mapped.productHeight || defaults.productHeight || 5,
    productFrontFaceCount: mapped.productFrontFaceCount || defaults.productFrontFaceCount || 1,
    productBackToBackCount: mapped.productBackToBackCount || defaults.productBackToBackCount || 12,

    standWidth: mapped.standWidth || defaults.standWidth || 15,
    standDepth: mapped.standDepth || defaults.standDepth || 30,
    standHeight: mapped.standHeight || defaults.standHeight || 30,

    shelfWidth: mapped.shelfWidth || defaults.shelfWidth || 15,
    shelfDepth: mapped.shelfDepth || defaults.shelfDepth || 15,
    shelfCount: mapped.shelfCount || defaults.shelfCount || 1
  };
}
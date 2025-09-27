/**
 * Dynamic Spec Generator - Creates geometry specifications from form data
 */

import { Spec } from './spec';
import { FormData } from '../types';

export function generateSpecFromFormData(formData: Partial<FormData>): Spec {
  // Use form data values with fallbacks to SPEC_A defaults
  const standWidth = formData.standWidth || 15;
  const standDepth = formData.standDepth || 30;
  const standHeight = formData.standHeight || 30;
  const shelfThick = 2; // Fixed shelf thickness
  const shelfCount = formData.shelfCount || 1; // Multi-shelf support

  const productWidth = formData.productWidth || 13;
  const productHeight = formData.productHeight || 5;
  const productDepth = formData.productDepth || 2.5;

  const frontFaceCount = formData.frontFaceCount || 1;
  const backToBackCount = formData.backToBackCount || 12;
  const gapsDepth = 0; // Fixed no gaps for tight packaging

  // Adjust stand height based on stand type
  let adjustedHeight = standHeight;
  const standType = formData.standType || 'Tabletop Stand';

  // Auto-scale height for floor stands if not explicitly set
  if (standType === 'Floor Stand' && standHeight <= 50) {
    adjustedHeight = Math.max(120, shelfCount * 25 + 20); // Minimum 120cm for floor stands
    console.log(`🏗️ Auto-scaling floor stand height from ${standHeight}cm to ${adjustedHeight}cm`);
  }

  return {
    stand: {
      W: standWidth,
      D: standDepth,
      H: adjustedHeight,
      shelfThick: shelfThick
    },
    product: {
      W: productWidth,
      H: productHeight,
      D: productDepth
    },
    layout: {
      columns: frontFaceCount,
      depthCount: backToBackCount,
      gapsDepth: gapsDepth
    },
    // Include additional metadata for stand builders
    metadata: {
      standType: standType,
      shelfCount: shelfCount,
      originalHeight: standHeight
    }
  };
}

export function generateContractFromFormData(formData: Partial<FormData>) {
  const spec = generateSpecFromFormData(formData);

  return {
    stand_cm: {
      width: spec.stand.W,
      depth: spec.stand.D,
      height: spec.stand.H,
      shelf_thickness: spec.stand.shelfThick
    },
    product_cm: {
      width: spec.product.W,
      height: spec.product.H,
      depth: spec.product.D
    },
    arrangement: {
      columns_across: spec.layout.columns,
      depth_count: spec.layout.depthCount,
      gaps_depth_cm: spec.layout.gapsDepth
    },
    checksum: {
      total_products: spec.layout.columns * spec.layout.depthCount,
      calculated_depth: spec.layout.depthCount * spec.product.D + spec.layout.gapsDepth * (spec.layout.depthCount - 1),
      available_depth: spec.stand.D,
      verification: `${spec.layout.columns}×${spec.layout.depthCount} single-file queue`
    },
    forbid: [
      "change_dimensions",
      "extra_rows",
      "stagger",
      "count_drift",
      "rotate_products"
    ]
  };
}

export function generateDynamicPrompt(formData: Partial<FormData>, currentSpec: any): string {
  const brandName = formData.brand || 'Brand';
  const productName = formData.product || 'Product';
  const standColor = formData.standBaseColor || 'white plastic';
  const materials = formData.materials || [];
  const description = formData.description || '';

  // Get material descriptions
  const materialDescription = materials.length > 0
    ? materials.map(m => m.name || m).join(', ')
    : 'professional retail materials';

  return `Transform this 3D display stand rendering by adding realistic materials and prominent branding while preserving the exact same geometry.

GEOMETRY TO PRESERVE (DO NOT CHANGE):
- Exact rectangular stand dimensions: ${currentSpec.stand.W}×${currentSpec.stand.D}×${currentSpec.stand.H} cm
- Exact single shelf placement and thickness: ${currentSpec.stand.shelfThick} cm
- All ${currentSpec.layout.depthCount} packages in same single-file straight line
- Same spacing (no gaps) between packages
- Same viewing angle and perspective

APPLY THESE BRANDING ELEMENTS:

1. ${brandName.toUpperCase()} LOGO PLACEMENT:
- Large, prominent ${brandName} logo on the stand's header/top section
- Smaller ${brandName} logo on the front base/lip of the stand
- Logos should be clearly visible and well-sized
- Use official ${brandName} brand colors and styling

2. PRODUCT BRANDING:
- Each package must show "${productName}" text clearly on the front face
- Product packages should have ${brandName} brand styling
- Make text and graphics large enough to read
- Show professional product packaging design

3. MATERIALS & FINISH:
- Stand body: ${standColor} finish with professional quality
- Materials: ${materialDescription}
- Visible structural supports and joints
- Professional retail display quality

4. LIGHTING & PRESENTATION:
- Professional studio lighting with soft shadows
- Highlight the branding elements
- Make logos and text clearly visible and readable
- Preserve any dimension labels

${description ? `\nADDITIONAL REQUIREMENTS:\n${description}` : ''}

CRITICAL: The stand geometry must remain exactly the same - only add materials and branding. Maintain the exact ${currentSpec.layout.columns}×${currentSpec.layout.depthCount} product arrangement.`;
}
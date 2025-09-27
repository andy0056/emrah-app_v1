/**
 * Stage-1 to Stage-2 Contract
 * Immutable geometry specification that Nano Banana must preserve
 */

import { SPEC_A } from "./spec";

/**
 * CONTRACT: Binding agreement between Stage-1 and Stage-2
 * Stage-2 (Nano Banana) MUST preserve all dimensions and arrangements
 */
export const CONTRACT = {
  // Exact stand dimensions in cm
  stand_cm: {
    width: 15,
    depth: 30,
    height: 30,
    shelf_thickness: 2
  },

  // Exact product dimensions in cm
  product_cm: {
    width: 13,
    height: 5,
    depth: 2.5
  },

  // Exact arrangement specification
  arrangement: {
    columns_across: 1,
    depth_count: 12,
    gaps_depth_cm: 0.0
  },

  // Camera and view requirements
  camera: "orthographic 3/4",

  // Strict prohibitions for Stage-2
  forbid: [
    "change_dimensions",
    "extra_rows",
    "stagger",
    "count_drift",
    "rotate_products",
    "add_products",
    "remove_products",
    "change_layout"
  ],

  // Verification checksum
  checksum: {
    total_products: 12,
    used_depth_cm: 12 * 2.5, // = 30cm
    verification: "1x12_zero_gaps"
  }
};

/**
 * Generate contract from spec (for dynamic specs)
 */
export function generateContract(spec: typeof SPEC_A) {
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
    camera: "orthographic 3/4",
    forbid: [
      "change_dimensions", "extra_rows", "stagger",
      "count_drift", "rotate_products", "add_products",
      "remove_products", "change_layout"
    ],
    checksum: {
      total_products: spec.layout.depthCount,
      used_depth_cm: spec.layout.depthCount * spec.product.D +
                     (spec.layout.depthCount - 1) * spec.layout.gapsDepth,
      verification: `${spec.layout.columns}x${spec.layout.depthCount}_${spec.layout.gapsDepth === 0 ? 'zero' : spec.layout.gapsDepth}_gaps`
    }
  };
}
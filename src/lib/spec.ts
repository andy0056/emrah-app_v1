/**
 * Exact geometry specification for tabletop stands
 * All measurements in centimeters (cm)
 */

export type Spec = {
  stand: { W: number; D: number; H: number; shelfThick: number }; // cm
  product: { W: number; H: number; D: number };                   // cm
  layout: { columns: number; depthCount: number; gapsDepth: number }; // cm - made flexible
  metadata?: { // Optional metadata for multi-stand support
    standType?: string;
    shelfCount?: number;
    originalHeight?: number;
  };
};

/**
 * SPEC_A: Ülker Çikolatalı Gofret tabletop stand
 * - Stand: 15W × 30D × 30H cm
 * - Product: 13W × 5H × 2.5D cm
 * - Layout: Single-file 1×12 queue, zero gaps
 */
export const SPEC_A: Spec = {
  stand: { W: 15, D: 30, H: 30, shelfThick: 2 },
  product: { W: 13, H: 5, D: 2.5 },
  layout: { columns: 1, depthCount: 12, gapsDepth: 0 }
};

/**
 * SPEC_B: Alternative with gaps (future use)
 * - Layout: Single-file 1×9 queue with 0.8cm gaps
 */
export const SPEC_B: Spec = {
  stand: { W: 15, D: 30, H: 30, shelfThick: 2 },
  product: { W: 13, H: 5, D: 2.5 },
  layout: { columns: 1, depthCount: 9, gapsDepth: 0.8 }
};
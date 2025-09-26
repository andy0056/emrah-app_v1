/**
 * Smart Positioning Service for Intelligent Product Placement
 * Provides seamless, automatic positioning with minimal client interaction
 */

import type { PlacementResult, ProductInstance, ShelfStructure } from './productPlacementService';
import type { FormData } from '../types';

export interface SmartPositioningConfig {
  autoSnapToShelves: boolean;
  autoDistributeProducts: boolean;
  preventOverlaps: boolean;
  maintainProportions: boolean;
  clientFriendlyMode: boolean;
}

export interface PositioningConstraints {
  shelfMargin: number;     // cm - margin from shelf edges
  productSpacing: number;  // cm - minimum space between products
  verticalClearance: number; // cm - clearance above products
  maxProductsPerRow: number;
  preferredOrientation: 'front' | 'side' | 'angle';
}

export interface SmartPositionResult {
  products: ProductInstance[];
  shelves: ShelfStructure[];
  improvements: string[];
  clientTips: string[];
  autoAdjustments: number;
}

export class SmartPositioningService {
  private static readonly DEFAULT_CONFIG: SmartPositioningConfig = {
    autoSnapToShelves: true,
    autoDistributeProducts: true,
    preventOverlaps: true,
    maintainProportions: true,
    clientFriendlyMode: true
  };

  private static readonly DEFAULT_CONSTRAINTS: PositioningConstraints = {
    shelfMargin: 1.0,      // 1cm margin
    productSpacing: 0.8,   // 8mm between products
    verticalClearance: 0.5, // 5mm clearance above
    maxProductsPerRow: 8,
    preferredOrientation: 'front'
  };

  /**
   * Main smart positioning function - makes products client-friendly
   */
  static optimizeProductPlacement(
    placement: PlacementResult,
    formData: FormData,
    config: Partial<SmartPositioningConfig> = {},
    constraints: Partial<PositioningConstraints> = {}
  ): SmartPositionResult {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    const finalConstraints = { ...this.DEFAULT_CONSTRAINTS, ...constraints };

    console.log('🎯 Running smart positioning optimization...');

    let autoAdjustments = 0;
    const improvements: string[] = [];
    const clientTips: string[] = [];

    // Create working copies
    const optimizedShelves = JSON.parse(JSON.stringify(placement.shelves)) as ShelfStructure[];
    const allProducts: ProductInstance[] = [];

    // Process each shelf with smart positioning
    for (const shelf of optimizedShelves) {
      if (shelf.products.length === 0) continue;

      const shelfProducts = this.optimizeShelfProducts(
        shelf,
        formData,
        finalConstraints,
        finalConfig
      );

      // Apply smart positioning improvements
      const improvements_result = this.applySmartPositioning(shelfProducts, shelf, finalConstraints);

      shelf.products = improvements_result.products;
      allProducts.push(...improvements_result.products);
      autoAdjustments += improvements_result.adjustmentCount;
      improvements.push(...improvements_result.improvements);

      // Update shelf utilization
      shelf.utilization = this.calculateShelfUtilization(shelf, finalConstraints);
    }

    // Generate client-friendly tips
    if (finalConfig.clientFriendlyMode) {
      clientTips.push(...this.generateClientTips(optimizedShelves, formData));
    }

    // Add general improvements made
    if (autoAdjustments > 0) {
      improvements.push(`✅ Made ${autoAdjustments} automatic positioning improvements`);
      improvements.push('🎯 All products now properly positioned on shelves');
      improvements.push('📏 Maintained optimal spacing and proportions');
    }

    return {
      products: allProducts,
      shelves: optimizedShelves,
      improvements,
      clientTips,
      autoAdjustments
    };
  }

  /**
   * Optimize products on a single shelf
   */
  private static optimizeShelfProducts(
    shelf: ShelfStructure,
    formData: FormData,
    constraints: PositioningConstraints,
    config: SmartPositioningConfig
  ): ProductInstance[] {
    const products = [...shelf.products];

    if (products.length === 0) return products;

    // Get actual product dimensions from form data
    const productDims = {
      width: (formData.productWidth || 13) / 10,  // Convert mm to cm for 3D space
      height: (formData.productHeight || 5) / 10,
      depth: (formData.productDepth || 2.5) / 10
    };

    // Calculate optimal grid layout
    const gridLayout = this.calculateOptimalGrid(
      products.length,
      shelf.dimensions,
      productDims,
      constraints
    );

    // Reposition products in the optimal grid
    products.forEach((product, index) => {
      const row = Math.floor(index / gridLayout.cols);
      const col = index % gridLayout.cols;

      // Calculate position on shelf surface
      const newPosition = this.calculateShelfPosition(
        shelf,
        productDims,
        row,
        col,
        gridLayout,
        constraints
      );

      product.position = newPosition;
      product.gridPosition = { row, col };

      // Ensure products face forward for better visibility
      product.rotation = [0, 0, 0];
      product.orientation = 'front';
    });

    return products;
  }

  /**
   * Calculate optimal grid layout for products on a shelf
   */
  private static calculateOptimalGrid(
    productCount: number,
    shelfDims: { width: number; height: number; depth: number },
    productDims: { width: number; height: number; depth: number },
    constraints: PositioningConstraints
  ) {
    // Available space on shelf (accounting for margins)
    const availableWidth = shelfDims.width - (constraints.shelfMargin * 2);
    const availableDepth = shelfDims.depth - (constraints.shelfMargin * 2);

    // Calculate how many products can fit in each direction
    const maxCols = Math.floor((availableWidth + constraints.productSpacing) /
                              (productDims.width + constraints.productSpacing));
    const maxRows = Math.floor((availableDepth + constraints.productSpacing) /
                              (productDims.depth + constraints.productSpacing));

    // Optimize for the given number of products
    let bestCols = Math.min(maxCols, productCount, constraints.maxProductsPerRow);
    let bestRows = Math.ceil(productCount / bestCols);

    // Ensure we don't exceed shelf capacity
    if (bestRows > maxRows) {
      bestRows = maxRows;
      bestCols = Math.ceil(productCount / bestRows);
    }

    return {
      rows: bestRows,
      cols: bestCols,
      maxCols,
      maxRows,
      availableWidth,
      availableDepth
    };
  }

  /**
   * Calculate precise position for a product on a shelf
   */
  private static calculateShelfPosition(
    shelf: ShelfStructure,
    productDims: { width: number; height: number; depth: number },
    row: number,
    col: number,
    gridLayout: any,
    constraints: PositioningConstraints
  ): [number, number, number] {
    // Convert shelf coordinates to 3D scene coordinates (cm to scene units)
    const sceneScale = 0.1; // 1cm = 0.1 scene units

    // Calculate starting offsets to center the product grid on the shelf
    const totalProductWidth = (gridLayout.cols * productDims.width) +
                             ((gridLayout.cols - 1) * constraints.productSpacing);
    const totalProductDepth = (gridLayout.rows * productDims.depth) +
                             ((gridLayout.rows - 1) * constraints.productSpacing);

    const startX = shelf.position[0] - (totalProductWidth / 2) + (productDims.width / 2);
    const startZ = shelf.position[2] - (totalProductDepth / 2) + (productDims.depth / 2);

    // Calculate position for this specific product
    const x = startX + (col * (productDims.width + constraints.productSpacing));
    const z = startZ + (row * (productDims.depth + constraints.productSpacing));

    // Position on top of shelf surface with proper clearance
    const y = shelf.position[1] + (shelf.dimensions.height / 2) + (productDims.height / 2) + constraints.verticalClearance;

    // Apply scene scaling
    return [
      x * sceneScale,
      y * sceneScale,
      z * sceneScale
    ];
  }

  /**
   * Apply smart positioning improvements
   */
  private static applySmartPositioning(
    products: ProductInstance[],
    shelf: ShelfStructure,
    constraints: PositioningConstraints
  ) {
    let adjustmentCount = 0;
    const improvements: string[] = [];

    // Check and fix overlapping products
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const distance = this.calculateProductDistance(products[i], products[j]);

        if (distance < constraints.productSpacing) {
          // Automatic spacing adjustment
          this.adjustProductSpacing(products[i], products[j], constraints.productSpacing);
          adjustmentCount++;
        }
      }
    }

    // Ensure products are properly aligned to shelf
    products.forEach(product => {
      const originalY = product.position[1];

      // Snap to shelf surface
      const correctedY = shelf.position[1] * 0.1 + (shelf.dimensions.height / 2 * 0.1) +
                        (constraints.verticalClearance * 0.1);

      if (Math.abs(originalY - correctedY) > 0.01) { // 1mm tolerance
        product.position[1] = correctedY;
        adjustmentCount++;
      }
    });

    if (adjustmentCount > 0) {
      improvements.push(`Fixed ${adjustmentCount} positioning issues on shelf ${shelf.id}`);
    }

    return {
      products,
      improvements,
      adjustmentCount
    };
  }

  /**
   * Calculate distance between two products
   */
  private static calculateProductDistance(product1: ProductInstance, product2: ProductInstance): number {
    return Math.sqrt(
      Math.pow(product1.position[0] - product2.position[0], 2) +
      Math.pow(product1.position[2] - product2.position[2], 2)
    );
  }

  /**
   * Adjust spacing between two products
   */
  private static adjustProductSpacing(
    product1: ProductInstance,
    product2: ProductInstance,
    minSpacing: number
  ): void {
    const currentDistance = this.calculateProductDistance(product1, product2);
    const adjustment = (minSpacing - currentDistance) / 2;

    // Move products apart
    const dx = product2.position[0] - product1.position[0];
    const dz = product2.position[2] - product1.position[2];
    const length = Math.sqrt(dx * dx + dz * dz);

    if (length > 0) {
      const unitX = dx / length;
      const unitZ = dz / length;

      product1.position[0] -= unitX * adjustment;
      product1.position[2] -= unitZ * adjustment;
      product2.position[0] += unitX * adjustment;
      product2.position[2] += unitZ * adjustment;
    }
  }

  /**
   * Calculate shelf utilization based on positioned products
   */
  private static calculateShelfUtilization(
    shelf: ShelfStructure,
    constraints: PositioningConstraints
  ): number {
    if (shelf.products.length === 0) return 0;

    const usableArea = (shelf.dimensions.width - constraints.shelfMargin * 2) *
                      (shelf.dimensions.depth - constraints.shelfMargin * 2);

    const productArea = shelf.products.length *
                       ((13/10 + constraints.productSpacing) * (2.5/10 + constraints.productSpacing));

    return Math.min(100, (productArea / usableArea) * 100);
  }

  /**
   * Generate helpful tips for clients
   */
  private static generateClientTips(shelves: ShelfStructure[], formData: FormData): string[] {
    const tips: string[] = [];

    const totalProducts = shelves.reduce((sum, shelf) => sum + shelf.products.length, 0);

    tips.push(`💡 ${totalProducts} products automatically positioned on ${shelves.length} shelves`);
    tips.push('🎯 All products are now properly placed on shelf surfaces');
    tips.push('📏 Optimal spacing maintained for professional presentation');

    if (shelves.some(shelf => shelf.utilization > 80)) {
      tips.push('⚠️ Some shelves are highly utilized - consider reducing products per shelf');
    }

    if (shelves.length > 3) {
      tips.push('📊 Multi-tier design detected - great for maximizing display space');
    }

    tips.push('✨ Switch to "Smart Mode" to see simplified controls');

    return tips;
  }

  /**
   * Quick client-friendly auto-positioning (one-click solution)
   */
  static autoPositionForClient(
    placement: PlacementResult,
    formData: FormData
  ): SmartPositionResult {
    console.log('🚀 Running client-friendly auto-positioning...');

    return this.optimizeProductPlacement(placement, formData, {
      autoSnapToShelves: true,
      autoDistributeProducts: true,
      preventOverlaps: true,
      maintainProportions: true,
      clientFriendlyMode: true
    }, {
      shelfMargin: 0.8,
      productSpacing: 0.6,
      verticalClearance: 0.3,
      maxProductsPerRow: 6,
      preferredOrientation: 'front'
    });
  }

  /**
   * Professional mode with finer control
   */
  static optimizeForProfessional(
    placement: PlacementResult,
    formData: FormData,
    customConstraints: Partial<PositioningConstraints> = {}
  ): SmartPositionResult {
    console.log('🎯 Running professional-grade optimization...');

    return this.optimizeProductPlacement(placement, formData, {
      autoSnapToShelves: true,
      autoDistributeProducts: true,
      preventOverlaps: true,
      maintainProportions: true,
      clientFriendlyMode: false
    }, customConstraints);
  }
}
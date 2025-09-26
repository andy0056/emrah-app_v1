/**
 * Product Placement Service
 *
 * Handles intelligent 3D product placement on shelves with precise positioning,
 * optimal spacing algorithms, and manufacturing-ready specifications.
 */

import * as THREE from 'three';
import type { FormData } from '../types';

export interface ProductInstance {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  shelfIndex: number;
  gridPosition: { row: number; col: number };
  orientation: 'front' | 'side' | 'angle';
}

export interface ShelfStructure {
  id: string;
  position: [number, number, number];
  dimensions: { width: number; height: number; depth: number };
  products: ProductInstance[];
  capacity: number;
  utilization: number;
}

export interface PlacementResult {
  shelves: ShelfStructure[];
  totalProducts: number;
  overallUtilization: number;
  manufacturingSpecs: ManufacturingSpecs;
  placementErrors: string[];
}

export interface ManufacturingSpecs {
  shelfSpacing: number;
  productSpacing: { x: number; z: number };
  supportStructure: {
    verticalSupports: [number, number, number][];
    horizontalBeams: { start: [number, number, number]; end: [number, number, number] }[];
  };
  materialUsage: {
    shelfMaterial: number; // square cm
    supportMaterial: number; // linear cm
  };
}

export class ProductPlacementService {
  /**
   * Generate intelligent product placement from form data
   */
  static generatePlacement(formData: FormData): PlacementResult {
    console.log('🎯 Generating intelligent product placement...');

    const errors: string[] = [];

    // Parse form data
    const standDims = {
      width: formData.standWidth,
      depth: formData.standDepth,
      height: formData.standHeight
    };

    const productDims = {
      width: formData.productWidth,
      height: formData.productHeight,
      depth: formData.productDepth
    };

    const shelfDims = {
      width: formData.shelfWidth,
      depth: formData.shelfDepth
    };

    // Calculate optimal shelf spacing
    const shelfSpacing = this.calculateOptimalShelfSpacing(
      standDims.height,
      formData.shelfCount,
      productDims.height
    );

    // Generate shelf structures
    const shelves = this.generateShelfStructures(
      formData.shelfCount,
      shelfDims,
      shelfSpacing,
      standDims
    );

    // Calculate products per shelf based on form data
    const productsPerShelf = this.calculateProductsPerShelf(
      formData.frontFaceCount,
      formData.backToBackCount,
      formData.shelfCount
    );

    // Place products on each shelf
    let totalProducts = 0;
    shelves.forEach((shelf, index) => {
      const shelfProducts = this.placeProductsOnShelf(
        shelf,
        productDims,
        productsPerShelf,
        index
      );
      shelf.products = shelfProducts;
      shelf.capacity = productsPerShelf;
      shelf.utilization = (shelfProducts.length / productsPerShelf) * 100;
      totalProducts += shelfProducts.length;
    });

    // Generate manufacturing specifications
    const manufacturingSpecs = this.generateManufacturingSpecs(
      shelves,
      standDims,
      shelfSpacing,
      productDims
    );

    // Calculate overall utilization
    const maxCapacity = formData.shelfCount * productsPerShelf;
    const overallUtilization = (totalProducts / maxCapacity) * 100;

    console.log('✅ Product placement generated:', {
      totalProducts,
      overallUtilization: `${overallUtilization.toFixed(1)}%`,
      shelfCount: shelves.length,
      averageProductsPerShelf: totalProducts / shelves.length
    });

    return {
      shelves,
      totalProducts,
      overallUtilization,
      manufacturingSpecs,
      placementErrors: errors
    };
  }

  /**
   * Calculate optimal spacing between shelves
   */
  private static calculateOptimalShelfSpacing(
    totalHeight: number,
    shelfCount: number,
    productHeight: number
  ): number {
    // Reserve space for structure (top/bottom margins)
    const structuralReserve = Math.max(4, totalHeight * 0.1);
    const availableHeight = totalHeight - structuralReserve;

    // Calculate spacing ensuring products fit comfortably
    const minClearance = Math.max(1, productHeight * 0.2); // 20% clearance above products
    const requiredPerShelf = productHeight + minClearance;

    return Math.max(requiredPerShelf, availableHeight / shelfCount);
  }

  /**
   * Generate shelf structures with precise positioning
   */
  private static generateShelfStructures(
    shelfCount: number,
    shelfDims: { width: number; depth: number },
    shelfSpacing: number,
    standDims: { width: number; depth: number; height: number }
  ): ShelfStructure[] {
    const shelves: ShelfStructure[] = [];
    const shelfThickness = 2; // cm

    for (let i = 0; i < shelfCount; i++) {
      // Calculate Y position (height) for each shelf
      const yPosition = (i + 0.5) * shelfSpacing;

      const shelf: ShelfStructure = {
        id: `shelf-${i}`,
        position: [0, yPosition, 0], // Centered horizontally
        dimensions: {
          width: shelfDims.width,
          height: shelfThickness,
          depth: shelfDims.depth
        },
        products: [],
        capacity: 0,
        utilization: 0
      };

      shelves.push(shelf);
    }

    return shelves;
  }

  /**
   * Calculate how many products should be placed per shelf
   */
  private static calculateProductsPerShelf(
    frontFaceCount: number,
    backToBackCount: number,
    shelfCount: number
  ): number {
    // Total products = frontFaceCount × backToBackCount
    const totalProducts = frontFaceCount * backToBackCount;

    // Distribute evenly across shelves
    return Math.ceil(totalProducts / shelfCount);
  }

  /**
   * Place products on a single shelf with optimal spacing
   */
  private static placeProductsOnShelf(
    shelf: ShelfStructure,
    productDims: { width: number; height: number; depth: number },
    targetCount: number,
    shelfIndex: number
  ): ProductInstance[] {
    const products: ProductInstance[] = [];

    // Calculate optimal grid layout
    const gridLayout = this.calculateOptimalGrid(
      shelf.dimensions,
      productDims,
      targetCount
    );

    let productId = 0;

    // Place products in grid pattern
    for (let row = 0; row < gridLayout.rows; row++) {
      for (let col = 0; col < gridLayout.cols; col++) {
        if (products.length >= targetCount) break;

        // Calculate position relative to shelf center
        const xOffset = (col - (gridLayout.cols - 1) / 2) * gridLayout.spacing.x;
        const zOffset = (row - (gridLayout.rows - 1) / 2) * gridLayout.spacing.z;

        const product: ProductInstance = {
          id: `product-${shelfIndex}-${productId++}`,
          position: [
            shelf.position[0] + xOffset,
            shelf.position[1] + shelf.dimensions.height / 2 + productDims.height / 2,
            shelf.position[2] + zOffset
          ],
          rotation: [0, 0, 0], // Front-facing by default
          shelfIndex,
          gridPosition: { row, col },
          orientation: 'front'
        };

        products.push(product);
      }
      if (products.length >= targetCount) break;
    }

    return products;
  }

  /**
   * Calculate optimal grid layout for products on shelf
   */
  private static calculateOptimalGrid(
    shelfDims: { width: number; depth: number },
    productDims: { width: number; depth: number },
    targetCount: number
  ): { rows: number; cols: number; spacing: { x: number; z: number } } {
    // Minimum spacing between products (accessibility and visual clarity)
    const minSpacing = Math.max(0.5, Math.min(productDims.width, productDims.depth) * 0.1);

    // Calculate how many products fit in each dimension
    const maxCols = Math.floor(shelfDims.width / (productDims.width + minSpacing));
    const maxRows = Math.floor(shelfDims.depth / (productDims.depth + minSpacing));

    // Find optimal arrangement that accommodates target count
    let bestLayout = { rows: 1, cols: targetCount };
    let bestRatio = Infinity;

    for (let cols = 1; cols <= Math.min(maxCols, targetCount); cols++) {
      const rows = Math.ceil(targetCount / cols);
      if (rows <= maxRows) {
        const ratio = Math.abs((cols / rows) - (shelfDims.width / shelfDims.depth));
        if (ratio < bestRatio) {
          bestRatio = ratio;
          bestLayout = { rows, cols };
        }
      }
    }

    // Calculate actual spacing to center the grid
    const totalProductWidth = bestLayout.cols * productDims.width;
    const totalProductDepth = bestLayout.rows * productDims.depth;

    const spacingX = bestLayout.cols > 1
      ? (shelfDims.width - totalProductWidth) / (bestLayout.cols - 1)
      : productDims.width + minSpacing;

    const spacingZ = bestLayout.rows > 1
      ? (shelfDims.depth - totalProductDepth) / (bestLayout.rows - 1)
      : productDims.depth + minSpacing;

    return {
      rows: bestLayout.rows,
      cols: bestLayout.cols,
      spacing: {
        x: spacingX,
        z: spacingZ
      }
    };
  }

  /**
   * Generate manufacturing specifications
   */
  private static generateManufacturingSpecs(
    shelves: ShelfStructure[],
    standDims: { width: number; depth: number; height: number },
    shelfSpacing: number,
    productDims: { width: number; height: number; depth: number }
  ): ManufacturingSpecs {
    // Calculate support structure
    const verticalSupports: [number, number, number][] = [
      [-standDims.width/2, 0, -standDims.depth/2], // Back left
      [standDims.width/2, 0, -standDims.depth/2],  // Back right
      [-standDims.width/2, 0, standDims.depth/2],  // Front left
      [standDims.width/2, 0, standDims.depth/2]    // Front right
    ];

    const horizontalBeams: { start: [number, number, number]; end: [number, number, number] }[] = [];

    // Add horizontal beams for each shelf
    shelves.forEach(shelf => {
      const y = shelf.position[1];
      horizontalBeams.push(
        { start: [-standDims.width/2, y, -standDims.depth/2], end: [standDims.width/2, y, -standDims.depth/2] },
        { start: [-standDims.width/2, y, standDims.depth/2], end: [standDims.width/2, y, standDims.depth/2] },
        { start: [-standDims.width/2, y, -standDims.depth/2], end: [-standDims.width/2, y, standDims.depth/2] },
        { start: [standDims.width/2, y, -standDims.depth/2], end: [standDims.width/2, y, standDims.depth/2] }
      );
    });

    // Calculate material usage
    const shelfMaterial = shelves.length * standDims.width * standDims.depth; // cm²
    const supportMaterial = (verticalSupports.length * standDims.height) +
                           (horizontalBeams.length * standDims.width); // cm

    return {
      shelfSpacing,
      productSpacing: {
        x: productDims.width + 0.8, // Based on optimal spacing calculation
        z: productDims.depth + 0.8
      },
      supportStructure: {
        verticalSupports,
        horizontalBeams
      },
      materialUsage: {
        shelfMaterial,
        supportMaterial
      }
    };
  }

  /**
   * Update product position (for manual adjustments)
   */
  static updateProductPosition(
    placement: PlacementResult,
    productId: string,
    newPosition: [number, number, number]
  ): PlacementResult {
    const updatedPlacement = { ...placement };

    // Find and update the product
    for (const shelf of updatedPlacement.shelves) {
      const product = shelf.products.find(p => p.id === productId);
      if (product) {
        product.position = newPosition;
        break;
      }
    }

    return updatedPlacement;
  }

  /**
   * Validate placement constraints
   */
  static validatePlacement(placement: PlacementResult): string[] {
    const errors: string[] = [];

    placement.shelves.forEach((shelf, index) => {
      // Check for overlapping products
      for (let i = 0; i < shelf.products.length; i++) {
        for (let j = i + 1; j < shelf.products.length; j++) {
          const product1 = shelf.products[i];
          const product2 = shelf.products[j];

          const distance = Math.sqrt(
            Math.pow(product1.position[0] - product2.position[0], 2) +
            Math.pow(product1.position[2] - product2.position[2], 2)
          );

          if (distance < 1.0) { // Minimum 1cm separation
            errors.push(`Products ${product1.id} and ${product2.id} on shelf ${index} are too close`);
          }
        }
      }

      // Check shelf capacity
      if (shelf.utilization > 95) {
        errors.push(`Shelf ${index} is overcrowded (${shelf.utilization.toFixed(1)}% utilization)`);
      }
    });

    return errors;
  }
}
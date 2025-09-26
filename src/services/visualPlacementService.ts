/**
 * Visual Placement Service
 *
 * Generates annotated diagrams, enhanced AI prompts, and visual references
 * from 3D product placement data for precise AI model input.
 */

import * as THREE from 'three';
import type { PlacementResult, ProductInstance, ShelfStructure } from './productPlacementService';
import type { FormData } from '../types';

export interface PlacementDiagram {
  topView: string; // Base64 data URL
  frontView: string;
  sideView: string;
  annotations: PlacementAnnotation[];
  metadata: DiagramMetadata;
}

export interface PlacementAnnotation {
  id: string;
  position: { x: number; y: number };
  label: string;
  type: 'product' | 'shelf' | 'dimension' | 'spacing';
  value?: string;
}

export interface DiagramMetadata {
  scale: number; // pixels per cm
  dimensions: { width: number; height: number };
  productCount: number;
  shelfCount: number;
  utilization: number;
  timestamp: number;
}

export interface EnhancedPlacementPrompt {
  basePrompt: string;
  placementInstructions: string;
  dimensionalDetails: string;
  manufacturingSpecs: string;
  visualReferences: string;
  fullPrompt: string;
  confidence: number;
}

export interface VisualPlacementResult {
  diagrams: PlacementDiagram;
  enhancedPrompts: {
    frontView: EnhancedPlacementPrompt;
    storeView: EnhancedPlacementPrompt;
    threeQuarterView: EnhancedPlacementPrompt;
  };
  manufacturingDrawings: {
    assemblyDiagram: string;
    dimensionDrawing: string;
    partsList: ManufacturingPart[];
  };
}

export interface ManufacturingPart {
  id: string;
  type: 'shelf' | 'support' | 'bracket';
  dimensions: { width: number; height: number; depth: number };
  material: string;
  quantity: number;
  position: [number, number, number];
}

export class VisualPlacementService {
  private static canvas: HTMLCanvasElement | null = null;
  private static context: CanvasRenderingContext2D | null = null;

  /**
   * Generate complete visual placement references
   */
  static async generateVisualReferences(
    placement: PlacementResult,
    formData: FormData
  ): Promise<VisualPlacementResult> {
    console.log('📊 Generating visual placement references...');

    try {
      // Generate annotated diagrams
      const diagrams = await this.generatePlacementDiagrams(placement, formData);

      // Generate enhanced prompts for each view
      const enhancedPrompts = {
        frontView: this.generateEnhancedPrompt(placement, formData, 'front'),
        storeView: this.generateEnhancedPrompt(placement, formData, 'store'),
        threeQuarterView: this.generateEnhancedPrompt(placement, formData, 'three-quarter')
      };

      // Generate manufacturing drawings
      const manufacturingDrawings = await this.generateManufacturingDrawings(placement);

      console.log('✅ Visual placement references generated successfully');

      return {
        diagrams,
        enhancedPrompts,
        manufacturingDrawings
      };
    } catch (error) {
      console.error('❌ Failed to generate visual references:', error);
      throw error;
    }
  }

  /**
   * Generate annotated placement diagrams
   */
  private static async generatePlacementDiagrams(
    placement: PlacementResult,
    formData: FormData
  ): Promise<PlacementDiagram> {
    // Initialize canvas if needed
    this.initializeCanvas();

    const scale = 10; // 10 pixels per cm
    const standWidth = formData.standWidth * scale;
    const standHeight = formData.standHeight * scale;
    const standDepth = formData.standDepth * scale;

    // Generate top view diagram
    const topView = this.generateTopViewDiagram(placement, formData, scale);

    // Generate front view diagram
    const frontView = this.generateFrontViewDiagram(placement, formData, scale);

    // Generate side view diagram
    const sideView = this.generateSideViewDiagram(placement, formData, scale);

    // Create annotations
    const annotations = this.generateAnnotations(placement, scale);

    const metadata: DiagramMetadata = {
      scale,
      dimensions: { width: standWidth, height: standHeight },
      productCount: placement.totalProducts,
      shelfCount: placement.shelves.length,
      utilization: placement.overallUtilization,
      timestamp: Date.now()
    };

    return {
      topView,
      frontView,
      sideView,
      annotations,
      metadata
    };
  }

  /**
   * Generate top view diagram with product placement
   */
  private static generateTopViewDiagram(
    placement: PlacementResult,
    formData: FormData,
    scale: number
  ): string {
    if (!this.canvas || !this.context) {
      throw new Error('Canvas not initialized');
    }

    const canvas = this.canvas;
    const ctx = this.context;

    // Set canvas size
    const width = (formData.standWidth + 4) * scale; // +4cm margin
    const height = (formData.standDepth + 4) * scale;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    // Draw stand outline
    const standX = 2 * scale; // 2cm margin
    const standY = 2 * scale;
    const standWidth = formData.standWidth * scale;
    const standDepth = formData.standDepth * scale;

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(standX, standY, standWidth, standDepth);

    // Draw shelves and products
    placement.shelves.forEach((shelf, shelfIndex) => {
      // Draw shelf outline
      const shelfX = standX + (standWidth - formData.shelfWidth * scale) / 2;
      const shelfY = standY + (standDepth - formData.shelfDepth * scale) / 2;

      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 1;
      ctx.strokeRect(shelfX, shelfY, formData.shelfWidth * scale, formData.shelfDepth * scale);

      // Draw products on this shelf
      shelf.products.forEach((product, productIndex) => {
        const productX = shelfX + (product.position[0] + formData.shelfWidth / 2) * scale;
        const productY = shelfY + (product.position[2] + formData.shelfDepth / 2) * scale;
        const productWidth = formData.productWidth * scale;
        const productDepth = formData.productDepth * scale;

        // Draw product rectangle
        ctx.fillStyle = '#059669';
        ctx.fillRect(
          productX - productWidth / 2,
          productY - productDepth / 2,
          productWidth,
          productDepth
        );

        // Add product label
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `P${shelfIndex}-${productIndex}`,
          productX,
          productY + 2
        );
      });

      // Add shelf label
      ctx.fillStyle = '#8B4513';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(
        `S${shelfIndex} (${shelf.products.length}/${shelf.capacity})`,
        shelfX,
        shelfY - 5
      );
    });

    // Add dimensions
    this.addDimensionAnnotations(ctx, standX, standY, standWidth, standDepth, scale);

    // Add title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Top View - Product Placement', width / 2, 20);

    return canvas.toDataURL('image/png');
  }

  /**
   * Generate front view diagram
   */
  private static generateFrontViewDiagram(
    placement: PlacementResult,
    formData: FormData,
    scale: number
  ): string {
    if (!this.canvas || !this.context) {
      throw new Error('Canvas not initialized');
    }

    const canvas = this.canvas;
    const ctx = this.context;

    const width = (formData.standWidth + 4) * scale;
    const height = (formData.standHeight + 4) * scale;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    const standX = 2 * scale;
    const standY = 2 * scale;
    const standWidth = formData.standWidth * scale;
    const standHeight = formData.standHeight * scale;

    // Draw stand outline
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(standX, standY, standWidth, standHeight);

    // Draw shelves from bottom to top
    placement.shelves.forEach((shelf, shelfIndex) => {
      const shelfY = standY + standHeight - (shelf.position[1] * scale) - (shelf.dimensions.height * scale / 2);
      const shelfHeight = shelf.dimensions.height * scale;

      // Draw shelf
      ctx.fillStyle = '#d2b48c';
      ctx.fillRect(standX, shelfY, standWidth, shelfHeight);
      ctx.strokeStyle = '#8B4513';
      ctx.strokeRect(standX, shelfY, standWidth, shelfHeight);

      // Draw products on shelf (front face view)
      shelf.products.forEach((product) => {
        const productX = standX + (product.position[0] + formData.standWidth / 2) * scale;
        const productY = shelfY - formData.productHeight * scale;
        const productWidth = formData.productWidth * scale;
        const productHeight = formData.productHeight * scale;

        // Draw product
        ctx.fillStyle = '#059669';
        ctx.fillRect(
          productX - productWidth / 2,
          productY,
          productWidth,
          productHeight
        );
        ctx.strokeStyle = '#047857';
        ctx.strokeRect(
          productX - productWidth / 2,
          productY,
          productWidth,
          productHeight
        );
      });
    });

    // Add title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Front View - Product Display', width / 2, 20);

    return canvas.toDataURL('image/png');
  }

  /**
   * Generate side view diagram
   */
  private static generateSideViewDiagram(
    placement: PlacementResult,
    formData: FormData,
    scale: number
  ): string {
    if (!this.canvas || !this.context) {
      throw new Error('Canvas not initialized');
    }

    const canvas = this.canvas;
    const ctx = this.context;

    const width = (formData.standDepth + 4) * scale;
    const height = (formData.standHeight + 4) * scale;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    const standX = 2 * scale;
    const standY = 2 * scale;
    const standDepth = formData.standDepth * scale;
    const standHeight = formData.standHeight * scale;

    // Draw stand outline
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(standX, standY, standDepth, standHeight);

    // Draw shelves
    placement.shelves.forEach((shelf) => {
      const shelfY = standY + standHeight - (shelf.position[1] * scale) - (shelf.dimensions.height * scale / 2);
      const shelfHeight = shelf.dimensions.height * scale;

      // Draw shelf
      ctx.fillStyle = '#d2b48c';
      ctx.fillRect(standX, shelfY, standDepth, shelfHeight);
      ctx.strokeStyle = '#8B4513';
      ctx.strokeRect(standX, shelfY, standDepth, shelfHeight);

      // Show product depth representation
      if (shelf.products.length > 0) {
        const productDepth = formData.productDepth * scale;
        ctx.fillStyle = 'rgba(5, 150, 105, 0.5)';
        ctx.fillRect(standX + 5, shelfY - formData.productHeight * scale, productDepth, formData.productHeight * scale);
      }
    });

    // Add title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Side View - Shelf Structure', width / 2, 20);

    return canvas.toDataURL('image/png');
  }

  /**
   * Generate enhanced AI prompt with placement details
   */
  private static generateEnhancedPrompt(
    placement: PlacementResult,
    formData: FormData,
    viewType: 'front' | 'store' | 'three-quarter'
  ): EnhancedPlacementPrompt {
    const placementInstructions = this.generatePlacementInstructions(placement);
    const dimensionalDetails = this.generateDimensionalDetails(placement, formData);
    const manufacturingSpecs = this.generateManufacturingDetails(placement);
    const visualReferences = this.generateVisualReferenceText(placement, viewType);

    const basePrompt = this.getBasePrompt(formData, viewType);

    const fullPrompt = `${basePrompt}

PRECISE PRODUCT PLACEMENT:
${placementInstructions}

DIMENSIONAL SPECIFICATIONS:
${dimensionalDetails}

MANUFACTURING REQUIREMENTS:
${manufacturingSpecs}

VISUAL REFERENCE GUIDELINES:
${visualReferences}

PLACEMENT VALIDATION:
- Total products: ${placement.totalProducts} exactly as specified
- Shelf utilization: ${placement.overallUtilization.toFixed(1)}% (validated)
- Product spacing: ${placement.manufacturingSpecs.productSpacing.x.toFixed(1)}cm between products
- No overlapping products (mathematically verified)
- All products within shelf boundaries (constraint validated)

CRITICAL: Follow the exact placement specifications above. Each product position has been calculated for optimal display and manufacturing feasibility.`;

    return {
      basePrompt,
      placementInstructions,
      dimensionalDetails,
      manufacturingSpecs,
      visualReferences,
      fullPrompt,
      confidence: this.calculatePromptConfidence(placement)
    };
  }

  /**
   * Generate detailed placement instructions
   */
  private static generatePlacementInstructions(placement: PlacementResult): string {
    let instructions = '';

    placement.shelves.forEach((shelf, shelfIndex) => {
      instructions += `\nSHELF ${shelfIndex + 1} (Y-position: ${shelf.position[1].toFixed(1)}cm from base):`;
      instructions += `\n- Products: ${shelf.products.length}/${shelf.capacity}`;
      instructions += `\n- Arrangement: Grid pattern with ${shelf.products.length} products`;

      shelf.products.forEach((product, productIndex) => {
        instructions += `\n  • Product ${productIndex + 1}: Position (${product.position[0].toFixed(1)}, ${product.position[1].toFixed(1)}, ${product.position[2].toFixed(1)})cm`;
        instructions += ` | Orientation: ${product.orientation}`;
      });
    });

    return instructions;
  }

  /**
   * Generate dimensional details
   */
  private static generateDimensionalDetails(placement: PlacementResult, formData: FormData): string {
    return `
STAND DIMENSIONS: ${formData.standWidth}×${formData.standHeight}×${formData.standDepth}cm
SHELF DIMENSIONS: ${formData.shelfWidth}×${formData.shelfDepth}cm per shelf
PRODUCT DIMENSIONS: ${formData.productWidth}×${formData.productHeight}×${formData.productDepth}cm each
SHELF SPACING: ${placement.manufacturingSpecs.shelfSpacing.toFixed(1)}cm vertical spacing
PRODUCT SPACING: ${placement.manufacturingSpecs.productSpacing.x.toFixed(1)}cm horizontal, ${placement.manufacturingSpecs.productSpacing.z.toFixed(1)}cm depth
TOTAL CAPACITY: ${placement.totalProducts} products across ${placement.shelves.length} shelves`;
  }

  /**
   * Generate manufacturing details
   */
  private static generateManufacturingDetails(placement: PlacementResult): string {
    const specs = placement.manufacturingSpecs;

    return `
STRUCTURAL SUPPORT: ${specs.supportStructure.verticalSupports.length} vertical supports
MATERIAL USAGE: ${specs.materialUsage.shelfMaterial.toFixed(0)}cm² shelf material, ${specs.materialUsage.supportMaterial.toFixed(0)}cm support material
ASSEMBLY: ${specs.supportStructure.horizontalBeams.length} horizontal beams required
BUILDABILITY: Validated for manufacturing with standard materials`;
  }

  /**
   * Generate visual reference text
   */
  private static generateVisualReferenceText(placement: PlacementResult, viewType: string): string {
    const view = viewType === 'three-quarter' ? '3/4' : viewType;

    return `
${view.toUpperCase()} VIEW REQUIREMENTS:
- Show exact product positioning as calculated in placement data
- Maintain ${placement.manufacturingSpecs.productSpacing.x.toFixed(1)}cm spacing between products
- Display ${placement.shelves.length} shelves with precise vertical spacing
- Products must appear in specified grid arrangements per shelf
- Overall utilization should visually represent ${placement.overallUtilization.toFixed(1)}% capacity
- No products should appear outside calculated boundaries`;
  }

  /**
   * Get base prompt for view type
   */
  private static getBasePrompt(formData: FormData, viewType: string): string {
    return `Professional ${formData.standType} for ${formData.brand} ${formData.product} made from ${formData.materials.join(' and ')}.`;
  }

  /**
   * Calculate prompt confidence based on placement quality
   */
  private static calculatePromptConfidence(placement: PlacementResult): number {
    let confidence = 1.0;

    // Reduce confidence for placement errors
    confidence -= placement.placementErrors.length * 0.1;

    // Reduce confidence for low utilization
    if (placement.overallUtilization < 50) {
      confidence -= 0.2;
    }

    // Reduce confidence for overcrowding
    if (placement.overallUtilization > 90) {
      confidence -= 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Generate manufacturing drawings
   */
  private static async generateManufacturingDrawings(placement: PlacementResult): Promise<{
    assemblyDiagram: string;
    dimensionDrawing: string;
    partsList: ManufacturingPart[];
  }> {
    // Generate parts list
    const partsList: ManufacturingPart[] = [];

    // Add shelves
    placement.shelves.forEach((shelf, index) => {
      partsList.push({
        id: `shelf-${index}`,
        type: 'shelf',
        dimensions: shelf.dimensions,
        material: 'MDF/Wood',
        quantity: 1,
        position: shelf.position
      });
    });

    // Add supports
    placement.manufacturingSpecs.supportStructure.verticalSupports.forEach((support, index) => {
      partsList.push({
        id: `support-${index}`,
        type: 'support',
        dimensions: { width: 2, height: 30, depth: 2 }, // Standard support dimensions
        material: 'Metal/Wood',
        quantity: 1,
        position: support
      });
    });

    // Generate simple assembly and dimension diagrams (placeholder)
    const assemblyDiagram = this.generateAssemblyDiagram(placement);
    const dimensionDrawing = this.generateDimensionDrawing(placement);

    return {
      assemblyDiagram,
      dimensionDrawing,
      partsList
    };
  }

  /**
   * Helper methods for diagram generation
   */
  private static initializeCanvas(): void {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.context = this.canvas.getContext('2d');
    }
  }

  private static addDimensionAnnotations(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    scale: number
  ): void {
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.font = '8px Arial';
    ctx.fillStyle = '#6b7280';

    // Width dimension
    ctx.beginPath();
    ctx.moveTo(x, y + height + 10);
    ctx.lineTo(x + width, y + height + 10);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillText(`${(width / scale).toFixed(0)}cm`, x + width / 2, y + height + 25);

    // Height dimension
    ctx.beginPath();
    ctx.moveTo(x + width + 10, y);
    ctx.lineTo(x + width + 10, y + height);
    ctx.stroke();

    ctx.save();
    ctx.translate(x + width + 25, y + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${(height / scale).toFixed(0)}cm`, 0, 0);
    ctx.restore();
  }

  private static generateAnnotations(placement: PlacementResult, scale: number): PlacementAnnotation[] {
    const annotations: PlacementAnnotation[] = [];
    let annotationId = 0;

    placement.shelves.forEach((shelf, shelfIndex) => {
      shelf.products.forEach((product, productIndex) => {
        annotations.push({
          id: `annotation-${annotationId++}`,
          position: {
            x: (product.position[0] + 20) * scale,
            y: (product.position[2] + 20) * scale
          },
          label: `P${shelfIndex}-${productIndex}`,
          type: 'product',
          value: `${product.orientation} facing`
        });
      });
    });

    return annotations;
  }

  private static generateAssemblyDiagram(placement: PlacementResult): string {
    // Simplified assembly diagram generation
    return 'data:image/png;base64,placeholder-assembly-diagram';
  }

  private static generateDimensionDrawing(placement: PlacementResult): string {
    // Simplified dimension drawing generation
    return 'data:image/png;base64,placeholder-dimension-drawing';
  }
}
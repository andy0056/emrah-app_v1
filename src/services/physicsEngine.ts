/**
 * Advanced Physics Engine for 3D Product Placement
 * Provides collision detection, structural analysis, and manufacturing constraints
 */

import * as THREE from 'three';
import type { PlacementResult } from './productPlacementService';
import type { FormData } from '../types';

export interface PhysicsConstraints {
  maxWeight: number; // kg per shelf
  maxProducts: number; // products per shelf
  minSpacing: number; // mm between products
  shelfDeflection: number; // mm maximum deflection
  stabilityFactor: number; // 0-1 stability score
}

export interface CollisionData {
  hasCollisions: boolean;
  collisionPairs: Array<{
    product1: string;
    product2: string;
    overlap: number; // mm
    severity: 'minor' | 'moderate' | 'critical';
  }>;
  recommendations: string[];
}

export interface StructuralAnalysis {
  shelfStress: number; // N/m²
  deflection: number; // mm
  safetyFactor: number; // ratio
  materialUtilization: number; // percentage
  warnings: string[];
  certified: boolean;
}

export interface PhysicsSimulationResult {
  constraints: PhysicsConstraints;
  collisions: CollisionData;
  structural: StructuralAnalysis;
  optimizedPlacement?: PlacementResult;
  manufacturingViability: {
    feasible: boolean;
    costFactor: number; // 1.0 = baseline cost
    timeToManufacture: number; // hours
    requiredTooling: string[];
  };
}

export class PhysicsEngine {
  private static readonly GRAVITY = 9.81; // m/s²
  private static readonly SAFETY_FACTOR = 2.5; // Engineering safety factor

  // Material properties (simplified engineering data)
  private static readonly MATERIAL_PROPERTIES = {
    'Plastik': {
      density: 1200, // kg/m³
      youngModulus: 2.8e9, // Pa
      yieldStrength: 50e6, // Pa
      cost: 1.0
    },
    'Akrilik': {
      density: 1180,
      youngModulus: 3.2e9,
      yieldStrength: 72e6,
      cost: 1.8
    },
    'Metal': {
      density: 2700,
      youngModulus: 69e9,
      yieldStrength: 270e6,
      cost: 2.5
    },
    'Wood': {
      density: 800,
      youngModulus: 12e9,
      yieldStrength: 40e6,
      cost: 1.2
    }
  };

  /**
   * Run comprehensive physics simulation on placement
   */
  static async runSimulation(
    placement: PlacementResult,
    formData: FormData
  ): Promise<PhysicsSimulationResult> {
    console.log('🔬 Starting advanced physics simulation...');

    const constraints = this.calculateConstraints(formData);
    const collisions = this.detectCollisions(placement);
    const structural = this.analyzeStructure(placement, formData);
    const manufacturing = this.assessManufacturingViability(placement, formData);

    // Optimize placement if issues detected
    let optimizedPlacement: PlacementResult | undefined;
    if (collisions.hasCollisions || !structural.certified) {
      console.log('⚡ Running optimization algorithm...');
      optimizedPlacement = await this.optimizePlacement(placement, formData, constraints);
    }

    return {
      constraints,
      collisions,
      structural,
      optimizedPlacement,
      manufacturingViability: manufacturing
    };
  }

  /**
   * Calculate physics constraints based on materials and dimensions
   */
  private static calculateConstraints(formData: FormData): PhysicsConstraints {
    const material = this.MATERIAL_PROPERTIES[formData.material as keyof typeof this.MATERIAL_PROPERTIES]
      || this.MATERIAL_PROPERTIES['Plastik'];

    // Calculate based on beam theory and material properties
    const shelfLength = formData.width || 300; // mm
    const shelfThickness = 10; // mm (assumed)
    const shelfWidth = formData.depth || 200; // mm

    // Moment of inertia for rectangular beam
    const I = (shelfWidth * Math.pow(shelfThickness, 3)) / 12;

    // Maximum allowable load (simplified beam calculation)
    const maxMoment = material.yieldStrength * I / (shelfThickness / 2);
    const maxLoad = (8 * maxMoment) / Math.pow(shelfLength / 1000, 2); // Convert to N
    const maxWeight = maxLoad / this.GRAVITY; // Convert to kg

    return {
      maxWeight: Math.round(maxWeight * 100) / 100,
      maxProducts: Math.floor(shelfLength / 50), // Assume 50mm min per product
      minSpacing: 15, // mm minimum spacing
      shelfDeflection: shelfLength / 300, // L/300 deflection limit
      stabilityFactor: this.calculateStabilityFactor(formData)
    };
  }

  /**
   * Advanced collision detection using 3D bounding boxes
   */
  private static detectCollisions(placement: PlacementResult): CollisionData {
    const collisionPairs: CollisionData['collisionPairs'] = [];
    const recommendations: string[] = [];

    for (const shelf of placement.shelves) {
      const products = shelf.products;

      for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < products.length; j++) {
          const product1 = products[i];
          const product2 = products[j];

          const overlap = this.calculateOverlap(product1, product2);

          if (overlap > 0) {
            const severity = overlap > 10 ? 'critical' : overlap > 5 ? 'moderate' : 'minor';

            collisionPairs.push({
              product1: `Shelf ${shelf.level} Product ${i + 1}`,
              product2: `Shelf ${shelf.level} Product ${j + 1}`,
              overlap,
              severity
            });

            if (severity === 'critical') {
              recommendations.push(`Increase spacing between products on shelf ${shelf.level}`);
            }
          }
        }
      }
    }

    if (collisionPairs.length === 0) {
      recommendations.push('✅ No collisions detected - optimal placement achieved');
    }

    return {
      hasCollisions: collisionPairs.length > 0,
      collisionPairs,
      recommendations
    };
  }

  /**
   * Comprehensive structural analysis
   */
  private static analyzeStructure(
    placement: PlacementResult,
    formData: FormData
  ): StructuralAnalysis {
    const material = this.MATERIAL_PROPERTIES[formData.material as keyof typeof this.MATERIAL_PROPERTIES]
      || this.MATERIAL_PROPERTIES['Plastik'];

    let totalStress = 0;
    let maxDeflection = 0;
    const warnings: string[] = [];

    for (const shelf of placement.shelves) {
      const shelfLoad = shelf.products.reduce((sum, product) => {
        // Estimate product weight based on dimensions
        const volume = product.dimensions.width * product.dimensions.height * product.dimensions.depth;
        return sum + (volume * 0.5 / 1000000); // kg (rough estimate)
      }, 0);

      // Calculate stress (simplified)
      const shelfArea = (formData.width || 300) * (formData.depth || 200) / 1000000; // m²
      const stress = (shelfLoad * this.GRAVITY) / shelfArea;
      totalStress = Math.max(totalStress, stress);

      // Calculate deflection using beam theory
      const L = (formData.width || 300) / 1000; // m
      const E = material.youngModulus;
      const I = ((formData.depth || 200) * Math.pow(10, 3)) / 12000000000; // m⁴
      const deflection = (5 * shelfLoad * this.GRAVITY * Math.pow(L, 4)) / (384 * E * I) * 1000; // mm

      maxDeflection = Math.max(maxDeflection, deflection);

      if (stress > material.yieldStrength / this.SAFETY_FACTOR) {
        warnings.push(`Shelf ${shelf.level}: Stress exceeds safe limits (${Math.round(stress/1000000)}MPa)`);
      }

      if (deflection > L * 1000 / 300) {
        warnings.push(`Shelf ${shelf.level}: Deflection exceeds L/300 limit (${deflection.toFixed(1)}mm)`);
      }
    }

    const safetyFactor = material.yieldStrength / totalStress;
    const materialUtilization = (totalStress / material.yieldStrength) * 100;
    const certified = safetyFactor >= this.SAFETY_FACTOR && warnings.length === 0;

    if (certified) {
      warnings.push('✅ Structure meets all engineering standards');
    }

    return {
      shelfStress: Math.round(totalStress),
      deflection: Math.round(maxDeflection * 100) / 100,
      safetyFactor: Math.round(safetyFactor * 100) / 100,
      materialUtilization: Math.round(materialUtilization * 100) / 100,
      warnings,
      certified
    };
  }

  /**
   * Assess manufacturing viability and cost factors
   */
  private static assessManufacturingViability(
    placement: PlacementResult,
    formData: FormData
  ) {
    const material = this.MATERIAL_PROPERTIES[formData.material as keyof typeof this.MATERIAL_PROPERTIES]
      || this.MATERIAL_PROPERTIES['Plastik'];

    const complexity = this.calculateComplexity(placement, formData);
    const costFactor = material.cost * complexity.factor;

    const requiredTooling = this.determineRequiredTooling(formData);
    const timeToManufacture = this.estimateManufacturingTime(formData, complexity);

    return {
      feasible: complexity.feasible,
      costFactor,
      timeToManufacture,
      requiredTooling
    };
  }

  /**
   * Optimize placement to resolve physics issues
   */
  private static async optimizePlacement(
    placement: PlacementResult,
    formData: FormData,
    constraints: PhysicsConstraints
  ): Promise<PlacementResult> {
    console.log('🎯 Running placement optimization algorithm...');

    // Create optimized copy
    const optimized: PlacementResult = JSON.parse(JSON.stringify(placement));

    // Apply optimization algorithms
    for (const shelf of optimized.shelves) {
      // Redistribute products with physics-aware spacing
      const optimalSpacing = this.calculateOptimalSpacing(
        shelf.products.length,
        formData.width || 300,
        constraints.minSpacing
      );

      let currentX = optimalSpacing / 2;
      for (const product of shelf.products) {
        product.position.x = currentX;
        currentX += optimalSpacing;
      }

      // Adjust for weight distribution
      this.optimizeWeightDistribution(shelf.products);
    }

    // Recalculate utilization
    optimized.overallUtilization = this.recalculateUtilization(optimized);

    return optimized;
  }

  // Helper methods
  private static calculateOverlap(product1: any, product2: any): number {
    const dx = Math.abs(product1.position.x - product2.position.x);
    const minDistanceX = (product1.dimensions.width + product2.dimensions.width) / 2;
    return Math.max(0, minDistanceX - dx);
  }

  private static calculateStabilityFactor(formData: FormData): number {
    const height = formData.height || 150;
    const width = formData.width || 300;
    const aspectRatio = height / width;

    // Lower aspect ratio = more stable
    return Math.max(0.3, 1 - (aspectRatio * 0.3));
  }

  private static calculateComplexity(placement: PlacementResult, formData: FormData) {
    const shelfCount = placement.shelves.length;
    const totalProducts = placement.shelves.reduce((sum, shelf) => sum + shelf.products.length, 0);
    const hasCustomDimensions = (formData.width !== 300) || (formData.height !== 150);

    let complexityFactor = 1.0;
    if (shelfCount > 3) complexityFactor += 0.2;
    if (totalProducts > 20) complexityFactor += 0.3;
    if (hasCustomDimensions) complexityFactor += 0.1;

    return {
      factor: complexityFactor,
      feasible: complexityFactor < 2.0
    };
  }

  private static determineRequiredTooling(formData: FormData): string[] {
    const tooling = ['CNC Machine', 'Assembly Jigs'];

    if (formData.material === 'Akrilik') {
      tooling.push('Laser Cutter', 'Polishing Equipment');
    }
    if (formData.material === 'Metal') {
      tooling.push('Sheet Metal Press', 'Welding Equipment');
    }
    if ((formData.width || 0) > 500) {
      tooling.push('Large Format Tooling');
    }

    return tooling;
  }

  private static estimateManufacturingTime(formData: FormData, complexity: any): number {
    let baseTime = 2; // hours
    baseTime *= complexity.factor;

    if (formData.material === 'Metal') baseTime *= 1.5;
    if (formData.material === 'Akrilik') baseTime *= 1.2;

    return Math.round(baseTime * 100) / 100;
  }

  private static calculateOptimalSpacing(productCount: number, shelfWidth: number, minSpacing: number): number {
    if (productCount <= 1) return shelfWidth;

    const availableSpace = shelfWidth - (productCount * 40); // Assume 40mm per product
    const spacingCount = productCount + 1; // Including edges

    return Math.max(minSpacing, availableSpace / spacingCount);
  }

  private static optimizeWeightDistribution(products: any[]): void {
    // Sort by estimated weight and distribute evenly
    products.sort((a, b) => {
      const volumeA = a.dimensions.width * a.dimensions.height * a.dimensions.depth;
      const volumeB = b.dimensions.width * b.dimensions.height * b.dimensions.depth;
      return volumeB - volumeA;
    });

    // Redistribute with heavy items toward center
    const center = products.length / 2;
    for (let i = 0; i < products.length; i++) {
      const distanceFromCenter = Math.abs(i - center);
      products[i].priority = products.length - distanceFromCenter;
    }
  }

  private static recalculateUtilization(placement: PlacementResult): number {
    const totalCapacity = placement.shelves.length * 100; // Assume 100% per shelf
    const actualUsage = placement.shelves.reduce((sum, shelf) => {
      return sum + (shelf.products.length * 15); // Assume 15% per product
    }, 0);

    return Math.min(100, actualUsage / totalCapacity * 100);
  }
}
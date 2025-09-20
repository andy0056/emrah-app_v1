/**
 * Real-Time Manufacturing Cost Calculator
 * Provides live cost estimation with supplier integration and regional pricing
 */

import { FormData } from '../types';
import { AppliedChange } from './smartRefinementService';

export interface CostBreakdown {
  materials: MaterialCost;
  fabrication: FabricationCost;
  finishing: FinishingCost;
  assembly: AssemblyCost;
  shipping: ShippingCost;
  overhead: OverheadCost;
  total: TotalCost;
}

export interface MaterialCost {
  primary: number;
  secondary: number;
  hardware: number;
  total: number;
  currency: string;
  breakdown: MaterialBreakdownItem[];
}

export interface MaterialBreakdownItem {
  material: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  supplier: string;
  leadTime: number; // days
  availability: 'in-stock' | 'order' | 'custom';
}

export interface FabricationCost {
  cutting: number;
  machining: number;
  welding: number;
  setup: number;
  total: number;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: number; // hours
}

export interface FinishingCost {
  surface: number;
  painting: number;
  printing: number;
  total: number;
  processes: string[];
}

export interface AssemblyCost {
  labor: number;
  packaging: number;
  testing: number;
  total: number;
  estimatedTime: number; // hours
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface ShippingCost {
  domestic: number;
  international: number;
  packaging: number;
  insurance: number;
  estimatedWeight: number; // kg
  estimatedVolume: number; // cubic meters
}

export interface OverheadCost {
  design: number;
  project_management: number;
  quality_control: number;
  profit_margin: number;
  total: number;
}

export interface TotalCost {
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  validUntil: string; // ISO date
  confidence: number; // 0-1
}

export interface CostOptimization {
  alternatives: CostAlternative[];
  savings: OptimizationSuggestion[];
  bulkDiscounts: BulkDiscount[];
}

export interface CostAlternative {
  description: string;
  materialChanges: string[];
  costReduction: number;
  qualityImpact: 'none' | 'minimal' | 'moderate' | 'significant';
  leadTimeImpact: number; // days change
  feasibility: 'high' | 'medium' | 'low';
}

export interface OptimizationSuggestion {
  category: 'material' | 'fabrication' | 'finishing' | 'design';
  suggestion: string;
  potentialSaving: number;
  implementationEffort: 'low' | 'medium' | 'high';
  qualityImpact: 'none' | 'minimal' | 'moderate';
}

export interface BulkDiscount {
  quantity: number;
  discountPercentage: number;
  totalSavings: number;
  breakEvenPoint: number;
}

export interface RegionalPricing {
  region: string;
  currency: string;
  costMultiplier: number;
  shippingCost: number;
  leadTimeAdjustment: number; // days
  localSuppliers: string[];
}

export class ManufacturingCostService {
  private static readonly COST_CACHE_KEY = 'manufacturing_costs';
  private static readonly SUPPLIER_RATES_KEY = 'supplier_rates';
  private static readonly CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

  // Base pricing data (in production, this would come from supplier APIs)
  private static readonly BASE_MATERIAL_PRICES = {
    'Metal': {
      'steel': { price: 2.5, unit: 'kg', supplier: 'MetalCorp', leadTime: 7 },
      'aluminum': { price: 3.8, unit: 'kg', supplier: 'AlumTech', leadTime: 5 },
      'stainless_steel': { price: 5.2, unit: 'kg', supplier: 'SteelPro', leadTime: 10 }
    },
    'Ahşap (Wood)': {
      'plywood': { price: 25, unit: 'm2', supplier: 'WoodSource', leadTime: 3 },
      'mdf': { price: 18, unit: 'm2', supplier: 'WoodSource', leadTime: 2 },
      'solid_wood': { price: 45, unit: 'm2', supplier: 'PremiumWood', leadTime: 14 }
    },
    'Plastik (Plastic)': {
      'acrylic': { price: 12, unit: 'm2', supplier: 'PlasticTech', leadTime: 7 },
      'abs': { price: 8, unit: 'kg', supplier: 'PolySupply', leadTime: 5 },
      'polycarbonate': { price: 15, unit: 'm2', supplier: 'ClearPlas', leadTime: 10 }
    },
    'Karton (Cardboard)': {
      'corrugated': { price: 0.8, unit: 'm2', supplier: 'PackCorp', leadTime: 1 },
      'solid_board': { price: 1.2, unit: 'm2', supplier: 'PackCorp', leadTime: 2 }
    }
  };

  private static readonly REGIONAL_MULTIPLIERS = {
    'Turkey': { cost: 1.0, shipping: 0, leadTime: 0, currency: 'TRY', exchange: 27.5 },
    'Europe': { cost: 1.3, shipping: 150, leadTime: 7, currency: 'EUR', exchange: 1.0 },
    'North America': { cost: 1.5, shipping: 300, leadTime: 14, currency: 'USD', exchange: 0.95 },
    'Asia': { cost: 0.8, shipping: 200, leadTime: 21, currency: 'USD', exchange: 0.95 }
  };

  /**
   * Calculate complete manufacturing cost breakdown
   */
  static async calculateManufacturingCost(
    formData: FormData,
    appliedChanges: AppliedChange[] = [],
    region: string = 'Turkey',
    quantity: number = 1
  ): Promise<CostBreakdown> {

    console.log('💰 Calculating manufacturing costs:', {
      material: formData.materials[0],
      dimensions: `${formData.standWidth}×${formData.standHeight}×${formData.standDepth}`,
      region,
      quantity,
      changes: appliedChanges.length
    });

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(formData, appliedChanges, region, quantity);
      const cachedResult = this.getCachedCost(cacheKey);
      if (cachedResult) {
        console.log('📦 Using cached cost calculation');
        return cachedResult;
      }

      // Calculate each cost component
      const materials = await this.calculateMaterialCosts(formData, appliedChanges, region, quantity);
      const fabrication = this.calculateFabricationCosts(formData, appliedChanges, region);
      const finishing = this.calculateFinishingCosts(formData, appliedChanges, region);
      const assembly = this.calculateAssemblyCosts(formData, appliedChanges, region);
      const shipping = this.calculateShippingCosts(formData, region, quantity);
      const overhead = this.calculateOverheadCosts(formData, materials.total + fabrication.total + finishing.total + assembly.total);

      const subtotal = materials.total + fabrication.total + finishing.total + assembly.total + shipping.domestic + overhead.total;
      const tax = subtotal * 0.18; // Turkish VAT
      const total = subtotal + tax;

      const breakdown: CostBreakdown = {
        materials,
        fabrication,
        finishing,
        assembly,
        shipping,
        overhead,
        total: {
          subtotal,
          tax,
          total,
          currency: this.REGIONAL_MULTIPLIERS[region]?.currency || 'TRY',
          validUntil: new Date(Date.now() + this.CACHE_DURATION).toISOString(),
          confidence: this.calculateConfidence(formData, appliedChanges)
        }
      };

      // Cache the result
      this.setCachedCost(cacheKey, breakdown);

      console.log('✅ Cost calculation complete:', {
        total: breakdown.total.total,
        currency: breakdown.total.currency,
        confidence: breakdown.total.confidence
      });

      return breakdown;

    } catch (error) {
      console.error('❌ Cost calculation failed:', error);
      throw new Error(`Failed to calculate manufacturing costs: ${error}`);
    }
  }

  /**
   * Calculate material costs with supplier pricing
   */
  private static async calculateMaterialCosts(
    formData: FormData,
    appliedChanges: AppliedChange[],
    region: string,
    quantity: number
  ): Promise<MaterialCost> {

    const primaryMaterial = formData.materials[0];
    const regionalData = this.REGIONAL_MULTIPLIERS[region] || this.REGIONAL_MULTIPLIERS['Turkey'];

    // Calculate base dimensions with changes
    let width = formData.standWidth;
    let height = formData.standHeight;
    let depth = formData.standDepth;

    appliedChanges.forEach(change => {
      if (change.type === 'dimension') {
        if (change.description.includes('height')) {
          height *= 1.2; // Assume 20% increase
        }
        if (change.description.includes('width')) {
          width *= 1.1; // Assume 10% increase
        }
      }
    });

    // Calculate material requirements
    const surfaceArea = this.calculateSurfaceArea(width, height, depth, formData.shelfCount);
    const volume = this.calculateVolume(width, height, depth);

    const materialPrices = this.BASE_MATERIAL_PRICES[primaryMaterial] || this.BASE_MATERIAL_PRICES['Metal'];
    const materialData = Object.values(materialPrices)[0]; // Use first material type as default

    let primaryCost = 0;
    let quantity_needed = 0;

    if (materialData.unit === 'm2') {
      quantity_needed = surfaceArea;
      primaryCost = surfaceArea * materialData.price * regionalData.cost;
    } else if (materialData.unit === 'kg') {
      quantity_needed = this.estimateWeight(primaryMaterial, volume);
      primaryCost = quantity_needed * materialData.price * regionalData.cost;
    }

    // Hardware costs (screws, joints, etc.)
    const hardwareCost = this.calculateHardwareCost(formData, appliedChanges) * regionalData.cost;

    // Secondary materials (brackets, supports)
    const secondaryCost = primaryCost * 0.15; // 15% of primary

    const breakdown: MaterialBreakdownItem[] = [
      {
        material: `${primaryMaterial} - Primary`,
        quantity: quantity_needed,
        unit: materialData.unit,
        unitPrice: materialData.price * regionalData.cost,
        subtotal: primaryCost * quantity,
        supplier: materialData.supplier,
        leadTime: materialData.leadTime + regionalData.leadTime,
        availability: 'in-stock'
      },
      {
        material: 'Hardware & Fasteners',
        quantity: 1,
        unit: 'set',
        unitPrice: hardwareCost,
        subtotal: hardwareCost * quantity,
        supplier: 'Hardware Solutions',
        leadTime: 2,
        availability: 'in-stock'
      },
      {
        material: 'Secondary Components',
        quantity: 1,
        unit: 'set',
        unitPrice: secondaryCost,
        subtotal: secondaryCost * quantity,
        supplier: 'Component Supply',
        leadTime: 5,
        availability: 'order'
      }
    ];

    const totalMaterialCost = (primaryCost + hardwareCost + secondaryCost) * quantity;

    return {
      primary: primaryCost * quantity,
      secondary: secondaryCost * quantity,
      hardware: hardwareCost * quantity,
      total: totalMaterialCost,
      currency: regionalData.currency,
      breakdown
    };
  }

  /**
   * Calculate fabrication costs based on complexity
   */
  private static calculateFabricationCosts(
    formData: FormData,
    appliedChanges: AppliedChange[],
    region: string
  ): FabricationCost {

    const regionalData = this.REGIONAL_MULTIPLIERS[region] || this.REGIONAL_MULTIPLIERS['Turkey'];
    const baseLaborRate = 25; // USD per hour
    const adjustedRate = baseLaborRate * regionalData.cost;

    // Base fabrication time
    let cuttingTime = 2; // hours
    let machiningTime = 1;
    let weldingTime = formData.materials[0] === 'Metal' ? 3 : 0;
    let setupTime = 1;

    // Complexity adjustments
    const complexity = this.calculateFabricationComplexity(formData, appliedChanges);
    const complexityMultipliers = {
      'simple': 1.0,
      'moderate': 1.4,
      'complex': 1.8
    };

    const multiplier = complexityMultipliers[complexity];
    cuttingTime *= multiplier;
    machiningTime *= multiplier;
    weldingTime *= multiplier;

    // Apply changes impact
    appliedChanges.forEach(change => {
      if (change.type === 'lighting') {
        machiningTime += 2; // Additional time for lighting integration
      }
      if (change.type === 'material') {
        setupTime += 0.5; // Additional setup for material changes
      }
    });

    const totalTime = cuttingTime + machiningTime + weldingTime + setupTime;

    return {
      cutting: cuttingTime * adjustedRate,
      machining: machiningTime * adjustedRate,
      welding: weldingTime * adjustedRate,
      setup: setupTime * adjustedRate,
      total: totalTime * adjustedRate,
      complexity,
      estimatedTime: totalTime
    };
  }

  /**
   * Calculate finishing costs
   */
  private static calculateFinishingCosts(
    formData: FormData,
    appliedChanges: AppliedChange[],
    region: string
  ): FinishingCost {

    const regionalData = this.REGIONAL_MULTIPLIERS[region] || this.REGIONAL_MULTIPLIERS['Turkey'];
    const surfaceArea = this.calculateSurfaceArea(formData.standWidth, formData.standHeight, formData.standDepth, formData.shelfCount);

    let surfaceCost = 0;
    let paintingCost = 0;
    let printingCost = 0;
    const processes: string[] = [];

    // Base surface preparation
    surfaceCost = surfaceArea * 3 * regionalData.cost; // $3 per m2
    processes.push('Surface preparation');

    // Material-specific finishing
    switch (formData.materials[0]) {
      case 'Metal':
        paintingCost = surfaceArea * 8 * regionalData.cost; // Powder coating
        processes.push('Powder coating');
        break;
      case 'Ahşap (Wood)':
        paintingCost = surfaceArea * 5 * regionalData.cost; // Wood stain/lacquer
        processes.push('Wood finishing');
        break;
      case 'Plastik (Plastic)':
        paintingCost = surfaceArea * 4 * regionalData.cost; // UV coating
        processes.push('UV coating');
        break;
      case 'Karton (Cardboard)':
        printingCost = surfaceArea * 2 * regionalData.cost; // Printing
        processes.push('Digital printing');
        break;
    }

    // Branding and graphics
    if (formData.brandLogo || formData.keyVisual) {
      printingCost += 50 * regionalData.cost; // Logo application
      processes.push('Brand graphics');
    }

    // Apply changes impact
    appliedChanges.forEach(change => {
      if (change.type === 'color') {
        paintingCost *= 1.2; // 20% increase for custom colors
      }
      if (change.type === 'lighting') {
        surfaceCost += 30 * regionalData.cost; // LED integration prep
        processes.push('LED preparation');
      }
    });

    return {
      surface: surfaceCost,
      painting: paintingCost,
      printing: printingCost,
      total: surfaceCost + paintingCost + printingCost,
      processes
    };
  }

  /**
   * Calculate assembly costs
   */
  private static calculateAssemblyCosts(
    formData: FormData,
    appliedChanges: AppliedChange[],
    region: string
  ): AssemblyCost {

    const regionalData = this.REGIONAL_MULTIPLIERS[region] || this.REGIONAL_MULTIPLIERS['Turkey'];
    const laborRate = 20 * regionalData.cost; // Assembly rate

    // Base assembly time
    let assemblyTime = 2; // hours for basic stand
    assemblyTime += formData.shelfCount * 0.5; // 30 minutes per shelf

    // Complexity assessment
    const complexity = this.calculateAssemblyComplexity(formData, appliedChanges);
    const complexityMultipliers = {
      'simple': 1.0,
      'moderate': 1.3,
      'complex': 1.6
    };

    assemblyTime *= complexityMultipliers[complexity];

    // Apply changes impact
    appliedChanges.forEach(change => {
      if (change.type === 'lighting') {
        assemblyTime += 1.5; // LED system installation
      }
      if (change.type === 'dimension') {
        assemblyTime += 0.5; // Additional fitting time
      }
    });

    const laborCost = assemblyTime * laborRate;
    const packagingCost = 25 * regionalData.cost; // Standard packaging
    const testingCost = 15 * regionalData.cost; // Quality testing

    return {
      labor: laborCost,
      packaging: packagingCost,
      testing: testingCost,
      total: laborCost + packagingCost + testingCost,
      estimatedTime: assemblyTime,
      complexity
    };
  }

  /**
   * Calculate shipping costs
   */
  private static calculateShippingCosts(
    formData: FormData,
    region: string,
    quantity: number
  ): ShippingCost {

    const regionalData = this.REGIONAL_MULTIPLIERS[region] || this.REGIONAL_MULTIPLIERS['Turkey'];

    const weight = this.estimateWeight(formData.materials[0], this.calculateVolume(formData.standWidth, formData.standHeight, formData.standDepth)) * quantity;
    const volume = this.calculatePackageVolume(formData) * quantity;

    const domesticBase = Math.max(weight * 5, volume * 200); // Weight or volume based
    const domestic = domesticBase * 1.0; // No multiplier for domestic

    const international = domesticBase + regionalData.shipping;
    const packaging = 15 * quantity; // Per unit packaging
    const insurance = Math.max(20, domesticBase * 0.02); // 2% of shipping or minimum $20

    return {
      domestic,
      international,
      packaging,
      insurance,
      estimatedWeight: weight,
      estimatedVolume: volume
    };
  }

  /**
   * Calculate overhead costs
   */
  private static calculateOverheadCosts(
    formData: FormData,
    baseCost: number
  ): OverheadCost {

    const design = baseCost * 0.08; // 8% for design
    const project_management = baseCost * 0.05; // 5% for PM
    const quality_control = baseCost * 0.03; // 3% for QC
    const profit_margin = baseCost * 0.25; // 25% profit margin

    return {
      design,
      project_management,
      quality_control,
      profit_margin,
      total: design + project_management + quality_control + profit_margin
    };
  }

  /**
   * Generate cost optimization suggestions
   */
  static generateCostOptimizations(
    formData: FormData,
    costBreakdown: CostBreakdown,
    appliedChanges: AppliedChange[] = []
  ): CostOptimization {

    const alternatives: CostAlternative[] = [];
    const savings: OptimizationSuggestion[] = [];
    const bulkDiscounts: BulkDiscount[] = [];

    // Material alternatives
    if (formData.materials[0] === 'Metal') {
      alternatives.push({
        description: 'Switch to high-grade plastic with metal finish',
        materialChanges: ['Plastik (Plastic) with metallic coating'],
        costReduction: costBreakdown.materials.total * 0.35,
        qualityImpact: 'minimal',
        leadTimeImpact: -3,
        feasibility: 'high'
      });
    }

    // Fabrication optimizations
    if (costBreakdown.fabrication.complexity === 'complex') {
      savings.push({
        category: 'fabrication',
        suggestion: 'Simplify joint design to reduce machining time',
        potentialSaving: costBreakdown.fabrication.total * 0.2,
        implementationEffort: 'medium',
        qualityImpact: 'none'
      });
    }

    // Finishing optimizations
    savings.push({
      category: 'finishing',
      suggestion: 'Use standard colors to avoid custom coating charges',
      potentialSaving: costBreakdown.finishing.total * 0.15,
      implementationEffort: 'low',
      qualityImpact: 'minimal'
    });

    // Bulk discounts
    [5, 10, 25, 50, 100].forEach(qty => {
      const discountRate = Math.min(0.3, qty * 0.02); // Max 30% discount
      bulkDiscounts.push({
        quantity: qty,
        discountPercentage: discountRate * 100,
        totalSavings: costBreakdown.total.total * qty * discountRate,
        breakEvenPoint: qty
      });
    });

    return {
      alternatives,
      savings,
      bulkDiscounts
    };
  }

  // Helper methods
  private static calculateSurfaceArea(width: number, height: number, depth: number, shelfCount: number): number {
    // Simplified surface area calculation
    const front = width * height;
    const back = width * height;
    const sides = 2 * (depth * height);
    const shelves = shelfCount * (width * depth);
    const top_bottom = 2 * (width * depth);

    return (front + back + sides + shelves + top_bottom) / 10000; // Convert cm2 to m2
  }

  private static calculateVolume(width: number, height: number, depth: number): number {
    return (width * height * depth) / 1000000; // Convert cm3 to m3
  }

  private static calculatePackageVolume(formData: FormData): number {
    // Add packaging space
    const packagedVolume = this.calculateVolume(
      formData.standWidth + 10,
      formData.standHeight + 10,
      formData.standDepth + 10
    );
    return packagedVolume;
  }

  private static estimateWeight(material: string, volume: number): number {
    const densities = {
      'Metal': 2700, // kg/m3 for aluminum
      'Ahşap (Wood)': 600, // kg/m3 for plywood
      'Plastik (Plastic)': 950, // kg/m3 for ABS
      'Karton (Cardboard)': 700 // kg/m3 for corrugated
    };

    return volume * (densities[material] || densities['Metal']);
  }

  private static calculateHardwareCost(formData: FormData, appliedChanges: AppliedChange[]): number {
    let baseCost = 25; // Base hardware set
    baseCost += formData.shelfCount * 8; // $8 per shelf in hardware

    appliedChanges.forEach(change => {
      if (change.type === 'lighting') {
        baseCost += 45; // LED hardware
      }
    });

    return baseCost;
  }

  private static calculateFabricationComplexity(formData: FormData, appliedChanges: AppliedChange[]): 'simple' | 'moderate' | 'complex' {
    let score = 0;

    // Base complexity
    if (formData.shelfCount > 4) score += 1;
    if (formData.standHeight > 150) score += 1;
    if (formData.materials[0] === 'Metal') score += 1;

    // Changes impact
    appliedChanges.forEach(change => {
      if (change.type === 'lighting') score += 2;
      if (change.type === 'dimension') score += 1;
    });

    if (score <= 2) return 'simple';
    if (score <= 4) return 'moderate';
    return 'complex';
  }

  private static calculateAssemblyComplexity(formData: FormData, appliedChanges: AppliedChange[]): 'simple' | 'moderate' | 'complex' {
    let score = 0;

    if (formData.shelfCount > 3) score += 1;
    if (formData.materials[0] === 'Metal') score += 1;

    appliedChanges.forEach(change => {
      if (change.type === 'lighting') score += 2;
      if (change.type === 'structure') score += 1;
    });

    if (score <= 1) return 'simple';
    if (score <= 3) return 'moderate';
    return 'complex';
  }

  private static calculateConfidence(formData: FormData, appliedChanges: AppliedChange[]): number {
    let confidence = 0.9; // Base confidence

    // Reduce confidence for complex changes
    if (appliedChanges.length > 3) confidence -= 0.1;
    if (appliedChanges.some(c => c.type === 'lighting')) confidence -= 0.05;

    // Reduce confidence for unusual materials
    if (formData.materials[0] === 'Karton (Cardboard)') confidence -= 0.1;

    return Math.max(0.6, confidence);
  }

  private static generateCacheKey(formData: FormData, changes: AppliedChange[], region: string, quantity: number): string {
    const key = `${formData.materials[0]}_${formData.standWidth}x${formData.standHeight}x${formData.standDepth}_${changes.length}_${region}_${quantity}`;
    return btoa(key).slice(0, 16);
  }

  private static getCachedCost(key: string): CostBreakdown | null {
    try {
      const cached = localStorage.getItem(`${this.COST_CACHE_KEY}_${key}`);
      if (!cached) return null;

      const data = JSON.parse(cached);
      if (new Date(data.timestamp) < new Date(Date.now() - this.CACHE_DURATION)) {
        localStorage.removeItem(`${this.COST_CACHE_KEY}_${key}`);
        return null;
      }

      return data.breakdown;
    } catch (error) {
      return null;
    }
  }

  private static setCachedCost(key: string, breakdown: CostBreakdown): void {
    try {
      const data = {
        breakdown,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`${this.COST_CACHE_KEY}_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache cost data:', error);
    }
  }
}
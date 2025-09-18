import { FormData } from '../types';
import { FalService } from './falService';
import { GroundedGenerationService } from './groundedGenerationService';

export interface ProductionConstraints {
  maxOverhang: number; // mm
  minWallThickness: number; // mm
  standardTubeSizes: number[]; // mm
  maxUnsupportedSpan: number; // cm
  standardSheetSizes: { width: number; height: number }[];
  assemblyMethod: 'welded' | 'bolted' | 'snap-fit' | 'cam-lock' | 'slot-tab';
  costPerUnit: number; // $ per unit
  leadTimeDays: number;
}

export interface MaterialItem {
  name: string;
  quantity: number | string;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  partNumber?: string;
}

export interface ProductionStep {
  description: string;
  estimatedTime: string;
  requiredTools: string[];
  skillLevel: 'basic' | 'intermediate' | 'advanced';
  notes?: string;
}

export interface ManufacturingReport {
  designId: string;
  mode: 'production';
  materials: MaterialItem[];
  totalCost: number;
  productionSteps: ProductionStep[];
  technicalDrawings: Array<{ view: string; url: string }>;
  assemblyTime: number; // minutes
  qualityChecks: string[];
  manufacturability: {
    score: number; // 0-100
    issues: string[];
    recommendations: string[];
  };
  packaging: {
    dimensions: { length: number; width: number; height: number };
    weight: number;
    shippingClass: string;
  };
}

export class ProductionDesignService {

  // Reference library of real manufacturable stands
  private static readonly PRODUCTION_REFERENCES = {
    metal: {
      floor: [
        '/references/metal-floor-standard-001.jpg',
        '/references/metal-floor-grid-002.jpg',
        '/references/metal-tower-modular-003.jpg'
      ],
      counter: [
        '/references/metal-counter-simple-001.jpg',
        '/references/metal-counter-spinner-002.jpg'
      ]
    },
    wood: {
      floor: [
        '/references/mdf-floor-modular-001.jpg',
        '/references/wood-floor-classic-002.jpg',
        '/references/plywood-tower-003.jpg'
      ],
      counter: [
        '/references/wood-counter-natural-001.jpg'
      ]
    },
    cardboard: {
      floor: [
        '/references/corrugated-floor-foldable-001.jpg',
        '/references/cardboard-shipper-display-002.jpg'
      ],
      counter: [
        '/references/corrugated-counter-simple-001.jpg',
        '/references/cardboard-counter-branded-002.jpg'
      ]
    }
  };

  // Manufacturing constraints database
  private static readonly CONSTRAINTS: Record<string, ProductionConstraints> = {
    'Metal': {
      maxOverhang: 300,
      minWallThickness: 1.5,
      standardTubeSizes: [20, 25, 30, 40, 50],
      maxUnsupportedSpan: 80,
      standardSheetSizes: [{ width: 1220, height: 2440 }],
      assemblyMethod: 'welded',
      costPerUnit: 15, // $ per kg
      leadTimeDays: 14
    },
    'Ahşap (Wood)': {
      maxOverhang: 200,
      minWallThickness: 15,
      standardTubeSizes: [],
      maxUnsupportedSpan: 60,
      standardSheetSizes: [{ width: 1220, height: 2440 }],
      assemblyMethod: 'cam-lock',
      costPerUnit: 25, // $ per sq meter
      leadTimeDays: 10
    },
    'Karton (Cardboard)': {
      maxOverhang: 150,
      minWallThickness: 5,
      standardTubeSizes: [],
      maxUnsupportedSpan: 40,
      standardSheetSizes: [{ width: 1000, height: 700 }],
      assemblyMethod: 'slot-tab',
      costPerUnit: 2, // $ per sq meter
      leadTimeDays: 5
    },
    'Plastik (Plastic)': {
      maxOverhang: 100,
      minWallThickness: 2.5,
      standardTubeSizes: [],
      maxUnsupportedSpan: 40,
      standardSheetSizes: [],
      assemblyMethod: 'snap-fit',
      costPerUnit: 8, // $ per kg
      leadTimeDays: 21
    }
  };

  static async generateProductionReady(
    formData: FormData,
    options: {
      referenceStyle?: 'minimal' | 'standard' | 'premium';
      includeAssemblyGuide?: boolean;
      validateOnly?: boolean;
    } = {}
  ) {
    console.log('🏭 Starting Production-Ready Generation:', {
      standType: formData.standType,
      material: formData.materials[0],
      referenceStyle: options.referenceStyle || 'standard'
    });

    try {
      // Step 1: Validate manufacturability
      const validation = this.validateManufacturability(formData);
      if (!validation.isValid) {
        throw new Error(`Design not manufacturable: ${validation.issues.join(', ')}`);
      }

      if (options.validateOnly) {
        return { validation, manufacturingReport: null, images: [] };
      }

      // Step 2: Use grounded generation with production constraints
      const productionResult = await GroundedGenerationService.generateGroundedDisplay(
        formData,
        [], // No brand assets for production mode - focus on structure
        {
          // Let optimal model selection choose the best model (now Nano Banana for SVG structure guides)
          preserveStructure: true,
          showJoinery: true,
          perspective: '3quarter',
          enableDFMValidation: true
        }
      );

      // Step 3: Generate manufacturing report
      const manufacturingReport = await this.generateManufacturingReport(
        formData,
        productionResult,
        validation.corrections
      );

      // Step 4: Generate technical drawings if requested
      let technicalDrawings = [];
      if (options.includeAssemblyGuide) {
        technicalDrawings = await this.generateTechnicalDrawings(formData);
        manufacturingReport.technicalDrawings = technicalDrawings;
      }

      console.log('✅ Production-Ready Generation Complete:', {
        manufacturabilityScore: manufacturingReport.manufacturability.score,
        totalCost: manufacturingReport.totalCost,
        assemblyTime: manufacturingReport.assemblyTime
      });

      return {
        ...productionResult,
        mode: 'production' as const,
        manufacturingReport,
        validation,
        productionReady: true
      };

    } catch (error) {
      console.error('❌ Production generation failed:', error);
      throw error;
    }
  }

  private static validateManufacturability(formData: FormData): {
    isValid: boolean;
    issues: string[];
    corrections: any;
    score: number;
  } {
    const issues: string[] = [];
    const corrections: any = {};
    const material = this.normalizeMaterial(formData.materials[0]);
    const constraints = this.CONSTRAINTS[material] || this.CONSTRAINTS['Metal'];

    let score = 100;

    // Check shelf span
    if (formData.standWidth > constraints.maxUnsupportedSpan) {
      issues.push(`Shelf width ${formData.standWidth}cm exceeds max unsupported span (${constraints.maxUnsupportedSpan}cm)`);
      corrections.shelfSupports = Math.ceil(formData.standWidth / constraints.maxUnsupportedSpan);
      score -= 20;
    }

    // Check stability ratio (relaxed for practical displays)
    const stabilityRatio = formData.standDepth / formData.standHeight;
    if (stabilityRatio < 0.15) {
      issues.push('Base too narrow for height - consider adding stability features');
      corrections.requiredDepth = Math.ceil(formData.standHeight * 0.2);
      score -= 15;
    }

    // Check height limits for material
    const maxHeight = material === 'Karton (Cardboard)' ? 180 : 250;
    if (formData.standHeight > maxHeight) {
      issues.push(`Height ${formData.standHeight}cm exceeds ${material} limits (${maxHeight}cm)`);
      corrections.maxHeight = maxHeight;
      score -= 15;
    }

    // Check material efficiency (relaxed threshold)
    const sheetEfficiency = this.calculateSheetEfficiency(formData, constraints);
    if (sheetEfficiency < 0.4) {
      issues.push('Poor material utilization - consider dimension adjustment');
      corrections.suggestedDimensions = this.optimizeDimensions(formData, constraints);
      score -= 10;
    }

    // Check assembly complexity
    if (formData.shelfCount > 6) {
      issues.push('High shelf count increases assembly complexity');
      score -= 5;
    }

    return {
      isValid: issues.length === 0 || score >= 70,
      issues,
      corrections,
      score: Math.max(0, score)
    };
  }

  private static normalizeMaterial(material: string): string {
    const materialMap: Record<string, string> = {
      'Metal': 'Metal',
      'metal': 'Metal',
      'Ahşap (Wood)': 'Ahşap (Wood)',
      'Wood': 'Ahşap (Wood)',
      'wood': 'Ahşap (Wood)',
      'Karton (Cardboard)': 'Karton (Cardboard)',
      'Cardboard': 'Karton (Cardboard)',
      'cardboard': 'Karton (Cardboard)',
      'Plastik (Plastic)': 'Plastik (Plastic)',
      'Plastic': 'Plastik (Plastic)',
      'plastic': 'Plastik (Plastic)'
    };
    return materialMap[material] || 'Metal';
  }

  private static calculateSheetEfficiency(formData: FormData, constraints: ProductionConstraints): number {
    if (constraints.standardSheetSizes.length === 0) return 1; // No sheet constraints

    const sheet = constraints.standardSheetSizes[0];
    const requiredArea = formData.standWidth * formData.standHeight +
                        formData.standWidth * formData.standDepth * formData.shelfCount;
    const sheetArea = sheet.width * sheet.height / 100; // Convert mm to cm

    return Math.min(requiredArea / sheetArea, 1);
  }

  private static optimizeDimensions(formData: FormData, constraints: ProductionConstraints) {
    const sheet = constraints.standardSheetSizes[0];
    if (!sheet) return formData;

    // Suggest dimensions that fit standard sheet sizes better
    const maxWidth = Math.floor(sheet.width / 10); // mm to cm
    const maxHeight = Math.floor(sheet.height / 10);

    return {
      width: Math.min(formData.standWidth, maxWidth),
      height: Math.min(formData.standHeight, maxHeight),
      depth: formData.standDepth
    };
  }

  private static async generateManufacturingReport(
    formData: FormData,
    generationResult: any,
    corrections: any
  ): Promise<ManufacturingReport> {
    const material = this.normalizeMaterial(formData.materials[0]);
    const constraints = this.CONSTRAINTS[material];
    const specs = this.getManufacturingSpecs(material);

    // Calculate materials
    const materials = this.calculateMaterials(formData, material, constraints);
    const totalCost = materials.reduce((sum, item) => sum + item.totalCost, 0);

    // Generate production steps
    const productionSteps = this.generateProductionSteps(formData, material, specs);

    // Calculate assembly time
    const assemblyTime = this.calculateAssemblyTime(formData, material);

    return {
      designId: `prod_${Date.now()}`,
      mode: 'production',
      materials,
      totalCost,
      productionSteps,
      technicalDrawings: [], // Will be populated separately if requested
      assemblyTime,
      qualityChecks: this.generateQualityChecks(material),
      manufacturability: {
        score: generationResult.manufacturability?.score || 85,
        issues: generationResult.manufacturability?.issues?.map((i: any) => i.message) || [],
        recommendations: Object.keys(corrections).map(key =>
          `Consider: ${corrections[key]}`
        )
      },
      packaging: this.calculatePackaging(formData, material)
    };
  }

  private static calculateMaterials(
    formData: FormData,
    material: string,
    constraints: ProductionConstraints
  ): MaterialItem[] {
    const materials: MaterialItem[] = [];

    switch (material) {
      case 'Metal':
        // Main frame tubes
        const tubeLength = (formData.standHeight * 4 + formData.standWidth * 2 + formData.standDepth * 2) / 100; // Convert to meters
        materials.push({
          name: '25x25mm Square Tube',
          quantity: `${Math.ceil(tubeLength)}m`,
          unitCost: 12,
          totalCost: Math.ceil(tubeLength) * 12,
          supplier: 'Steel Supply Co',
          partNumber: 'ST-25SQ'
        });

        // Shelf plates
        const shelfArea = (formData.standWidth * formData.standDepth * formData.shelfCount) / 10000; // sq meters
        materials.push({
          name: '2mm Steel Sheet',
          quantity: `${shelfArea.toFixed(1)}m²`,
          unitCost: 25,
          totalCost: Math.ceil(shelfArea * 25),
          supplier: 'Steel Supply Co',
          partNumber: 'SS-2MM'
        });

        // Hardware
        materials.push({
          name: 'Welding & Hardware',
          quantity: '1 set',
          unitCost: 35,
          totalCost: 35,
          supplier: 'Hardware Plus'
        });

        // Powder coating
        materials.push({
          name: 'Powder Coating',
          quantity: '1 unit',
          unitCost: 45,
          totalCost: 45,
          supplier: 'Finish Pro'
        });
        break;

      case 'Ahşap (Wood)':
        // MDF sheets
        const woodArea = this.calculateWoodArea(formData);
        materials.push({
          name: '18mm MDF Sheet',
          quantity: `${Math.ceil(woodArea)} sheets`,
          unitCost: 45,
          totalCost: Math.ceil(woodArea) * 45,
          supplier: 'Wood Depot',
          partNumber: 'MDF-18-1220'
        });

        // Cam-lock hardware
        const hardwareCount = formData.shelfCount * 4 + 8; // 4 per shelf + frame
        materials.push({
          name: 'Cam-Lock Hardware Set',
          quantity: hardwareCount,
          unitCost: 2.5,
          totalCost: hardwareCount * 2.5,
          supplier: 'Hardware Plus',
          partNumber: 'CAM-SET-25'
        });

        // Edge banding
        const edgeLength = this.calculateEdgeLength(formData);
        materials.push({
          name: 'Edge Banding',
          quantity: `${edgeLength}m`,
          unitCost: 3,
          totalCost: edgeLength * 3,
          supplier: 'Wood Depot'
        });
        break;

      case 'Karton (Cardboard)':
        // Corrugated sheets
        const cardboardSheets = Math.ceil(this.calculateCardboardSheets(formData));
        materials.push({
          name: '5mm Corrugated Sheet',
          quantity: cardboardSheets,
          unitCost: 8,
          totalCost: cardboardSheets * 8,
          supplier: 'Packaging Supply',
          partNumber: 'CORR-5-B'
        });

        // Printing
        const printArea = this.calculatePrintArea(formData);
        materials.push({
          name: 'Digital Printing',
          quantity: `${printArea.toFixed(1)}m²`,
          unitCost: 15,
          totalCost: Math.ceil(printArea * 15),
          supplier: 'Print Solutions'
        });
        break;
    }

    return materials;
  }

  private static calculateWoodArea(formData: FormData): number {
    // Simplified calculation - in reality would be more complex
    const panelArea = (formData.standWidth * formData.standHeight +
                      formData.standWidth * formData.standDepth +
                      formData.standDepth * formData.standHeight * 2) / 10000; // to sq meters
    return panelArea / 2.98; // Standard sheet is 2.98 sq meters
  }

  private static calculateEdgeLength(formData: FormData): number {
    return (formData.standWidth + formData.standHeight + formData.standDepth) * 2 * formData.shelfCount / 100;
  }

  private static calculateCardboardSheets(formData: FormData): number {
    const totalArea = (formData.standWidth * formData.standHeight * 2 +
                      formData.standDepth * formData.standHeight * 2 +
                      formData.standWidth * formData.standDepth * (formData.shelfCount + 1)) / 10000;
    return totalArea / 0.7; // Standard sheet is 0.7 sq meters
  }

  private static calculatePrintArea(formData: FormData): number {
    // Assume 60% of surface area is printed
    const totalSurface = this.calculateCardboardSheets(formData) * 0.7;
    return totalSurface * 0.6;
  }

  private static generateProductionSteps(
    formData: FormData,
    material: string,
    specs: any
  ): ProductionStep[] {
    const steps: ProductionStep[] = [];

    switch (material) {
      case 'Metal':
        steps.push(
          {
            description: 'Cut square tubes to required lengths',
            estimatedTime: '30 min',
            requiredTools: ['Metal saw', 'Measuring tape'],
            skillLevel: 'basic'
          },
          {
            description: 'Cut shelf plates from steel sheet',
            estimatedTime: '20 min',
            requiredTools: ['Plasma cutter', 'Templates'],
            skillLevel: 'intermediate'
          },
          {
            description: 'Weld main frame structure',
            estimatedTime: '60 min',
            requiredTools: ['TIG welder', 'Jigs'],
            skillLevel: 'advanced'
          },
          {
            description: 'Attach shelf brackets',
            estimatedTime: '15 min',
            requiredTools: ['Drill', 'Bolts'],
            skillLevel: 'basic'
          },
          {
            description: 'Sand and prepare for coating',
            estimatedTime: '25 min',
            requiredTools: ['Grinder', 'Sandpaper'],
            skillLevel: 'basic'
          },
          {
            description: 'Apply powder coating',
            estimatedTime: '40 min',
            requiredTools: ['Spray booth', 'Oven'],
            skillLevel: 'intermediate'
          }
        );
        break;

      case 'Ahşap (Wood)':
        steps.push(
          {
            description: 'Cut MDF panels to size',
            estimatedTime: '20 min',
            requiredTools: ['Panel saw', 'Measuring'],
            skillLevel: 'basic'
          },
          {
            description: 'Drill cam-lock holes',
            estimatedTime: '25 min',
            requiredTools: ['CNC router', 'Jigs'],
            skillLevel: 'intermediate'
          },
          {
            description: 'Apply edge banding',
            estimatedTime: '15 min',
            requiredTools: ['Edge bander', 'Trimmer'],
            skillLevel: 'basic'
          },
          {
            description: 'Install cam-lock hardware',
            estimatedTime: '10 min',
            requiredTools: ['Screwdriver', 'Hardware'],
            skillLevel: 'basic'
          }
        );
        break;

      case 'Karton (Cardboard)':
        steps.push(
          {
            description: 'Design and create cutting template',
            estimatedTime: '30 min',
            requiredTools: ['CAD software', 'Plotter'],
            skillLevel: 'intermediate'
          },
          {
            description: 'Print graphics on sheets',
            estimatedTime: '20 min',
            requiredTools: ['Digital printer', 'Color management'],
            skillLevel: 'basic'
          },
          {
            description: 'Die-cut panels and slots',
            estimatedTime: '15 min',
            requiredTools: ['Die cutting machine', 'Custom dies'],
            skillLevel: 'basic'
          },
          {
            description: 'Score fold lines',
            estimatedTime: '10 min',
            requiredTools: ['Scoring machine'],
            skillLevel: 'basic'
          }
        );
        break;
    }

    return steps;
  }

  private static calculateAssemblyTime(formData: FormData, material: string): number {
    const baseTime = {
      'Metal': 15, // Bolted assembly
      'Ahşap (Wood)': 12, // Cam-lock system
      'Karton (Cardboard)': 8, // Slot-tab assembly
      'Plastik (Plastic)': 10 // Snap-fit
    };

    const base = baseTime[material] || 15;
    const shelfMultiplier = formData.shelfCount * 2; // 2 minutes per shelf

    return base + shelfMultiplier;
  }

  private static generateQualityChecks(material: string): string[] {
    const commonChecks = [
      'Verify all dimensions match specification',
      'Check structural stability',
      'Inspect all joints and connections',
      'Verify weight capacity'
    ];

    const materialSpecific = {
      'Metal': [
        'Check weld quality and penetration',
        'Verify powder coating thickness',
        'Test for sharp edges'
      ],
      'Ahşap (Wood)': [
        'Check cam-lock engagement',
        'Verify edge banding adhesion',
        'Inspect surface finish'
      ],
      'Karton (Cardboard)': [
        'Verify print quality and color accuracy',
        'Check slot-tab fit tolerance',
        'Test fold line integrity'
      ]
    };

    return [...commonChecks, ...(materialSpecific[material] || [])];
  }

  private static calculatePackaging(formData: FormData, material: string) {
    const packaged = {
      'Metal': {
        dimensions: {
          length: Math.max(formData.standWidth, formData.standHeight) + 10,
          width: formData.standDepth + 10,
          height: 20
        },
        weight: this.estimateWeight(formData, material),
        shippingClass: 'Standard Freight'
      },
      'Ahşap (Wood)': {
        dimensions: {
          length: Math.max(formData.standWidth, formData.standHeight) + 5,
          width: formData.standDepth + 5,
          height: 15
        },
        weight: this.estimateWeight(formData, material),
        shippingClass: 'Standard Ground'
      },
      'Karton (Cardboard)': {
        dimensions: {
          length: formData.standWidth + 5,
          width: formData.standDepth + 5,
          height: 8
        },
        weight: this.estimateWeight(formData, material),
        shippingClass: 'Standard Ground'
      }
    };

    return packaged[material] || packaged['Metal'];
  }

  private static estimateWeight(formData: FormData, material: string): number {
    const density = {
      'Metal': 7.8, // kg per liter
      'Ahşap (Wood)': 0.7,
      'Karton (Cardboard)': 0.1,
      'Plastik (Plastic)': 1.2
    };

    const volume = (formData.standWidth * formData.standHeight * formData.standDepth) / 1000; // liters
    const materialVolume = volume * 0.15; // Assume 15% solid material

    return Math.ceil(materialVolume * (density[material] || 1));
  }

  private static getManufacturingSpecs(material: string) {
    const specs = {
      'Metal': {
        spec: 'Powder-coated steel, 1.5mm wall thickness',
        stock: '25×25mm square tube',
        joints: 'TIG welded or bolted',
        assembly: 'Welded frame with bolted shelves',
        finish: 'RAL powder coating',
        maxOverhang: 300,
        reinforcement: 'diagonal bracing',
        production: 'small batch (10-100 units)'
      },
      'Ahşap (Wood)': {
        spec: '18mm MDF with melamine laminate',
        stock: '1220×2440mm sheets',
        joints: 'doweled and glued',
        assembly: 'Flat-pack with cam-lock system',
        finish: 'Melamine laminate or painted',
        maxOverhang: 200,
        reinforcement: 'hidden metal brackets',
        production: 'CNC batch production'
      },
      'Karton (Cardboard)': {
        spec: '5mm corrugated cardboard, E-flute',
        stock: '1000×700mm sheets',
        joints: 'slot-and-tab',
        assembly: 'Tool-free assembly',
        finish: 'Digital printing',
        maxOverhang: 150,
        reinforcement: 'double-wall construction',
        production: 'die-cutting and printing'
      },
      'Plastik (Plastic)': {
        spec: 'Injection molded ABS, 3mm walls',
        stock: 'pelletized ABS resin',
        joints: 'snap-fit connections',
        assembly: 'Tool-free snap assembly',
        finish: 'Textured mold surface',
        maxOverhang: 100,
        reinforcement: 'integrated ribs',
        production: 'injection molding (1000+ units)'
      }
    };

    return specs[material] || specs['Metal'];
  }

  // Generate technical drawings for factory
  static async generateTechnicalDrawings(formData: FormData) {
    const views = ['front', 'side', 'top', 'isometric'];
    const drawings = [];

    for (const view of views) {
      try {
        const drawing = await FalService.generateImage({
          prompt: `Technical CAD drawing of display stand.
                  ${view} view with dimensions.
                  ${formData.standWidth}×${formData.standDepth}×${formData.standHeight}cm.
                  Black lines on white background.
                  Include measurement annotations.
                  Professional engineering drawing style.
                  Show material thickness and joint details.`,
          aspect_ratio: "1:1",
          num_images: 1
        });

        drawings.push({
          view,
          url: drawing.images[0]?.url || ''
        });
      } catch (error) {
        console.warn(`Failed to generate ${view} technical drawing:`, error);
        // Continue with other views
      }
    }

    return drawings;
  }

  // Quick manufacturability check without full generation
  static async validateOnly(formData: FormData) {
    return this.generateProductionReady(formData, { validateOnly: true });
  }

  // Get estimated costs without full generation
  static async getQuickEstimate(formData: FormData) {
    const material = this.normalizeMaterial(formData.materials[0]);
    const constraints = this.CONSTRAINTS[material];
    const materials = this.calculateMaterials(formData, material, constraints);
    const totalCost = materials.reduce((sum, item) => sum + item.totalCost, 0);

    return {
      materialCost: totalCost,
      laborCost: Math.ceil(totalCost * 0.4), // 40% labor
      totalCost: Math.ceil(totalCost * 1.4),
      leadTime: constraints.leadTimeDays,
      currency: 'USD'
    };
  }
}
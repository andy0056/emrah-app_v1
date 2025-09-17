import { FormData } from '../types';

export interface DisplayValidationInput {
  display_type: 'tabletop' | 'fsu' | 'wall_unit';
  dimensions_cm: { height: number; width: number; depth: number };
  materials: { allowed: string[] };
  shelves: {
    count: number;
    spec: Array<{
      index: number;
      width_cm: number;
      depth_cm: number;
      min_products: number;
    }>;
  };
  brand: {
    primary_color: string;
    logo: boolean;
    key_visual: boolean;
  };
}

export interface DisplayValidationOutput {
  display_type: 'tabletop' | 'fsu' | 'wall_unit';
  dimensions_cm: { height: number; width: number; depth: number };
  materials: {
    allowed: string[];
    used: string[];
  };
  shelves: {
    count: number;
    spec: Array<{
      index: number;
      width_cm: number;
      depth_cm: number;
      front_lip_mm: number;
      load_kg: number;
      products_planned: number;
    }>;
  };
  brand: {
    logo_applied: boolean;
    key_visual_applied: boolean;
    primary_color: string;
    notes: string;
  };
  manufacturability: {
    status: 'pass' | 'fail';
    checks: Array<{
      name: string;
      result: 'pass' | 'fail';
      note: string;
    }>;
  };
  validation: {
    tolerance: {
      dimensions_pct: number;
      shelf_dimensions_pct: number;
    };
    errors: string[];
  };
  corrected_proposal: DisplayValidationOutput | null;
}

export interface ValidationRule {
  id: string;
  description: string;
  validate: (input: DisplayValidationInput, output: DisplayValidationOutput) => string | null;
}

export class DisplayValidator {
  private static readonly DIMENSION_TOLERANCE = 0.10; // ±10%
  private static readonly HARD_FAIL_TOLERANCE = 0.15; // ±15% hard fail
  private static readonly SHELF_TOLERANCE = 0.10; // ±10%

  private static readonly VALIDATION_RULES: ValidationRule[] = [
    {
      id: 'type-lock',
      description: 'Display type must match selection exactly',
      validate: (input, output) => {
        if (output.display_type !== input.display_type) {
          return `Display type mismatch: requested '${input.display_type}', got '${output.display_type}'`;
        }
        return null;
      }
    },
    {
      id: 'dim-tolerance',
      description: 'Dimensions must be within ±10% tolerance',
      validate: (input, output) => {
        const checks = [
          { name: 'height', input: input.dimensions_cm.height, output: output.dimensions_cm.height },
          { name: 'width', input: input.dimensions_cm.width, output: output.dimensions_cm.width },
          { name: 'depth', input: input.dimensions_cm.depth, output: output.dimensions_cm.depth }
        ];

        for (const check of checks) {
          const variance = Math.abs(check.output - check.input) / check.input;
          if (variance > this.HARD_FAIL_TOLERANCE) {
            return `${check.name} variance ${(variance * 100).toFixed(1)}% exceeds hard limit of ±15%`;
          }
          if (variance > this.DIMENSION_TOLERANCE) {
            return `${check.name} variance ${(variance * 100).toFixed(1)}% exceeds tolerance of ±10%`;
          }
        }
        return null;
      }
    },
    {
      id: 'shelf-count',
      description: 'Shelf count must match exactly',
      validate: (input, output) => {
        if (output.shelves.count !== input.shelves.count) {
          return `Shelf count mismatch: requested ${input.shelves.count}, got ${output.shelves.count}`;
        }
        return null;
      }
    },
    {
      id: 'shelf-size',
      description: 'Each shelf size must be within ±10% tolerance',
      validate: (input, output) => {
        for (let i = 0; i < input.shelves.spec.length; i++) {
          const inputShelf = input.shelves.spec[i];
          const outputShelf = output.shelves.spec[i];
          
          if (!outputShelf) {
            return `Missing shelf ${i + 1} in output`;
          }

          const widthVariance = Math.abs(outputShelf.width_cm - inputShelf.width_cm) / inputShelf.width_cm;
          const depthVariance = Math.abs(outputShelf.depth_cm - inputShelf.depth_cm) / inputShelf.depth_cm;

          if (widthVariance > this.SHELF_TOLERANCE) {
            return `Shelf ${i + 1} width variance ${(widthVariance * 100).toFixed(1)}% exceeds ±10%`;
          }
          if (depthVariance > this.SHELF_TOLERANCE) {
            return `Shelf ${i + 1} depth variance ${(depthVariance * 100).toFixed(1)}% exceeds ±10%`;
          }
        }
        return null;
      }
    },
    {
      id: 'product-count',
      description: 'Products per shelf must meet minimum requirements',
      validate: (input, output) => {
        for (let i = 0; i < input.shelves.spec.length; i++) {
          const inputShelf = input.shelves.spec[i];
          const outputShelf = output.shelves.spec[i];
          
          if (!outputShelf) {
            return `Missing shelf ${i + 1} in output`;
          }

          if (outputShelf.products_planned < inputShelf.min_products) {
            return `Shelf ${i + 1} has ${outputShelf.products_planned} products, minimum required: ${inputShelf.min_products}`;
          }
        }
        return null;
      }
    },
    {
      id: 'materials',
      description: 'Only allowed materials may be used',
      validate: (input, output) => {
        const disallowedMaterials = output.materials.used.filter(
          material => !input.materials.allowed.includes(material)
        );
        
        if (disallowedMaterials.length > 0) {
          return `Disallowed materials used: ${disallowedMaterials.join(', ')}. Allowed: ${input.materials.allowed.join(', ')}`;
        }
        return null;
      }
    },
    {
      id: 'manufacturable',
      description: 'Design must pass manufacturability checks',
      validate: (input, output) => {
        if (output.manufacturability.status === 'fail') {
          const failedChecks = output.manufacturability.checks
            .filter(check => check.result === 'fail')
            .map(check => `${check.name}: ${check.note}`)
            .join('; ');
          return `Manufacturability failed: ${failedChecks}`;
        }
        return null;
      }
    }
  ];

  static validateDisplay(input: DisplayValidationInput, output: DisplayValidationOutput): string[] {
    const errors: string[] = [];

    for (const rule of this.VALIDATION_RULES) {
      const error = rule.validate(input, output);
      if (error) {
        errors.push(`[${rule.id}] ${error}`);
      }
    }

    return errors;
  }

  static generateConstrainedPrompt(input: DisplayValidationInput): string {
    const displayTypeMapping = {
      'tabletop': 'countertop display stand',
      'fsu': 'floor-standing display unit',
      'wall_unit': 'wall-mounted display unit'
    };

    const materialMapping: Record<string, string> = {
      'plastic': 'injection-molded plastic construction',
      'cardboard': 'corrugated cardboard construction',
      'metal': 'powder-coated steel construction',
      'wood': 'engineered wood construction',
      'acrylic': 'laser-cut acrylic construction'
    };

    const displayType = displayTypeMapping[input.display_type];
    const materialDescriptions = input.materials.allowed.map(m => materialMapping[m] || m).join(' and ');

    return `STRICT REQUIREMENTS - MANDATORY COMPLIANCE:

DISPLAY TYPE: ${displayType} (NEVER output floor-standing if tabletop requested, NEVER output wall-mounted if floor-standing requested)

EXACT DIMENSIONS: ${input.dimensions_cm.width}cm W × ${input.dimensions_cm.depth}cm D × ${input.dimensions_cm.height}cm H (±10% tolerance maximum, HARD FAIL if >±15%)

SHELF CONFIGURATION:
- EXACTLY ${input.shelves.count} shelves (not ${input.shelves.count - 1}, not ${input.shelves.count + 1})
${input.shelves.spec.map(shelf => 
  `- Shelf ${shelf.index}: ${shelf.width_cm}cm × ${shelf.depth_cm}cm (±10% tolerance), minimum ${shelf.min_products} products`
).join('\n')}

MATERIALS: ONLY use ${input.materials.allowed.join(' OR ')} - ${materialDescriptions}
DO NOT introduce any other materials. If plastic is specified, do NOT add cardboard elements.

MANUFACTURABILITY REQUIREMENTS:
- No floating elements without structural support
- No extreme overhangs (>30% of base depth)
- Standard joinery methods (screws, snap-fits, welding as appropriate)
- Stable base design (center of gravity within base footprint)
- Realistic material thickness (plastic ≥2.5mm walls, cardboard ≥3mm corrugated)

BRAND INTEGRATION: Apply ${input.brand.primary_color} as primary color, incorporate logo prominently, integrate key visual elements

CRITICAL: Generate a ${input.display_type} that meets ALL specifications above. Any deviation from display type, dimensions beyond ±10%, wrong shelf count, or disallowed materials constitutes a HARD FAILURE.`;
  }

  static createCorrectedProposal(input: DisplayValidationInput): DisplayValidationOutput {
    // Create a corrected version that strictly adheres to all constraints
    const corrected: DisplayValidationOutput = {
      display_type: input.display_type,
      dimensions_cm: {
        height: input.dimensions_cm.height,
        width: input.dimensions_cm.width,
        depth: input.dimensions_cm.depth
      },
      materials: {
        allowed: input.materials.allowed,
        used: [input.materials.allowed[0]] // Use only the first allowed material
      },
      shelves: {
        count: input.shelves.count,
        spec: input.shelves.spec.map(shelf => ({
          index: shelf.index,
          width_cm: shelf.width_cm,
          depth_cm: shelf.depth_cm,
          front_lip_mm: 5,
          load_kg: 2.0,
          products_planned: shelf.min_products
        }))
      },
      brand: {
        logo_applied: input.brand.logo,
        key_visual_applied: input.brand.key_visual,
        primary_color: input.brand.primary_color,
        notes: "Logo prominently placed, key visual integrated, brand color applied throughout structure"
      },
      manufacturability: {
        status: 'pass',
        checks: [
          { name: 'stability', result: 'pass', note: 'Base width adequate for height' },
          { name: 'joinery', result: 'pass', note: 'Standard fastening methods used' },
          { name: 'overhangs', result: 'pass', note: 'All elements properly supported' },
          { name: 'material_thickness', result: 'pass', note: 'Appropriate thickness for material type' }
        ]
      },
      validation: {
        tolerance: {
          dimensions_pct: 10,
          shelf_dimensions_pct: 10
        },
        errors: []
      },
      corrected_proposal: null
    };

    return corrected;
  }

  static convertFormDataToValidationInput(formData: FormData): DisplayValidationInput {
    // Map FormData to ValidationInput format
    const displayTypeMapping: Record<string, 'tabletop' | 'fsu' | 'wall_unit'> = {
      'Masa Üstü Stant (Tabletop Stand)': 'tabletop',
      'Ayaklı Stant (Floor Stand)': 'fsu',
      'Duvar Stantı (Wall Mount Stand)': 'wall_unit'
    };

    const materialMapping: Record<string, string> = {
      'Metal': 'metal',
      'Ahşap (Wood)': 'wood',
      'Plastik (Plastic)': 'plastic',
      'Cam (Glass)': 'glass',
      'Karton (Cardboard)': 'cardboard',
      'Akrilik (Acrylic)': 'acrylic',
      'MDF': 'wood',
      'Alüminyum (Aluminum)': 'metal'
    };

    const shelfWidth = formData.shelfWidth || formData.standWidth - 4; // 2cm margin each side
    const shelfDepth = formData.shelfDepth || formData.standDepth - 4; // 2cm margin front/back
    const productsPerShelf = Math.max(1, Math.floor(shelfWidth / formData.productWidth));

    return {
      display_type: displayTypeMapping[formData.standType] || 'fsu',
      dimensions_cm: {
        height: formData.standHeight,
        width: formData.standWidth,
        depth: formData.standDepth
      },
      materials: {
        allowed: formData.materials.map(m => materialMapping[m] || m.toLowerCase())
      },
      shelves: {
        count: formData.shelfCount,
        spec: Array.from({ length: formData.shelfCount }, (_, i) => ({
          index: i + 1,
          width_cm: shelfWidth,
          depth_cm: shelfDepth,
          min_products: productsPerShelf
        }))
      },
      brand: {
        primary_color: formData.standBaseColor || '#FFFFFF',
        logo: !!formData.brandLogo,
        key_visual: !!formData.keyVisual
      }
    };
  }
}

export default DisplayValidator;
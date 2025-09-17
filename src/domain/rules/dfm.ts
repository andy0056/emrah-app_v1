import { DisplayTemplate } from '../templates/templateLibrary';

export interface ManufacturabilityIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'structure' | 'joinery' | 'printing' | 'packing' | 'assembly';
  message: string;
  suggestion?: string;
}

export interface ManufacturabilityReport {
  score: number; // 0-100, where 100 is perfectly manufacturable
  issues: ManufacturabilityIssue[];
  isManufacturable: boolean; // true if score >= 70 and no critical issues
  estimatedCost?: number;
  estimatedLeadTime?: number;
}

export class DFMValidator {

  static validateTemplate(template: DisplayTemplate): ManufacturabilityReport {
    const issues: ManufacturabilityIssue[] = [];

    // Run all validation checks
    issues.push(...this.validateStructuralIntegrity(template));
    issues.push(...this.validateJoinery(template));
    issues.push(...this.validatePrintZones(template));
    issues.push(...this.validatePacking(template));
    issues.push(...this.validateAssembly(template));

    // Calculate score based on issues
    const score = this.calculateScore(issues);
    const isManufacturable = score >= 70 && !issues.some(i => i.severity === 'critical');

    return {
      score,
      issues,
      isManufacturable,
      estimatedCost: this.estimateCost(template),
      estimatedLeadTime: this.estimateLeadTime(template)
    };
  }

  private static validateStructuralIntegrity(template: DisplayTemplate): ManufacturabilityIssue[] {
    const issues: ManufacturabilityIssue[] = [];
    const { width_mm, height_mm, depth_mm } = template.overall_dimensions;

    // Stability check: height to base ratio
    const stabilityRatio = height_mm / Math.min(width_mm, depth_mm);
    if (stabilityRatio > 3.0) {
      issues.push({
        severity: 'critical',
        category: 'structure',
        message: `Stability ratio too high (${stabilityRatio.toFixed(1)}). Display may tip over.`,
        suggestion: 'Increase base dimensions or reduce height'
      });
    } else if (stabilityRatio > 2.5) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        message: `Stability ratio borderline (${stabilityRatio.toFixed(1)}). Consider wider base.`,
        suggestion: 'Add weight to base or increase base dimensions'
      });
    }

    // Shelf span validation
    const shelves = template.modules.filter(m => m.type === 'shelf');
    shelves.forEach((shelf, index) => {
      const span = shelf.dimensions.width_mm;
      const thickness = template.material.thickness_mm;
      const maxSpan = this.getMaxSpanForMaterial(template.material.type, thickness);

      if (span > maxSpan) {
        issues.push({
          severity: 'critical',
          category: 'structure',
          message: `Shelf ${index + 1} span (${span}mm) exceeds safe limit for ${thickness}mm ${template.material.type}`,
          suggestion: `Reduce span to ${maxSpan}mm or add center support`
        });
      }
    });

    // Material thickness vs load
    const maxLoad = template.constraints.max_shelf_load_kg;
    const minThickness = this.getMinThicknessForLoad(template.material.type, maxLoad);
    if (template.material.thickness_mm < minThickness) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        message: `Material thickness (${template.material.thickness_mm}mm) may be insufficient for ${maxLoad}kg load`,
        suggestion: `Consider ${minThickness}mm thickness or reduce load rating`
      });
    }

    return issues;
  }

  private static validateJoinery(template: DisplayTemplate): ManufacturabilityIssue[] {
    const issues: ManufacturabilityIssue[] = [];
    const { joinery, material } = template;

    if (joinery.type === 'slot_tab') {
      const slotWidth = joinery.slot_width_mm || 0;
      const materialThickness = material.thickness_mm;

      // Slot width should be slightly larger than material thickness for easy assembly
      const idealTolerance = materialThickness * 0.04; // 4% tolerance
      const minSlot = materialThickness + 0.1;
      const maxSlot = materialThickness + idealTolerance + 0.3;

      if (slotWidth < minSlot) {
        issues.push({
          severity: 'critical',
          category: 'joinery',
          message: `Slot width (${slotWidth}mm) too tight for ${materialThickness}mm material`,
          suggestion: `Increase slot width to at least ${minSlot}mm`
        });
      } else if (slotWidth > maxSlot) {
        issues.push({
          severity: 'warning',
          category: 'joinery',
          message: `Slot width (${slotWidth}mm) may be too loose for ${materialThickness}mm material`,
          suggestion: `Reduce slot width to ${maxSlot.toFixed(1)}mm for better fit`
        });
      }

      // Tab count validation
      const shelves = template.modules.filter(m => m.type === 'shelf');
      const recommendedTabsPerShelf = Math.ceil(template.overall_dimensions.width_mm / 150); // One tab per 150mm
      const totalRecommendedTabs = shelves.length * recommendedTabsPerShelf + 4; // +4 for corners

      if ((joinery.tab_count || 0) < totalRecommendedTabs * 0.7) {
        issues.push({
          severity: 'warning',
          category: 'joinery',
          message: `Insufficient tabs (${joinery.tab_count}) for structural integrity`,
          suggestion: `Consider adding more tabs (recommended: ${totalRecommendedTabs})`
        });
      }
    }

    return issues;
  }

  private static validatePrintZones(template: DisplayTemplate): ManufacturabilityIssue[] {
    const issues: ManufacturabilityIssue[] = [];

    template.modules.forEach((module, index) => {
      if (module.printZone) {
        const { x_mm, y_mm, width_mm, height_mm } = module.printZone;
        const moduleWidth = module.dimensions.width_mm;
        const moduleHeight = module.dimensions.height_mm;

        // Check if print zone extends beyond module boundaries
        if (x_mm + width_mm > moduleWidth) {
          issues.push({
            severity: 'critical',
            category: 'printing',
            message: `Print zone on ${module.type} extends beyond module width`,
            suggestion: 'Reduce print zone width or move it inward'
          });
        }

        if (y_mm + height_mm > moduleHeight) {
          issues.push({
            severity: 'critical',
            category: 'printing',
            message: `Print zone on ${module.type} extends beyond module height`,
            suggestion: 'Reduce print zone height or move it inward'
          });
        }

        // Check minimum margin for cutting and folding
        const minMargin = 10; // 10mm minimum margin
        if (x_mm < minMargin || y_mm < minMargin) {
          issues.push({
            severity: 'warning',
            category: 'printing',
            message: `Print zone on ${module.type} too close to edge (${Math.min(x_mm, y_mm)}mm margin)`,
            suggestion: `Maintain at least ${minMargin}mm margin from edges`
          });
        }

        // Check if print zone overlaps with likely fold lines
        if (module.type === 'side_panel' && this.checkFoldLineOverlap(module, template)) {
          issues.push({
            severity: 'warning',
            category: 'printing',
            message: `Print zone on ${module.type} may overlap with fold lines`,
            suggestion: 'Adjust print zone to avoid fold areas'
          });
        }
      }
    });

    return issues;
  }

  private static validatePacking(template: DisplayTemplate): ManufacturabilityIssue[] {
    const issues: ManufacturabilityIssue[] = [];
    const { packing } = template;

    // Check flat-pack efficiency
    const totalMaterialArea = template.modules.reduce((area, module) => {
      return area + (module.dimensions.width_mm * (module.dimensions.height_mm || module.dimensions.depth_mm || 0));
    }, 0);

    const packArea = packing.flat_pack_dimensions.width_mm * packing.flat_pack_dimensions.height_mm;
    const efficiency = totalMaterialArea / packArea;

    if (efficiency < 0.6) {
      issues.push({
        severity: 'warning',
        category: 'packing',
        message: `Low packing efficiency (${(efficiency * 100).toFixed(1)}%). Wasted material.`,
        suggestion: 'Optimize part layout or reduce flat-pack dimensions'
      });
    }

    // Check shipping constraints
    const maxShippingDim = 1200; // 1.2m typical max for standard shipping
    if (Math.max(packing.flat_pack_dimensions.width_mm, packing.flat_pack_dimensions.height_mm) > maxShippingDim) {
      issues.push({
        severity: 'critical',
        category: 'packing',
        message: `Flat-pack dimensions exceed standard shipping limits (${maxShippingDim}mm)`,
        suggestion: 'Break down into smaller pieces or redesign for smaller pack size'
      });
    }

    // Check weight limits
    if (packing.shipping_weight_kg > 20) {
      issues.push({
        severity: 'warning',
        category: 'packing',
        message: `Shipping weight (${packing.shipping_weight_kg}kg) may require special handling`,
        suggestion: 'Consider lighter materials or break into multiple packages'
      });
    }

    return issues;
  }

  private static validateAssembly(template: DisplayTemplate): ManufacturabilityIssue[] {
    const issues: ManufacturabilityIssue[] = [];
    const { packing } = template;

    // Assembly time validation
    if (packing.estimated_assembly_minutes > 30) {
      issues.push({
        severity: 'warning',
        category: 'assembly',
        message: `Assembly time (${packing.estimated_assembly_minutes} min) may be too long for retail staff`,
        suggestion: 'Simplify assembly or provide better instructions'
      });
    }

    // Piece count validation
    if (packing.piece_count > 15) {
      issues.push({
        severity: 'warning',
        category: 'assembly',
        message: `High piece count (${packing.piece_count}) increases assembly complexity`,
        suggestion: 'Consider combining pieces or pre-assembling some components'
      });
    }

    // Assembly complexity vs target user
    if (template.constraints.assembly_complexity === 'complex' && template.archetype_id !== 'exhibition') {
      issues.push({
        severity: 'warning',
        category: 'assembly',
        message: 'Complex assembly may not be suitable for retail environment',
        suggestion: 'Simplify joints or provide pre-assembled components'
      });
    }

    return issues;
  }

  private static calculateScore(issues: ManufacturabilityIssue[]): number {
    let score = 100;

    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 2;
          break;
      }
    });

    return Math.max(0, score);
  }

  private static getMaxSpanForMaterial(materialType: string, thickness: number): number {
    const spanLimits: Record<string, number> = {
      'EB_flute_cardboard': thickness * 120, // 120x thickness in mm
      'MDF': thickness * 200,
      'acrylic': thickness * 150,
      'metal': thickness * 300,
      'plastic': thickness * 100
    };

    return spanLimits[materialType] || thickness * 100;
  }

  private static getMinThicknessForLoad(materialType: string, loadKg: number): number {
    const strengthFactors: Record<string, number> = {
      'EB_flute_cardboard': 0.8, // kg per mm thickness
      'MDF': 2.0,
      'acrylic': 1.5,
      'metal': 5.0,
      'plastic': 1.2
    };

    const factor = strengthFactors[materialType] || 1.0;
    return Math.ceil(loadKg / factor);
  }

  private static checkFoldLineOverlap(module: any, template: DisplayTemplate): boolean {
    // Simplified check - in real implementation, calculate actual fold positions
    return false;
  }

  private static estimateCost(template: DisplayTemplate): number {
    // Simplified cost estimation
    const materialCosts: Record<string, number> = {
      'EB_flute_cardboard': 0.02, // $ per sq cm
      'MDF': 0.05,
      'acrylic': 0.15,
      'metal': 0.25,
      'plastic': 0.08
    };

    const materialCost = materialCosts[template.material.type] || 0.05;
    const totalArea = template.modules.reduce((area, module) => {
      return area + (module.dimensions.width_mm * (module.dimensions.height_mm || module.dimensions.depth_mm || 0)) / 100; // convert to sq cm
    }, 0);

    const baseCost = totalArea * materialCost;
    const complexityMultiplier = template.constraints.assembly_complexity === 'complex' ? 1.5 :
                                template.constraints.assembly_complexity === 'moderate' ? 1.2 : 1.0;

    return baseCost * complexityMultiplier;
  }

  private static estimateLeadTime(template: DisplayTemplate): number {
    // Base lead time in days
    let leadTime = 3; // base 3 days for simple cardboard

    if (template.material.type !== 'EB_flute_cardboard') {
      leadTime += 2; // additional time for non-cardboard materials
    }

    if (template.constraints.assembly_complexity === 'complex') {
      leadTime += 2;
    }

    if (template.modules.some(m => m.printZone)) {
      leadTime += 1; // printing adds time
    }

    return leadTime;
  }

  // Quick validation for form data before template selection
  static validateFormData(formData: {
    standWidth: number;
    standHeight: number;
    standDepth: number;
    shelfCount: number;
    materials: string[];
  }): ManufacturabilityIssue[] {
    const issues: ManufacturabilityIssue[] = [];

    // Convert cm to mm for calculations
    const width_mm = formData.standWidth * 10;
    const height_mm = formData.standHeight * 10;
    const depth_mm = formData.standDepth * 10;

    // Basic dimension checks
    if (width_mm > 1500) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        message: 'Width exceeds typical retail space constraints',
        suggestion: 'Consider reducing width or designing modular units'
      });
    }

    if (height_mm > 2000) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        message: 'Height may exceed ceiling or safety constraints',
        suggestion: 'Reduce height to under 2000mm'
      });
    }

    // Stability check
    const stabilityRatio = height_mm / Math.min(width_mm, depth_mm);
    if (stabilityRatio > 3.0) {
      issues.push({
        severity: 'critical',
        category: 'structure',
        message: 'Dimensions create unstable design (too tall for base)',
        suggestion: 'Increase base dimensions or reduce height'
      });
    }

    // Shelf count vs height
    const avgShelfHeight = height_mm / (formData.shelfCount + 1); // +1 for header space
    if (avgShelfHeight < 200) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        message: 'Too many shelves for height - products may not fit',
        suggestion: 'Reduce shelf count or increase height'
      });
    }

    if (avgShelfHeight > 600) {
      issues.push({
        severity: 'info',
        category: 'structure',
        message: 'Large shelf spacing - may look empty',
        suggestion: 'Consider adding more shelves or reducing height'
      });
    }

    return issues;
  }
}
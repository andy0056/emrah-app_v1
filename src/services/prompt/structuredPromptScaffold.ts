import { DisplayTemplate } from '../../domain/templates/templateLibrary';
import { FormData } from '../../types';

export interface PromptScaffoldConfig {
  role: 'retail_finisher' | 'manufacturing_validator' | 'brand_integrator';
  preserveStructure: boolean;
  includeBrandAssets: boolean;
  showJoinery: boolean;
  emphasizeManufacturability: boolean;
}

export interface ScaffoldedPrompt {
  primary: string;
  negative: string;
  metadata: {
    template_id: string;
    archetype: string;
    model_optimized_for: string[];
    structure_preservation_level: 'strict' | 'moderate' | 'flexible';
  };
}

export class StructuredPromptScaffold {

  // Main scaffolding method that replaces legacy prompt generation
  static generateManufacturingScaffold(
    template: DisplayTemplate,
    formData: FormData,
    config: PromptScaffoldConfig
  ): ScaffoldedPrompt {
    const scaffold = this.buildPromptSections(template, formData, config);

    return {
      primary: scaffold.join('\n'),
      negative: this.generateNegativePrompt(config),
      metadata: {
        template_id: template.id,
        archetype: template.archetype_id,
        model_optimized_for: this.getOptimizedModels(config),
        structure_preservation_level: config.preserveStructure ? 'strict' : 'flexible'
      }
    };
  }

  private static buildPromptSections(
    template: DisplayTemplate,
    formData: FormData,
    config: PromptScaffoldConfig
  ): string[] {
    const sections: string[] = [];

    // 1. ROLE DEFINITION (most important)
    sections.push(...this.buildRoleSection(config.role));

    // 2. STRUCTURE PRESERVATION CONTRACT (critical)
    if (config.preserveStructure) {
      sections.push(...this.buildStructureContract(template));
    }

    // 3. MANUFACTURING CONSTRAINTS (important)
    sections.push(...this.buildManufacturingConstraints(template, config));

    // 4. DIMENSIONAL SPECIFICATIONS (important)
    sections.push(...this.buildDimensionalSpecs(template));

    // 5. MATERIAL SPECIFICATIONS (important)
    sections.push(...this.buildMaterialSpecs(template));

    // 6. JOINERY & ASSEMBLY (important if shown)
    if (config.showJoinery) {
      sections.push(...this.buildJoinerySpecs(template));
    }

    // 7. BRAND INTEGRATION (conditional)
    if (config.includeBrandAssets) {
      sections.push(...this.buildBrandingConstraints(template, formData));
    }

    // 8. PRODUCT DISPLAY SPECS (functional)
    sections.push(...this.buildProductDisplaySpecs(template));

    // 9. VISUAL QUALITY REQUIREMENTS (nice to have)
    sections.push(...this.buildVisualQualitySpecs(template, config));

    // 10. STRICT PROHIBITIONS (critical for preventing fantasy)
    sections.push(...this.buildProhibitions(config));

    return sections;
  }

  private static buildRoleSection(role: PromptScaffoldConfig['role']): string[] {
    const roleDefs = {
      retail_finisher: [
        "Role: Retail POP display finisher and manufacturing specialist.",
        "Expertise: Converting technical drawings to photorealistic displays while maintaining buildability.",
        "Priority: Structural accuracy over artistic interpretation."
      ],
      manufacturing_validator: [
        "Role: Manufacturing validation engineer for POP displays.",
        "Expertise: Ensuring all generated designs comply with production constraints.",
        "Priority: Manufacturability and cost-effectiveness over aesthetics."
      ],
      brand_integrator: [
        "Role: Brand asset integration specialist for retail displays.",
        "Expertise: Seamlessly integrating brand elements within manufacturing constraints.",
        "Priority: Brand consistency within structural limitations."
      ]
    };

    return [
      ...roleDefs[role],
      ""
    ];
  }

  private static buildStructureContract(template: DisplayTemplate): string[] {
    return [
      "STRUCTURE PRESERVATION CONTRACT:",
      "- Input structure guide MUST be preserved exactly",
      "- All edges, planes, and proportions are NON-NEGOTIABLE",
      "- No curves, overhangs, or geometry beyond guide specifications",
      "- Maintain all visible joinery points, tabs, and fold lines",
      "- Respect material thickness and connection methods",
      `- Template: ${template.name} (${template.archetype_id})`,
      ""
    ];
  }

  private static buildManufacturingConstraints(
    template: DisplayTemplate,
    config: PromptScaffoldConfig
  ): string[] {
    const constraints = [
      "MANUFACTURING CONSTRAINTS:"
    ];

    // Assembly complexity
    constraints.push(`- Assembly complexity: ${template.constraints.assembly_complexity}`);
    constraints.push(`- Assembly time: ${template.packing.estimated_assembly_minutes} minutes maximum`);

    // Structural limits
    constraints.push(`- Maximum shelf load: ${template.constraints.max_shelf_load_kg}kg per shelf`);
    constraints.push(`- Stability ratio: ${template.constraints.stability_ratio.toFixed(1)} (height/base)`);

    // Packing constraints
    constraints.push(`- Flat-pack size: ${template.packing.flat_pack_dimensions.width_mm}×${template.packing.flat_pack_dimensions.height_mm}×${template.packing.flat_pack_dimensions.depth_mm}mm`);
    constraints.push(`- Shipping weight: ${template.packing.shipping_weight_kg}kg`);

    if (config.emphasizeManufacturability) {
      constraints.push("- PRIORITY: Cost-effective production over visual appeal");
      constraints.push("- Show realistic material imperfections and joint tolerances");
    }

    constraints.push("");
    return constraints;
  }

  private static buildDimensionalSpecs(template: DisplayTemplate): string[] {
    const { width_mm, height_mm, depth_mm } = template.overall_dimensions;

    return [
      "DIMENSIONAL SPECIFICATIONS:",
      `- Overall: ${width_mm}mm W × ${height_mm}mm H × ${depth_mm}mm D`,
      `- Shelf count: ${template.product_capacity.shelf_count}`,
      `- Products per shelf: ${template.product_capacity.products_per_shelf}`,
      ""
    ];
  }

  private static buildMaterialSpecs(template: DisplayTemplate): string[] {
    const material = template.material;

    return [
      "MATERIAL SPECIFICATIONS:",
      `- Primary material: ${material.type.replace(/_/g, ' ')}`,
      `- Thickness: ${material.thickness_mm}mm`,
      `- Finish: ${material.finish || 'standard'}`,
      `- Color base: ${material.color || 'natural'}`,
      "- Show realistic material texture and edge details",
      ""
    ];
  }

  private static buildJoinerySpecs(template: DisplayTemplate): string[] {
    const joinery = template.joinery;
    const specs = ["JOINERY & ASSEMBLY:"];

    switch (joinery.type) {
      case 'slot_tab':
        specs.push(`- Slot-and-tab construction with ${joinery.tab_count} tabs`);
        specs.push(`- Slot width: ${joinery.slot_width_mm}mm`);
        specs.push("- Show visible tab insertions and material edge thickness");
        specs.push("- Display slight gaps at joints for realistic assembly");
        break;

      case 'screws':
        specs.push("- Screw fastening system");
        specs.push("- Show screw heads and hardware details");
        if (joinery.hardware_required) {
          specs.push(`- Hardware: ${joinery.hardware_required.join(', ')}`);
        }
        break;

      case 'adhesive':
        specs.push("- Adhesive bonding");
        specs.push("- Clean, seamless joints");
        break;

      case 'clip_fit':
        specs.push("- Clip-fit connections");
        specs.push("- Show clip mechanisms and engagement points");
        break;
    }

    specs.push("");
    return specs;
  }

  private static buildBrandingConstraints(template: DisplayTemplate, formData: FormData): string[] {
    const constraints = ["BRAND INTEGRATION CONSTRAINTS:"];

    // Color specifications
    if (formData.standBaseColor) {
      constraints.push(`- Primary color: ${formData.standBaseColor}`);
    }

    // Print zone compliance
    const printZones = template.modules.filter(m => m.printZone);
    if (printZones.length > 0) {
      constraints.push("- Logo placement ONLY within designated print zones:");
      printZones.forEach(module => {
        if (module.printZone) {
          const pz = module.printZone;
          constraints.push(`  • ${module.type}: ${pz.width_mm}×${pz.height_mm}mm zone at (${pz.x_mm}, ${pz.y_mm})`);
        }
      });
    }

    constraints.push("- No logo warping, stretching, or perspective distortion");
    constraints.push("- Maintain brand color accuracy");
    constraints.push("- Respect minimum margins around print areas");
    constraints.push("");

    return constraints;
  }

  private static buildProductDisplaySpecs(template: DisplayTemplate): string[] {
    const capacity = template.product_capacity;
    const { width_mm, height_mm, depth_mm } = capacity.max_product_dimensions;

    return [
      "PRODUCT DISPLAY SPECIFICATIONS:",
      `- Product dimensions: ${width_mm}×${height_mm}×${depth_mm}mm boxes`,
      `- ${capacity.products_per_shelf} products per shelf`,
      `- Total capacity: ${capacity.shelf_count * capacity.products_per_shelf} units`,
      "- Products clearly visible and accessible",
      "- No products occluding headers or critical branding areas",
      "- Realistic product arrangement with slight variations",
      ""
    ];
  }

  private static buildVisualQualitySpecs(
    template: DisplayTemplate,
    config: PromptScaffoldConfig
  ): string[] {
    return [
      "VISUAL QUALITY REQUIREMENTS:",
      "- Photorealistic retail photography style",
      "- Neutral studio lighting with soft shadows",
      "- 3/4 hero angle aligned with structure guide",
      "- Clean white or neutral background",
      "- Professional product photography aesthetic",
      "- Sharp focus on structure and material details",
      "- Subtle shadows to reveal edges, seams, and depth",
      ""
    ];
  }

  private static buildProhibitions(config: PromptScaffoldConfig): string[] {
    const prohibitions = [
      "STRICT PROHIBITIONS:",
      "- NO fantasy geometry or impossible structures",
      "- NO floating elements or invisible supports",
      "- NO curves or organic shapes not in original guide",
      "- NO hidden fasteners or magical joints",
      "- NO perspective distortion of guide proportions",
      "- NO modifications to structural angles or relationships"
    ];

    if (config.preserveStructure) {
      prohibitions.push("- NO creative interpretation of structural elements");
      prohibitions.push("- NO artistic liberties with engineering constraints");
    }

    if (config.emphasizeManufacturability) {
      prohibitions.push("- NO unrealistic material finishes or effects");
      prohibitions.push("- NO perfect joints (show realistic tolerances)");
    }

    prohibitions.push("");
    return prohibitions;
  }

  private static generateNegativePrompt(config: PromptScaffoldConfig): string {
    const negative = [
      "floating elements",
      "invisible supports",
      "fantasy geometry",
      "impossible structures",
      "curved surfaces",
      "hidden fasteners",
      "distorted proportions",
      "modified angles",
      "unrealistic materials",
      "perfect joints",
      "magical connections",
      "deformed structure",
      "blurry details",
      "low quality",
      "amateur photography"
    ];

    if (config.preserveStructure) {
      negative.push("creative interpretation", "artistic liberties", "structural modifications");
    }

    if (config.emphasizeManufacturability) {
      negative.push("glossy fantasy", "impossible finishes", "flawless assembly");
    }

    return negative.join(", ");
  }

  private static getOptimizedModels(config: PromptScaffoldConfig): string[] {
    const models = [];

    if (config.preserveStructure) {
      models.push("seedream-v4"); // Best for structure preservation
    }

    if (config.includeBrandAssets) {
      models.push("nano-banana"); // Best for multi-image fusion
    }

    if (!config.preserveStructure) {
      models.push("flux-kontext"); // Good for creative interpretation
    }

    return models.length > 0 ? models : ["seedream-v4"]; // Default to SeedReam
  }

  // Quick prompt generator for backwards compatibility
  static generateQuickPrompt(
    template: DisplayTemplate,
    formData: FormData,
    preserveStructure = true
  ): string {
    const config: PromptScaffoldConfig = {
      role: 'retail_finisher',
      preserveStructure,
      includeBrandAssets: !!formData.companyLogo,
      showJoinery: true,
      emphasizeManufacturability: true
    };

    const scaffold = this.generateManufacturingScaffold(template, formData, config);
    return scaffold.primary;
  }

  // Legacy compatibility - convert old prompts to scaffolded format
  static upgradeUnstructuredPrompt(
    oldPrompt: string,
    template: DisplayTemplate,
    formData: FormData
  ): ScaffoldedPrompt {
    console.warn('🔄 Upgrading unstructured prompt to manufacturing scaffold');

    const config: PromptScaffoldConfig = {
      role: 'retail_finisher',
      preserveStructure: true,
      includeBrandAssets: oldPrompt.includes('logo') || oldPrompt.includes('brand'),
      showJoinery: oldPrompt.includes('joint') || oldPrompt.includes('assembly'),
      emphasizeManufacturability: true
    };

    return this.generateManufacturingScaffold(template, formData, config);
  }
}
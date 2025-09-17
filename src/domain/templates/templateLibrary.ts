import { ArchetypeId } from './archetypes';

export interface MaterialSpec {
  type: 'EB_flute_cardboard' | 'MDF' | 'acrylic' | 'metal' | 'plastic';
  thickness_mm: number;
  finish?: string;
  color?: string;
}

export interface ModuleSpec {
  id: string;
  type: 'side_panel' | 'header' | 'shelf' | 'base_plate' | 'back_panel';
  dimensions: { width_mm: number; height_mm: number; depth_mm?: number };
  material: MaterialSpec;
  printZone?: {
    x_mm: number;
    y_mm: number;
    width_mm: number;
    height_mm: number;
  };
}

export interface JoinerySpec {
  type: 'slot_tab' | 'screws' | 'adhesive' | 'clip_fit';
  slot_width_mm?: number;
  tab_count?: number;
  hardware_required?: string[];
}

export interface PackingSpec {
  flat_pack_dimensions: { width_mm: number; height_mm: number; depth_mm: number };
  piece_count: number;
  estimated_assembly_minutes: number;
  shipping_weight_kg: number;
}

export interface DisplayTemplate {
  id: string;
  name: string;
  archetype_id: ArchetypeId;
  overall_dimensions: { width_mm: number; height_mm: number; depth_mm: number };
  material: MaterialSpec;
  modules: ModuleSpec[];
  joinery: JoinerySpec;
  packing: PackingSpec;
  product_capacity: {
    shelf_count: number;
    products_per_shelf: number;
    max_product_dimensions: { width_mm: number; height_mm: number; depth_mm: number };
  };
  constraints: {
    max_shelf_load_kg: number;
    stability_ratio: number; // height/base_width for tip-over safety
    assembly_complexity: 'simple' | 'moderate' | 'complex';
  };
}

// Template library - starting with 3-5 proven templates per archetype
export const TEMPLATE_LIBRARY: DisplayTemplate[] = [
  // FSU Templates
  {
    id: 'fsu_standard_4tier',
    name: 'Standard 4-Tier FSU',
    archetype_id: 'fsu',
    overall_dimensions: { width_mm: 600, height_mm: 1600, depth_mm: 400 },
    material: {
      type: 'EB_flute_cardboard',
      thickness_mm: 5,
      finish: 'matte',
      color: 'natural'
    },
    modules: [
      {
        id: 'header',
        type: 'header',
        dimensions: { width_mm: 600, height_mm: 200 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 5 },
        printZone: { x_mm: 50, y_mm: 25, width_mm: 500, height_mm: 150 }
      },
      {
        id: 'side_left',
        type: 'side_panel',
        dimensions: { width_mm: 400, height_mm: 1400 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 5 },
        printZone: { x_mm: 50, y_mm: 50, width_mm: 300, height_mm: 1300 }
      },
      {
        id: 'side_right',
        type: 'side_panel',
        dimensions: { width_mm: 400, height_mm: 1400 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 5 },
        printZone: { x_mm: 50, y_mm: 50, width_mm: 300, height_mm: 1300 }
      },
      {
        id: 'shelf_1',
        type: 'shelf',
        dimensions: { width_mm: 590, height_mm: 400, depth_mm: 5 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 5 }
      },
      {
        id: 'shelf_2',
        type: 'shelf',
        dimensions: { width_mm: 590, height_mm: 400, depth_mm: 5 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 5 }
      },
      {
        id: 'shelf_3',
        type: 'shelf',
        dimensions: { width_mm: 590, height_mm: 400, depth_mm: 5 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 5 }
      },
      {
        id: 'shelf_4',
        type: 'shelf',
        dimensions: { width_mm: 590, height_mm: 400, depth_mm: 5 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 5 }
      },
      {
        id: 'base',
        type: 'base_plate',
        dimensions: { width_mm: 600, height_mm: 400, depth_mm: 5 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 5 }
      }
    ],
    joinery: {
      type: 'slot_tab',
      slot_width_mm: 5.2,
      tab_count: 16
    },
    packing: {
      flat_pack_dimensions: { width_mm: 650, height_mm: 450, depth_mm: 25 },
      piece_count: 8,
      estimated_assembly_minutes: 15,
      shipping_weight_kg: 3.2
    },
    product_capacity: {
      shelf_count: 4,
      products_per_shelf: 8,
      max_product_dimensions: { width_mm: 75, height_mm: 180, depth_mm: 60 }
    },
    constraints: {
      max_shelf_load_kg: 5,
      stability_ratio: 2.67, // 1600/600
      assembly_complexity: 'simple'
    }
  },

  // Counter Display Templates
  {
    id: 'counter_compact_2tier',
    name: 'Compact 2-Tier Counter',
    archetype_id: 'counter',
    overall_dimensions: { width_mm: 300, height_mm: 400, depth_mm: 250 },
    material: {
      type: 'EB_flute_cardboard',
      thickness_mm: 3,
      finish: 'gloss',
      color: 'white'
    },
    modules: [
      {
        id: 'header',
        type: 'header',
        dimensions: { width_mm: 300, height_mm: 80 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 3 },
        printZone: { x_mm: 20, y_mm: 10, width_mm: 260, height_mm: 60 }
      },
      {
        id: 'side_left',
        type: 'side_panel',
        dimensions: { width_mm: 250, height_mm: 320 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 3 }
      },
      {
        id: 'side_right',
        type: 'side_panel',
        dimensions: { width_mm: 250, height_mm: 320 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 3 }
      },
      {
        id: 'shelf_1',
        type: 'shelf',
        dimensions: { width_mm: 294, height_mm: 250, depth_mm: 3 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 3 }
      },
      {
        id: 'shelf_2',
        type: 'shelf',
        dimensions: { width_mm: 294, height_mm: 250, depth_mm: 3 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 3 }
      }
    ],
    joinery: {
      type: 'slot_tab',
      slot_width_mm: 3.2,
      tab_count: 8
    },
    packing: {
      flat_pack_dimensions: { width_mm: 320, height_mm: 270, depth_mm: 15 },
      piece_count: 5,
      estimated_assembly_minutes: 8,
      shipping_weight_kg: 0.8
    },
    product_capacity: {
      shelf_count: 2,
      products_per_shelf: 4,
      max_product_dimensions: { width_mm: 70, height_mm: 120, depth_mm: 50 }
    },
    constraints: {
      max_shelf_load_kg: 3,
      stability_ratio: 1.33, // 400/300
      assembly_complexity: 'simple'
    }
  },

  // Modular Shipper Templates
  {
    id: 'shipper_medium_3tier',
    name: 'Medium 3-Tier Shipper',
    archetype_id: 'modular_shipper',
    overall_dimensions: { width_mm: 500, height_mm: 1200, depth_mm: 350 },
    material: {
      type: 'EB_flute_cardboard',
      thickness_mm: 4,
      finish: 'recyclable',
      color: 'kraft'
    },
    modules: [
      {
        id: 'header',
        type: 'header',
        dimensions: { width_mm: 500, height_mm: 150 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 4 },
        printZone: { x_mm: 40, y_mm: 20, width_mm: 420, height_mm: 110 }
      },
      {
        id: 'side_left',
        type: 'side_panel',
        dimensions: { width_mm: 350, height_mm: 1050 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 4 },
        printZone: { x_mm: 30, y_mm: 30, width_mm: 290, height_mm: 990 }
      },
      {
        id: 'side_right',
        type: 'side_panel',
        dimensions: { width_mm: 350, height_mm: 1050 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 4 },
        printZone: { x_mm: 30, y_mm: 30, width_mm: 290, height_mm: 990 }
      },
      {
        id: 'shelf_1',
        type: 'shelf',
        dimensions: { width_mm: 492, height_mm: 350, depth_mm: 4 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 4 }
      },
      {
        id: 'shelf_2',
        type: 'shelf',
        dimensions: { width_mm: 492, height_mm: 350, depth_mm: 4 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 4 }
      },
      {
        id: 'shelf_3',
        type: 'shelf',
        dimensions: { width_mm: 492, height_mm: 350, depth_mm: 4 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 4 }
      },
      {
        id: 'base',
        type: 'base_plate',
        dimensions: { width_mm: 500, height_mm: 350, depth_mm: 4 },
        material: { type: 'EB_flute_cardboard', thickness_mm: 4 }
      }
    ],
    joinery: {
      type: 'slot_tab',
      slot_width_mm: 4.2,
      tab_count: 12
    },
    packing: {
      flat_pack_dimensions: { width_mm: 520, height_mm: 370, depth_mm: 20 },
      piece_count: 7,
      estimated_assembly_minutes: 12,
      shipping_weight_kg: 2.1
    },
    product_capacity: {
      shelf_count: 3,
      products_per_shelf: 6,
      max_product_dimensions: { width_mm: 80, height_mm: 160, depth_mm: 70 }
    },
    constraints: {
      max_shelf_load_kg: 4,
      stability_ratio: 2.4, // 1200/500
      assembly_complexity: 'simple'
    }
  }
];

export function getTemplate(templateId: string): DisplayTemplate | undefined {
  return TEMPLATE_LIBRARY.find(template => template.id === templateId);
}

export function getTemplatesByArchetype(archetypeId: ArchetypeId): DisplayTemplate[] {
  return TEMPLATE_LIBRARY.filter(template => template.archetype_id === archetypeId);
}

export function findBestTemplate(
  archetypeId: ArchetypeId,
  targetDimensions: { width_mm: number; height_mm: number; depth_mm: number },
  shelfCount: number
): DisplayTemplate | null {
  const templates = getTemplatesByArchetype(archetypeId);

  if (templates.length === 0) return null;

  // Score templates based on how well they match requirements
  const scored = templates.map(template => {
    const dimScore = calculateDimensionScore(template.overall_dimensions, targetDimensions);
    const shelfScore = Math.abs(template.product_capacity.shelf_count - shelfCount) / shelfCount;
    const totalScore = dimScore + shelfScore;

    return { template, score: totalScore };
  });

  // Return template with lowest score (best match)
  scored.sort((a, b) => a.score - b.score);
  return scored[0].template;
}

function calculateDimensionScore(
  templateDims: { width_mm: number; height_mm: number; depth_mm: number },
  targetDims: { width_mm: number; height_mm: number; depth_mm: number }
): number {
  const widthDiff = Math.abs(templateDims.width_mm - targetDims.width_mm) / targetDims.width_mm;
  const heightDiff = Math.abs(templateDims.height_mm - targetDims.height_mm) / targetDims.height_mm;
  const depthDiff = Math.abs(templateDims.depth_mm - targetDims.depth_mm) / targetDims.depth_mm;

  return (widthDiff + heightDiff + depthDiff) / 3;
}
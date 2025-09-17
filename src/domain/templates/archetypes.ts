// Empati's proven buildable archetypes from their "Organized Display Solutions"
export type ArchetypeId =
  | 'modular_shipper'
  | 'shelf'
  | 'hanger'
  | 'fsu'  // Floor Standing Unit
  | 'counter'
  | 'island'
  | 'exhibition';

export interface Archetype {
  id: ArchetypeId;
  name: string;
  description: string;
  category: 'floor' | 'counter' | 'wall' | 'specialty';
  maxDimensions: {
    width_mm: number;
    height_mm: number;
    depth_mm: number;
  };
  constraints: {
    minShelfSpan: number;
    maxShelfSpan: number;
    maxShelfLoad_kg: number;
    requiresBase: boolean;
    supportsGraphics: boolean;
  };
}

export const BUILDABLE_ARCHETYPES: Archetype[] = [
  {
    id: 'modular_shipper',
    name: 'Modular Shipper',
    description: 'Flat-pack cardboard display that ships flat and assembles on-site',
    category: 'floor',
    maxDimensions: { width_mm: 800, height_mm: 1800, depth_mm: 600 },
    constraints: {
      minShelfSpan: 200,
      maxShelfSpan: 600,
      maxShelfLoad_kg: 5,
      requiresBase: true,
      supportsGraphics: true
    }
  },
  {
    id: 'shelf',
    name: 'Shelf Display',
    description: 'Simple shelf-based display for existing retail fixtures',
    category: 'counter',
    maxDimensions: { width_mm: 600, height_mm: 400, depth_mm: 400 },
    constraints: {
      minShelfSpan: 150,
      maxShelfSpan: 500,
      maxShelfLoad_kg: 8,
      requiresBase: false,
      supportsGraphics: true
    }
  },
  {
    id: 'fsu',
    name: 'Floor Standing Unit',
    description: 'Permanent floor display with multiple tiers and header graphics',
    category: 'floor',
    maxDimensions: { width_mm: 1000, height_mm: 2000, depth_mm: 800 },
    constraints: {
      minShelfSpan: 250,
      maxShelfSpan: 800,
      maxShelfLoad_kg: 12,
      requiresBase: true,
      supportsGraphics: true
    }
  },
  {
    id: 'counter',
    name: 'Counter Display',
    description: 'Compact point-of-sale display for checkout areas',
    category: 'counter',
    maxDimensions: { width_mm: 400, height_mm: 600, depth_mm: 300 },
    constraints: {
      minShelfSpan: 100,
      maxShelfSpan: 350,
      maxShelfLoad_kg: 3,
      requiresBase: false,
      supportsGraphics: true
    }
  },
  {
    id: 'hanger',
    name: 'Hanger Display',
    description: 'Hanging display for overhead or wire rack mounting',
    category: 'wall',
    maxDimensions: { width_mm: 500, height_mm: 300, depth_mm: 200 },
    constraints: {
      minShelfSpan: 100,
      maxShelfSpan: 400,
      maxShelfLoad_kg: 2,
      requiresBase: false,
      supportsGraphics: true
    }
  },
  {
    id: 'island',
    name: 'Island Display',
    description: 'Four-sided freestanding display for high-traffic areas',
    category: 'specialty',
    maxDimensions: { width_mm: 1200, height_mm: 1800, depth_mm: 1200 },
    constraints: {
      minShelfSpan: 300,
      maxShelfSpan: 1000,
      maxShelfLoad_kg: 15,
      requiresBase: true,
      supportsGraphics: true
    }
  },
  {
    id: 'exhibition',
    name: 'Exhibition Display',
    description: 'Large-scale trade show or event display with premium finishes',
    category: 'specialty',
    maxDimensions: { width_mm: 3000, height_mm: 2500, depth_mm: 1500 },
    constraints: {
      minShelfSpan: 400,
      maxShelfSpan: 2500,
      maxShelfLoad_kg: 25,
      requiresBase: true,
      supportsGraphics: true
    }
  }
];

// Map user-friendly stand types to archetypes
export const STAND_TYPE_TO_ARCHETYPE: Record<string, ArchetypeId> = {
  'Ayaklı Stant (Floor Stand)': 'fsu',
  'Masa Üstü Stant (Tabletop Stand)': 'counter',
  'Duvar Stantı (Wall Mount Stand)': 'hanger',
  'Köşe Stantı (Corner Stand)': 'fsu',
  'Dönen Stant (Rotating Stand)': 'island',
  'Çok Katlı Stant (Multi-tier Stand)': 'modular_shipper'
};

export function getArchetype(id: ArchetypeId): Archetype | undefined {
  return BUILDABLE_ARCHETYPES.find(arch => arch.id === id);
}

export function mapStandTypeToArchetype(standType: string): ArchetypeId {
  return STAND_TYPE_TO_ARCHETYPE[standType] || 'fsu';
}
import { DisplayTemplate } from '../../domain/templates/templateLibrary';

export interface GuideGenerationOptions {
  perspective: '3quarter' | 'orthographic_front' | 'orthographic_side';
  showDimensions: boolean;
  showJoinery: boolean;
  showFoldLines: boolean;
  exportFormat: 'svg' | 'png';
  resolution?: number; // for PNG export
}

export interface StructureGuide {
  svg: string;
  png?: string; // base64 encoded if exported as PNG
  metadata: {
    template_id: string;
    perspective: string;
    dimensions: { width: number; height: number };
  };
}

export class StructureGuideGenerator {

  static async generateGuide(
    template: DisplayTemplate,
    options: GuideGenerationOptions = {
      perspective: '3quarter',
      showDimensions: true,
      showJoinery: true,
      showFoldLines: true,
      exportFormat: 'svg'
    }
  ): Promise<StructureGuide> {
    const svg = this.generateSVG(template, options);

    const guide: StructureGuide = {
      svg,
      metadata: {
        template_id: template.id,
        perspective: options.perspective,
        dimensions: { width: 800, height: 600 }
      }
    };

    if (options.exportFormat === 'png') {
      guide.png = await this.convertSVGToPNG(svg, options.resolution || 1024);
    }

    return guide;
  }

  private static generateSVG(template: DisplayTemplate, options: GuideGenerationOptions): string {
    const { width_mm, height_mm, depth_mm } = template.overall_dimensions;
    const scale = 0.3; // Scale down for display

    const svgWidth = 800;
    const svgHeight = 600;

    // Calculate isometric projection for 3/4 view
    const isoX = (x: number, z: number) => x * Math.cos(Math.PI / 6) - z * Math.cos(Math.PI / 6);
    const isoY = (x: number, y: number, z: number) =>
      -y + x * Math.sin(Math.PI / 6) + z * Math.sin(Math.PI / 6);

    const centerX = svgWidth / 2;
    const centerY = svgHeight / 2;

    let svgElements: string[] = [];

    // Generate structure based on template modules
    if (options.perspective === '3quarter') {
      svgElements = this.generate3QuarterView(template, scale, centerX, centerY, options);
    } else if (options.perspective === 'orthographic_front') {
      svgElements = this.generateFrontView(template, scale, centerX, centerY, options);
    } else {
      svgElements = this.generateSideView(template, scale, centerX, centerY, options);
    }

    // Add dimension annotations if requested
    if (options.showDimensions) {
      svgElements.push(...this.generateDimensionAnnotations(template, scale, centerX, centerY));
    }

    return `
      <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .panel { fill: #f5f5f5; stroke: #333; stroke-width: 1; }
            .shelf { fill: #e8e8e8; stroke: #333; stroke-width: 1; }
            .joint { fill: none; stroke: #666; stroke-width: 0.5; stroke-dasharray: 2,2; }
            .fold { fill: none; stroke: #999; stroke-width: 0.5; stroke-dasharray: 1,1; }
            .dimension { fill: none; stroke: #0066cc; stroke-width: 1; }
            .dim-text { font-family: Arial; font-size: 10px; fill: #0066cc; }
            .print-zone { fill: rgba(255,255,0,0.1); stroke: #ffaa00; stroke-width: 0.5; }
          </style>
        </defs>

        <!-- Background -->
        <rect width="100%" height="100%" fill="#ffffff"/>

        <!-- Structure elements -->
        ${svgElements.join('\n')}

        <!-- Template info -->
        <text x="10" y="20" class="dim-text" font-size="12">
          Template: ${template.name}
        </text>
        <text x="10" y="35" class="dim-text">
          Dimensions: ${width_mm}×${height_mm}×${depth_mm}mm
        </text>
        <text x="10" y="50" class="dim-text">
          Material: ${template.material.type} ${template.material.thickness_mm}mm
        </text>
        <text x="10" y="65" class="dim-text">
          Assembly: ${template.packing.estimated_assembly_minutes} min
        </text>
      </svg>
    `.trim();
  }

  private static generate3QuarterView(
    template: DisplayTemplate,
    scale: number,
    centerX: number,
    centerY: number,
    options: GuideGenerationOptions
  ): string[] {
    const elements: string[] = [];
    const { width_mm, height_mm, depth_mm } = template.overall_dimensions;

    // Isometric projection helpers
    const isoX = (x: number, z: number) => x * Math.cos(Math.PI / 6) - z * Math.cos(Math.PI / 6);
    const isoY = (x: number, y: number, z: number) =>
      -y + x * Math.sin(Math.PI / 6) + z * Math.sin(Math.PI / 6);

    // Base coordinates
    const w = width_mm * scale;
    const h = height_mm * scale;
    const d = depth_mm * scale;

    // Define the main structure outline (isometric cube)
    const frontFace = [
      [centerX + isoX(0, 0), centerY + isoY(0, 0, 0)],
      [centerX + isoX(w, 0), centerY + isoY(w, 0, 0)],
      [centerX + isoX(w, -h), centerY + isoY(w, -h, 0)],
      [centerX + isoX(0, -h), centerY + isoY(0, -h, 0)]
    ];

    const rightFace = [
      [centerX + isoX(w, 0), centerY + isoY(w, 0, 0)],
      [centerX + isoX(w, -d), centerY + isoY(w, 0, -d)],
      [centerX + isoX(w, -d), centerY + isoY(w, -h, -d)],
      [centerX + isoX(w, 0), centerY + isoY(w, -h, 0)]
    ];

    const topFace = [
      [centerX + isoX(0, -h), centerY + isoY(0, -h, 0)],
      [centerX + isoX(w, -h), centerY + isoY(w, -h, 0)],
      [centerX + isoX(w, -d), centerY + isoY(w, -h, -d)],
      [centerX + isoX(0, -d), centerY + isoY(0, -h, -d)]
    ];

    // Draw main faces
    elements.push(`<polygon points="${frontFace.map(p => p.join(',')).join(' ')}" class="panel"/>`);
    elements.push(`<polygon points="${rightFace.map(p => p.join(',')).join(' ')}" class="panel"/>`);
    elements.push(`<polygon points="${topFace.map(p => p.join(',')).join(' ')}" class="panel"/>`);

    // Add shelves based on template
    const shelves = template.modules.filter(m => m.type === 'shelf');
    shelves.forEach((shelf, index) => {
      const shelfY = -((index + 1) * (h / (shelves.length + 1)));
      const shelfFront = [
        [centerX + isoX(5, 0), centerY + isoY(5, shelfY, 0)],
        [centerX + isoX(w-5, 0), centerY + isoY(w-5, shelfY, 0)],
        [centerX + isoX(w-5, -d+5), centerY + isoY(w-5, shelfY, -d+5)],
        [centerX + isoX(5, -d+5), centerY + isoY(5, shelfY, -d+5)]
      ];
      elements.push(`<polygon points="${shelfFront.map(p => p.join(',')).join(' ')}" class="shelf"/>`);
    });

    // Add print zones if they exist
    template.modules.forEach(module => {
      if (module.printZone && options.showDimensions) {
        const pz = module.printZone;
        if (module.type === 'header') {
          // Header print zone on top face
          const pzPoints = [
            [centerX + isoX(pz.x_mm * scale, -h), centerY + isoY(pz.x_mm * scale, -h, -(depth_mm - pz.y_mm) * scale)],
            [centerX + isoX((pz.x_mm + pz.width_mm) * scale, -h), centerY + isoY((pz.x_mm + pz.width_mm) * scale, -h, -(depth_mm - pz.y_mm) * scale)],
            [centerX + isoX((pz.x_mm + pz.width_mm) * scale, -h), centerY + isoY((pz.x_mm + pz.width_mm) * scale, -h, -(depth_mm - pz.y_mm - pz.height_mm) * scale)],
            [centerX + isoX(pz.x_mm * scale, -h), centerY + isoY(pz.x_mm * scale, -h, -(depth_mm - pz.y_mm - pz.height_mm) * scale)]
          ];
          elements.push(`<polygon points="${pzPoints.map(p => p.join(',')).join(' ')}" class="print-zone"/>`);
        }
      }
    });

    // Add joinery indicators (slot/tab positions)
    if (options.showJoinery && template.joinery.type === 'slot_tab') {
      const tabCount = template.joinery.tab_count || 0;
      for (let i = 0; i < tabCount; i++) {
        const tabX = (i / tabCount) * w;
        elements.push(`
          <line x1="${centerX + isoX(tabX, 0)}" y1="${centerY + isoY(tabX, 0, 0)}"
                x2="${centerX + isoX(tabX, 0)}" y2="${centerY + isoY(tabX, -10, 0)}"
                class="joint"/>
        `);
      }
    }

    return elements;
  }

  private static generateFrontView(
    template: DisplayTemplate,
    scale: number,
    centerX: number,
    centerY: number,
    options: GuideGenerationOptions
  ): string[] {
    const elements: string[] = [];
    const { width_mm, height_mm } = template.overall_dimensions;

    const w = width_mm * scale;
    const h = height_mm * scale;

    // Main outline
    const x = centerX - w/2;
    const y = centerY - h/2;

    elements.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="panel"/>`);

    // Add shelves
    const shelves = template.modules.filter(m => m.type === 'shelf');
    shelves.forEach((shelf, index) => {
      const shelfY = y + ((index + 1) * (h / (shelves.length + 1)));
      elements.push(`<line x1="${x + 10}" y1="${shelfY}" x2="${x + w - 10}" y2="${shelfY}" class="shelf" stroke-width="3"/>`);
    });

    // Header area
    const header = template.modules.find(m => m.type === 'header');
    if (header) {
      const headerHeight = (header.dimensions.height_mm / height_mm) * h;
      elements.push(`<rect x="${x}" y="${y}" width="${w}" height="${headerHeight}" class="panel" fill="#f0f0f0"/>`);

      if (header.printZone) {
        const pz = header.printZone;
        const pzX = x + (pz.x_mm / width_mm) * w;
        const pzW = (pz.width_mm / width_mm) * w;
        const pzH = (pz.height_mm / header.dimensions.height_mm) * headerHeight;
        elements.push(`<rect x="${pzX}" y="${y + 5}" width="${pzW}" height="${pzH}" class="print-zone"/>`);
      }
    }

    return elements;
  }

  private static generateSideView(
    template: DisplayTemplate,
    scale: number,
    centerX: number,
    centerY: number,
    options: GuideGenerationOptions
  ): string[] {
    const elements: string[] = [];
    const { depth_mm, height_mm } = template.overall_dimensions;

    const d = depth_mm * scale;
    const h = height_mm * scale;

    const x = centerX - d/2;
    const y = centerY - h/2;

    elements.push(`<rect x="${x}" y="${y}" width="${d}" height="${h}" class="panel"/>`);

    // Add shelf depth lines
    const shelves = template.modules.filter(m => m.type === 'shelf');
    shelves.forEach((shelf, index) => {
      const shelfY = y + ((index + 1) * (h / (shelves.length + 1)));
      elements.push(`<line x1="${x + 5}" y1="${shelfY}" x2="${x + d - 5}" y2="${shelfY}" class="shelf" stroke-width="2"/>`);
    });

    return elements;
  }

  private static generateDimensionAnnotations(
    template: DisplayTemplate,
    scale: number,
    centerX: number,
    centerY: number
  ): string[] {
    const elements: string[] = [];
    const { width_mm, height_mm, depth_mm } = template.overall_dimensions;

    // Width dimension
    const w = width_mm * scale;
    const h = height_mm * scale;

    elements.push(`
      <line x1="${centerX - w/2}" y1="${centerY + h/2 + 20}" x2="${centerX + w/2}" y2="${centerY + h/2 + 20}" class="dimension"/>
      <line x1="${centerX - w/2}" y1="${centerY + h/2 + 15}" x2="${centerX - w/2}" y2="${centerY + h/2 + 25}" class="dimension"/>
      <line x1="${centerX + w/2}" y1="${centerY + h/2 + 15}" x2="${centerX + w/2}" y2="${centerY + h/2 + 25}" class="dimension"/>
      <text x="${centerX}" y="${centerY + h/2 + 35}" class="dim-text" text-anchor="middle">${width_mm}mm</text>
    `);

    // Height dimension
    elements.push(`
      <line x1="${centerX - w/2 - 20}" y1="${centerY - h/2}" x2="${centerX - w/2 - 20}" y2="${centerY + h/2}" class="dimension"/>
      <line x1="${centerX - w/2 - 15}" y1="${centerY - h/2}" x2="${centerX - w/2 - 25}" y2="${centerY - h/2}" class="dimension"/>
      <line x1="${centerX - w/2 - 15}" y1="${centerY + h/2}" x2="${centerX - w/2 - 25}" y2="${centerY + h/2}" class="dimension"/>
      <text x="${centerX - w/2 - 35}" y="${centerY}" class="dim-text" text-anchor="middle" transform="rotate(-90 ${centerX - w/2 - 35} ${centerY})">${height_mm}mm</text>
    `);

    return elements;
  }

  private static async convertSVGToPNG(svg: string, resolution: number): Promise<string> {
    // In a real implementation, you'd use a server-side SVG->PNG converter
    // For now, return a placeholder
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }

  static async generateGuideForFormData(
    formData: { standWidth: number; standHeight: number; standDepth: number; standType: string; shelfCount: number },
    perspective: '3quarter' | 'orthographic_front' | 'orthographic_side' = '3quarter'
  ): Promise<StructureGuide | null> {
    // Import here to avoid circular dependencies
    const { mapStandTypeToArchetype } = await import('../../domain/templates/archetypes');
    const { findBestTemplate } = await import('../../domain/templates/templateLibrary');

    const archetypeId = mapStandTypeToArchetype(formData.standType);
    const targetDimensions = {
      width_mm: formData.standWidth * 10, // Convert cm to mm
      height_mm: formData.standHeight * 10,
      depth_mm: formData.standDepth * 10
    };

    const template = findBestTemplate(archetypeId, targetDimensions, formData.shelfCount);
    if (!template) return null;

    return this.generateGuide(template, {
      perspective,
      showDimensions: true,
      showJoinery: true,
      showFoldLines: true,
      exportFormat: 'svg'
    });
  }
}
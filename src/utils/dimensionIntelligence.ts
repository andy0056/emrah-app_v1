/**
 * Dimensional Intelligence System
 *
 * Analyzes product and stand dimensions to generate physically realistic
 * AI prompts that respect manufacturing constraints and spatial relationships
 */

interface ProductDimensions {
  width: number;    // Ürün Genişlik (cm)
  depth: number;    // Ürün Derinlik (cm)
  height: number;   // Ürün Yükseklik (cm)
  frontFaceCount: number;  // Ürün Ön Yüz Sayısı
  backToBackCount: number; // Arka Arkaya Ürün Sayısı
}

interface StandDimensions {
  width: number;    // Stant Genişlik (cm)
  depth: number;    // Stant Derinlik (cm)
  height: number;   // Stant Yükseklik (cm)
}

interface ShelfSpecifications {
  width: number;    // Raf Genişlik (cm)
  depth: number;    // Raf Derinlik (cm)
  count: number;    // Raf Sayısı
}

interface DimensionalAnalysis {
  isPhysicallyValid: boolean;
  issues: string[];
  recommendations: string[];
  calculatedLayout: ProductLayout;
  spaceUtilization: SpaceUtilization;
  manufacturingConstraints: ManufacturingConstraint[];
}

interface ProductLayout {
  productsPerShelf: number;
  shelfRows: number;
  shelfColumns: number;
  totalProductCapacity: number;
  productSpacing: number;
  shelfSpacing: number;
}

interface SpaceUtilization {
  shelfUsagePercent: number;
  standUsagePercent: number;
  wastedSpace: number;
  efficiency: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
}

interface ManufacturingConstraint {
  type: 'STRUCTURAL' | 'AESTHETIC' | 'PRACTICAL' | 'SAFETY';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestion: string;
}

interface SmartPromptEnhancement {
  dimensionalPrefix: string;
  structuralGuidance: string;
  proportionInstructions: string;
  realismEnforcement: string;
  manufacturingHints: string;
}

class DimensionIntelligenceService {

  /**
   * Comprehensive dimensional analysis with manufacturing intelligence
   */
  static analyzeDimensions(
    product: ProductDimensions,
    stand: StandDimensions,
    shelf: ShelfSpecifications
  ): DimensionalAnalysis {

    const issues: string[] = [];
    const recommendations: string[] = [];
    const constraints: ManufacturingConstraint[] = [];

    // 1. BASIC PHYSICAL VALIDATION
    const basicValidation = this.validateBasicPhysics(product, stand, shelf);
    issues.push(...basicValidation.issues);
    constraints.push(...basicValidation.constraints);

    // 2. PRODUCT LAYOUT CALCULATIONS
    const layout = this.calculateOptimalLayout(product, shelf);

    // 3. SPACE UTILIZATION ANALYSIS
    const utilization = this.analyzeSpaceUtilization(product, stand, shelf, layout);

    // 4. MANUFACTURING CONSTRAINTS
    const manufacturingAnalysis = this.analyzeManufacturingConstraints(product, stand, shelf);
    constraints.push(...manufacturingAnalysis);

    // 5. GENERATE RECOMMENDATIONS
    recommendations.push(...this.generateRecommendations(product, stand, shelf, layout, utilization));

    return {
      isPhysicallyValid: issues.length === 0,
      issues,
      recommendations,
      calculatedLayout: layout,
      spaceUtilization: utilization,
      manufacturingConstraints: constraints
    };
  }

  /**
   * Generate intelligent prompt enhancements based on dimensional analysis
   */
  static generateSmartPrompt(
    product: ProductDimensions,
    stand: StandDimensions,
    shelf: ShelfSpecifications,
    basePrompt: string
  ): SmartPromptEnhancement {

    const analysis = this.analyzeDimensions(product, stand, shelf);
    const layout = analysis.calculatedLayout;

    // DIMENSIONAL PREFIX - Exact specifications
    const dimensionalPrefix = `EXACT DIMENSIONS: ${stand.width}cm W × ${stand.depth}cm D × ${stand.height}cm H display stand`;

    // STRUCTURAL GUIDANCE - Based on calculations
    const shelfHeight = Math.floor(stand.height / shelf.count) - 2; // Account for shelf thickness
    const structuralGuidance = `${shelf.count} shelves, each ${shelf.width}cm × ${shelf.depth}cm × ${shelfHeight}cm high, evenly spaced vertically`;

    // PROPORTION INSTRUCTIONS - Realistic ratios
    const proportionInstructions = this.generateProportionGuidance(product, stand, shelf, layout);

    // REALISM ENFORCEMENT - Physical constraints
    const realismEnforcement = this.generateRealismConstraints(analysis);

    // MANUFACTURING HINTS - Buildable features
    const manufacturingHints = this.generateManufacturingGuidance(stand, shelf);

    return {
      dimensionalPrefix,
      structuralGuidance,
      proportionInstructions,
      realismEnforcement,
      manufacturingHints
    };
  }

  /**
   * Create dimension-aware prompt for AI models
   */
  static createDimensionAwarePrompt(
    basePrompt: string,
    product: ProductDimensions,
    stand: StandDimensions,
    shelf: ShelfSpecifications,
    viewType: 'front' | 'store' | 'three-quarter' = 'front'
  ): string {

    const smartPrompt = this.generateSmartPrompt(product, stand, shelf, basePrompt);
    const analysis = this.analyzeDimensions(product, stand, shelf);

    // View-specific adjustments
    const viewInstructions = this.getViewSpecificInstructions(viewType, stand, shelf);

    return `${basePrompt}

CRITICAL DIMENSIONAL REQUIREMENTS:
${smartPrompt.dimensionalPrefix}

STRUCTURAL SPECIFICATION:
${smartPrompt.structuralGuidance}

PRODUCT ARRANGEMENT:
- Products: ${product.width}×${product.depth}×${product.height}cm each
- Shelf capacity: ${analysis.calculatedLayout.productsPerShelf} products per shelf
- Layout: ${analysis.calculatedLayout.shelfRows} rows × ${analysis.calculatedLayout.shelfColumns} columns
- Total capacity: ${analysis.calculatedLayout.totalProductCapacity} products

${smartPrompt.proportionInstructions}

REALISM CONSTRAINTS:
${smartPrompt.realismEnforcement}

MANUFACTURING REQUIREMENTS:
${smartPrompt.manufacturingHints}

VIEW SPECIFICATIONS:
${viewInstructions}

DIMENSION VALIDATION: The AI must create a display that exactly matches these measurements and can physically hold the specified products in the calculated arrangement.`;
  }

  /**
   * Validate basic physics and spatial relationships
   */
  private static validateBasicPhysics(
    product: ProductDimensions,
    stand: StandDimensions,
    shelf: ShelfSpecifications
  ): { issues: string[]; constraints: ManufacturingConstraint[] } {

    const issues: string[] = [];
    const constraints: ManufacturingConstraint[] = [];

    // Product vs Shelf fit
    if (product.width > shelf.width) {
      issues.push(`Product width (${product.width}cm) exceeds shelf width (${shelf.width}cm)`);
      constraints.push({
        type: 'STRUCTURAL',
        description: 'Product cannot fit on shelf width-wise',
        severity: 'CRITICAL',
        suggestion: `Increase shelf width to at least ${product.width + 2}cm for proper fit`
      });
    }

    if (product.depth > shelf.depth) {
      issues.push(`Product depth (${product.depth}cm) exceeds shelf depth (${shelf.depth}cm)`);
      constraints.push({
        type: 'STRUCTURAL',
        description: 'Product cannot fit on shelf depth-wise',
        severity: 'CRITICAL',
        suggestion: `Increase shelf depth to at least ${product.depth + 1}cm for stability`
      });
    }

    // Shelf vs Stand fit
    if (shelf.width > stand.width) {
      issues.push(`Shelf width (${shelf.width}cm) exceeds stand width (${stand.width}cm)`);
      constraints.push({
        type: 'STRUCTURAL',
        description: 'Shelf cannot fit within stand structure',
        severity: 'CRITICAL',
        suggestion: `Reduce shelf width or increase stand width`
      });
    }

    if (shelf.depth > stand.depth) {
      issues.push(`Shelf depth (${shelf.depth}cm) exceeds stand depth (${stand.depth}cm)`);
      constraints.push({
        type: 'STRUCTURAL',
        description: 'Shelf extends beyond stand boundaries',
        severity: 'CRITICAL',
        suggestion: `Reduce shelf depth or increase stand depth`
      });
    }

    // Height constraints
    const minHeightNeeded = (shelf.count * (product.height + 3)) + (shelf.count * 2); // 3cm clearance + 2cm shelf thickness
    if (minHeightNeeded > stand.height) {
      issues.push(`Insufficient height: Need ${minHeightNeeded}cm, have ${stand.height}cm`);
      constraints.push({
        type: 'STRUCTURAL',
        description: 'Not enough vertical space for all shelves and products',
        severity: 'HIGH',
        suggestion: `Reduce shelf count to ${Math.floor(stand.height / (product.height + 5))} or increase stand height`
      });
    }

    return { issues, constraints };
  }

  /**
   * Calculate optimal product layout on shelves
   */
  private static calculateOptimalLayout(
    product: ProductDimensions,
    shelf: ShelfSpecifications
  ): ProductLayout {

    // Calculate how many products fit per shelf
    const productsPerRow = Math.floor(shelf.width / product.width);
    const productsPerColumn = Math.floor(shelf.depth / product.depth);
    const productsPerShelf = productsPerRow * productsPerColumn;

    // Account for spacing between products (0.5cm minimum)
    const spacingAdjustedPerRow = Math.floor((shelf.width - 0.5) / (product.width + 0.5));
    const spacingAdjustedPerColumn = Math.floor((shelf.depth - 0.5) / (product.depth + 0.5));
    const realisticProductsPerShelf = spacingAdjustedPerRow * spacingAdjustedPerColumn;

    const totalCapacity = realisticProductsPerShelf * shelf.count;

    // Calculate spacing
    const remainingWidth = shelf.width - (spacingAdjustedPerRow * product.width);
    const remainingDepth = shelf.depth - (spacingAdjustedPerColumn * product.depth);
    const productSpacing = Math.min(remainingWidth / (spacingAdjustedPerRow + 1), remainingDepth / (spacingAdjustedPerColumn + 1));

    return {
      productsPerShelf: realisticProductsPerShelf,
      shelfRows: spacingAdjustedPerColumn,
      shelfColumns: spacingAdjustedPerRow,
      totalProductCapacity: totalCapacity,
      productSpacing: Math.round(productSpacing * 10) / 10,
      shelfSpacing: 2 // Standard shelf thickness
    };
  }

  /**
   * Analyze space utilization efficiency
   */
  private static analyzeSpaceUtilization(
    product: ProductDimensions,
    stand: StandDimensions,
    shelf: ShelfSpecifications,
    layout: ProductLayout
  ): SpaceUtilization {

    // Calculate shelf usage
    const productVolumePerShelf = layout.productsPerShelf * (product.width * product.depth * product.height);
    const shelfVolume = shelf.width * shelf.depth * (product.height + 2); // Account for clearance
    const shelfUsagePercent = Math.round((productVolumePerShelf / shelfVolume) * 100);

    // Calculate overall stand usage
    const totalProductVolume = productVolumePerShelf * shelf.count;
    const standVolume = stand.width * stand.depth * stand.height;
    const standUsagePercent = Math.round((totalProductVolume / standVolume) * 100);

    const wastedSpace = standVolume - totalProductVolume;

    let efficiency: SpaceUtilization['efficiency'];
    if (standUsagePercent >= 70) efficiency = 'EXCELLENT';
    else if (standUsagePercent >= 50) efficiency = 'GOOD';
    else if (standUsagePercent >= 30) efficiency = 'FAIR';
    else efficiency = 'POOR';

    return {
      shelfUsagePercent,
      standUsagePercent,
      wastedSpace: Math.round(wastedSpace),
      efficiency
    };
  }

  /**
   * Analyze manufacturing constraints
   */
  private static analyzeManufacturingConstraints(
    product: ProductDimensions,
    stand: StandDimensions,
    shelf: ShelfSpecifications
  ): ManufacturingConstraint[] {

    const constraints: ManufacturingConstraint[] = [];

    // Structural stability
    const aspectRatio = stand.height / Math.min(stand.width, stand.depth);
    if (aspectRatio > 2.5) {
      constraints.push({
        type: 'STRUCTURAL',
        description: 'Stand is too tall relative to base dimensions - stability risk',
        severity: 'HIGH',
        suggestion: 'Add wider base or reduce height for better stability'
      });
    }

    // Shelf spacing
    const availableHeight = stand.height - (shelf.count * 2); // Minus shelf thickness
    const spacePerLevel = availableHeight / shelf.count;
    if (spacePerLevel < product.height + 3) {
      constraints.push({
        type: 'PRACTICAL',
        description: 'Insufficient clearance between shelves for product access',
        severity: 'MEDIUM',
        suggestion: 'Increase clearance to at least 3cm above product height'
      });
    }

    // Manufacturing tolerances
    if (product.width === shelf.width) {
      constraints.push({
        type: 'PRACTICAL',
        description: 'No tolerance for product placement - too tight fit',
        severity: 'MEDIUM',
        suggestion: 'Add 2-3cm extra shelf width for easy product placement'
      });
    }

    // Weight distribution (estimate)
    if (shelf.count > 3 && shelf.depth < 20) {
      constraints.push({
        type: 'STRUCTURAL',
        description: 'Multiple shelves on narrow base may cause tipping',
        severity: 'HIGH',
        suggestion: 'Increase base depth or add anti-tip features'
      });
    }

    return constraints;
  }

  /**
   * Generate dimensional recommendations
   */
  private static generateRecommendations(
    product: ProductDimensions,
    stand: StandDimensions,
    shelf: ShelfSpecifications,
    layout: ProductLayout,
    utilization: SpaceUtilization
  ): string[] {

    const recommendations: string[] = [];

    // Space optimization
    if (utilization.efficiency === 'POOR') {
      recommendations.push('Consider reducing stand size or adding more shelves to improve space efficiency');
    }

    // Layout optimization
    if (layout.productsPerShelf < 3) {
      recommendations.push('Shelf size could be optimized to hold more products per level');
    }

    // Proportional improvements
    const heightToWidthRatio = stand.height / stand.width;
    if (heightToWidthRatio > 2) {
      recommendations.push('Consider a wider base for better visual proportion and stability');
    }

    // Product accessibility
    if (shelf.depth > 25) {
      recommendations.push('Deep shelves may make back products hard to reach - consider front-facing display');
    }

    return recommendations;
  }

  /**
   * Generate proportion guidance for AI
   */
  private static generateProportionGuidance(
    product: ProductDimensions,
    stand: StandDimensions,
    shelf: ShelfSpecifications,
    layout: ProductLayout
  ): string {

    return `PROPORTIONAL REQUIREMENTS:
- Stand aspect ratio: ${stand.width}:${stand.depth}:${stand.height} (W:D:H)
- Product arrangement: ${layout.shelfColumns} products across × ${layout.shelfRows} products deep per shelf
- Shelf spacing: ${Math.floor(stand.height / shelf.count)}cm between shelf levels
- Product spacing: ${layout.productSpacing}cm gaps between products for visibility
- Scale accuracy: Products must appear ${product.height}cm tall relative to ${stand.height}cm total height`;
  }

  /**
   * Generate realism constraints for AI
   */
  private static generateRealismConstraints(analysis: DimensionalAnalysis): string {

    const constraints = [
      'Products must physically fit on shelves without overlap',
      'Shelves must be structurally supported and level',
      'Proportions must be mathematically accurate to specified dimensions',
      `Space utilization: ${analysis.spaceUtilization.efficiency} efficiency (${analysis.spaceUtilization.standUsagePercent}%)`,
      'No floating or impossible structural elements'
    ];

    if (analysis.manufacturingConstraints.length > 0) {
      constraints.push('Must address structural stability requirements');
    }

    return constraints.join('\n- ');
  }

  /**
   * Generate manufacturing guidance
   */
  private static generateManufacturingGuidance(
    stand: StandDimensions,
    shelf: ShelfSpecifications
  ): string {

    const structural = [
      'Visible support structure appropriate for dimensions',
      'Shelf thickness: 2cm minimum for structural integrity',
      'Base stability features if height > 60cm',
      'Consistent material thickness throughout design'
    ];

    if (stand.height > 100) {
      structural.push('Anti-tip features for tall display safety');
    }

    return structural.join('\n- ');
  }

  /**
   * Get view-specific instructions
   */
  private static getViewSpecificInstructions(
    viewType: 'front' | 'store' | 'three-quarter',
    stand: StandDimensions,
    shelf: ShelfSpecifications
  ): string {

    switch (viewType) {
      case 'front':
        return `FRONT VIEW: Show ${stand.width}cm width × ${stand.height}cm height, emphasize product visibility and shelf structure`;

      case 'store':
        return `STORE VIEW: Wide angle showing full ${stand.width}×${stand.depth}cm footprint, context within retail environment`;

      case 'three-quarter':
        return `3/4 VIEW: Perspective showing ${stand.width}cm width, ${stand.depth}cm depth, and ${stand.height}cm height with dimensional accuracy`;

      default:
        return 'Standard proportional accuracy required';
    }
  }
}

export { DimensionIntelligenceService, type ProductDimensions, type StandDimensions, type ShelfSpecifications, type DimensionalAnalysis };
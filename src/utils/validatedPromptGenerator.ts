import { FormData } from '../types';
import DisplayValidator, { DisplayValidationInput } from './displayValidation';

export class ValidatedPromptGenerator {
  
  static generateConstrainedPrompts(formData: FormData): {
    frontView: string;
    storeView: string;
    threeQuarterView: string;
    validationInput: DisplayValidationInput;
  } {
    // Convert FormData to validation input
    const validationInput = DisplayValidator.convertFormDataToValidationInput(formData);
    
    // Generate the base constrained prompt
    const baseConstraints = DisplayValidator.generateConstrainedPrompt(validationInput);
    
    // Generate view-specific prompts with constraints
    const frontView = this.generateConstrainedFrontView(baseConstraints, validationInput);
    const storeView = this.generateConstrainedStoreView(baseConstraints, validationInput);
    const threeQuarterView = this.generateConstrainedThreeQuarterView(baseConstraints, validationInput);
    
    return {
      frontView,
      storeView,
      threeQuarterView,
      validationInput
    };
  }
  
  private static generateConstrainedFrontView(baseConstraints: string, input: DisplayValidationInput): string {
    return `${baseConstraints}

VIEW SPECIFICATION: Front orthographic elevation view, straight-on perspective, no angle

VISUAL REQUIREMENTS:
- Professional product photography studio lighting
- Clean white background or subtle gradient
- Square aspect ratio composition
- Photorealistic rendering quality

MANDATORY VALIDATION POINTS:
- Display type MUST be visible as ${input.display_type}
- All ${input.shelves.count} shelves MUST be clearly visible and properly spaced
- Overall silhouette MUST reflect ${input.dimensions_cm.width}×${input.dimensions_cm.depth}×${input.dimensions_cm.height}cm proportions
- Material appearance MUST match specified ${input.materials.allowed.join(' or ')} construction
- Brand color ${input.brand.primary_color} MUST be prominently featured

WHAT TO AVOID:
- No products on shelves (empty display)
- No branding text or logos (focus on structure)
- No decorative elements that compromise structural integrity
- No mixing of disallowed materials

Generate a ${input.display_type} display that would pass strict manufacturing and specification review.`;
  }
  
  private static generateConstrainedStoreView(baseConstraints: string, input: DisplayValidationInput): string {
    const environmentContext = {
      'tabletop': 'positioned on retail counter or checkout area',
      'fsu': 'standing prominently in store aisle or endcap',
      'wall_unit': 'mounted on retail wall between other fixtures'
    };
    
    return `${baseConstraints}

VIEW SPECIFICATION: Wide-angle retail environment shot showing display in natural commercial setting

ENVIRONMENT CONTEXT: ${environmentContext[input.display_type]} with appropriate surrounding retail elements

SPATIAL VALIDATION:
- Display footprint MUST appear as ${input.dimensions_cm.width}cm × ${input.dimensions_cm.depth}cm floor/counter space
- Height MUST appear proportional to ${input.dimensions_cm.height}cm in retail context
- Clearances MUST be appropriate for customer access and traffic flow

RETAIL INTEGRATION:
- Surrounding products and fixtures should complement but not overshadow the display
- Lighting should be realistic retail fluorescent/LED
- Floor materials and ceiling height appropriate for commercial space
- Customer sight lines to all ${input.shelves.count} shelf levels

MANDATORY VALIDATION POINTS:
- Display type MUST be clearly identifiable as ${input.display_type}
- Structural stability MUST be evident in the retail environment
- Material construction MUST be appropriate for commercial use

Generate a realistic retail environment where this validated ${input.display_type} display performs its intended function.`;
  }
  
  private static generateConstrainedThreeQuarterView(baseConstraints: string, input: DisplayValidationInput): string {
    return `${baseConstraints}

VIEW SPECIFICATION: Three-quarter angle perspective showcasing complete design and construction details

TECHNICAL DOCUMENTATION FOCUS:
- Hero shot angle that reveals both front face and side profile
- All structural connections and joinery methods clearly visible
- Material thickness and construction quality evident
- Professional architectural photography lighting

MANUFACTURABILITY VALIDATION DISPLAY:
- Show how ${input.materials.allowed[0]} construction achieves the required structural integrity
- Reveal support methods for all ${input.shelves.count} shelves
- Demonstrate stability through base design proportions
- Display appropriate material thickness for load bearing

DIMENSIONAL VERIFICATION:
- Overall proportions MUST clearly represent ${input.dimensions_cm.width}×${input.dimensions_cm.depth}×${input.dimensions_cm.height}cm
- Shelf spacing MUST be visually consistent with ${input.shelves.count} equal or purposeful intervals
- Base footprint MUST appear adequate for structural stability

DESIGN QUALITY STANDARDS:
- Avoid generic/template appearance while maintaining manufacturability
- Incorporate brand color ${input.brand.primary_color} as functional design element
- Show premium construction quality appropriate for retail environment

Generate a hero shot that would satisfy both design approval and engineering review for a production-ready ${input.display_type} display.`;
  }
  
  // Generate system prompt for AI models that includes validation requirements
  static generateSystemPrompt(): string {
    return `You are a retail display design specialist that must generate images strictly adhering to provided specifications.

MANDATORY REQUIREMENTS:
1. DISPLAY TYPE: Never change the requested display type (tabletop/floor-standing/wall-mounted)
2. DIMENSIONS: Stay within ±10% of specified measurements (Hard fail if >±15%)
3. SHELVES: Exact count and appropriate sizing as specified
4. MATERIALS: Use ONLY the specified materials, never introduce others
5. MANUFACTURABILITY: All designs must be structurally sound and producible

CRITICAL VALIDATION POINTS:
- If input says "tabletop", NEVER generate floor-standing or wall units
- If dimensions are 40×30×25cm, output must appear proportionally correct
- If 3 shelves specified, show exactly 3 shelves, properly spaced
- If "plastic only" specified, do NOT add metal, cardboard, or wood elements
- All structural elements must be supported (no floating shelves without brackets)

QUALITY STANDARDS:
- Professional product photography quality
- Clean, manufacturable design aesthetic
- Appropriate for commercial retail environment
- Brand integration without compromising structural integrity

Your outputs will be validated against these requirements. Any deviation from display type, dimensions beyond tolerance, wrong shelf count, or material violations will be flagged as failures.`;
  }
  
  // Test method to validate against common failure cases
  static validateAgainstTestCases(formData: FormData): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let isValid = true;
    
    // Test Case 1: Display type consistency
    if (!formData.standType) {
      warnings.push("No display type specified - may lead to inconsistent outputs");
      isValid = false;
    }
    
    // Test Case 2: Dimension reasonableness
    const { standHeight, standWidth } = formData;
    if (standHeight && standWidth) {
      const aspectRatio = standHeight / standWidth;
      if (aspectRatio > 10) {
        warnings.push(`Extreme height-to-width ratio (${aspectRatio.toFixed(1)}:1) may be unstable`);
        recommendations.push("Consider reducing height or increasing base width for stability");
      }
    }
    
    // Test Case 3: Shelf configuration
    if (formData.shelfCount && formData.standHeight) {
      const shelfSpacing = formData.standHeight / (formData.shelfCount + 1);
      if (shelfSpacing < 15) {
        warnings.push(`Shelf spacing too tight (${shelfSpacing.toFixed(1)}cm) - products may not fit`);
        recommendations.push("Increase display height or reduce shelf count");
      }
    }
    
    // Test Case 4: Material consistency
    if (formData.materials.length === 1 && formData.materials[0] === 'Plastik (Plastic)') {
      recommendations.push("Single plastic construction specified - ensure no cardboard elements are introduced");
    }
    
    // Test Case 5: Manufacturability basics
    if (formData.standDepth && formData.standHeight && formData.standDepth < formData.standHeight * 0.3) {
      warnings.push("Base depth may be insufficient for stability (recommended: depth ≥ 30% of height)");
      recommendations.push(`Consider increasing depth to at least ${Math.ceil(formData.standHeight * 0.3)}cm`);
    }
    
    return {
      isValid,
      warnings,
      recommendations
    };
  }
}

export default ValidatedPromptGenerator;
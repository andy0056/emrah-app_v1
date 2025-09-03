import { FormData } from '../types';

export class RefinedPromptGenerator {
  
  static generateFrontViewPrompt(formData: FormData): string {
    const promptVariables = this.buildPromptVariables(formData);
    const creativeApproach = this.selectCreativeApproach('front');
    
    // Google's recommended narrative approach - describe the scene, don't list keywords
    return `A high-resolution, studio-lit product photograph of a ${creativeApproach.theme.toLowerCase()} ${this.getStandType(formData.standType)} retail display measuring ${promptVariables.dimensions}. The innovative structure features ${creativeApproach.structure}, with ${promptVariables.displayLevels} elegantly integrated into ${creativeApproach.shelving}. The display is crafted from ${promptVariables.materialDescription} with ${creativeApproach.materials}, while ${promptVariables.colorScheme} flows as the dominant structural accent throughout the entire design. ${creativeApproach.brandIntegration}. The scene is illuminated by ${creativeApproach.lighting}, creating a dramatic atmosphere that emphasizes bold visual impact and retail differentiation. The photograph is captured from a front elevation perspective using professional commercial photography techniques, with ultra-realistic detail and sharp focus on the craftsmanship and material textures. ${creativeApproach.atmosphere}. Square format.`;
  }

  static generateStoreViewPrompt(formData: FormData): string {
    const promptVariables = this.buildPromptVariables(formData);
    const creativeApproach = this.selectCreativeApproach('store');
    
    // Google's narrative approach for photorealistic retail environments
    return `A photorealistic wide-angle shot of a ${creativeApproach.theme.toLowerCase()} ${this.getStandType(formData.standType)} display positioned as the centerpiece within a contemporary retail store environment. The innovative installation, measuring ${formData.standWidth}cm wide by ${formData.standHeight}cm tall, commands attention within the premium commercial space through its architectural presence. The display features ${promptVariables.displayLevels} that create ${creativeApproach.visualFlow}, constructed from ${promptVariables.materialDescription} enhanced with ${creativeApproach.textures}. ${creativeApproach.contextualElements} surround the display, creating a sophisticated retail atmosphere with carefully curated product adjacencies. The scene is illuminated by ${creativeApproach.ambientLighting}, creating an elevated design sensibility that emphasizes experiential retail design and customer engagement. The photograph showcases the environmental integration from a wide-angle perspective, with sharp focus on the display while maintaining context of the surrounding retail space. The overall mood is sophisticated and inviting, designed to create customer magnetism. Square format.`;
  }

  static generateThreeQuarterViewPrompt(formData: FormData): string {
    const promptVariables = this.buildPromptVariables(formData);
    const creativeApproach = this.selectCreativeApproach('hero');
    
    // Google's narrative approach for hero photography
    return `A breathtaking three-quarter perspective photograph of a ${creativeApproach.theme.toLowerCase()} ${this.getStandType(formData.standType)} display that merges retail functionality with artistic expression. This flagship installation, precisely proportioned at ${promptVariables.dimensions}, commands monumental design impact through its innovative architecture. The sculptural form is crafted from ${promptVariables.materialDescription} featuring ${creativeApproach.materialInnovation}, while ${promptVariables.colorScheme} ${creativeApproach.colorTreatment} throughout the structure. The ${promptVariables.displayLevels} create ${creativeApproach.structuralNarrative}, revealing the full design narrative from this dynamic angle. ${creativeApproach.dramaticLighting} illuminates every detail, emphasizing ${creativeApproach.designDetails} and the superior craftsmanship. ${creativeApproach.brandStory}, positioning the display as a testament to design innovation and competitive differentiation. The photograph captures award-worthy retail fixture documentation quality, with ultra-sharp focus on material textures, connection details, and the interplay of light and shadow across the sculptural surfaces. This is museum-quality commercial photography that celebrates both form and function. Square format.`;
  }

  static buildPromptVariables(formData: FormData) {
    return {
      // Physical specifications with precision
      dimensions: `${formData.standWidth}×${formData.standDepth}×${formData.standHeight}cm`,
      
      // Enhanced material descriptions
      materialDescription: this.getMaterialDescription(formData.materials),
      
      // Sophisticated color integration
      colorScheme: formData.standBaseColor 
        ? `${formData.standBaseColor.toLowerCase()} finish with complementary accents` 
        : 'sophisticated neutral palette with subtle tonal variations',
      
      // Detailed shelf configuration
      displayLevels: this.getDisplayLevelDescription(formData.shelfCount),
    };
  }

  private static getMaterialDescription(materials: string[]): string {
    const materialMap: Record<string, string> = {
      'Metal': 'brushed metal framework',
      'Ahşap': 'premium hardwood elements',
      'Cam': 'tempered glass surfaces',
      'Alüminyum': 'anodized aluminum structure',
      'Plastik': 'high-grade polymer components'
    };
    
    const descriptions = materials.map(material => 
      materialMap[material] || material.toLowerCase()
    );
    
    if (descriptions.length > 1) {
      return `hybrid ${descriptions.join(' and ')} construction`;
    }
    return descriptions[0] || 'premium composite material';
  }

  private static getDisplayLevelDescription(shelfCount: number): string {
    if (shelfCount === 1) return 'single display platform with generous product space';
    if (shelfCount === 2) return 'dual-tier merchandising system with strategic spacing';
    if (shelfCount === 3) return 'three-level display architecture with optimal sight lines';
    if (shelfCount > 3) return `multi-tier ${shelfCount}-level merchandising tower with cascading product visibility`;
    return 'flexible display configuration';
  }

  // Creative approach selector for innovative display concepts
  private static selectCreativeApproach(viewType: 'front' | 'store' | 'hero') {
    const approaches = {
      front: [
        {
          theme: 'Dynamic Ribbon Flow',
          structure: 'flowing curved elements integrated as structural supports',
          shelving: 'suspended glass platforms following organic curves',
          materials: 'brushed aluminum ribbons, tempered glass, LED strip integration',
          lighting: 'embedded LED strips creating flowing light patterns',
          brandIntegration: 'brand colors flowing as continuous ribbon through entire structure',
          atmosphere: 'futuristic retail sculpture with kinetic visual energy'
        },
        {
          theme: 'Geometric Crystalline',
          structure: 'angular faceted geometry with prismatic forms',
          shelving: 'diamond-cut acrylic platforms with internal illumination',
          materials: 'polished chrome framework, crystal-clear acrylic, holographic accents',
          lighting: 'multi-directional spotlights creating prismatic reflections',
          brandIntegration: 'brand colors refracted through crystal elements',
          atmosphere: 'luxury jewelry display aesthetic meets high-tech presentation'
        },
        {
          theme: 'Industrial Kinetic',
          structure: 'exposed mechanical elements with rotating components',
          shelving: 'conveyor-inspired moving display platforms',
          materials: 'raw steel, brass gears, leather details, Edison bulb lighting',
          lighting: 'industrial pendant lights with exposed filaments',
          brandIntegration: 'brand elements integrated into mechanical movement system',
          atmosphere: 'steampunk-inspired retail machine with working components'
        }
      ],
      store: [
        {
          theme: 'Architectural Monument',
          visualFlow: 'dramatic vertical emphasis drawing customers upward',
          textures: 'mixed concrete, brushed steel, warm wood accents',
          ambientLighting: 'architectural lighting creating dramatic shadows and highlights',
          contextualElements: 'integrated digital screens showing brand storytelling content',
        },
        {
          theme: 'Organic Oasis',
          visualFlow: 'natural flowing forms creating calm discovery zones',
          textures: 'living moss walls, sustainable bamboo, bio-luminescent elements',
          ambientLighting: 'soft biophilic lighting mimicking natural daylight cycles',
          contextualElements: 'surrounding plants and natural materials creating brand ecosystem',
        },
        {
          theme: 'Digital Interactive Hub',
          visualFlow: 'technology-enhanced customer engagement zones',
          textures: 'smart glass surfaces, haptic feedback materials, projection mapping',
          ambientLighting: 'responsive LED systems reacting to customer proximity',
          contextualElements: 'augmented reality brand experiences and interactive product exploration',
        }
      ],
      hero: [
        {
          theme: 'Sculptural Masterpiece',
          materialInnovation: 'gradient metallic finishes transitioning through brand color spectrum',
          colorTreatment: 'flowing as liquid metal effect across curved surfaces',
          structuralNarrative: 'ascending spiral composition suggesting brand elevation and aspiration',
          dramaticLighting: 'museum-quality lighting with dramatic chiaroscuro effects',
          designDetails: 'hand-crafted connection details and signature material textures',
          brandStory: 'display tells complete brand heritage story through design language'
        },
        {
          theme: 'Technological Innovation',
          materialInnovation: 'smart materials with color-changing properties and embedded sensors',
          colorTreatment: 'dynamically shifting through brand palette based on ambient conditions',
          structuralNarrative: 'modular components demonstrating brand adaptability and innovation',
          dramaticLighting: 'programmable LED matrix creating immersive brand experiences',
          designDetails: 'precision-engineered joints with aerospace-grade finishing',
          brandStory: 'represents brand innovation and forward-thinking through cutting-edge design'
        },
        {
          theme: 'Cultural Storytelling',
          materialInnovation: 'locally-sourced materials with cultural significance and brand connection',
          colorTreatment: 'hand-applied in artisanal techniques reflecting brand craftsmanship values',
          structuralNarrative: 'architectural elements referencing brand origins and cultural heritage',
          dramaticLighting: 'warm, inviting illumination creating emotional brand connection',
          designDetails: 'artisanal craftsmanship details celebrating human creativity',
          brandStory: 'connects brand authenticity with cultural values and human stories'
        }
      ]
    };

    // Select random approach for variety
    const options = approaches[viewType];
    return options[Math.floor(Math.random() * options.length)];
  }

  static getStandType(standType: string): string {
    const types: Record<string, string> = {
      'Ayaklı Stant (Floor Stand)': 'floor-standing',
      'Masa Üstü Stant (Tabletop Stand)': 'countertop',
      'Duvar Stantı (Wall Mount Stand)': 'wall-mounted',
      'Köşe Stantı (Corner Stand)': 'corner',
      'Dönen Stant (Rotating Stand)': 'rotating',
      'Çok Katlı Stant (Multi-tier Stand)': 'multi-tier'
    };
    return types[standType] || standType;
  }

  static generateAllPrompts(formData: FormData) {
    return {
      frontView: this.generateFrontViewPrompt(formData),
      storeView: this.generateStoreViewPrompt(formData),
      threeQuarterView: this.generateThreeQuarterViewPrompt(formData)
    };
  }

  // Enhanced brand integration using Google's narrative approach
  static getBrandIntegrationFramework(): string {
    return `The brand integration seamlessly transforms traditional logo placement into architectural elements where the brand identity becomes the structural DNA of the display itself. Product silhouettes flow naturally as functional design features, with shelving contours and support structures echoing the brand's iconic shapes. The brand's signature colors don't merely decorate surfaces but emerge as intrinsic material characteristics - appearing as if the materials themselves were born in these hues. This creates an immersive brand storytelling experience where every angle reveals new layers of the brand narrative. The display incorporates signature design elements that immediately communicate brand innovation, featuring interactive or kinetic components that engage customers through multi-sensory experiences. Smart technology integration enhances the brand message without overwhelming it, creating discovery zones where customers naturally uncover brand stories through exploration. The design language positions the brand as a category leader and trendsetter, with sustainable material choices and modular construction methods that showcase forward-thinking brand values. Every detail is crafted to create Instagram-worthy moments that encourage social sharing and brand amplification, ensuring the display becomes a destination that creates emotional connections far beyond functional product presentation.`;
  }
}
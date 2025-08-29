export class MetaphorLibrary {
  private metaphors: Map<string, Map<string, string[]>>;

  constructor() {
    this.metaphors = new Map();
    this.initializeMetaphors();
  }

  private initializeMetaphors() {
    // Coca-Cola metaphors
    const cocaColaMetaphors = new Map<string, string[]>();
    cocaColaMetaphors.set('architecture', [
      'crystalline ice formation catching light',
      'vintage soda fountain reimagined',
      'refreshment waterfall frozen in time',
      'polar ice cave with warm red glow',
      'celebration amphitheater for bottles'
    ]);
    cocaColaMetaphors.set('sculpture', [
      'effervescent bubble sculpture',
      'ribbon of happiness spiraling upward',
      'polar ice cave entrance',
      'frozen wave of refreshment',
      'carbonation bubbles rising in formation'
    ]);
    this.metaphors.set('Coca-Cola', cocaColaMetaphors);

    // Monster Energy metaphors
    const monsterMetaphors = new Map<string, string[]>();
    monsterMetaphors.set('architecture', [
      'industrial power station',
      'street art gallery frame',
      'extreme sports launch ramp',
      'urban jungle gym',
      'energy reactor containment'
    ]);
    monsterMetaphors.set('sculpture', [
      'coiled spring ready to explode',
      'lightning captured in black steel',
      'beast cage with glowing core',
      'energy bolt frozen mid-strike',
      'industrial cathedral of power'
    ]);
    this.metaphors.set('Monster Energy', monsterMetaphors);

    // NIVEA metaphors
    const niveaMetaphors = new Map<string, string[]>();
    niveaMetaphors.set('architecture', [
      'spa sanctuary with flowing water',
      'wellness temple of pure white',
      'protective embrace structure',
      'morning dew pavilion',
      'cloud formation made tangible'
    ]);
    niveaMetaphors.set('sculpture', [
      'protective mother\'s arms cradling products',
      'morning dew crystallized in white',
      'gentle wave of caring comfort',
      'cloud sculpture with silver lining',
      'wellness fountain of youth'
    ]);
    this.metaphors.set('NIVEA', niveaMetaphors);

    // PANTENE metaphors
    const panteneMetaphors = new Map<string, string[]>();
    panteneMetaphors.set('architecture', [
      'golden salon waterfall',
      'luxury hair transformation center',
      'beauty temple with golden columns',
      'cascading hair-inspired architecture',
      'professional stylist\'s dream station'
    ]);
    panteneMetaphors.set('sculpture', [
      'golden waterfall frozen in time',
      'flowing hair made architectural',
      'liquid gold cascade sculpture',
      'hair strand spiraling skyward',
      'transformation chrysalis in gold'
    ]);
    this.metaphors.set('PANTENE', panteneMetaphors);

    // Flormar metaphors
    const flormarMetaphors = new Map<string, string[]>();
    flormarMetaphors.set('architecture', [
      'blooming flower garden pavilion',
      'artist\'s color palette structure',
      'jewelry box opened to reveal treasures',
      'rainbow prism architectural form',
      'feminine curves meeting function'
    ]);
    flormarMetaphors.set('sculpture', [
      'rose petals arranged in perfect formation',
      'paintbrush strokes frozen in 3D',
      'jewelry scattered on velvet',
      'feminine grace captured in curves',
      'color spectrum blooming into form'
    ]);
    this.metaphors.set('Flormar', flormarMetaphors);

    // Avon metaphors
    const avonMetaphors = new Map<string, string[]>();
    avonMetaphors.set('architecture', [
      'elegant vanity table expanded',
      'sophisticated beauty boutique',
      'refined jewelry display case',
      'timeless elegance in architectural form',
      'lady\'s dressing room made public'
    ]);
    avonMetaphors.set('sculpture', [
      'elegant swan neck curve',
      'vintage mirror with modern twist',
      'sophisticated jewelry arrangement',
      'timeless beauty captured in form',
      'refined elegance made tangible'
    ]);
    this.metaphors.set('Avon', avonMetaphors);

    // Whiskey metaphors
    const whiskeyMetaphors = new Map<string, string[]>();
    whiskeyMetaphors.set('architecture', [
      'gentleman\'s library with secret bar',
      'master distiller\'s cabinet',
      'aged oak barrel reimagined',
      'prohibition-era speakeasy entrance',
      'Highland castle tower miniature'
    ]);
    whiskeyMetaphors.set('sculpture', [
      'aged oak staves forming cathedral',
      'amber liquid suspended in time',
      'copper still distillation tower',
      'leather-bound books made tangible',
      'masculine sophistication carved in wood'
    ]);
    this.metaphors.set('Whiskey', whiskeyMetaphors);

    // Paradontax metaphors
    const paradontaxMetaphors = new Map<string, string[]>();
    paradontaxMetaphors.set('architecture', [
      'dental clinic cabinet modernized',
      'health sanctuary with clean lines',
      'professional care station',
      'medical precision in retail form',
      'hygienic temple of oral health'
    ]);
    paradontaxMetaphors.set('sculpture', [
      'tooth enamel crystalline structure',
      'clean geometric health symbol',
      'medical precision made beautiful',
      'trust and care carved in white',
      'clinical perfection softened'
    ]);
    this.metaphors.set('paradontax', paradontaxMetaphors);
  }

  public getMetaphor(brand: string, type: string): string {
    // Normalize brand name
    const normalizedBrand = brand.trim();
    
    // Direct match
    let brandMetaphors = this.metaphors.get(normalizedBrand);
    
    // If no direct match, try partial matching
    if (!brandMetaphors) {
      const brandLower = normalizedBrand.toLowerCase();
      for (const [key, metaphors] of this.metaphors.entries()) {
        if (key.toLowerCase().includes(brandLower) || brandLower.includes(key.toLowerCase())) {
          brandMetaphors = metaphors;
          break;
        }
      }
    }
    
    if (!brandMetaphors) return 'distinctive architectural presence';
    
    const typeMetaphors = brandMetaphors.get(type);
    if (!typeMetaphors || typeMetaphors.length === 0) return 'unique structural form';
    
    return typeMetaphors[Math.floor(Math.random() * typeMetaphors.length)];
  }

  public getAllMetaphors(brand: string): Map<string, string[]> {
    const normalizedBrand = brand.trim();
    const brandMetaphors = this.metaphors.get(normalizedBrand);
    
    if (brandMetaphors) {
      return brandMetaphors;
    }
    
    // Return empty map if brand not found
    return new Map<string, string[]>();
  }
}
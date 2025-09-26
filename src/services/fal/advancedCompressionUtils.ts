/**
 * Advanced Prompt Compression Utils
 * Intelligent compression that preserves meaning while removing filler
 */

export interface CompressionConfig {
  maxLength: number;
  protectedContent: string[];
  compressionLevel: 'conservative' | 'moderate' | 'aggressive';
  preserveCreativeContext: boolean;
  maintainFormPriority: boolean;
}

export interface CompressionResult {
  compressedPrompt: string;
  originalLength: number;
  compressedLength: number;
  compressionRatio: number;
  protectedContentPreserved: boolean;
  sectionsRemoved: string[];
  sectionsAbbreviated: string[];
}

/**
 * Advanced prompt compression with intelligent content preservation
 */
export function advancedCompressPrompt(
  prompt: string,
  config: CompressionConfig
): CompressionResult {
  const originalLength = prompt.length;

  if (originalLength <= config.maxLength) {
    return {
      compressedPrompt: prompt,
      originalLength,
      compressedLength: originalLength,
      compressionRatio: 1.0,
      protectedContentPreserved: true,
      sectionsRemoved: [],
      sectionsAbbreviated: []
    };
  }

  console.log(`🧠 Advanced compression: ${originalLength} → ${config.maxLength} chars (${config.compressionLevel} mode)`);

  // Step 1: Intelligent text compression - remove filler words
  const textCompressed = compressTextContent(prompt, config.compressionLevel);

  if (textCompressed.length <= config.maxLength) {
    return {
      compressedPrompt: textCompressed,
      originalLength,
      compressedLength: textCompressed.length,
      compressionRatio: textCompressed.length / originalLength,
      protectedContentPreserved: validateProtectedContent(textCompressed, config.protectedContent),
      sectionsRemoved: [],
      sectionsAbbreviated: ['text-compression-applied']
    };
  }

  // Step 2: Section-based compression with advanced prioritization
  return performSectionCompression(textCompressed, config, originalLength);
}

/**
 * Intelligent text compression - removes filler while preserving meaning
 */
function compressTextContent(text: string, level: 'conservative' | 'moderate' | 'aggressive'): string {
  let compressed = text;

  // Conservative compression - minimal changes
  if (level === 'conservative' || level === 'moderate' || level === 'aggressive') {
    // Remove redundant spacing
    compressed = compressed.replace(/\s+/g, ' ').trim();

    // Remove redundant line breaks (but keep paragraph structure)
    compressed = compressed.replace(/\n\s*\n\s*\n+/g, '\n\n');
  }

  // Moderate compression - some word reduction
  if (level === 'moderate' || level === 'aggressive') {
    // Compress common phrases while preserving meaning
    const compressionMap = {
      'must be prominently displayed': 'must display prominently',
      'should be clearly visible': 'must be visible',
      'needs to be positioned': 'position',
      'it is important that': '',
      'please ensure that': 'ensure',
      'make sure to': 'ensure',
      'in order to': 'to',
      'for the purpose of': 'for',
      'with the goal of': 'to',
      'take into consideration': 'consider',
      'as a result of': 'due to',
      'in the event that': 'if',
      'at this point in time': 'now',
      'due to the fact that': 'because',
      'in spite of the fact that': 'although'
    };

    for (const [long, short] of Object.entries(compressionMap)) {
      compressed = compressed.replace(new RegExp(long, 'gi'), short);
    }
  }

  // Aggressive compression - more word reduction
  if (level === 'aggressive') {
    // Remove less essential descriptive words (but preserve critical specs)
    const aggressiveReductions = {
      'very important': 'critical',
      'extremely important': 'critical',
      'highly recommended': 'required',
      'strongly suggested': 'required',
      'should definitely': 'must',
      'ought to be': 'must be',
      'is required to be': 'must be',
      'professional quality': 'quality',
      'commercial grade': 'commercial',
      'industry standard': 'standard',
      'state of the art': 'advanced',
      'cutting edge': 'advanced'
    };

    for (const [verbose, concise] of Object.entries(aggressiveReductions)) {
      compressed = compressed.replace(new RegExp(verbose, 'gi'), concise);
    }

    // Remove filler adjectives (but preserve brand and numerical descriptors)
    compressed = compressed.replace(/\b(quite|rather|fairly|somewhat|pretty|really|very|extremely|incredibly|absolutely|completely|totally|entirely)\s+(?!EXACTLY|exactly|\d)/gi, '');
  }

  return compressed.trim();
}

/**
 * Advanced section-based compression with intelligent prioritization
 */
function performSectionCompression(
  prompt: string,
  config: CompressionConfig,
  originalLength: number
): CompressionResult {
  const sections = prompt.split('\n\n');
  const sectionsRemoved: string[] = [];
  const sectionsAbbreviated: string[] = [];

  // Separate protected sections from regular sections
  const protectedSections: string[] = [];
  const regularSections: string[] = [];

  for (const section of sections) {
    let isProtected = false;
    for (const protectedPhrase of config.protectedContent) {
      if (section.includes(protectedPhrase)) {
        protectedSections.push(section);
        isProtected = true;
        break;
      }
    }
    if (!isProtected) {
      regularSections.push(section);
    }
  }

  // Start with base prompt (first section)
  let compressed = sections[0] || '';

  // Add all protected sections (cannot be compressed)
  for (const protectedSection of protectedSections) {
    compressed += '\n\n' + protectedSection;
  }

  // Advanced prioritization of regular sections
  const prioritizedSections = prioritizeSections(regularSections.slice(1), config);

  // Add regular sections with intelligent compression
  for (const sectionData of prioritizedSections) {
    const availableSpace = config.maxLength - compressed.length - 2; // -2 for \n\n

    if (availableSpace <= 0) break;

    if (sectionData.section.length <= availableSpace) {
      // Section fits as-is
      compressed += '\n\n' + sectionData.section;
    } else if (availableSpace > 50) {
      // Try intelligent abbreviation
      const abbreviated = intelligentAbbreviation(sectionData.section, availableSpace);
      if (abbreviated.length > 0) {
        compressed += '\n\n' + abbreviated;
        sectionsAbbreviated.push(`${sectionData.type} (${sectionData.section.length} → ${abbreviated.length} chars)`);
      } else {
        sectionsRemoved.push(sectionData.type);
      }
    } else {
      sectionsRemoved.push(sectionData.type);
    }
  }

  return {
    compressedPrompt: compressed.trim(),
    originalLength,
    compressedLength: compressed.length,
    compressionRatio: compressed.length / originalLength,
    protectedContentPreserved: validateProtectedContent(compressed, config.protectedContent),
    sectionsRemoved,
    sectionsAbbreviated
  };
}

/**
 * Advanced section prioritization with form-priority awareness
 */
function prioritizeSections(sections: string[], config: CompressionConfig): Array<{section: string, type: string, priority: number}> {
  return sections.map(section => {
    let priority = 0;
    let type = 'generic';

    // Form-priority content gets highest priority
    if (config.maintainFormPriority) {
      if (section.includes('EXACTLY') || section.includes('CRITICAL NUMERICAL')) {
        priority += 100;
        type = 'form-critical';
      }
      if (section.includes('FORM-PRIORITY') || section.includes('NON-NEGOTIABLE')) {
        priority += 95;
        type = 'form-priority';
      }
    }

    // Brand content - very high priority
    if (section.includes('BRAND:') || section.includes('BRAND INTEGRATION')) {
      priority += 90;
      type = 'brand';
    }

    // Product specifications - high priority
    if (section.includes('PRODUCT') && (section.includes('ARRANGEMENT') || section.includes('FOCUS'))) {
      priority += 85;
      type = 'product-spec';
    }

    // 3D Visual content - high priority for visual accuracy
    if (section.includes('VISUAL SCALE') || section.includes('3D') || section.includes('REFERENCE')) {
      priority += 80;
      type = '3d-visual';
    }

    // Physical constraints - important for accuracy
    if (section.includes('DIMENSIONS') || section.includes('PHYSICAL')) {
      priority += 75;
      type = 'physical';
    }

    // Manufacturing and structural - important for feasibility
    if (section.includes('MANUFACTURING') || section.includes('STRUCTURAL')) {
      priority += 70;
      type = 'manufacturing';
    }

    // Creative context - important if preserve flag is set
    if (config.preserveCreativeContext) {
      if (section.includes('CREATIVE') || section.includes('STYLE') || section.includes('AESTHETIC')) {
        priority += 65;
        type = 'creative';
      }
    }

    // Material specifications
    if (section.includes('MATERIAL')) {
      priority += 60;
      type = 'material';
    }

    // General instructions - lower priority
    if (section.includes('INSTRUCTION') || section.includes('GENERATION')) {
      priority += 30;
      type = 'instruction';
    }

    return { section, type, priority };
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Intelligent abbreviation that preserves key information
 */
function intelligentAbbreviation(section: string, maxLength: number): string {
  if (section.length <= maxLength) return section;

  const lines = section.split('\n');
  let abbreviated = '';

  // Always keep the first line (usually the header/title)
  if (lines[0]) {
    abbreviated = lines[0];
  }

  // Add subsequent lines while there's space
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const testLength = abbreviated.length + line.length + 1; // +1 for \n

    if (testLength <= maxLength) {
      abbreviated += '\n' + line;
    } else if (maxLength - abbreviated.length > 20) {
      // Try to fit a compressed version of this line
      const compressedLine = compressTextContent(line, 'aggressive');
      if (abbreviated.length + compressedLine.length + 1 <= maxLength) {
        abbreviated += '\n' + compressedLine;
      }
      break;
    } else {
      break;
    }
  }

  return abbreviated;
}

/**
 * Validate that protected content is preserved
 */
function validateProtectedContent(compressed: string, protectedContent: string[]): boolean {
  for (const phrase of protectedContent) {
    if (!compressed.includes(phrase)) {
      return false;
    }
  }
  return true;
}
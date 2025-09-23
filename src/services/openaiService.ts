import { apiProxy } from './apiProxy';
import { SecureService } from '../security/secureService';
import { SmartPromptGenerator, type FormDataWithDimensions } from '../utils/smartPromptGenerator';

// SECURITY: Enhanced with comprehensive LLM security protections
// - Prompt injection prevention
// - PII detection and sanitization
// - Authentication and rate limiting
// - Real-time security monitoring

export interface PromptEnhancementRequest {
  basePrompt: string;
  brandContext: string;
  productContext: string;
  targetView: 'front' | 'store' | 'three-quarter';
  innovationHint: string;
  clientId?: string; // For security tracking
  dimensionalData?: FormDataWithDimensions; // For dimensional intelligence
  enableDimensionalIntelligence?: boolean;
}

export class OpenAIService {
  static async enhancePrompt(request: PromptEnhancementRequest): Promise<string> {
    const clientId = request.clientId || 'anonymous';

    // Check if dimensional intelligence is enabled and data is available
    if (request.enableDimensionalIntelligence && request.dimensionalData) {
      console.log('🧮 Using dimensional intelligence for OpenAI prompt enhancement');

      try {
        // Generate intelligent prompts using dimensional analysis
        const intelligentPrompts = SmartPromptGenerator.generateIntelligentPrompts(request.dimensionalData);

        // Select the appropriate view-specific prompt
        const dimensionalPrompt = request.targetView === 'front'
          ? intelligentPrompts.frontView
          : request.targetView === 'store'
          ? intelligentPrompts.storeView
          : intelligentPrompts.threeQuarterView;

        // Add brand context and innovation to the dimensional prompt
        const enhancedPrompt = `${dimensionalPrompt}

BRAND ENHANCEMENT:
- Brand: ${request.brandContext}
- Product: ${request.productContext}
- Innovation: ${request.innovationHint}

DIMENSIONAL INSIGHTS:
- Space efficiency: ${intelligentPrompts.analysis.spaceUtilization.efficiency} (${intelligentPrompts.analysis.spaceUtilization.standUsagePercent}%)
- Product capacity: ${intelligentPrompts.analysis.calculatedLayout.totalProductCapacity} products
- Layout: ${intelligentPrompts.analysis.calculatedLayout.shelfColumns}×${intelligentPrompts.analysis.calculatedLayout.shelfRows} grid
${intelligentPrompts.analysis.issues.length > 0 ? `- Issues addressed: ${intelligentPrompts.analysis.issues.slice(0, 2).join(', ')}` : ''}`;

        console.log('🎯 Enhanced dimensional prompt generated:', {
          targetView: request.targetView,
          spaceEfficiency: intelligentPrompts.analysis.spaceUtilization.efficiency,
          productCapacity: intelligentPrompts.analysis.calculatedLayout.totalProductCapacity,
          promptLength: enhancedPrompt.length
        });

        return enhancedPrompt;
      } catch (error) {
        console.warn('⚠️ Dimensional intelligence failed, falling back to standard enhancement:', error);
        // Fall through to standard enhancement
      }
    }

    // Use secure service layer for comprehensive protection
    const secureResponse = await SecureService.processSecureRequest(
      `${request.basePrompt} | Context: ${request.brandContext} | Product: ${request.productContext} | Innovation: ${request.innovationHint}`,
      {
        endpoint: '/api/openai/enhance',
        clientId,
        requireAuth: false, // Set to true if authentication is required
        enablePIIDetection: true,
        enablePromptValidation: true,
        enableOutputSanitization: true,
        enableMonitoring: true
      },
      async (sanitizedInput) => {
        // Extract components from sanitized input
        const [basePrompt, brandContext, productContext, innovationHint] = sanitizedInput.split(' | ').map(part =>
          part.includes(':') ? part.split(':')[1].trim() : part.trim()
        );

        const systemPrompt = `You are a Master Prompt Engineer specializing in AI image generation for retail POP displays. Your goal is to create CONCISE, SPECIFICATION-FOCUSED prompts that produce accurate, buildable display stands.

CRITICAL RULES:
1. Keep prompts under 60 words maximum
2. Lead with EXACT specifications (dimensions, materials, colors)
3. Ensure shelves are clearly described and functional
4. Reference uploaded images when available
5. Use simple, direct language - NO flowery descriptions

PROMPT STRUCTURE:
[Stand Type] [Brand] display stand, [View].
SPECS: [Exact dimensions/colors/materials]
SHELVES: [Count] shelves, [Product arrangement]
STYLE: [Brief style note]

INNOVATION: Add ONE unique feature that's buildable and brand-appropriate.`;

        const userPrompt = `Optimize this prompt for AI image generation. Make it CONCISE (under 60 words) and SPECIFICATION-FOCUSED.

**BASE PROMPT:** ${basePrompt}
**BRAND CONTEXT:** ${brandContext}
**PRODUCT CONTEXT:** ${productContext}
**INNOVATION HINT:** ${innovationHint}

**REQUIREMENTS:**
1. Keep under 60 words total
2. Start with exact stand type and brand
3. Include specific shelf details (count, product arrangement)
4. Add ONE innovative feature
5. End with view and style note

OUTPUT FORMAT:
[Stand Type] [Brand] display, [view]. [Materials/colors]. [Shelf count] shelves with [product arrangement]. [One innovation]. [Style/lighting].

Be CONCISE and CLEAR - AI models work better with simple, direct instructions!`;

        // Use secure API proxy instead of direct OpenAI client
        const response = await apiProxy.callOpenAI({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 150,
          temperature: 0.6
        });

        if (response.error) {
          throw new Error(response.error);
        }

        return response.data.choices?.[0]?.message?.content || basePrompt;
      }
    );

    // Handle security response
    if (!secureResponse.success) {
      console.error('🚨 OpenAI enhancement blocked by security:', secureResponse.errors);
      return request.basePrompt; // Fallback to original
    }

    // Log security events if any
    if (secureResponse.securityEvents.length > 0) {
      console.warn('⚠️ Security events during OpenAI enhancement:', secureResponse.securityEvents);
    }

    return secureResponse.data || request.basePrompt;
  }

  static async enhanceMultiplePrompts(requests: PromptEnhancementRequest[]): Promise<string[]> {
    try {
      const promises = requests.map(request => this.enhancePrompt(request));
      return await Promise.all(promises);
    } catch (error) {
      console.error('Error enhancing multiple prompts:', error);
      return requests.map(req => req.basePrompt);
    }
  }
}
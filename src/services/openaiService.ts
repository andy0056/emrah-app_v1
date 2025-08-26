import OpenAI from 'openai';

// Configure OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, this should be done server-side
});

export interface PromptEnhancementRequest {
  basePrompt: string;
  brandContext: string;
  productContext: string;
  targetView: 'front' | 'store' | 'three-quarter';
  innovationHint: string;
}

export class OpenAIService {
  static async enhancePrompt(request: PromptEnhancementRequest): Promise<string> {
    try {
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

**BASE PROMPT:** ${request.basePrompt}
**BRAND CONTEXT:** ${request.brandContext}
**PRODUCT CONTEXT:** ${request.productContext}
**INNOVATION HINT:** ${request.innovationHint}

**REQUIREMENTS:**
1. Keep under 60 words total
2. Start with exact stand type and brand  
3. Include specific shelf details (count, product arrangement)
4. Add ONE innovative feature
5. End with view and style note

OUTPUT FORMAT:
[Stand Type] [Brand] display, [view]. [Materials/colors]. [Shelf count] shelves with [product arrangement]. [One innovation]. [Style/lighting].

Be CONCISE and CLEAR - AI models work better with simple, direct instructions!`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 150,
        temperature: 0.6 // Reduced for more focused, consistent output
      });

      return completion.choices[0]?.message?.content || request.basePrompt;
    } catch (error) {
      console.error('Error enhancing prompt with OpenAI:', error);
      // Fallback to base prompt if enhancement fails
      return request.basePrompt;
    }
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
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
      const systemPrompt = `You are an expert in POP (Point of Purchase) display design and photorealistic product visualization. Your task is to enhance prompts for AI image generation to create professional, manufacturable, and visually compelling retail display stands.

Key Enhancement Guidelines:
1. Maintain all technical specifications exactly as provided (dimensions, materials, capacity)
2. Add sophisticated lighting and camera terminology for photorealism
3. Emphasize practical manufacturability and physics constraints
4. Include ONE innovative but feasible design element aligned with the brand
5. Use professional photography and 3D rendering terminology
6. Ensure brand consistency and retail environment authenticity
7. Output should be ready for Google Imagen 4 generation

Focus on: Material realism, proper lighting setup, camera angles, brand integration, and retail context.`;

      const userPrompt = `Enhance this POP display stand prompt for ${request.targetView} view:

BASE PROMPT:
${request.basePrompt}

BRAND CONTEXT: ${request.brandContext}
PRODUCT CONTEXT: ${request.productContext}
INNOVATION HINT: ${request.innovationHint}

Please enhance with:
- Professional photography/3D rendering terminology
- Specific lighting setups for ${request.targetView} view
- Material finish details (PBR, surface textures)
- One innovative but manufacturable feature
- Physics/structural realism
- Brand-appropriate design elements

Keep all dimensions and technical specs exactly as provided. Output only the enhanced prompt.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.7
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
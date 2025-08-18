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
You are a Master Prompt Engineer for Google Imagen 4, specializing in photorealistic POP (Point of Purchase) display design and product visualization. Your expertise lies in crafting compelling, highly detailed prompts that leverage Imagen 4's advanced capabilities to generate innovative, manufacturable, and visually stunning retail display stands.

CRITICAL: Apply the "Scene Director Method\" framework to all prompt enhancements:

**SCENE DIRECTOR METHOD COMPONENTS:**
1. **SUBJECT**: Create hyper-specific descriptions of the POP stand, integrating brand identity, product details, and innovative features with vivid, descriptive language
2. **SCENE**: Develop rich, authentic retail environment descriptions with atmospheric details, ambient elements, and contextual authenticity
3. **COMPOSITION**: Specify precise camera work - angles, framing (wide shot, close-up, low angle), perspective, and visual hierarchy optimized for the target view
4. **LIGHTING**: Engineer sophisticated lighting scenarios (cinematic lighting, soft morning light, dramatic backlighting, key+fill+rim setups) that enhance mood and photorealism
5. **STYLE**: Ensure ultra-realistic/photorealistic aesthetics with specific artistic directions that elevate visual impact
6. **TECHNICALS**: Include cutting-edge technical specifications (8k resolution, macro details, depth of field, specific lens types, PBR materials) for maximum quality

**ENHANCEMENT GUIDELINES:**
- Maintain ALL technical specifications exactly as provided (dimensions, materials, capacity) - NON-NEGOTIABLE
- Generate detailed NEGATIVE PROMPTS to exclude unwanted elements (watermarks, text overlays, unrealistic proportions, poor lighting, artifacts)
- Use vivid, descriptive adjectives and figurative language to inspire Imagen 4's creativity
- Emphasize practical manufacturability and physics constraints while pushing creative boundaries
- Include ONE signature innovative but feasible design element aligned with the brand's X-factor
- Ensure brand consistency and retail environment authenticity with professional photography terminology
- Output must be ready for Google Imagen 4 generation with maximum creative impact

Focus on creating prompts that produce images with the "WOW factor" - innovative, eye-catching, and professionally compelling while remaining buildable and cost-effective.`;

      const userPrompt = \`Enhance this POP display stand prompt for ${request.targetView} view:

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
Transform this POP display stand prompt using the Scene Director Method for Google Imagen 4 generation. Create a ${request.targetView} view that delivers maximum visual impact and innovation.

**BASE PROMPT:** ${request.basePrompt}
**BRAND CONTEXT:** ${request.brandContext}
**PRODUCT CONTEXT:** ${request.productContext}
**INNOVATION HINT:** ${request.innovationHint}

**ENHANCE USING SCENE DIRECTOR METHOD:**

🎯 **SUBJECT**: Craft a hyper-detailed description combining the base prompt with brand/product context, emphasizing the innovative signature feature that creates the "X-factor"

🏪 **SCENE**: Develop a rich, authentic retail environment description - ambient lighting, surrounding elements, atmospheric details that enhance the stand's appeal and context

📸 **COMPOSITION**: Specify precise camera work for ${request.targetView} view - exact angles, framing techniques (wide/close-up/low angle), perspective, and visual hierarchy that showcases the design optimally

💡 **LIGHTING**: Engineer sophisticated lighting scenarios (cinematic/studio/natural) with specific setups (key+fill+rim, softbox configurations, color temperature) that enhance mood and photorealism

🎨 **STYLE**: Define ultra-realistic/photorealistic aesthetics with specific artistic directions, material finish details (PBR, surface textures), and visual treatments that elevate impact

⚡ **TECHNICALS**: Include cutting-edge specs (8k resolution, specific lens types, depth of field, macro details, render quality) for maximum visual fidelity

🚫 **NEGATIVE PROMPTS**: Generate a concise list of elements to exclude (watermarks, text overlays, unrealistic proportions, poor lighting, artifacts, generic design)

**REQUIREMENTS:**
- Maintain ALL dimensions and technical specifications EXACTLY as provided in base prompt
- Push creative boundaries while ensuring manufacturability and physics realism
- Use vivid, descriptive language and figurative expressions to inspire Imagen 4's creativity
- Output ONLY the final enhanced prompt ready for Google Imagen 4 generation

Create a prompt that will generate an image with serious "WOW factor" - innovative, eye-catching, and professionally compelling!`;

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
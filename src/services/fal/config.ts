/**
 * FAL AI Service Configuration
 * Model configurations and constants
 */

import { ModelConfig } from './types';

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'flux-dev',
    name: 'Flux Dev',
    description: 'Fast, reliable text-to-image generation',
    endpoint: 'fal-ai/flux/dev',
    type: 'text-to-image',
    requiresInput: false
  },
  {
    id: 'flux-pro',
    name: 'Flux Pro',
    description: 'Higher quality, slower generation',
    endpoint: 'fal-ai/flux-pro',
    type: 'text-to-image',
    requiresInput: false
  },
  {
    id: 'nano-banana-t2i',
    name: 'Nano Banana T2I',
    description: 'AI text-to-image with natural language understanding',
    endpoint: 'fal-ai/nano-banana',
    type: 'text-to-image',
    requiresInput: false
  },
  {
    id: 'seedream-v4',
    name: 'SeedReam v4 Edit',
    description: 'Advanced multi-image editing with precise text control',
    endpoint: 'fal-ai/bytedance/seedream/v4/edit',
    type: 'image-editing',
    requiresInput: true
  }
];

export const IMAGE_SIZES = {
  "9:16": { width: 768, height: 1344 },
  "16:9": { width: 1344, height: 768 },
  "3:4": { width: 896, height: 1152 },
  "4:3": { width: 1152, height: 896 },
  "1:1": { width: 1024, height: 1024 }
} as const;

export const DEFAULT_GENERATION_CONFIG = {
  num_images: 1,
  guidance_scale: 7.5,
  num_inference_steps: 28,
  enable_safety_checker: false
} as const;
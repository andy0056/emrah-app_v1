/**
 * FAL AI Service Types
 * Centralized type definitions for FAL AI integration
 */

export type AIModel = 'flux-dev' | 'flux-pro' | 'nano-banana' | 'seedream-v4' | 'stable-diffusion';

export interface ModelConfig {
  id: AIModel;
  name: string;
  description: string;
  endpoint: string;
  type: 'text-to-image' | 'image-editing';
  requiresInput: boolean;
}

export interface ImageGenerationRequest {
  prompt: string;
  aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1" | "4:3";
  num_images?: number;
  negative_prompt?: string;
  seed?: number;
  reference_image_url?: string;
}

export interface FluxKontextRequest {
  prompt: string;
  image_url: string;
  aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1";
  guidance_scale?: number;
  num_images?: number;
  output_format?: string;
  safety_tolerance?: string;
}

export interface SeedreamV4Request {
  prompt: string;
  image_urls: string[];
  image_size?: { width: number; height: number };
  num_images?: number;
  enable_safety_checker?: boolean;
  seed?: number;
}

export interface FalGenerationRequest {
  prompt: string;
  aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1" | "4:3";
  num_images?: number;
  model?: AIModel;
  inputImages?: string[];
}

export interface FalImageResponse {
  images: Array<{ url: string; width?: number; height?: number }>;
  seed?: number;
  description?: string;
  has_nsfw_concepts?: boolean[];
}

export interface FalQueueUpdate {
  status: string;
  logs?: FalLog[];
}

export interface FalLog {
  message: string;
  level?: string;
  timestamp?: string;
}

export interface ModelRecommendation {
  model: 'nano-banana' | 'seedream-v4';
  confidence: number;
  reasoning: string[];
  assetAnalysis?: any;
}

export interface BrandAssetGenerationRequest {
  prompt: string;
  brand_asset_urls: string[];
  aspect_ratio: "9:16" | "16:9" | "3:4" | "1:1";
  num_images?: number;
  output_format?: 'jpeg' | 'png';
  formData?: any;
  userId?: string;
  enableABTesting?: boolean;
  enableOptimization?: boolean;
  enableIntelligence?: boolean;
  enableEvolution?: boolean;
  enableCompression?: boolean;
}

export interface SeedreamGenerationRequest extends BrandAssetGenerationRequest {
  image_size?: number;
}
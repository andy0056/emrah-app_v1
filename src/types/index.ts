export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: User;
}

export interface FormData {
  submissionId: string;
  respondentId: string;
  submittedAt: string;
  brand: string;
  brandLogo: File | string | null;
  product: string;
  productImage: File | string | null;
  productWidth: number;
  productDepth: number;
  productHeight: number;
  frontFaceCount: number;
  backToBackCount: number;
  keyVisual: File | string | null;
  exampleStands: File[] | string[];
  standType: StandType;
  materials: Material[];
  standBaseColor: string;
  standWidth: number;
  standDepth: number;
  standHeight: number;
  shelfWidth: number;
  shelfDepth: number;
  shelfCount: number;
  description: string;
}

export type StandType =
  | 'Floor Stand'
  | 'Tabletop Stand'
  | 'Wall Mount Stand'
  | 'Corner Stand'
  | 'Rotating Stand'
  | 'Multi-tier Stand';

export type Material =
  | 'Metal'
  | 'Wood'
  | 'Plastic'
  | 'Glass'
  | 'Cardboard'
  | 'Acrylic'
  | 'MDF'
  | 'Aluminum';

export interface PromptSet {
  frontView: string;
  storeView: string;
  threeQuarterView: string;
}

export interface GeneratedImageSet {
  frontView?: string;
  storeView?: string;
  threeQuarterView?: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  form_data: FormData;
  base_prompts: PromptSet;
  enhanced_prompts: PromptSet | null;
  brand: string | null;
  product: string | null;
  stand_type: string | null;
  status: ProjectStatus;
  is_public: boolean;
  share_token: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  images?: GeneratedImage[];
  versions?: ProjectVersion[];
}

export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  form_data: FormData;
  base_prompts: PromptSet;
  enhanced_prompts: PromptSet | null;
  version_name: string | null;
  change_notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface GeneratedImage {
  id: string;
  project_id: string;
  version_id: string | null;
  image_type: ImageType;
  image_url: string;
  storage_path: string | null;
  prompt_used: string | null;
  model_used: string;
  generation_params: GenerationParams | null;
  aspect_ratio: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  status: ImageStatus;
  quality_score: number | null;
  created_at: string;
}

export type ImageType = 'front_view' | 'store_view' | 'three_quarter_view' | 'edited';
export type ImageStatus = 'generating' | 'generated' | 'failed' | 'archived';

export interface ApiResponse<T = unknown> {
  data: T;
  error: string | null;
  success: boolean;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ErrorState {
  message: string;
  code?: string;
  field?: string;
  timestamp: string;
}

export interface LoadingState {
  isLoading: boolean;
  operation: string | null;
  progress?: number;
}

// Security Types
export interface CSRFToken {
  token: string;
  expires_at: string;
}

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'Strict-Transport-Security': string;
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Referrer-Policy': string;
}

// Performance Types
export interface ImageOptimization {
  lazy: boolean;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
  sizes: string;
}

export interface CacheConfig {
  ttl: number;
  key: string;
  strategy: 'stale-while-revalidate' | 'cache-first' | 'network-first';
}

// AI Service Types
export interface GenerationParams {
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
  safety_tolerance?: number;
  enable_safety_checker?: boolean;
  original_image_url?: string;
  edit_prompt?: string;
  aspect_ratio?: AspectRatio;
  image_size?: ImageSize;
  model_version?: string;
}

export interface ImageSize {
  width: number;
  height: number;
}

export type AspectRatio = "9:16" | "16:9" | "3:4" | "1:1" | "4:3";

export interface FalImageResponse {
  images: FalImage[];
  seed?: number;
  has_nsfw_concepts?: boolean[];
  description?: string;
}

export interface FalImage {
  url: string;
  width?: number;
  height?: number;
  content_type?: string;
}

export interface ModelRecommendation {
  model: 'seedream-v4' | 'nano-banana';
  confidence: number;
  reasoning: string[];
  assetAnalysis?: BrandAssetAnalysis;
}

export interface BrandAssetAnalysis {
  overallComplexity: number;
  brandIntegrationDifficulty: number;
  colorComplexity: number;
  textComplexity: number;
  logoComplexity: number;
  productComplexity: number;
  recommendations: string[];
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number;
  isActive: boolean;
  modifications: PromptModification[];
}

export interface PromptModification {
  type: 'replace' | 'append' | 'prepend' | 'remove';
  target: string;
  value: string;
}

export interface IntelligentPromptResult {
  enhancedPrompt: string;
  intent: PromptIntent;
  analysis: FormAnalysis;
  confidence: number;
}

export interface PromptIntent {
  primaryObjective: string;
  secondaryObjectives: string[];
  constraints: string[];
  priorities: string[];
}

export interface FormAnalysis {
  brandPriority: number;
  visualComplexity: number;
  functionalRequirements: string[];
  visualStyle: string;
  targetAudience: string;
}

export interface FeedbackData {
  imageUrl: string;
  rating: number;
  feedback: string;
  improvements: string[];
  timestamp: string;
  userId?: string;
}

export interface AnalyticsData {
  totalGenerations: number;
  successRate: number;
  averageRating: number;
  popularModels: ModelUsageStats[];
  timeMetrics: TimeMetrics;
  userEngagement: EngagementMetrics;
}

export interface ModelUsageStats {
  modelId: string;
  modelName: string;
  usageCount: number;
  successRate: number;
  averageRating: number;
}

export interface TimeMetrics {
  averageGenerationTime: number;
  peakUsageHours: number[];
  totalProcessingTime: number;
}

export interface EngagementMetrics {
  activeUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  featuresUsed: FeatureUsage[];
}

export interface FeatureUsage {
  feature: string;
  usageCount: number;
  lastUsed: string;
}

// Fal.ai specific types
export interface FalGenerationRequest {
  prompt: string;
  aspect_ratio: AspectRatio;
  num_images?: number;
  model?: string;
  inputImages?: string[];
  image_urls?: string[];
  brand_asset_urls?: string[];
  userId?: string;
  enableABTesting?: boolean;
  enableOptimization?: boolean;
  enableIntelligence?: boolean;
  enableEvolution?: boolean;
  output_format?: 'jpeg' | 'png';
  image_size?: number;
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

// Feedback and Analytics Types
export interface ImageFeedback {
  id: string;
  imageUrl: string;
  imageType: 'frontView' | 'storeView' | 'threeQuarterView';
  model: 'seedream-v4' | 'nano-banana';
  promptVersion: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: 'loved' | 'liked' | 'neutral' | 'disliked' | 'rejected';
  comments?: string;
  timestamp: string;
  projectId: string;
  userId: string;
  brandIntegration: 1 | 2 | 3 | 4 | 5;
  promptAdherence: 1 | 2 | 3 | 4 | 5;
  visualQuality: 1 | 2 | 3 | 4 | 5;
  realismAccuracy: 1 | 2 | 3 | 4 | 5;
  formData: FormData;
  promptUsed: string;
  generationTime: number;
}

export interface FeedbackAnalytics {
  totalFeedbacks: number;
  averageRating: number;
  modelPerformance: {
    'seedream-v4': ModelPerformance;
    'nano-banana': ModelPerformance;
  };
  promptEffectiveness: Record<string, PromptEffectiveness>;
  clientPreferences: ClientPreferences;
}

export interface ModelPerformance {
  averageRating: number;
  count: number;
  strongPoints: string[];
  weakPoints: string[];
}

export interface PromptEffectiveness {
  averageRating: number;
  count: number;
  bestPerformingAspects: string[];
}

export interface ClientPreferences {
  preferredModels: string[];
  commonRequests: string[];
  feedbackPatterns: string[];
}

// Brand Asset Analysis Types (moved from brandAssetAnalysisService.ts)
export interface BrandAssetAnalysisExtended {
  logoComplexity: 'simple' | 'moderate' | 'complex';
  logoColors: string[];
  logoStyle: 'text' | 'icon' | 'combination' | 'emblem';
  productType: 'packaged' | 'beverage' | 'food' | 'electronics' | 'beauty' | 'other';
  productShape: 'cylindrical' | 'rectangular' | 'irregular' | 'bottle';
  productColors: string[];
  keyVisualType?: 'lifestyle' | 'product' | 'brand' | 'campaign';
  keyVisualComplexity?: 'simple' | 'detailed' | 'complex';
  overallComplexity: number;
  brandIntegrationDifficulty: number;
  recommendedModel: 'seedream-v4' | 'nano-banana';
  confidence: number;
  reasoning: string[];
}

export interface ModelPerformanceProfile {
  'seedream-v4': ServiceModelProfile;
  'nano-banana': ServiceModelProfile;
}

export interface ServiceModelProfile {
  strengths: string[];
  weaknesses: string[];
  optimalAssetTypes: string[];
  averageRating: number;
  brandIntegrationScore: number;
}

// Prompt Optimization Types
export interface PromptOptimization {
  id: string;
  name: string;
  description: string;
  modifiers: string[];
  weight: number;
  performanceImpact: number;
  minSampleSize: number;
  currentSamples: number;
  isActive: boolean;
  confidence: number;
}

export interface DynamicPromptWeights {
  brandIntensity: number;
  productDensity: number;
  realismFocus: number;
  technicalPrecision: number;
  visualDrama: number;
}

// Evolution Service Types
export interface EvolutionMetrics {
  totalGenerations: number;
  averageImprovement: number;
  convergenceStatus: 'improving' | 'converged' | 'diverging';
  bestScore: number;
  activePatterns: number;
}

export interface EvolutionPattern {
  id: string;
  generation: number;
  pattern: string;
  score: number;
  parentPatterns: string[];
  mutations: string[];
  timestamp: string;
  performance: number;
}

export interface EvolutionHistory {
  generation: number;
  bestScore: number;
  averageScore: number;
  patterns: EvolutionPattern[];
  convergenceMetric: number;
  diversityIndex: number;
}

// Real-time Analytics Types
export interface RealTimeMetrics {
  activeUsers: number;
  generationsInProgress: number;
  averageGenerationTime: number;
  successRate: number;
  errorRate: number;
  queueLength: number;
  systemLoad: number;
}

export interface PerformanceSnapshot {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  responseTime: number;
  throughput: number;
  errorCount: number;
}

// Intelligent Alert Types
export interface IntelligentAlert {
  id: string;
  type: 'performance' | 'quality' | 'user_behavior' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionRequired: boolean;
  relatedData?: Record<string, unknown>;
}

// Enhanced Error Types
export interface AppError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'user' | 'system' | 'network' | 'validation' | 'authentication' | 'authorization';
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
}

export class APIError extends Error implements AppError {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'user' | 'system' | 'network' | 'validation' | 'authentication' | 'authorization';
  timestamp: string;
  context?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    category: 'user' | 'system' | 'network' | 'validation' | 'authentication' | 'authorization' = 'system',
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.severity = severity;
    this.category = category;
    this.timestamp = new Date().toISOString();
    this.context = context;
  }
}

export class ValidationError extends APIError {
  field?: string;
  value?: unknown;

  constructor(
    message: string,
    field?: string,
    value?: unknown,
    context?: Record<string, unknown>
  ) {
    super('VALIDATION_ERROR', message, 'medium', 'validation', context);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Authentication required', context?: Record<string, unknown>) {
    super('AUTH_ERROR', message, 'high', 'authentication', context);
    this.name = 'AuthenticationError';
  }
}

export class NetworkError extends APIError {
  statusCode?: number;
  endpoint?: string;

  constructor(
    message: string,
    statusCode?: number,
    endpoint?: string,
    context?: Record<string, unknown>
  ) {
    super('NETWORK_ERROR', message, 'medium', 'network', context);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

export class AIServiceError extends APIError {
  model?: string;
  promptLength?: number;

  constructor(
    message: string,
    model?: string,
    promptLength?: number,
    context?: Record<string, unknown>
  ) {
    super('AI_SERVICE_ERROR', message, 'high', 'system', context);
    this.name = 'AIServiceError';
    this.model = model;
    this.promptLength = promptLength;
  }
}

export class FileUploadError extends APIError {
  fileName?: string;
  fileSize?: number;
  fileType?: string;

  constructor(
    message: string,
    fileName?: string,
    fileSize?: number,
    fileType?: string,
    context?: Record<string, unknown>
  ) {
    super('FILE_UPLOAD_ERROR', message, 'medium', 'validation', context);
    this.name = 'FileUploadError';
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.fileType = fileType;
  }
}

// Error Handler Types
export interface ErrorHandler {
  handle(error: AppError): void;
  canHandle(error: Error): boolean;
}

export interface ErrorReportingConfig {
  enableReporting: boolean;
  endpoint?: string;
  apiKey?: string;
  includeContext: boolean;
  includeStack: boolean;
}
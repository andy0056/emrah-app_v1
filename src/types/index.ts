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
  | 'Ayaklı Stant (Floor Stand)'
  | 'Masa Üstü Stant (Tabletop Stand)'
  | 'Duvar Stantı (Wall Mount Stand)'
  | 'Köşe Stantı (Corner Stand)'
  | 'Dönen Stant (Rotating Stand)'
  | 'Çok Katlı Stant (Multi-tier Stand)';

export type Material = 
  | 'Metal'
  | 'Ahşap (Wood)'
  | 'Plastik (Plastic)'
  | 'Cam (Glass)'
  | 'Karton (Cardboard)'
  | 'Akrilik (Acrylic)'
  | 'MDF'
  | 'Alüminyum (Aluminum)';

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
  generation_params: Record<string, any>;
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

export interface ApiResponse<T = any> {
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
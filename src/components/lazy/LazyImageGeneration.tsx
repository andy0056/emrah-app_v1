import React, { Suspense } from 'react';
import { LoadingSpinner } from '../ui';

const ImageGeneration = React.lazy(() => import('../ImageGeneration'));

import type { CapturedViews } from '../hooks/useSceneCapture';
import type { Visual3DPromptResult } from '../services/visual3DPromptService';

interface LazyImageGenerationProps {
  prompts: {
    frontView: string;
    storeView: string;
    threeQuarterView: string;
  };
  enhancedPrompts?: {
    frontView: string;
    storeView: string;
    threeQuarterView: string;
  } | null;
  isFormValid: boolean;
  currentProjectId?: string;
  initialImages?: {
    frontView?: string;
    storeView?: string;
    threeQuarterView?: string;
  };
  formData?: any; // Full form data for advanced prompt generation
  onImagesUpdated?: (images: any) => void;
  // New props for 3D visual references
  capturedViews?: CapturedViews | null;
  visual3DPrompts?: Visual3DPromptResult | null;
}

const LazyImageGeneration: React.FC<LazyImageGenerationProps> = (props) => {
  return (
    <Suspense 
      fallback={
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 mt-8">
          <LoadingSpinner size="lg" text="Loading image generation..." />
        </div>
      }
    >
      <ImageGeneration {...props} />
    </Suspense>
  );
};

export default LazyImageGeneration;
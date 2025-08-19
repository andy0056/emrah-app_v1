import { useState, useCallback, useMemo } from 'react';
import { PromptGenerator } from '../utils/promptGenerator';
import { OpenAIService, PromptEnhancementRequest } from '../services/openaiService';

interface Prompts {
  frontView: string;
  storeView: string;
  threeQuarterView: string;
}

interface UsePromptReturn {
  basePrompts: Prompts;
  enhancedPrompts: Prompts | null;
  isEnhancing: boolean;
  enhanceError: string | null;
  generatePrompts: (formData: any) => void;
  enhancePrompts: (brandContext: string, productContext: string, innovationHint: string) => Promise<void>;
  clearEnhancedPrompts: () => void;
  clearError: () => void;
}

export const usePrompt = (): UsePromptReturn => {
  const [basePrompts, setBasePrompts] = useState<Prompts>({
    frontView: '',
    storeView: '',
    threeQuarterView: ''
  });
  
  const [enhancedPrompts, setEnhancedPrompts] = useState<Prompts | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);

  const generatePrompts = useCallback((formData: any) => {
    if (formData?.brand && formData?.product && formData?.standType) {
      const generatedPrompts = PromptGenerator.generateAllPrompts(formData);
      setBasePrompts(generatedPrompts);
      // Reset enhanced prompts when base data changes
      setEnhancedPrompts(null);
      setEnhanceError(null);
    }
  }, []);

  const enhancePrompts = useCallback(async (
    brandContext: string,
    productContext: string,
    innovationHint: string
  ) => {
    if (!basePrompts.frontView || !brandContext || !productContext) {
      setEnhanceError('Please fill out the form completely before enhancing prompts.');
      setTimeout(() => setEnhanceError(null), 5000);
      return;
    }

    setIsEnhancing(true);
    setEnhanceError(null);
    
    try {
      const enhancementRequests: PromptEnhancementRequest[] = [
        {
          basePrompt: basePrompts.frontView,
          brandContext,
          productContext,
          targetView: 'front',
          innovationHint
        },
        {
          basePrompt: basePrompts.storeView,
          brandContext,
          productContext,
          targetView: 'store',
          innovationHint
        },
        {
          basePrompt: basePrompts.threeQuarterView,
          brandContext,
          productContext,
          targetView: 'three-quarter',
          innovationHint
        }
      ];

      const enhanced = await OpenAIService.enhanceMultiplePrompts(enhancementRequests);
      
      setEnhancedPrompts({
        frontView: enhanced[0],
        storeView: enhanced[1],
        threeQuarterView: enhanced[2]
      });
    } catch (error) {
      console.error('Error enhancing prompts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to enhance prompts. Please try again.';
      setEnhanceError(errorMessage);
      setTimeout(() => setEnhanceError(null), 5000);
    } finally {
      setIsEnhancing(false);
    }
  }, [basePrompts]);

  const clearEnhancedPrompts = useCallback(() => {
    setEnhancedPrompts(null);
    setEnhanceError(null);
  }, []);

  const clearError = useCallback(() => {
    setEnhanceError(null);
  }, []);

  // Memoized final prompts (enhanced if available, otherwise base)
  const finalPrompts = useMemo(() => {
    return enhancedPrompts || basePrompts;
  }, [basePrompts, enhancedPrompts]);

  return {
    basePrompts,
    enhancedPrompts,
    isEnhancing,
    enhanceError,
    generatePrompts,
    enhancePrompts,
    clearEnhancedPrompts,
    clearError
  };
};
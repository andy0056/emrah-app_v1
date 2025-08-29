import React from 'react';
import { Eye, Copy, Check, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { OpenAIService } from '../services/openaiService';

interface PromptPreviewProps {
  prompts: {
    frontView: string;
    storeView: string;
    threeQuarterView: string;
  };
  brandContext: string;
  productContext: string;
  innovationHint: string;
}

const PromptPreview: React.FC<PromptPreviewProps> = ({ prompts, brandContext, productContext, innovationHint }) => {
  const [copiedPrompt, setCopiedPrompt] = React.useState<string | null>(null);
  const [enhancedPrompts, setEnhancedPrompts] = React.useState<{
    frontView: string;
    storeView: string;
    threeQuarterView: string;
  } | null>(null);
  const [isEnhancing, setIsEnhancing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const copyToClipboard = async (prompt: string, type: string) => {
    try {
      const finalPrompt = enhancedPrompts ? enhancedPrompts[type as keyof typeof enhancedPrompts] : prompt;
      await navigator.clipboard.writeText(finalPrompt);
      setCopiedPrompt(type);
      setTimeout(() => setCopiedPrompt(null), 2000);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Failed to copy prompt:', error);
      setError('Failed to copy to clipboard. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const enhancePrompts = async () => {
    if (!prompts.frontView || !brandContext || !productContext) {
      setError('Please fill out the form completely before enhancing prompts.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setIsEnhancing(true);
    setError(null);
    
    try {
      const enhancementRequests = [
        {
          basePrompt: prompts.frontView,
          brandContext,
          productContext,
          targetView: 'front' as const,
          innovationHint
        },
        {
          basePrompt: prompts.storeView,
          brandContext,
          productContext,
          targetView: 'store' as const,
          innovationHint
        },
        {
          basePrompt: prompts.threeQuarterView,
          brandContext,
          productContext,
          targetView: 'three-quarter' as const,
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
      setError(errorMessage);
    } finally {
      setIsEnhancing(false);
    }
  };

  const promptTypes = [
    { key: 'frontView', title: 'Front View (9:16)', basePrompt: prompts.frontView },
    { key: 'storeView', title: 'Store View (16:9)', basePrompt: prompts.storeView },
    { key: 'threeQuarterView', title: '3/4 View (3:4)', basePrompt: prompts.threeQuarterView }
  ];

  return (
    <div className="bg-indigo-50 rounded-lg p-4 sm:p-6 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          {enhancedPrompts ? 'AI-Enhanced Brand Prompts' : 'Brand-First Creative Templates'}
        </h3>
        
        <button
          onClick={enhancePrompts}
          disabled={isEnhancing || !prompts.frontView}
          className={`flex items-center px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
            isEnhancing || !prompts.frontView
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : enhancedPrompts
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isEnhancing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enhancing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {enhancedPrompts ? 'Re-enhance' : 'Enhance with AI'}
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        {promptTypes.map(({ key, title, basePrompt }) => {
          const displayPrompt = enhancedPrompts 
            ? enhancedPrompts[key as keyof typeof enhancedPrompts]
            : basePrompt;
          
          return (
          <div key={key} className="bg-white rounded-lg p-3 sm:p-4 border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <h4 className="font-medium text-gray-900">{title}</h4>
                {enhancedPrompts && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    AI Enhanced
                  </span>
                )}
              </div>
              <button
                onClick={() => copyToClipboard(basePrompt, key)}
                className="flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
              >
                {copiedPrompt === key ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-50 rounded p-2 sm:p-3 text-xs sm:text-sm text-gray-700 max-h-32 overflow-y-auto">
              {displayPrompt || 'Fill out the form to generate prompt...'}
            </div>
          </div>
        );
        })}
      </div>

      {enhancedPrompts && (
        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm font-medium">
            ✨ Brand prompts enhanced with personality-driven storytelling and signature design elements!
          </p>
        </div>
      )}
      
      <div className="mt-4 p-3 bg-purple-100 border border-purple-200 rounded-lg">
        <p className="text-purple-800 text-sm font-medium">
          🎨 Now using advanced Brand-First templates with signature elements, metaphors, and emotional language that brings brands to life!
        </p>
      </div>
    </div>
  );
};

export default PromptPreview;
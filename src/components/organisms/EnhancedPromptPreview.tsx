import React from 'react';
import { Eye, Copy, Check, Sparkles, Loader2 } from 'lucide-react';
import { usePrompt } from '../../hooks/usePrompt';
import Button from '../atoms/Button';
import Alert from '../atoms/Alert';

interface EnhancedPromptPreviewProps {
  brandContext: string;
  productContext: string;
  innovationHint: string;
}

const EnhancedPromptPreview: React.FC<EnhancedPromptPreviewProps> = ({
  brandContext,
  productContext,
  innovationHint
}) => {
  const { 
    basePrompts, 
    enhancedPrompts, 
    isEnhancing, 
    enhanceError, 
    enhancePrompts, 
    clearError 
  } = usePrompt();
  
  const [copiedPrompt, setCopiedPrompt] = React.useState<string | null>(null);

  const copyToClipboard = async (prompt: string, type: string) => {
    try {
      const finalPrompt = enhancedPrompts ? enhancedPrompts[type as keyof typeof enhancedPrompts] : prompt;
      await navigator.clipboard.writeText(finalPrompt);
      setCopiedPrompt(type);
      setTimeout(() => setCopiedPrompt(null), 2000);
      clearError();
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  const handleEnhancePrompts = async () => {
    if (!basePrompts.frontView || !brandContext || !productContext) {
      return;
    }
    
    await enhancePrompts(brandContext, productContext, innovationHint);
  };

  const promptTypes = [
    { key: 'frontView', title: 'Front View (9:16)', basePrompt: basePrompts.frontView },
    { key: 'storeView', title: 'Store View (16:9)', basePrompt: basePrompts.storeView },
    { key: 'threeQuarterView', title: '3/4 View (3:4)', basePrompt: basePrompts.threeQuarterView }
  ];

  return (
    <div className="bg-indigo-50 rounded-lg p-4 sm:p-6 mt-6 sm:mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          {enhancedPrompts ? 'AI-Enhanced Prompts' : 'Generated Prompts Preview'}
        </h3>
        
        <Button
          onClick={handleEnhancePrompts}
          disabled={isEnhancing || !basePrompts.frontView}
          loading={isEnhancing}
          variant={enhancedPrompts ? 'success' : 'primary'}
          size="md"
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {enhancedPrompts ? 'Re-enhance' : 'Enhance with AI'}
        </Button>
      </div>
      
      {enhanceError && (
        <div className="mb-4">
          <Alert type="error" onClose={clearError}>
            {enhanceError}
          </Alert>
        </div>
      )}
      
      <div className="space-y-3 sm:space-y-4">
        {promptTypes.map(({ key, title, basePrompt }) => {
          const displayPrompt = enhancedPrompts 
            ? enhancedPrompts[key as keyof typeof enhancedPrompts]
            : basePrompt;
          
          return (
            <div key={key} className="bg-white rounded-lg p-3 sm:p-4 border border-indigo-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">{title}</h4>
                  {enhancedPrompts && (
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      AI Enhanced
                    </span>
                  )}
                </div>
                <Button
                  onClick={() => copyToClipboard(basePrompt, key)}
                  variant="ghost"
                  size="sm"
                  className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 w-full sm:w-auto"
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
                </Button>
              </div>
              <div className="bg-gray-50 rounded p-2 sm:p-3 text-xs sm:text-sm text-gray-700 max-h-32 overflow-y-auto">
                {displayPrompt || 'Fill out the form to generate prompt...'}
              </div>
            </div>
          );
        })}
      </div>

      {enhancedPrompts && (
        <div className="mt-4">
          <Alert type="success">
            ✨ Prompts enhanced with professional terminology, advanced lighting setups, and innovative design elements!
          </Alert>
        </div>
      )}
    </div>
  );
};

export default EnhancedPromptPreview;
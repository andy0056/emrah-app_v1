import React from 'react';
import { Eye, Copy, Check } from 'lucide-react';

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

  const copyToClipboard = async (prompt: string, type: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(type);
      setTimeout(() => setCopiedPrompt(null), 2000);
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  const promptTypes = [
    { key: 'frontView', title: 'Front View (9:16)', basePrompt: prompts.frontView },
    { key: 'storeView', title: 'Store View (16:9)', basePrompt: prompts.storeView },
    { key: 'threeQuarterView', title: '3/4 View (3:4)', basePrompt: prompts.threeQuarterView }
  ];

  return (
    <div className="bg-indigo-50 rounded-lg p-4 sm:p-6 mt-8">
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          Generated Prompts (Optimized for Accuracy)
        </h3>
      </div>
      
      <div className="space-y-4">
        {promptTypes.map(({ key, title, basePrompt }) => {
          return (
          <div key={key} className="bg-white rounded-lg p-3 sm:p-4 border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <h4 className="font-medium text-gray-900">{title}</h4>
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
              {basePrompt || 'Fill out the form to generate prompt...'}
            </div>
          </div>
        );
        })}
      </div>

      <div className="mt-4 p-3 bg-purple-100 border border-purple-200 rounded-lg">
        <p className="text-purple-800 text-sm font-medium">
          🎯 Specification-first prompts with exact dimensions, materials, and structure details for accurate AI generation!
        </p>
      </div>
    </div>
  );
};

export default PromptPreview;
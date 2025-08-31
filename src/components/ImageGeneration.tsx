import React, { useState } from 'react';
import { Wand2, Download, Loader2, AlertCircle, Maximize2, Edit, Sparkles } from 'lucide-react';
import { FalService } from '../services/falService';
import { ProjectService } from '../services/projectService';
import ImageModal from './ImageModal';
import ImageEditModal from './ImageEditModal';

interface ImageGenerationProps {
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
  formData?: {
    brandLogo?: string | null;
    productImage?: string | null;
    keyVisual?: string | null;
    exampleStands?: string[];
  };
  initialImages?: {
    frontView?: string;
    storeView?: string;
    threeQuarterView?: string;
  };
  onImagesUpdated?: (images: GeneratedImageSet) => void;
}

interface GeneratedImageSet {
  frontView?: string;
  storeView?: string;
  threeQuarterView?: string;
}

const ImageGeneration: React.FC<ImageGenerationProps> = ({ 
  prompts, 
  enhancedPrompts, 
  isFormValid, 
  currentProjectId,
  formData,
  initialImages,
  onImagesUpdated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageSet>(initialImages || {});
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
    fileName: string;
  } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<{
    url: string;
    title: string;
    aspectRatio: "9:16" | "16:9" | "3:4" | "1:1";
  } | null>(null);
  // Removed selectedModel since we automatically choose the best model based on assets

  // Update generated images when initialImages prop changes
  React.useEffect(() => {
    if (initialImages) {
      setGeneratedImages(initialImages);
    }
  }, [initialImages]);

  // Call onImagesUpdated when generatedImages changes
  React.useEffect(() => {
    if (onImagesUpdated) {
      onImagesUpdated(generatedImages);
    }
  }, [generatedImages, onImagesUpdated]);

  const saveImageToSupabase = async (
    imageUrl: string, 
    imageType: 'front_view' | 'store_view' | 'three_quarter_view',
    promptUsed: string,
    aspectRatio: string
  ) => {
    if (!currentProjectId) {
      console.warn('No current project ID, skipping image save to Supabase');
      return;
    }

    try {
      await ProjectService.saveGeneratedImage(
        currentProjectId,
        imageType,
        imageUrl,
        promptUsed,
        aspectRatio
      );
      console.log(`✅ Saved ${imageType} image to Supabase for project ${currentProjectId}`);
    } catch (error) {
      console.error(`❌ Failed to save ${imageType} image to Supabase:`, error);
      // Don't throw error - image generation was successful, just storage failed
    }
  };

  const generateImages = async () => {
    if (!isFormValid) {
      setError('Please fill out all required form fields before generating images.');
      return;
    }

    // Check if brand assets are available for integrated generation
    const hasBrandAssets = formData && (
      formData.brandLogo || 
      formData.productImage || 
      formData.keyVisual
    );

    // Removed model configuration logic since we automatically select the best approach

    setIsGenerating(true);
    setError(null);
    setGeneratedImages({});
    
    try {
      // Use the base prompts (no enhancement needed)
      const finalPrompts = prompts;

      if (hasBrandAssets) {
        // NEW STRATEGY: Use Nano Banana Edit for brand-integrated primary generation
        console.log('🍌 Brand assets detected - using integrated generation approach');
        
        // Collect brand asset URLs
        const brandAssetUrls: string[] = [];
        if (formData.brandLogo) brandAssetUrls.push(formData.brandLogo);
        if (formData.productImage) brandAssetUrls.push(formData.productImage);
        if (formData.keyVisual) brandAssetUrls.push(formData.keyVisual);

        setProgress('🍌 Generating front view with integrated brand assets...');
        const frontResult = await FalService.generateWithBrandAssets({
          prompt: finalPrompts.frontView,
          brand_asset_urls: brandAssetUrls,
          aspect_ratio: '9:16',
          num_images: 1
        });
        const frontImageUrl = frontResult.images[0]?.url;
        if (frontImageUrl) {
          setGeneratedImages(prev => ({ ...prev, frontView: frontImageUrl }));
          if (currentProjectId) {
            await saveImageToSupabase(frontImageUrl, 'front_view', finalPrompts.frontView, '9:16');
          }
        }

        setProgress('🍌 Generating store view with integrated brand assets...');
        const storeResult = await FalService.generateWithBrandAssets({
          prompt: finalPrompts.storeView,
          brand_asset_urls: brandAssetUrls,
          aspect_ratio: '16:9',
          num_images: 1
        });
        const storeImageUrl = storeResult.images[0]?.url;
        if (storeImageUrl) {
          setGeneratedImages(prev => ({ ...prev, storeView: storeImageUrl }));
          if (currentProjectId) {
            await saveImageToSupabase(storeImageUrl, 'store_view', finalPrompts.storeView, '16:9');
          }
        }

        setProgress('🍌 Generating 3/4 view with integrated brand assets...');
        const threeQuarterResult = await FalService.generateWithBrandAssets({
          prompt: finalPrompts.threeQuarterView,
          brand_asset_urls: brandAssetUrls,
          aspect_ratio: '3:4',
          num_images: 1
        });
        const threeQuarterImageUrl = threeQuarterResult.images[0]?.url;
        if (threeQuarterImageUrl) {
          setGeneratedImages(prev => ({ ...prev, threeQuarterView: threeQuarterImageUrl }));
          if (currentProjectId) {
            await saveImageToSupabase(threeQuarterImageUrl, 'three_quarter_view', finalPrompts.threeQuarterView, '3:4');
          }
        }

        setProgress('✅ All brand-integrated images generated successfully!');
        
      } else {
        // FALLBACK: Use traditional Flux Dev generation when no brand assets
        console.log('🎯 No brand assets - using traditional Flux Dev generation');
        
        const requests = [
          {
            prompt: finalPrompts.frontView,
            aspect_ratio: "9:16",
            num_images: 1,
            model: 'flux-dev' as const
          },
          {
            prompt: finalPrompts.storeView,
            aspect_ratio: "16:9", 
            num_images: 1,
            model: 'flux-dev' as const
          },
          {
            prompt: finalPrompts.threeQuarterView,
            aspect_ratio: "3:4",
            num_images: 1,
            model: 'flux-dev' as const
          }
        ];

        setProgress('🎯 Generating front view with Flux Dev...');
        const frontResult = await FalService.generateImage(requests[0]);
        const frontImageUrl = frontResult.images[0]?.url;
        if (frontImageUrl) {
          setGeneratedImages(prev => ({ ...prev, frontView: frontImageUrl }));
          if (currentProjectId) {
            await saveImageToSupabase(frontImageUrl, 'front_view', finalPrompts.frontView, '9:16');
          }
        }

        setProgress('🎯 Generating store view with Flux Dev...');
        const storeResult = await FalService.generateImage(requests[1]);
        const storeImageUrl = storeResult.images[0]?.url;
        if (storeImageUrl) {
          setGeneratedImages(prev => ({ ...prev, storeView: storeImageUrl }));
          if (currentProjectId) {
            await saveImageToSupabase(storeImageUrl, 'store_view', finalPrompts.storeView, '16:9');
          }
        }

        setProgress('🎯 Generating 3/4 view with Flux Dev...');
        const threeQuarterResult = await FalService.generateImage(requests[2]);
        const threeQuarterImageUrl = threeQuarterResult.images[0]?.url;
        if (threeQuarterImageUrl) {
          setGeneratedImages(prev => ({ ...prev, threeQuarterView: threeQuarterImageUrl }));
          if (currentProjectId) {
            await saveImageToSupabase(threeQuarterImageUrl, 'three_quarter_view', finalPrompts.threeQuarterView, '3:4');
          }
        }

        setProgress('✅ All images generated successfully!');
      }
      
      setTimeout(() => setProgress(''), 3000);
    } catch (error) {
      console.error('Image generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate images. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const openModal = (url: string, title: string, filename: string) => {
    setSelectedImage({ url, title, fileName: filename });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedImage(null);
  };

  const openEditModal = (url: string, title: string, aspectRatio: "9:16" | "16:9" | "3:4" | "1:1") => {
    setImageToEdit({ url, title, aspectRatio });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setImageToEdit(null);
  };

  const handleImageEdited = (editedImageUrl: string) => {
    console.log('Image edited successfully:', editedImageUrl);
    // Could update the UI to show the new edited image or refresh the gallery
  };
  const imageTypes = [
    { key: 'frontView', title: 'Front View (9:16)', filename: 'pop-stand-front-view.png', aspectRatio: '9:16' as const },
    { key: 'storeView', title: 'Store View (16:9)', filename: 'pop-stand-store-view.png', aspectRatio: '16:9' as const },
    { key: 'threeQuarterView', title: '3/4 View (3:4)', filename: 'pop-stand-three-quarter-view.png', aspectRatio: '3:4' as const }
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <Wand2 className="w-5 h-5 mr-2" />
            AI Image Generation
          </h3>
          {formData && (formData.brandLogo || formData.productImage || formData.keyVisual) && (
            <p className="text-sm text-purple-600 mt-1 flex items-center">
              <Sparkles className="w-4 h-4 mr-1" />
              Brand assets detected - using integrated generation approach
            </p>
          )}
        </div>
        
        <div className="flex items-center">
          <button
            onClick={generateImages}
            disabled={isGenerating || !isFormValid}
            className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all ${
              isGenerating || !isFormValid
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Images
              </>
            )}
          </button>
        </div>
      </div>

      {/* Model Info */}
      {(() => {
        const hasBrandAssets = formData && (formData.brandLogo || formData.productImage || formData.keyVisual);
        const modelName = hasBrandAssets ? "Nano Banana Edit" : "Flux Dev";
        const modelDescription = hasBrandAssets 
          ? "AI image editing with brand asset integration" 
          : "Fast, reliable text-to-image generation";
        
        return (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg">
            <p className="text-purple-800 text-sm font-medium">
              🤖 Using {modelName}: {modelDescription}
              {hasBrandAssets && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Brand assets integrated
                </span>
              )}
            </p>
          </div>
        );
      })()}

      {enhancedPrompts && (
        <div className="mb-4 p-3 bg-purple-100 border border-purple-200 rounded-lg">
          <p className="text-purple-800 text-sm font-medium">🚀 Using AI-enhanced Brand-First prompts with signature elements, brand metaphors, and emotional storytelling!</p>
        </div>
      )}

      {progress && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm font-medium">{progress}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {imageTypes.map(({ key, title, filename, aspectRatio }) => {
          const imageUrl = generatedImages[key as keyof GeneratedImageSet];
          
          return (
            <div key={key} className="bg-white rounded-lg p-4 shadow-md">
              <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
              
              <div className="relative aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden group">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
                      onClick={() => openModal(imageUrl, title, filename)}
                    />
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                      onClick={() => openModal(imageUrl, title, filename)}
                    >
                      <div className="bg-white bg-opacity-90 rounded-full p-2">
                        <Maximize2 className="w-5 h-5 text-gray-700" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-center">
                    <Wand2 className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Image will appear here</p>
                  </div>
                )}
              </div>

            {imageUrl && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => downloadImage(imageUrl, filename)}
                  className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
                <button
                  onClick={() => openEditModal(imageUrl, title, aspectRatio)}
                  className="flex items-center justify-center px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </div>
            )}
            </div>
          );
        })}
      </div>

      {!isFormValid && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Please complete all required form fields to enable image generation.
          </p>
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={modalOpen}
        imageUrl={selectedImage?.url || null}
        imageTitle={selectedImage?.title || ''}
        fileName={selectedImage?.fileName || 'pop-stand-image.png'}
        onClose={closeModal}
      />

      {/* Image Edit Modal */}
      <ImageEditModal
        isOpen={isEditModalOpen}
        imageUrl={imageToEdit?.url || null}
        imageTitle={imageToEdit?.title || ''}
        aspectRatio={imageToEdit?.aspectRatio || '1:1'}
        projectId={currentProjectId}
        formData={formData}
        onClose={closeEditModal}
        onImageEdited={handleImageEdited}
      />
    </div>
  );
};

export default ImageGeneration;
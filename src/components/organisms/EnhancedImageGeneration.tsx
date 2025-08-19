import React, { useState, useEffect } from 'react';
import { Wand2, Download, Edit } from 'lucide-react';
import { FalService, ImageGenerationRequest } from '../../services/falService';
import { ProjectService } from '../../services/projectService';
import Button from '../atoms/Button';
import Alert from '../atoms/Alert';
import LoadingSpinner from '../atoms/LoadingSpinner';
import Modal from '../atoms/Modal';
import ImagePreview from '../molecules/ImagePreview';
import ImageModal from '../ImageModal';
import ImageEditModal from '../ImageEditModal';

interface EnhancedImageGenerationProps {
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
  onImagesUpdated?: (images: GeneratedImageSet) => void;
}

interface GeneratedImageSet {
  frontView?: string;
  storeView?: string;
  threeQuarterView?: string;
}

const EnhancedImageGeneration: React.FC<EnhancedImageGenerationProps> = ({
  prompts,
  enhancedPrompts,
  isFormValid,
  currentProjectId,
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

  // Update generated images when initialImages prop changes
  useEffect(() => {
    if (initialImages) {
      setGeneratedImages(initialImages);
    }
  }, [initialImages]);

  // Call onImagesUpdated when generatedImages changes
  useEffect(() => {
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
    }
  };

  const generateImages = async () => {
    if (!isFormValid) {
      setError('Please fill out all required form fields before generating images.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages({});

    try {
      const finalPrompts = enhancedPrompts || prompts;

      const requests: ImageGenerationRequest[] = [
        {
          prompt: finalPrompts.frontView,
          aspect_ratio: "9:16",
          num_images: 1
        },
        {
          prompt: finalPrompts.storeView,
          aspect_ratio: "16:9",
          num_images: 1
        },
        {
          prompt: finalPrompts.threeQuarterView,
          aspect_ratio: "3:4",
          num_images: 1
        }
      ];

      setProgress('Generating front view...');
      const frontResult = await FalService.generateImage(requests[0]);
      const frontImageUrl = frontResult.images[0]?.url;
      if (frontImageUrl) {
        setGeneratedImages(prev => ({ ...prev, frontView: frontImageUrl }));
        await saveImageToSupabase(frontImageUrl, 'front_view', finalPrompts.frontView, '9:16');
      }

      setProgress('Generating store view...');
      const storeResult = await FalService.generateImage(requests[1]);
      const storeImageUrl = storeResult.images[0]?.url;
      if (storeImageUrl) {
        setGeneratedImages(prev => ({ ...prev, storeView: storeImageUrl }));
        await saveImageToSupabase(storeImageUrl, 'store_view', finalPrompts.storeView, '16:9');
      }

      setProgress('Generating 3/4 view...');
      const threeQuarterResult = await FalService.generateImage(requests[2]);
      const threeQuarterImageUrl = threeQuarterResult.images[0]?.url;
      if (threeQuarterImageUrl) {
        setGeneratedImages(prev => ({ ...prev, threeQuarterView: threeQuarterImageUrl }));
        await saveImageToSupabase(threeQuarterImageUrl, 'three_quarter_view', finalPrompts.threeQuarterView, '3:4');
      }

      setProgress('All images generated and saved successfully!');
      setTimeout(() => setProgress(''), 3000);
    } catch (error) {
      console.error('Error generating images:', error);
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
      setError('Failed to download image. Please try again.');
    }
  };

  const openModal = (url: string, title: string, filename: string) => {
    setSelectedImage({ url, title, fileName: filename });
    setModalOpen(true);
  };

  const openEditModal = (url: string, title: string, aspectRatio: "9:16" | "16:9" | "3:4" | "1:1") => {
    setImageToEdit({ url, title, aspectRatio });
    setIsEditModalOpen(true);
  };

  const handleImageEdited = (editedImageUrl: string) => {
    console.log('Image edited successfully:', editedImageUrl);
  };

  const imageTypes = [
    { 
      key: 'frontView', 
      title: 'Front View (9:16)', 
      filename: 'pop-stand-front-view.png', 
      aspectRatio: '9:16' as const 
    },
    { 
      key: 'storeView', 
      title: 'Store View (16:9)', 
      filename: 'pop-stand-store-view.png', 
      aspectRatio: '16:9' as const 
    },
    { 
      key: 'threeQuarterView', 
      title: '3/4 View (3:4)', 
      filename: 'pop-stand-three-quarter-view.png', 
      aspectRatio: '3:4' as const 
    }
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 sm:p-6 mt-6 sm:mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
          <Wand2 className="w-5 h-5 mr-2" />
          {enhancedPrompts ? 'Enhanced AI Image Generation' : 'AI Image Generation'}
        </h3>

        <Button
          onClick={generateImages}
          disabled={isGenerating || !isFormValid}
          loading={isGenerating}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Wand2 className="w-5 h-5 mr-2" />
          Generate Images
        </Button>
      </div>

      {enhancedPrompts && (
        <div className="mb-4">
          <Alert type="info">
            🚀 Using AI-enhanced prompts for superior image quality!
          </Alert>
        </div>
      )}

      {progress && (
        <div className="mb-4">
          <Alert type="info">
            {progress}
          </Alert>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <Alert type="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      {isGenerating && (
        <div className="mb-6">
          <LoadingSpinner size="lg" text="Generating your POP stand images..." />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {imageTypes.map(({ key, title, filename, aspectRatio }) => {
          const imageUrl = generatedImages[key as keyof GeneratedImageSet];

          return (
            <div key={key}>
              {imageUrl ? (
                <ImagePreview
                  imageUrl={imageUrl}
                  title={title}
                  aspectRatio={aspectRatio}
                  onView={() => openModal(imageUrl, title, filename)}
                  onEdit={() => openEditModal(imageUrl, title, aspectRatio)}
                  onDownload={() => downloadImage(imageUrl, filename)}
                />
              ) : (
                <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
                  <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                    {title}
                  </h4>
                  <div className="relative aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3 overflow-hidden">
                    <div className="text-gray-400 text-center p-4">
                      <Wand2 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                      <p className="text-xs sm:text-sm">Image will appear here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isFormValid && (
        <div className="mt-4">
          <Alert type="warning">
            Please complete all required form fields to enable image generation.
          </Alert>
        </div>
      )}

      {/* Image Modal */}
      <ImageModal
        isOpen={modalOpen}
        imageUrl={selectedImage?.url || null}
        imageTitle={selectedImage?.title || ''}
        fileName={selectedImage?.fileName || 'pop-stand-image.png'}
        onClose={() => setModalOpen(false)}
      />

      {/* Image Edit Modal */}
      <ImageEditModal
        isOpen={isEditModalOpen}
        imageUrl={imageToEdit?.url || null}
        imageTitle={imageToEdit?.title || ''}
        aspectRatio={imageToEdit?.aspectRatio || '1:1'}
        projectId={currentProjectId}
        onClose={() => setIsEditModalOpen(false)}
        onImageEdited={handleImageEdited}
      />
    </div>
  );
};

export default EnhancedImageGeneration;
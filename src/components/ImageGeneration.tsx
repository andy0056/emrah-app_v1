import React, { useState } from 'react';
import { Wand2, Download, Loader2, AlertCircle, Maximize2, Edit } from 'lucide-react';
import { FalService, ImageGenerationRequest } from '../services/falService';
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
}

interface GeneratedImageSet {
  frontView?: string;
  storeView?: string;
  threeQuarterView?: string;
}

const ImageGeneration: React.FC<ImageGenerationProps> = ({ prompts, enhancedPrompts, isFormValid }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageSet>({});
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

  const generateImages = async () => {
    if (!isFormValid) {
      setError('Please fill out all required form fields before generating images.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImages({});
    
    try {
      // Use enhanced prompts if available, otherwise use base prompts
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
      setGeneratedImages(prev => ({ ...prev, frontView: frontResult.images[0]?.url }));

      setProgress('Generating store view...');
      const storeResult = await FalService.generateImage(requests[1]);
      setGeneratedImages(prev => ({ ...prev, storeView: storeResult.images[0]?.url }));

      setProgress('Generating 3/4 view...');
      const threeQuarterResult = await FalService.generateImage(requests[2]);
      setGeneratedImages(prev => ({ ...prev, threeQuarterView: threeQuarterResult.images[0]?.url }));

      setProgress('All images generated successfully!');
    } catch (error) {
      console.error('Error generating images:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate images. Please try again.');
    } finally {
      setIsGenerating(false);
      setProgress('');
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

  const imageTypes = [
    { key: 'frontView', title: 'Front View (9:16)', filename: 'pop-stand-front-view.png', aspectRatio: '9:16' as const },
    { key: 'storeView', title: 'Store View (16:9)', filename: 'pop-stand-store-view.png', aspectRatio: '16:9' as const },
    { key: 'threeQuarterView', title: '3/4 View (3:4)', filename: 'pop-stand-three-quarter-view.png', aspectRatio: '3:4' as const }
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Wand2 className="w-5 h-5 mr-2" />
          {enhancedPrompts ? 'Enhanced AI Image Generation' : 'AI Image Generation'}
        </h3>
        
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

      {enhancedPrompts && (
        <div className="mb-4 p-3 bg-purple-100 border border-purple-200 rounded-lg">
          <p className="text-purple-800 text-sm font-medium">🚀 Using AI-enhanced prompts for superior image quality!</p>
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
        onClose={closeEditModal}
      />
    </div>
  );
};

export default ImageGeneration;
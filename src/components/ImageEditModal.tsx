import React, { useState, useEffect } from 'react';
import { X, Edit, Loader2, Download, Save, CheckCircle, Palette, Image, Sparkles } from 'lucide-react';
import { FalService, FluxKontextRequest } from '../services/falService';
import { ProjectService } from '../services/projectService';

interface ImageEditModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  imageTitle: string;
  aspectRatio: "9:16" | "16:9" | "3:4" | "1:1";
  projectId?: string;
  formData?: {
    brandLogo?: string;
    productImage?: string;
    keyVisual?: string;
    brand?: string;
    product?: string;
  };
  onClose: () => void;
  onImageEdited?: (editedImageUrl: string) => void;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({
  isOpen,
  imageUrl,
  imageTitle,
  aspectRatio,
  projectId,
  formData,
  onClose,
  onImageEdited
}) => {
  const [editMode, setEditMode] = useState<'text' | 'assets'>('text');
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditMode('text');
      setEditPrompt('');
      setEditedImageUrl(null);
      setError(null);
      setIsSaving(false);
      setIsSaved(false);
    }
  }, [isOpen]);

  const hasUploadedAssets = formData && (
    formData.brandLogo || 
    formData.productImage || 
    formData.keyVisual
  );

  const handleApplyBrandAssets = async () => {
    if (!imageUrl || !hasUploadedAssets) {
      setError('No brand assets available to apply.');
      return;
    }

    console.log('🍌 Applying brand assets with Nano Banana Edit...');
    setIsEditing(true);
    setError(null);

    try {
      // Collect uploaded asset URLs
      const imageUrls = [imageUrl]; // Start with the generated stand image
      
      if (formData.brandLogo) imageUrls.push(formData.brandLogo);
      if (formData.productImage) imageUrls.push(formData.productImage);
      if (formData.keyVisual) imageUrls.push(formData.keyVisual);

      // Create smart prompt for asset integration
      const assetPrompt = `Apply the brand assets from the uploaded images to this display stand. Add any logos to appropriate header/branding areas and place the product items on the shelves. Maintain the original stand structure, dimensions, and layout. Use the visual elements from the provided brand images intelligently.`;

      console.log('📝 Asset integration prompt:', assetPrompt);
      console.log('🖼️ Using images:', imageUrls);

      const result = await FalService.applyBrandAssetsWithNanaBanana({
        image_urls: imageUrls,
        prompt: assetPrompt
      });

      if (result.images && result.images.length > 0) {
        setEditedImageUrl(result.images[0].url);
        console.log('✅ Brand assets applied successfully');
        console.log('📝 AI Description:', result.description);
        if (onImageEdited) {
          onImageEdited(result.images[0].url);
        }
      } else {
        setError('No edited image was generated. Please try again.');
      }
    } catch (error) {
      console.error('Error applying brand assets:', error);
      
      let errorMessage = 'Failed to apply brand assets. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('uploads\' bucket doesn\'t exist')) {
          errorMessage = '⚠️ Supabase Storage Error: The \'uploads\' bucket doesn\'t exist in your Supabase project.\n\nTo fix this:\n1. Go to your Supabase project dashboard\n2. Navigate to Storage\n3. Create a new bucket named \'uploads\'\n4. Make sure it\'s publicly accessible\n\nThen try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsEditing(false);
    }
  };

  const handleEditImage = async () => {
    if (!imageUrl || !editPrompt.trim()) {
      setError('Please provide an edit prompt.');
      return;
    }

    console.log('Starting image edit with:', {
      originalImageUrl: imageUrl,
      editPrompt: editPrompt,
      aspectRatio: aspectRatio
    });

    setIsEditing(true);
    setError(null);

    try {
      const request: FluxKontextRequest = {
        prompt: editPrompt,
        image_url: imageUrl,
        aspect_ratio: aspectRatio,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: "jpeg",
        safety_tolerance: "2"
      };

      const result = await FalService.editImageWithFluxKontext(request);
      
      if (result.images && result.images.length > 0) {
        setEditedImageUrl(result.images[0].url);
        if (onImageEdited) {
          onImageEdited(result.images[0].url);
        }
      } else {
        setError('No edited image was generated. Please try again.');
      }
    } catch (error) {
      console.error('Error editing image:', error);
      setError(error instanceof Error ? error.message : 'Failed to edit image. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const saveEditedImage = async () => {
    if (!editedImageUrl || !imageUrl || !projectId || !editPrompt.trim()) {
      setError('Cannot save: missing required data');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await ProjectService.saveEditedImage(
        projectId,
        imageUrl,
        editedImageUrl,
        editPrompt
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000); // Reset after 3 seconds
    } catch (error) {
      console.error('Error saving edited image:', error);
      setError(error instanceof Error ? error.message : 'Failed to save edited image');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      setError(null);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
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

  if (!isOpen || !imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative max-w-6xl max-h-[95vh] mx-4 bg-white rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Edit className="w-5 h-5 mr-2" />
            Edit {imageTitle}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {/* Edit Mode Selector */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 bg-gray-50 p-1 rounded-lg">
              <button
                onClick={() => setEditMode('text')}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-all ${
                  editMode === 'text' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Edit className="w-4 h-4 mr-2" />
                Text Edit
              </button>
              <button
                onClick={() => setEditMode('assets')}
                disabled={!hasUploadedAssets}
                className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md transition-all ${
                  editMode === 'assets' 
                    ? 'bg-white text-purple-700 shadow-sm' 
                    : hasUploadedAssets 
                      ? 'text-gray-600 hover:text-gray-800' 
                      : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Apply Brand Assets
                {!hasUploadedAssets && (
                  <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">No assets</span>
                )}
              </button>
            </div>
          </div>

          {/* Images Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Original Image */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Original Image</h4>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Original"
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>

            {/* Edited Image */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Edited Result</h4>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden h-64 flex items-center justify-center group">
                {isEditing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
                    <p className="text-sm text-gray-600">
                      {editMode === 'assets' ? 'Applying brand assets...' : 'Editing image...'}
                    </p>
                  </div>
                ) : editedImageUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={editedImageUrl}
                      alt="Edited"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                      {projectId && (
                        <button
                          onClick={saveEditedImage}
                          disabled={isSaving || isSaved}
                          className={`p-2 rounded-full shadow-md transition-all ${
                            isSaved 
                              ? 'bg-green-500 text-white' 
                              : 'bg-white bg-opacity-90 text-gray-700 hover:bg-opacity-100'
                          }`}
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isSaved ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => downloadImage(editedImageUrl, `edited-${imageTitle.toLowerCase().replace(/\s+/g, '-')}.jpg`)}
                        className="p-2 bg-white bg-opacity-90 rounded-full shadow-md hover:bg-opacity-100 transition-all"
                      >
                        <Download className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center">
                    <Edit className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Edited image will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Brand Assets Preview (when in assets mode) */}
          {editMode === 'assets' && hasUploadedAssets && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Image className="w-4 h-4 mr-2" />
                Available Brand Assets
              </h4>
              <div className="grid grid-cols-3 gap-4">
                {formData.brandLogo && (
                  <div className="text-center">
                    <img src={formData.brandLogo} alt="Brand Logo" className="w-16 h-16 object-cover mx-auto rounded-md mb-2" />
                    <p className="text-xs text-gray-600">Brand Logo</p>
                  </div>
                )}
                {formData.productImage && (
                  <div className="text-center">
                    <img src={formData.productImage} alt="Product" className="w-16 h-16 object-cover mx-auto rounded-md mb-2" />
                    <p className="text-xs text-gray-600">Product Image</p>
                  </div>
                )}
                {formData.keyVisual && (
                  <div className="text-center">
                    <img src={formData.keyVisual} alt="Key Visual" className="w-16 h-16 object-cover mx-auto rounded-md mb-2" />
                    <p className="text-xs text-gray-600">Key Visual</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit Controls */}
          <div className="space-y-4">
            {editMode === 'text' && (
              <div>
                <label htmlFor="editPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Edit Prompt *
                </label>
                <textarea
                  id="editPrompt"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Describe how you want to modify the image (e.g., 'add a neon sign', 'change background to forest', 'make it look futuristic')"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            )}

            {editMode === 'assets' && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Brand Asset Integration
                </h5>
                <p className="text-sm text-gray-600 mb-3">
                  This will apply your uploaded brand assets (logo, product images, key visual) to the display stand using AI. 
                  The process will intelligently integrate your branding while maintaining the stand structure.
                </p>
                {!hasUploadedAssets && (
                  <p className="text-sm text-orange-600">
                    ⚠️ No brand assets uploaded. Please upload images in the main form first.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            {isSaved && (
              <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm font-medium">✅ Edited image saved to project successfully!</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                {editMode === 'text' 
                  ? 'Using Flux Kontext Max model for text-based editing'
                  : 'Using Nano Banana Edit model for brand asset integration'
                }
              </div>
              
              <div className="flex space-x-2">
                {editMode === 'text' ? (
                  <button
                    onClick={handleEditImage}
                    disabled={isEditing || !editPrompt.trim()}
                    className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all ${
                      isEditing || !editPrompt.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Editing...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Image
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleApplyBrandAssets}
                    disabled={isEditing || !hasUploadedAssets}
                    className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all ${
                      isEditing || !hasUploadedAssets
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isEditing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying Assets...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Apply Brand Assets
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditModal;
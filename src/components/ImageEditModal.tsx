import React, { useState, useEffect } from 'react';
import { X, Edit, Loader2, Download } from 'lucide-react';
import { FalService, FluxKontextRequest } from '../services/falService';

interface ImageEditModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  imageTitle: string;
  aspectRatio: "9:16" | "16:9" | "3:4" | "1:1";
  onClose: () => void;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({
  isOpen,
  imageUrl,
  imageTitle,
  aspectRatio,
  onClose
}) => {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setEditPrompt('');
      setEditedImageUrl(null);
      setError(null);
    }
  }, [isOpen]);

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
              <div className="relative bg-gray-100 rounded-lg overflow-hidden h-64 flex items-center justify-center">
                {isEditing ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
                    <p className="text-sm text-gray-600">Editing image...</p>
                  </div>
                ) : editedImageUrl ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={editedImageUrl}
                      alt="Edited"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

          {/* Edit Controls */}
          <div className="space-y-4">
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

            {error && (
              <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Using Flux Kontext Max model for professional image editing
              </div>
              
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditModal;
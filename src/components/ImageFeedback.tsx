import React, { useState, useEffect } from 'react';
import { FeedbackService, ImageFeedback as IImageFeedback } from '../services/feedbackService';

interface ImageFeedbackProps {
  imageUrl: string;
  imageType: 'frontView' | 'storeView' | 'threeQuarterView';
  model: 'seedream-v4' | 'nano-banana';
  promptVersion: string;
  promptUsed: string;
  formData: any;
  projectId: string;
  userId: string;
  generationTime: number;
  onFeedbackSubmitted?: (feedback: IImageFeedback) => void;
}

const ImageFeedback: React.FC<ImageFeedbackProps> = ({
  imageUrl,
  imageType,
  model,
  promptVersion,
  promptUsed,
  formData,
  projectId,
  userId,
  generationTime,
  onFeedbackSubmitted
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [feedback, setFeedback] = useState<'loved' | 'liked' | 'neutral' | 'disliked' | 'rejected'>('loved');
  const [comments, setComments] = useState('');

  // Detailed ratings
  const [brandIntegration, setBrandIntegration] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [promptAdherence, setPromptAdherence] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [visualQuality, setVisualQuality] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [realismAccuracy, setRealismAccuracy] = useState<1 | 2 | 3 | 4 | 5>(5);

  const [existingFeedback, setExistingFeedback] = useState<IImageFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if feedback already exists for this image
    const existing = FeedbackService.getFeedbackForImage(imageUrl);
    if (existing) {
      setExistingFeedback(existing);
      setRating(existing.rating);
      setFeedback(existing.feedback);
      setComments(existing.comments || '');
      setBrandIntegration(existing.brandIntegration);
      setPromptAdherence(existing.promptAdherence);
      setVisualQuality(existing.visualQuality);
      setRealismAccuracy(existing.realismAccuracy);
    }
  }, [imageUrl]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const feedbackData = {
        imageUrl,
        imageType,
        model,
        promptVersion,
        rating,
        feedback,
        comments: comments.trim() || undefined,
        projectId,
        userId,
        brandIntegration,
        promptAdherence,
        visualQuality,
        realismAccuracy,
        formData,
        promptUsed,
        generationTime
      };

      const feedbackId = await FeedbackService.recordFeedback(feedbackData);

      const submittedFeedback: IImageFeedback = {
        ...feedbackData,
        id: feedbackId,
        timestamp: new Date().toISOString()
      };

      setExistingFeedback(submittedFeedback);
      setIsOpen(false);

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(submittedFeedback);
      }

      console.log('✅ Feedback submitted successfully');
    } catch (error) {
      console.error('❌ Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackColor = (feedbackType: string) => {
    switch (feedbackType) {
      case 'loved': return 'text-green-600';
      case 'liked': return 'text-blue-600';
      case 'neutral': return 'text-gray-600';
      case 'disliked': return 'text-orange-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getModelBadgeColor = (modelName: string) => {
    return modelName === 'seedream-v4' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800';
  };

  const StarRating: React.FC<{
    value: 1 | 2 | 3 | 4 | 5;
    onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
    label: string;
  }> = ({ value, onChange, label }) => (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 w-24">{label}:</span>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star as 1 | 2 | 3 | 4 | 5)}
            className={`w-6 h-6 ${
              star <= value ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400 transition-colors`}
          >
            ★
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-500">({value}/5)</span>
    </div>
  );

  return (
    <div className="relative">
      {/* Feedback Button/Status */}
      <div className="absolute top-2 right-2 z-10">
        {existingFeedback ? (
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getModelBadgeColor(model)}`}>
              {model === 'seedream-v4' ? 'SeedReam v4' : 'Nano Banana'}
            </span>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium bg-white shadow-sm cursor-pointer ${getFeedbackColor(existingFeedback.feedback)}`}
              onClick={() => setIsOpen(true)}
              title="Click to update feedback"
            >
              ★ {existingFeedback.rating}/5 • {existingFeedback.feedback}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 transition-colors shadow-sm"
          >
            Rate this image
          </button>
        )}
      </div>

      {/* Feedback Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Rate This Image</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Model and Image Type Info */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className={`px-2 py-1 rounded ${getModelBadgeColor(model)}`}>
                  {model === 'seedream-v4' ? 'SeedReam v4' : 'Nano Banana'}
                </span>
                <span>•</span>
                <span className="capitalize">{imageType.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span>•</span>
                <span>{(generationTime / 1000).toFixed(1)}s</span>
              </div>

              {/* Overall Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star as 1 | 2 | 3 | 4 | 5)}
                      className={`w-8 h-8 ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors text-lg`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Reaction
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['loved', 'liked', 'neutral', 'disliked', 'rejected'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFeedback(type)}
                      className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                        feedback === type
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Ratings */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Detailed Feedback</h4>
                <StarRating
                  value={brandIntegration}
                  onChange={setBrandIntegration}
                  label="Brand Integration"
                />
                <StarRating
                  value={promptAdherence}
                  onChange={setPromptAdherence}
                  label="Prompt Following"
                />
                <StarRating
                  value={visualQuality}
                  onChange={setVisualQuality}
                  label="Visual Quality"
                />
                <StarRating
                  value={realismAccuracy}
                  onChange={setRealismAccuracy}
                  label="Realism"
                />
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (Optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="What worked well? What could be improved?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : existingFeedback ? 'Update' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageFeedback;
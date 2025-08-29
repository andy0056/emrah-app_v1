import React from 'react';
import { Download, Maximize2, Edit, X } from 'lucide-react';
import Button from '../atoms/Button';

interface ImagePreviewProps {
  imageUrl: string;
  title: string;
  aspectRatio: string;
  onView: () => void;
  onEdit: () => void;
  onDownload: () => void;
  showEditButton?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrl,
  title,
  aspectRatio,
  onView,
  onEdit,
  onDownload,
  showEditButton = true
}) => {
  return (
    <div className="bg-white rounded-lg p-3 sm:p-4 shadow-md">
      <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
        {title}
      </h4>
      
      <div className="relative aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-2 sm:mb-3 overflow-hidden group">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform hover:scale-105"
          onClick={onView}
        />
        <div 
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
          onClick={onView}
        >
          <div className="bg-white bg-opacity-90 rounded-full p-2">
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 sm:gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onDownload}
          className="text-xs sm:text-sm"
        >
          <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          <span className="hidden sm:inline">Download</span>
        </Button>
        {showEditButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-purple-700 hover:bg-purple-100 text-xs sm:text-sm"
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ImagePreview;
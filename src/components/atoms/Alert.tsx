import React, { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({
  type,
  title,
  children,
  onClose
}) => {
  const config = {
    success: {
      icon: CheckCircle,
      containerClass: 'bg-green-100 border-green-200',
      iconClass: 'text-green-600',
      titleClass: 'text-green-800',
      textClass: 'text-green-800'
    },
    error: {
      icon: XCircle,
      containerClass: 'bg-red-100 border-red-200',
      iconClass: 'text-red-600',
      titleClass: 'text-red-800',
      textClass: 'text-red-800'
    },
    warning: {
      icon: AlertCircle,
      containerClass: 'bg-yellow-100 border-yellow-200',
      iconClass: 'text-yellow-600',
      titleClass: 'text-yellow-800',
      textClass: 'text-yellow-800'
    },
    info: {
      icon: Info,
      containerClass: 'bg-blue-100 border-blue-200',
      iconClass: 'text-blue-600',
      titleClass: 'text-blue-800',
      textClass: 'text-blue-800'
    }
  };

  const { icon: Icon, containerClass, iconClass, titleClass, textClass } = config[type];

  return (
    <div className={`p-3 sm:p-4 border rounded-lg flex items-start ${containerClass}`}>
      <Icon className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${iconClass}`} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={`font-medium text-sm sm:text-base ${titleClass} mb-1`}>
            {title}
          </h4>
        )}
        <div className={`text-sm ${textClass}`}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`ml-3 flex-shrink-0 ${iconClass} hover:opacity-75`}
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
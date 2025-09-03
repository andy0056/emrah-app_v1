import React from 'react';
import { Toaster as SonnerToaster, toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info, Sparkles } from 'lucide-react';

// Enhanced toast functions with psychological design
export const showToast = {
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <CheckCircle className="w-5 h-5" />,
      className: 'border-green-200 bg-green-50',
    });
  },
  
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
      icon: <XCircle className="w-5 h-5" />,
      className: 'border-red-200 bg-red-50',
    });
  },
  
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
      icon: <AlertCircle className="w-5 h-5" />,
      className: 'border-yellow-200 bg-yellow-50',
    });
  },
  
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
      icon: <Info className="w-5 h-5" />,
      className: 'border-blue-200 bg-blue-50',
    });
  },
  
  magic: (message: string, description?: string) => {
    toast.success(message, {
      description,
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      className: 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50',
    });
  }
};

// Toast provider component
const ToastProvider: React.FC = () => {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: 'rounded-xl shadow-lg border backdrop-blur-sm',
        style: {
          fontFamily: 'inherit',
        },
      }}
      theme="light"
      richColors
    />
  );
};

export default ToastProvider;
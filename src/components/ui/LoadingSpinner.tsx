import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'magic' | 'ai';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  text,
  className = ''
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const DefaultSpinner = () => (
    <motion.div
      className={`${sizes[size]} border-2 border-purple-200 border-t-purple-600 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );

  const DotsSpinner = () => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-5 h-5'} bg-purple-600 rounded-full`}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [1, 0.6, 1] 
          }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity, 
            delay: i * 0.2 
          }}
        />
      ))}
    </div>
  );

  const PulseSpinner = () => (
    <motion.div
      className={`${sizes[size]} bg-gradient-to-r from-purple-600 to-pink-600 rounded-full`}
      animate={{ 
        scale: [1, 1.3, 1],
        opacity: [1, 0.7, 1] 
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );

  const MagicSpinner = () => (
    <motion.div
      className="relative"
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    >
      <Sparkles className={`${sizes[size]} text-purple-600`} />
      <motion.div
        className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full"
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );

  const AISpinner = () => (
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Wand2 className={`${sizes[size]} text-purple-600`} />
      </motion.div>
      <motion.div
        className="absolute -inset-2 border-2 border-purple-300 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <Zap className="absolute -top-2 -right-2 w-3 h-3 text-yellow-500" />
    </div>
  );

  const renderSpinner = () => {
    switch (variant) {
      case 'dots': return <DotsSpinner />;
      case 'pulse': return <PulseSpinner />;
      case 'magic': return <MagicSpinner />;
      case 'ai': return <AISpinner />;
      default: return <DefaultSpinner />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {renderSpinner()}
      {text && (
        <motion.p
          className={`${textSizes[size]} text-gray-600 font-medium text-center`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;
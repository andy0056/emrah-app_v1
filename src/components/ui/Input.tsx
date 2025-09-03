import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  variant?: 'default' | 'minimal' | 'filled';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  icon,
  suffix,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'w-full px-4 py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50';
  
  const variants = {
    default: 'bg-white border border-gray-200 focus:border-purple-500 focus:ring-purple-500',
    minimal: 'bg-transparent border-b-2 border-gray-200 rounded-none focus:border-purple-500 focus:ring-0 px-0 py-2',
    filled: 'bg-gray-50 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-purple-500'
  };

  const getInputState = () => {
    if (error) return 'border-red-500 focus:border-red-500 focus:ring-red-500';
    if (success) return 'border-green-500 focus:border-green-500 focus:ring-green-500';
    return '';
  };

  return (
    <div className="space-y-2">
      {label && (
        <motion.label
          className="block text-sm font-medium text-gray-700"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {label}
        </motion.label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <motion.input
          ref={ref}
          className={`
            ${baseStyles}
            ${variants[variant]}
            ${getInputState()}
            ${icon ? 'pl-11' : ''}
            ${suffix ? 'pr-11' : ''}
            ${className}
          `}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />
        
        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {suffix}
          </div>
        )}
      </div>
      
      {(error || success) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`text-sm ${error ? 'text-red-600' : 'text-green-600'}`}
        >
          {error || success}
        </motion.div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
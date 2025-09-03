import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  glass = false,
  gradient = false,
  onClick
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-300';
  
  const getCardStyles = () => {
    if (glass) {
      return 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl';
    }
    if (gradient) {
      return 'bg-gradient-to-br from-purple-50 via-white to-pink-50 border border-purple-100/50 shadow-lg';
    }
    return 'bg-white border border-gray-200 shadow-sm';
  };

  const hoverStyles = hover ? 'hover:shadow-2xl hover:-translate-y-1 hover:border-purple-300/50' : '';

  return (
    <motion.div
      className={`
        ${baseStyles}
        ${getCardStyles()}
        ${hoverStyles}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      whileHover={hover ? { 
        y: -4,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      } : undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

export default Card;
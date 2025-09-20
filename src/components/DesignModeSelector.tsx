import React from 'react';
import { Factory, Sparkles, Rocket, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export type DesignMode = 'production' | 'concept' | 'hybrid';

interface DesignModeSelectorProps {
  mode: DesignMode;
  onModeChange: (mode: DesignMode) => void;
  disabled?: boolean;
  className?: string;
}

export const DesignModeSelector: React.FC<DesignModeSelectorProps> = ({
  mode,
  onModeChange,
  disabled = false,
  className = ""
}) => {
  const modes = [
    {
      id: 'production' as DesignMode,
      title: 'Production-Ready',
      subtitle: 'Manufacturable designs for immediate production',
      icon: Factory,
      color: 'blue',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
      features: [
        'Standard manufacturing methods',
        'Real-world references',
        'Cost-optimized materials',
        'Factory specifications'
      ]
    },
    {
      id: 'concept' as DesignMode,
      title: 'Concept Design',
      subtitle: 'Creative explorations and innovative visions',
      icon: Sparkles,
      color: 'purple',
      bgColor: 'bg-purple-500',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50',
      features: [
        'Artistic innovation',
        'Future-forward concepts',
        'Brand storytelling',
        'Unlimited creativity'
      ]
    },
    {
      id: 'hybrid' as DesignMode,
      title: 'Hybrid Approach',
      subtitle: 'Manufacturable with creative elements',
      icon: Rocket,
      color: 'green',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-500',
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
      features: [
        'Practical base design',
        'Creative accents',
        'Balanced innovation',
        'Scalable production'
      ]
    }
  ];

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 mb-8 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <span className="mr-2">🎯</span>
        Select Design Approach
      </h3>

      <div className="grid md:grid-cols-3 gap-4">
        {modes.map((modeOption) => (
          <motion.button
            key={modeOption.id}
            onClick={() => !disabled && onModeChange(modeOption.id)}
            disabled={disabled}
            className={`relative p-6 rounded-lg border-2 transition-all text-left ${
              mode === modeOption.id
                ? `${modeOption.borderColor} ${modeOption.bgLight} shadow-md`
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            {mode === modeOption.id && (
              <motion.div
                className={`absolute -top-2 -right-2 ${modeOption.bgColor} text-white
                           rounded-full p-1`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Check className="w-4 h-4" />
              </motion.div>
            )}

            <modeOption.icon className={`w-8 h-8 mb-3 ${
              mode === modeOption.id ? modeOption.textColor : 'text-gray-400'
            }`} />

            <h4 className="font-semibold mb-1">{modeOption.title}</h4>
            <p className="text-xs text-gray-600 mb-3">{modeOption.subtitle}</p>

            <ul className="text-xs text-left space-y-1">
              {modeOption.features.map(feature => (
                <li key={feature} className="flex items-start">
                  <span className="text-green-500 mr-1 mt-0.5">✓</span>
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </motion.button>
        ))}
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          💡 <strong>Empati Brand Alignment:</strong> All designs are automatically aligned with your
          minimalist-modern aesthetic, professional blue accents (#4E5AC3), and clean geometric principles.
          Choose your creativity level while maintaining brand consistency.
        </p>
      </div>

      {/* Mode-specific info panels */}
      {mode === 'production' && (
        <motion.div
          className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Factory className="w-4 h-4 mr-2" />
            Production Mode Active
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✓ Designs validated for immediate manufacturability</li>
            <li>✓ Empati's grid-based modular design principles</li>
            <li>✓ Professional finishes with clean geometric lines</li>
            <li>✓ Cost-optimized with standard fabrication methods</li>
          </ul>
        </motion.div>
      )}

      {mode === 'concept' && (
        <motion.div
          className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
            <Sparkles className="w-4 h-4 mr-2" />
            Concept Mode Active
          </h4>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>✨ Creative exploration within Empati's design language</li>
            <li>✨ Advanced materials maintaining professional aesthetic</li>
            <li>✨ Future-forward concepts with brand consistency</li>
            <li>✨ Premium presentations and client pitches</li>
          </ul>
        </motion.div>
      )}

      {mode === 'hybrid' && (
        <motion.div
          className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <h4 className="font-semibold text-green-900 mb-2 flex items-center">
            <Rocket className="w-4 h-4 mr-2" />
            Hybrid Mode Active
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>🎯 Production-ready base with Empati signature touches</li>
            <li>🎯 Smart LED integration with brand color themes</li>
            <li>🎯 Premium material accents within budget constraints</li>
            <li>🎯 Scalable creativity maintaining manufacturing efficiency</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};
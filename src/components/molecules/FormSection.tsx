import React, { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  icon?: ReactNode;
  bgColor?: string;
  children: ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  icon,
  bgColor = 'bg-gray-50',
  children
}) => {
  return (
    <div className={`${bgColor} rounded-lg p-4 sm:p-6`}>
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </h3>
      {children}
    </div>
  );
};

export default FormSection;
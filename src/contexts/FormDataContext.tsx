import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FormData } from '../types';

// Create default form data
const defaultFormData: Partial<FormData> = {
  standWidth: 15,
  standDepth: 30,
  standHeight: 30,
  productWidth: 13,
  productDepth: 2.5,
  productHeight: 5,
  frontFaceCount: 1,
  backToBackCount: 12,
  shelfCount: 1,
  shelfWidth: 15,
  shelfDepth: 30,
  brand: 'Ülker',
  product: 'Çikolatalı Gofret',
  standType: 'Tabletop Stand',
  materials: ['Plastic'],
  standBaseColor: '#ffffff'
};

interface FormDataContextType {
  formData: Partial<FormData>;
  updateFormData: (data: Partial<FormData>) => void;
  resetFormData: () => void;
}

const FormDataContext = createContext<FormDataContextType | undefined>(undefined);

export const useFormData = (): FormDataContextType => {
  const context = useContext(FormDataContext);
  if (!context) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return context;
};

interface FormDataProviderProps {
  children: ReactNode;
}

export const FormDataProvider: React.FC<FormDataProviderProps> = ({ children }) => {
  const [formData, setFormData] = useState<Partial<FormData>>(defaultFormData);

  const updateFormData = (newData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };

  const resetFormData = () => {
    setFormData(defaultFormData);
  };

  return (
    <FormDataContext.Provider value={{ formData, updateFormData, resetFormData }}>
      {children}
    </FormDataContext.Provider>
  );
};
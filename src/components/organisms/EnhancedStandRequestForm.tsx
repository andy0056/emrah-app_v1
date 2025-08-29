import React, { useState, useEffect } from 'react';
import { Send, Calendar, Palette, Package, Ruler, FileText, Upload } from 'lucide-react';
import { usePrompt } from '../../hooks/usePrompt';
import { useProject } from '../../hooks/useProject';
import FormSection from '../molecules/FormSection';
import Input from '../atoms/Input';
import TextArea from '../atoms/TextArea';
import FileUpload from '../atoms/FileUpload';
import Button from '../atoms/Button';
import Alert from '../atoms/Alert';
import LoadingSpinner from '../atoms/LoadingSpinner';

interface FormData {
  submissionId: string;
  respondentId: string;
  submittedAt: string;
  brand: string;
  brandLogo: File | string | null;
  product: string;
  productImage: File | string | null;
  productWidth: number;
  productDepth: number;
  productHeight: number;
  frontFaceCount: number;
  backToBackCount: number;
  keyVisual: File | string | null;
  exampleStands: File[] | string[];
  standType: string;
  materials: string[];
  standBaseColor: string;
  standWidth: number;
  standDepth: number;
  standHeight: number;
  shelfWidth: number;
  shelfDepth: number;
  shelfCount: number;
  description: string;
}

const STAND_TYPES = [
  'Ayaklı Stant (Floor Stand)',
  'Masa Üstü Stant (Tabletop Stand)',
  'Duvar Stantı (Wall Mount Stand)',
  'Köşe Stantı (Corner Stand)',
  'Dönen Stant (Rotating Stand)',
  'Çok Katlı Stant (Multi-tier Stand)'
];

const MATERIALS = [
  'Metal',
  'Ahşap (Wood)',
  'Plastik (Plastic)',
  'Cam (Glass)',
  'Karton (Cardboard)',
  'Akrilik (Acrylic)',
  'MDF',
  'Alüminyum (Aluminum)'
];

interface EnhancedStandRequestFormProps {
  onFormDataChange: (formData: FormData, isValid: boolean) => void;
  onPromptsChange: (basePrompts: any, enhancedPrompts: any) => void;
  initialData?: FormData;
}

const EnhancedStandRequestForm: React.FC<EnhancedStandRequestFormProps> = ({
  onFormDataChange,
  onPromptsChange,
  initialData
}) => {
  const { basePrompts, enhancedPrompts, generatePrompts } = usePrompt();
  const [formData, setFormData] = useState<FormData>(initialData || {
    submissionId: '',
    respondentId: '',
    submittedAt: '',
    brand: 'Coca-Cola',
    brandLogo: null,
    product: 'Coca-Cola 1 litre',
    productImage: null,
    productWidth: 8.5,
    productDepth: 8.5,
    productHeight: 27,
    frontFaceCount: 4,
    backToBackCount: 3,
    keyVisual: null,
    exampleStands: [],
    standType: 'Ayaklı Stant (Floor Stand)',
    materials: ['Metal', 'Ahşap (Wood)'],
    standBaseColor: '#ffffff',
    standWidth: 40,
    standDepth: 30,
    standHeight: 160,
    shelfWidth: 35,
    shelfDepth: 28,
    shelfCount: 1,
    description: '1 litre Coca-Cola ürünümüz için ilgi çekici, standardın dışında, yenilikçi bir FSU tasarımı istiyoruz. 300 adet üretme hedefimiz var. Işıklı ve ışıksız versiyonlarını alternatifli olarak çalışın lütfen.'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Initialize submission data
  useEffect(() => {
    if (!initialData) {
      const generateSubmissionId = () => 'rj6kgVv';
      setFormData(prev => ({
        ...prev,
        submissionId: generateSubmissionId(),
        submittedAt: '2025-01-20T05:53',
        respondentId: 'PqM601'
      }));
    }
  }, [initialData]);

  // Generate prompts when form data changes
  useEffect(() => {
    if (formData.brand && formData.product && formData.standType) {
      generatePrompts(formData);
    }
  }, [formData, generatePrompts]);

  // Update parent component with prompts
  useEffect(() => {
    onPromptsChange(basePrompts, enhancedPrompts);
  }, [basePrompts, enhancedPrompts, onPromptsChange]);

  // Validate form
  useEffect(() => {
    const requiredFields = ['respondentId', 'brand', 'product', 'standType', 'description'];
    const numericFields = [
      'productWidth', 'productDepth', 'productHeight',
      'frontFaceCount', 'backToBackCount',
      'standWidth', 'standDepth', 'standHeight',
      'shelfWidth', 'shelfDepth', 'shelfCount'
    ];

    const hasRequiredFields = requiredFields.every(field => formData[field as keyof FormData]);
    const hasValidNumbers = numericFields.every(field => (formData[field as keyof FormData] as number) > 0);
    const hasMaterials = formData.materials.length > 0;

    const valid = hasRequiredFields && hasValidNumbers && hasMaterials;
    setIsFormValid(valid);
    onFormDataChange(formData, valid);
  }, [formData, onFormDataChange]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (field: keyof FormData, files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (field === 'exampleStands') {
      const validFiles = Array.from(files).filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
        return isValidType && isValidSize;
      });

      if (validFiles.length !== files.length) {
        setErrors(prev => ({ ...prev, [field]: 'Some files were invalid. Only images under 10MB are allowed.' }));
        return;
      }

      setFormData(prev => ({ ...prev, [field]: validFiles }));
    } else {
      const file = files[0];
      
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, [field]: 'Only image files are allowed.' }));
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, [field]: 'File size must be under 10MB.' }));
        return;
      }

      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleMaterialToggle = (material: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.includes(material)
        ? prev.materials.filter(m => m !== material)
        : [...prev.materials, material]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const requiredFields = ['respondentId', 'brand', 'product', 'standType', 'description'];

    requiredFields.forEach(field => {
      if (!formData[field as keyof FormData]) {
        newErrors[field] = 'This field is required';
      }
    });

    const numericFields = [
      'productWidth', 'productDepth', 'productHeight',
      'frontFaceCount', 'backToBackCount',
      'standWidth', 'standDepth', 'standHeight',
      'shelfWidth', 'shelfDepth', 'shelfCount'
    ];

    numericFields.forEach(field => {
      const value = formData[field as keyof FormData] as number;
      if (value <= 0) {
        newErrors[field] = 'Value must be greater than 0';
      }
    });

    if (formData.materials.length === 0) {
      newErrors.materials = 'Please select at least one material';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting form data:', formData);
      // Form submission logic would go here
      alert('Stand design request submitted successfully! Use the form below to generate AI-powered designs.');
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">
          POP Stand Design Request
        </h2>
        <p className="text-gray-600 text-sm sm:text-base">
          Fill out this comprehensive form to generate AI-powered 2D renderings of your POP display stand designs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {/* Basic Information */}
        <FormSection title="Basic Information" icon={<FileText className="w-5 h-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Input
              label="Submission ID (Başvuru Kimliği)"
              value={formData.submissionId}
              readOnly
              className="bg-gray-100 text-gray-600"
            />
            <Input
              label="Respondent ID (Yanıtlayan Kimliği) *"
              value={formData.respondentId}
              onChange={(e) => handleInputChange('respondentId', e.target.value)}
              error={errors.respondentId}
              placeholder="PqM601"
            />
            <Input
              label="Submitted at (Gönderim Zamanı)"
              type="datetime-local"
              value={formData.submittedAt}
              onChange={(e) => handleInputChange('submittedAt', e.target.value)}
            />
          </div>
        </FormSection>

        {/* Brand & Product Information */}
        <FormSection title="Brand & Product Information" icon={<Package className="w-5 h-5" />} bgColor="bg-blue-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Input
              label="Brand (Marka) *"
              value={formData.brand}
              onChange={(e) => handleInputChange('brand', e.target.value)}
              error={errors.brand}
              placeholder="Coca-Cola"
            />
            <FileUpload
              label="Marka Logosu (Brand Logo)"
              accept="image/png,image/jpeg,image/jpg"
              onChange={(files) => handleFileUpload('brandLogo', files)}
              error={errors.brandLogo}
            />
            <Input
              label="Ürün (Product) *"
              value={formData.product}
              onChange={(e) => handleInputChange('product', e.target.value)}
              error={errors.product}
              placeholder="Coca-Cola 1 litre"
            />
            <FileUpload
              label="Ürün Görseli (Product Image)"
              onChange={(files) => handleFileUpload('productImage', files)}
              error={errors.productImage}
            />
          </div>
        </FormSection>

        {/* Product Dimensions */}
        <FormSection title="Product Dimensions & Quantities" icon={<Ruler className="w-5 h-5" />} bgColor="bg-green-50">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Input
              label="Ürün Genişlik (cm) *"
              type="number"
              min="0.1"
              step="0.1"
              value={formData.productWidth || ''}
              onChange={(e) => handleInputChange('productWidth', parseFloat(e.target.value) || 0)}
              error={errors.productWidth}
              placeholder="8.5"
            />
            <Input
              label="Ürün Derinlik (cm) *"
              type="number"
              min="0.1"
              step="0.1"
              value={formData.productDepth || ''}
              onChange={(e) => handleInputChange('productDepth', parseFloat(e.target.value) || 0)}
              error={errors.productDepth}
              placeholder="8.5"
            />
            <Input
              label="Ürün Yükseklik (cm) *"
              type="number"
              min="0.1"
              step="0.1"
              value={formData.productHeight || ''}
              onChange={(e) => handleInputChange('productHeight', parseFloat(e.target.value) || 0)}
              error={errors.productHeight}
              placeholder="27"
            />
            <Input
              label="Ürün Ön Yüz Sayısı *"
              type="number"
              min="1"
              value={formData.frontFaceCount || ''}
              onChange={(e) => handleInputChange('frontFaceCount', parseInt(e.target.value) || 1)}
              error={errors.frontFaceCount}
              placeholder="4"
            />
            <Input
              label="Arka Arkaya Ürün Sayısı *"
              type="number"
              min="1"
              value={formData.backToBackCount || ''}
              onChange={(e) => handleInputChange('backToBackCount', parseInt(e.target.value) || 1)}
              error={errors.backToBackCount}
              placeholder="3"
            />
          </div>
        </FormSection>

        {/* Visual Assets */}
        <FormSection title="Visual Assets" icon={<Upload className="w-5 h-5" />} bgColor="bg-purple-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FileUpload
              label="Key Visual (Key Visual)"
              onChange={(files) => handleFileUpload('keyVisual', files)}
              error={errors.keyVisual}
            />
            <FileUpload
              label="Örnek Stantlar (Example Stands)"
              multiple
              onChange={(files) => handleFileUpload('exampleStands', files)}
              error={errors.exampleStands}
              helperText="You can upload multiple reference images"
            />
          </div>
        </FormSection>

        {/* Stand Specifications */}
        <FormSection title="Stand Specifications" icon={<Package className="w-5 h-5" />} bgColor="bg-orange-50">
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stand Type (Stant Tipi) *
                </label>
                <select
                  value={formData.standType}
                  onChange={(e) => handleInputChange('standType', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.standType ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select stand type</option>
                  {STAND_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.standType && <p className="text-red-500 text-sm mt-1">{errors.standType}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Standın Genel Rengi (Stand Base Color)
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.standBaseColor}
                    onChange={(e) => handleInputChange('standBaseColor', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <Input
                    value={formData.standBaseColor}
                    onChange={(e) => handleInputChange('standBaseColor', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Materials */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Malzeme (Material) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MATERIALS.map(material => (
                  <label key={material} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.materials.includes(material)}
                      onChange={() => handleMaterialToggle(material)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                    />
                    <span className="ml-2 text-sm text-gray-700">{material}</span>
                  </label>
                ))}
              </div>
              {errors.materials && <p className="text-red-500 text-sm mt-1">{errors.materials}</p>}
            </div>

            {/* Stand Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Stant Boyutları (Stand Dimensions)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Input
                  label="Stant Genişlik (cm) *"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.standWidth || ''}
                  onChange={(e) => handleInputChange('standWidth', parseFloat(e.target.value) || 0)}
                  error={errors.standWidth}
                  placeholder="40"
                />
                <Input
                  label="Stant Derinlik (cm) *"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.standDepth || ''}
                  onChange={(e) => handleInputChange('standDepth', parseFloat(e.target.value) || 0)}
                  error={errors.standDepth}
                  placeholder="30"
                />
                <Input
                  label="Stant Yükseklik (cm) *"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.standHeight || ''}
                  onChange={(e) => handleInputChange('standHeight', parseFloat(e.target.value) || 0)}
                  error={errors.standHeight}
                  placeholder="160"
                />
              </div>
            </div>

            {/* Shelf Specifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Raf Özellikleri (Shelf Specifications)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Input
                  label="Raf Genişlik (cm) *"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.shelfWidth || ''}
                  onChange={(e) => handleInputChange('shelfWidth', parseFloat(e.target.value) || 0)}
                  error={errors.shelfWidth}
                  placeholder="35"
                />
                <Input
                  label="Raf Derinlik (cm) *"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.shelfDepth || ''}
                  onChange={(e) => handleInputChange('shelfDepth', parseFloat(e.target.value) || 0)}
                  error={errors.shelfDepth}
                  placeholder="28"
                />
                <Input
                  label="Raf Sayısı (Shelf Count) *"
                  type="number"
                  min="1"
                  value={formData.shelfCount || ''}
                  onChange={(e) => handleInputChange('shelfCount', parseInt(e.target.value) || 1)}
                  error={errors.shelfCount}
                  placeholder="1"
                />
              </div>
            </div>
          </div>
        </FormSection>

        {/* Description */}
        <FormSection title="Additional Details" icon={<FileText className="w-5 h-5" />}>
          <TextArea
            label="Açıklama (Description) *"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            error={errors.description}
            placeholder="1 litre Coca-Cola ürünümüz için ilgi çekici, standardın dışında, yenilikçi bir FSU tasarımı istiyoruz. 300 adet üretme hedefimiz var. Işıklı ve ışıksız versiyonlarını alternatifli olarak çalışın lütfen."
          />
        </FormSection>

        {/* Submit Button */}
        <div className="flex justify-center pt-4 sm:pt-6">
          <Button
            type="submit"
            size="lg"
            loading={isSubmitting}
            disabled={!isFormValid}
            icon={<Send className="w-5 h-5" />}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Design Request'}
          </Button>
        </div>

        {!isFormValid && (
          <Alert type="warning">
            Please complete all required form fields to enable submission.
          </Alert>
        )}
      </form>
    </div>
  );
};

export default EnhancedStandRequestForm;
import React, { useState, useEffect } from 'react';
import { Upload, Calendar, Palette, Package, Ruler, FileText, Send } from 'lucide-react';
import { PromptGenerator } from '../utils/promptGenerator';
import PromptPreview from './PromptPreview';
import ImageGeneration from './ImageGeneration';
import ProjectManager from './ProjectManager';
import { SavedProject } from '../services/projectService';

interface FormData {
  submissionId: string;
  respondentId: string;
  submittedAt: string;
  brand: string;
  brandLogo: File | null;
  product: string;
  productImage: File | null;
  productWidth: number;
  productDepth: number;
  productHeight: number;
  frontFaceCount: number;
  backToBackCount: number;
  keyVisual: File | null;
  exampleStands: File[];
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

const StandRequestForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
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
  const [prompts, setPrompts] = useState({
    frontView: '',
    storeView: '',
    threeQuarterView: ''
  });
  const [enhancedPrompts, setEnhancedPrompts] = useState<{
    frontView: string;
    storeView: string;
    threeQuarterView: string;
  } | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  useEffect(() => {
    // Generate submission ID and set current timestamp
    const generateSubmissionId = () => {
      // Use example ID for testing, or generate new one
      return 'rj6kgVv';
    };

    setFormData(prev => ({
      ...prev,
      submissionId: generateSubmissionId(),
      submittedAt: '2025-01-20T05:53',
      respondentId: 'PqM601'
    }));
  }, []);

  // Update prompts whenever form data changes
  useEffect(() => {
    if (formData.brand && formData.product && formData.standType) {
      const generatedPrompts = PromptGenerator.generateAllPrompts(formData);
      setPrompts(generatedPrompts);
      // Reset enhanced prompts when base data changes
      setEnhancedPrompts(null);
    }
  }, [formData]);

  // Check form validity
  useEffect(() => {
    const requiredFields = [
      'respondentId', 'brand', 'product', 'standType', 'description'
    ];
    
    const numericFields = [
      'productWidth', 'productDepth', 'productHeight',
      'frontFaceCount', 'backToBackCount',
      'standWidth', 'standDepth', 'standHeight',
      'shelfWidth', 'shelfDepth', 'shelfCount'
    ];

    const hasRequiredFields = requiredFields.every(field => formData[field as keyof FormData]);
    const hasValidNumbers = numericFields.every(field => (formData[field as keyof FormData] as number) > 0);
    const hasMaterials = formData.materials.length > 0;

    setIsFormValid(hasRequiredFields && hasValidNumbers && hasMaterials);
  }, [formData]);

  const handleLoadProject = (project: SavedProject) => {
    setIsLoadingProject(true);
    
    try {
      // Load form data
      const loadedFormData = project.form_data;
      setFormData(loadedFormData);
      
      // Load prompts
      if (project.base_prompts) {
        setPrompts(project.base_prompts);
      }
      
      if (project.enhanced_prompts) {
        setEnhancedPrompts(project.enhanced_prompts);
      }
      
      // Set current project ID
      setCurrentProjectId(project.id);
      
    } catch (error) {
      console.error('Error loading project:', error);
      alert('Failed to load project data');
    } finally {
      setIsLoadingProject(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (field: keyof FormData, files: FileList | null) => {
    if (!files) return;

    if (field === 'exampleStands') {
      setFormData(prev => ({ 
        ...prev, 
        [field]: Array.from(files)
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [field]: files[0] || null
      }));
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

    // Required fields validation
    const requiredFields = [
      'respondentId', 'brand', 'product', 'standType', 'description'
    ];

    requiredFields.forEach(field => {
      if (!formData[field as keyof FormData]) {
        newErrors[field] = 'This field is required';
      }
    });

    // Numeric validation (must be > 0)
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

    // File validation

    if (formData.materials.length === 0) {
      newErrors.materials = 'Please select at least one material';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      console.log('Submitting form data:', formData);
      
      // Create FormData for file uploads
      const payload = new FormData();
      
      // Add all form fields to payload
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          payload.append(key, value);
        } else if (Array.isArray(value) && key === 'exampleStands') {
          value.forEach((file, index) => {
            payload.append(`exampleStands_${index}`, file);
          });
        } else if (Array.isArray(value)) {
          payload.append(key, JSON.stringify(value));
        } else {
          payload.append(key, String(value));
        }
      });

      // Simulate successful submission
      setTimeout(() => {
        alert('Stand design request submitted successfully! Our AI will process your requirements and generate innovative POP display designs.');
        setIsSubmitting(false);
      }, 2000);

    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting form. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">POP Stand Design Request</h2>
        <p className="text-gray-600">
          Fill out this comprehensive form to generate AI-powered 2D renderings of your POP display stand designs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission ID (Başvuru Kimliği)
              </label>
              <input
                type="text"
                value={formData.submissionId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Respondent ID (Yanıtlayan Kimliği) *
              </label>
              <input
                type="text"
                value={formData.respondentId}
                onChange={(e) => handleInputChange('respondentId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.respondentId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="PqM601"
              />
              {errors.respondentId && <p className="text-red-500 text-sm mt-1">{errors.respondentId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Submitted at (Gönderim Zamanı)
              </label>
              <input
                type="datetime-local"
                value={formData.submittedAt}
                onChange={(e) => handleInputChange('submittedAt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Brand & Product Information */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Brand & Product Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand (Marka) *
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.brand ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Coca-Cola"
              />
              {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="w-4 h-4 inline mr-1" />
                Marka Logosu (Brand Logo)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={(e) => handleFileUpload('brandLogo', e.target.files)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün (Product) *
              </label>
              <input
                type="text"
                value={formData.product}
                onChange={(e) => handleInputChange('product', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.product ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Coca-Cola 1 litre"
              />
              {errors.product && <p className="text-red-500 text-sm mt-1">{errors.product}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="w-4 h-4 inline mr-1" />
                Ürün Görseli (Product Image)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('productImage', e.target.files)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Product Dimensions */}
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Ruler className="w-5 h-5 mr-2" />
            Product Dimensions & Quantities
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Genişlik (cm) *
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.productWidth || ''}
                onChange={(e) => handleInputChange('productWidth', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.productWidth ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="8.5"
              />
              {errors.productWidth && <p className="text-red-500 text-xs mt-1">{errors.productWidth}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Derinlik (cm) *
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.productDepth || ''}
                onChange={(e) => handleInputChange('productDepth', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.productDepth ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="8.5"
              />
              {errors.productDepth && <p className="text-red-500 text-xs mt-1">{errors.productDepth}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Yükseklik (cm) *
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.productHeight || ''}
                onChange={(e) => handleInputChange('productHeight', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.productHeight ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="27"
              />
              {errors.productHeight && <p className="text-red-500 text-xs mt-1">{errors.productHeight}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ürün Ön Yüz Sayısı *
              </label>
              <input
                type="number"
                min="1"
                value={formData.frontFaceCount || ''}
                onChange={(e) => handleInputChange('frontFaceCount', parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.frontFaceCount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="4"
              />
              {errors.frontFaceCount && <p className="text-red-500 text-xs mt-1">{errors.frontFaceCount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arka Arkaya Ürün Sayısı *
              </label>
              <input
                type="number"
                min="1"
                value={formData.backToBackCount || ''}
                onChange={(e) => handleInputChange('backToBackCount', parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.backToBackCount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="3"
              />
              {errors.backToBackCount && <p className="text-red-500 text-xs mt-1">{errors.backToBackCount}</p>}
            </div>
          </div>
        </div>

        {/* Visual Assets */}
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Visual Assets
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Visual (Key Visual)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('keyVisual', e.target.files)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Örnek Stantlar (Example Stands)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload('exampleStands', e.target.files)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">You can upload multiple reference images</p>
            </div>
          </div>
        </div>

        {/* Stand Specifications */}
        <div className="bg-orange-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Stand Specifications
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <input
                    type="text"
                    value={formData.standBaseColor}
                    onChange={(e) => handleInputChange('standBaseColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            {/* Materials Multi-select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Malzeme (Material) *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-3">Stant Boyutları (Stand Dimensions)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Stant Genişlik (cm) *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.standWidth || ''}
                    onChange={(e) => handleInputChange('standWidth', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.standWidth ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="40"
                  />
                  {errors.standWidth && <p className="text-red-500 text-xs mt-1">{errors.standWidth}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Stant Derinlik (cm) *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.standDepth || ''}
                    onChange={(e) => handleInputChange('standDepth', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.standDepth ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="30"
                  />
                  {errors.standDepth && <p className="text-red-500 text-xs mt-1">{errors.standDepth}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Stant Yükseklik (cm) *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.standHeight || ''}
                    onChange={(e) => handleInputChange('standHeight', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.standHeight ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="160"
                  />
                  {errors.standHeight && <p className="text-red-500 text-xs mt-1">{errors.standHeight}</p>}
                </div>
              </div>
            </div>

            {/* Shelf Specifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Raf Özellikleri (Shelf Specifications)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Raf Genişlik (cm) *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.shelfWidth || ''}
                    onChange={(e) => handleInputChange('shelfWidth', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.shelfWidth ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="35"
                  />
                  {errors.shelfWidth && <p className="text-red-500 text-xs mt-1">{errors.shelfWidth}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Raf Derinlik (cm) *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.shelfDepth || ''}
                    onChange={(e) => handleInputChange('shelfDepth', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.shelfDepth ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="28"
                  />
                  {errors.shelfDepth && <p className="text-red-500 text-xs mt-1">{errors.shelfDepth}</p>}
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Raf Sayısı (Shelf Count) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.shelfCount || ''}
                    onChange={(e) => handleInputChange('shelfCount', parseInt(e.target.value) || 1)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.shelfCount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1"
                  />
                  {errors.shelfCount && <p className="text-red-500 text-xs mt-1">{errors.shelfCount}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Additional Details
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama (Description) *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="1 litre Coca-Cola ürünümüz için ilgi çekici, standardın dışında, yenilikçi bir FSU tasarımı istiyoruz. 300 adet üretme hedefimiz var. Işıklı ve ışıksız versiyonlarını alternatifli olarak çalışın lütfen."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Send className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Submitting...' : 'Submit Design Request'}
          </button>
        </div>
      </form>

      {/* Project Management */}
      <ProjectManager
        formData={formData}
        prompts={prompts}
        enhancedPrompts={enhancedPrompts}
        onLoadProject={handleLoadProject}
        currentProjectId={currentProjectId || undefined}
      />

      {/* Dynamic Prompt Preview */}
      <PromptPreview 
        prompts={prompts} 
        brandContext={`${formData.brand} - ${formData.product}`}
        productContext={`${formData.productWidth}×${formData.productDepth}×${formData.productHeight} cm product for ${formData.standType}`}
        innovationHint={formData.description}
      />

      {/* Image Generation Section */}
      <ImageGeneration 
        prompts={prompts} 
        enhancedPrompts={enhancedPrompts}
        isFormValid={isFormValid} 
      />
    </div>
  );
};

export default StandRequestForm;
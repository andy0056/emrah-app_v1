import React, { useState, useEffect, useCallback } from 'react';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Calendar, Palette, Package, Ruler, FileText, Send, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PromptGenerator } from '../utils/promptGenerator';
import { SmartPromptGenerator } from '../utils/smartPromptGenerator';
import { mapToFormDataWithDimensions, validateDimensionalData, mergeWithDefaults } from '../utils/formDataMapper';
import { SecurityUtils } from '../utils/security';
import { PerformanceUtils } from '../utils/performance';
import { DesignModeSelector, DesignMode } from './DesignModeSelector';
import { ManufacturingReportModal } from './ManufacturingReport';
import { HybridResultsModal } from './HybridResultsModal';
import { ProductionDesignService, ManufacturingReport as IManufacturingReport } from '../services/productionDesignService';
import { HybridDesignService, HybridDesignResult } from '../services/hybridDesignService';
import { UserPreferencesService } from '../services/userPreferencesService';

import LazyImageGeneration from './lazy/LazyImageGeneration';
import LazyProjectManager from './lazy/LazyProjectManager';
import { SavedProject } from '../services/projectService';
import Scene3DConfigurator from './Scene3DConfigurator';
import { Visual3DPromptService, type Visual3DPromptResult } from '../services/visual3DPromptService';
import type { CapturedViews } from '../hooks/useSceneCapture';
import { ProjectService } from '../services/projectService';
import type { FormData as FormDataType, StandType, Material } from '../types';
import { Button, Card, Input, LoadingSpinner, showToast } from './ui';

// FormData is now properly typed via types/index.ts
type FormData = FormDataType;

// Remove the old interface definition and use the one from types
/*interface FormData {
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
}*/

const STAND_TYPES: StandType[] = [
  'Ayaklı Stant (Floor Stand)',
  'Masa Üstü Stant (Tabletop Stand)',
  'Duvar Stantı (Wall Mount Stand)',
  'Köşe Stantı (Corner Stand)',
  'Dönen Stant (Rotating Stand)',
  'Çok Katlı Stant (Multi-tier Stand)'
];

const MATERIALS: Material[] = [
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
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    submissionId: '',
    respondentId: '',
    submittedAt: '',
    brand: 'Ülker',
    brandLogo: null,
    product: 'Çikolatalı Gofret',
    productImage: null,
    productWidth: 13,
    productDepth: 2.5,
    productHeight: 5,
    frontFaceCount: 1,
    backToBackCount: 12,
    keyVisual: null,
    exampleStands: [],
    standType: 'Masa Üstü Stant (Tabletop Stand)',
    materials: ['Plastik (Plastic)', 'Akrilik (Acrylic)'],
    standBaseColor: '#3a0448',
    standWidth: 15,
    standDepth: 30,
    standHeight: 30,
    shelfWidth: 15,
    shelfDepth: 30,
    shelfCount: 1,
    description: 'Yıllardır en çok satılan ve sevilen ürünümüz olan Ülker Çikolatalı gofret için ürünü satış noktalarında öne çıkaracak yenilikçi bir masa üstü stant tasarımı rica ediyoruz.'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Dual-mode system state
  const [designMode, setDesignMode] = useState<DesignMode>('production');
  const [manufacturingReport, setManufacturingReport] = useState<IManufacturingReport | null>(null);
  const [showManufacturingReport, setShowManufacturingReport] = useState(false);
  const [hybridResults, setHybridResults] = useState<HybridDesignResult | null>(null);
  const [showHybridResults, setShowHybridResults] = useState(false);
  const [isGeneratingWithMode, setIsGeneratingWithMode] = useState(false);
  const [modeGenerationResults, setModeGenerationResults] = useState<any>(null);
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

  // 3D Configurator state
  const [showPrecisionMode, setShowPrecisionMode] = useState(false);
  const [configuratorMode, setConfiguratorMode] = useState<'beginner' | 'advanced'>('beginner');
  const [capturedViews, setCapturedViews] = useState<CapturedViews | null>(null);
  const [visual3DPrompts, setVisual3DPrompts] = useState<Visual3DPromptResult | null>(null);
  const [isGeneratingVisual3D, setIsGeneratingVisual3D] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(false);
   const [generatedImages, setGeneratedImages] = useState<{
     frontView?: string;
     storeView?: string;
     threeQuarterView?: string;
   }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string>('');
  
  // Performance optimization: debounce form validation
  const debouncedValidation = PerformanceUtils.debounce(() => {
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
    const hasMandatoryBrandAssets = formData.brandLogo && formData.productImage; // Logo and Product are mandatory

    setIsFormValid(hasRequiredFields && hasValidNumbers && hasMaterials && hasMandatoryBrandAssets);
  }, 300);

  useEffect(() => {
    // Generate CSRF token on component mount
    SecurityUtils.generateCSRFToken().then(setCsrfToken);
    
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

  // Update prompts whenever form data changes using Dimensional Intelligence
  useEffect(() => {
    if (formData.brand && formData.product && formData.standType) {
      try {
        // Validate dimensional data
        const validation = validateDimensionalData(formData);

        if (validation.warnings.length > 0) {
          console.warn('🚨 Dimensional validation warnings:', validation.warnings);
        }

        // Convert to dimensional format, using defaults for missing values
        const dimensionalData = mergeWithDefaults(formData, formData.product);

        // Generate intelligent prompts with dimensional analysis
        const intelligentPrompts = SmartPromptGenerator.generateIntelligentPrompts(dimensionalData);

        console.log('🧮 Dimensional Intelligence Results:', {
          spaceEfficiency: intelligentPrompts.analysis.spaceUtilization.efficiency,
          productCapacity: intelligentPrompts.analysis.calculatedLayout.totalProductCapacity,
          productArrangement: `${intelligentPrompts.analysis.calculatedLayout.shelfRows}×${intelligentPrompts.analysis.calculatedLayout.shelfColumns}`,
          issues: intelligentPrompts.analysis.issues.length,
          manufacturingConstraints: intelligentPrompts.analysis.manufacturingConstraints.length
        });

        // Use intelligent prompts instead of basic ones
        setPrompts({
          frontView: intelligentPrompts.frontView,
          storeView: intelligentPrompts.storeView,
          threeQuarterView: intelligentPrompts.threeQuarterView
        });

        // Reset enhanced prompts when base data changes
        setEnhancedPrompts(null);

        // Show validation warnings if any critical issues
        if (!validation.isValid) {
          console.error('❌ Missing dimensional data:', validation.missingFields);
          // Still use intelligent prompts but with defaults
        }

      } catch (error) {
        console.error('Failed to generate intelligent prompts, falling back to basic generation:', error);

        // Fallback to basic prompt generation if dimensional intelligence fails
        const generatedPrompts = PromptGenerator.generateAllPrompts(formData);
        setPrompts(generatedPrompts);
        setEnhancedPrompts(null);
      }
    }
  }, [formData]);

  // 3D Configurator handlers
  const handleSceneCapture = useCallback(async (views: CapturedViews) => {
    console.log('🎯 Scene captured, generating visual 3D prompts...');
    setCapturedViews(views);
    setIsGeneratingVisual3D(true);

    try {
      // Generate visual 3D prompts for all view types
      const frontPrompt = await Visual3DPromptService.generateVisuallyEnhancedPrompt({
        formData,
        capturedViews: views,
        viewType: 'front',
        creativeMode: 'refined'
      });

      const storePrompt = await Visual3DPromptService.generateVisuallyEnhancedPrompt({
        formData,
        capturedViews: views,
        viewType: 'store',
        creativeMode: 'refined'
      });

      const threeQuarterPrompt = await Visual3DPromptService.generateVisuallyEnhancedPrompt({
        formData,
        capturedViews: views,
        viewType: 'three-quarter',
        creativeMode: 'refined'
      });

      // Set enhanced prompts with visual 3D intelligence
      setEnhancedPrompts({
        frontView: frontPrompt.enhancedPrompt,
        storeView: storePrompt.enhancedPrompt,
        threeQuarterView: threeQuarterPrompt.enhancedPrompt
      });

      // Store the full analysis for debugging
      setVisual3DPrompts(frontPrompt);

      console.log('✅ Visual 3D prompts generated successfully', {
        scaleAccuracy: frontPrompt.scaleAccuracy.overallConfidence,
        promptEnhancement: 'Visual scale references integrated'
      });

    } catch (error) {
      console.error('Failed to generate visual 3D prompts:', error);
      // Fallback to regular enhanced prompts
    } finally {
      setIsGeneratingVisual3D(false);
    }
  }, [formData]);

  const handleTogglePrecisionMode = useCallback(() => {
    setShowPrecisionMode(!showPrecisionMode);

    if (showPrecisionMode) {
      // Reset 3D data when exiting precision mode
      setCapturedViews(null);
      setVisual3DPrompts(null);
    }
  }, [showPrecisionMode]);

  // Check form validity
  useEffect(() => {
    debouncedValidation();
  }, [formData, debouncedValidation]);

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
      
       // Load generated images if available
       setGeneratedImages({});
       if (project.images && project.images.length > 0) {
         const imageMap: { [key: string]: string } = {};
         project.images.forEach(img => {
           const typeMap = {
             'front_view': 'frontView',
             'store_view': 'storeView', 
             'three_quarter_view': 'threeQuarterView'
           };
           const mappedType = typeMap[img.image_type as keyof typeof typeMap];
           if (mappedType) {
             imageMap[mappedType] = img.image_url;
           }
         });
         setGeneratedImages(imageMap);
       }
       
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
    if (!files || files.length === 0) return;

    // Security validation for file uploads
    const invalidFiles: string[] = [];
    
    Array.from(files).forEach(file => {
      const validation = SecurityUtils.validateFileUpload(file);
      if (!validation.valid) {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (invalidFiles.length > 0) {
      setErrors(prev => ({ 
        ...prev, 
        [field]: `Invalid files: ${invalidFiles.join(', ')}` 
      }));
      return;
    }

    // Clear any existing error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Show uploading state
    setIsUploading(true);

    if (field === 'exampleStands') {
      // Validate file types and sizes
      const validFiles = Array.from(files).filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
        return isValidType && isValidSize;
      });

      if (validFiles.length !== files.length) {
        setErrors(prev => ({ ...prev, [field]: 'Some files were invalid. Only images under 10MB are allowed.' }));
        setIsUploading(false);
        return;
      }

      // Upload multiple files immediately
      uploadFiles(validFiles, field);
    } else {
      const file = files[0];
      
      // Validate single file
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, [field]: 'Only image files are allowed.' }));
        setIsUploading(false);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setErrors(prev => ({ ...prev, [field]: 'File size must be under 10MB.' }));
        setIsUploading(false);
        return;
      }

      // Upload single file immediately
      uploadSingleFile(file, field);
    }
  };

  // Upload single file and convert to URL immediately
  const uploadSingleFile = async (file: File, field: keyof FormData) => {
    try {
      console.log(`📤 Uploading ${field}:`, file.name);
      const url = await ProjectService.uploadFile(file);
      console.log(`✅ ${field} uploaded:`, url);
      
      setFormData(prev => ({
        ...prev,
        [field]: url // Store as URL string
      }));
      
    } catch (error) {
      console.error(`❌ Error uploading ${field}:`, error);
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        // Provide more user-friendly error messages for common issues
        if (errorMessage.includes('User must be authenticated')) {
          errorMessage = 'Please log in to upload files. You must be signed in to save files.';
        } else if (errorMessage.includes('Upload permission denied')) {
          errorMessage = 'Upload permission denied. Please contact support if this issue persists.';
        }
      }
      setErrors(prev => ({ 
        ...prev, 
        [field]: `Upload failed: ${errorMessage}`
      }));
    } finally {
      setIsUploading(false);
    }
  };

  // Upload multiple files and convert to URLs immediately
  const uploadFiles = async (files: File[], field: keyof FormData) => {
    try {
      console.log(`📤 Uploading ${files.length} files for ${field}`);
      const urls = await ProjectService.uploadFiles(files);
      console.log(`✅ ${field} uploaded:`, urls);
      
      setFormData(prev => ({
        ...prev,
        [field]: urls // Store as URL strings
      }));
      
    } catch (error) {
      console.error(`❌ Error uploading ${field}:`, error);
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        // Provide more user-friendly error messages for common issues
        if (errorMessage.includes('User must be authenticated')) {
          errorMessage = 'Please log in to upload files. You must be signed in to save files.';
        } else if (errorMessage.includes('Upload permission denied')) {
          errorMessage = 'Upload permission denied. Please contact support if this issue persists.';
        }
      }
      setErrors(prev => ({ 
        ...prev, 
        [field]: `Upload failed: ${errorMessage}`
      }));
    } finally {
      setIsUploading(false);
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

  // Rate limiting for form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limit
    if (!SecurityUtils.checkRateLimit('form_submission', 3, 300000)) {
      setFormError('Too many submission attempts. Please wait 5 minutes before trying again.');
      return;
    }
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = document.querySelector('.border-red-500');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      console.log('Submitting form data:', formData);

      // Add CSRF token to submission
      const submissionData = {
        ...formData,
        csrf_token: csrfToken
      };

      alert('Stand design request submitted successfully! Use the form below to generate AI-powered designs.');

    } catch (error) {
      console.error('Submission error:', error);
      setFormError('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dual-mode generation
  const handleGenerateWithMode = async () => {
    if (!isFormValid) {
      showToast.error('Please fill out all required form fields before generating designs.');
      return;
    }

    setIsGeneratingWithMode(true);
    setModeGenerationResults(null);
    setManufacturingReport(null);

    try {
      console.log(`🎯 Generating with ${designMode} mode`);

      // Collect brand asset URLs
      const brandAssetUrls: string[] = [];
      if (formData.brandLogo && typeof formData.brandLogo === 'string') {
        brandAssetUrls.push(formData.brandLogo);
      }
      if (formData.productImage && typeof formData.productImage === 'string') {
        brandAssetUrls.push(formData.productImage);
      }
      if (formData.keyVisual && typeof formData.keyVisual === 'string') {
        brandAssetUrls.push(formData.keyVisual);
      }

      let results;

      switch (designMode) {
        case 'production':
          results = await ProductionDesignService.generateProductionReady(formData, {
            referenceStyle: 'standard',
            includeAssemblyGuide: true
          });

          if (results.manufacturingReport) {
            setManufacturingReport(results.manufacturingReport);
            setShowManufacturingReport(true);
          }

          showToast.success(
            `Production-ready design generated! Manufacturability score: ${results.manufacturability.score}%`
          );
          break;

        case 'concept':
          // Use the existing creative system (ImageGeneration component)
          showToast.info('Concept mode: Use the Creative Generation section below for artistic designs.');
          return;

        case 'hybrid':
          results = await HybridDesignService.generateHybridDesign(formData, brandAssetUrls, {
            creativityLevel: 'moderate',
            budgetConstraint: 'medium'
          });

          // Store hybrid results and show modal
          setHybridResults(results);
          setShowHybridResults(true);

          showToast.success(
            `Hybrid design generated! Base score: ${results.baseStructure.manufacturabilityScore}%, Additional cost: $${results.creativeElements.additionalCost}`
          );
          break;

        default:
          throw new Error(`Unsupported design mode: ${designMode}`);
      }

      setModeGenerationResults(results);

      // Update generated images for display
      if (results && results.images && results.images.length > 0) {
        setGeneratedImages({
          frontView: results.images[0].url,
          storeView: results.images[1]?.url,
          threeQuarterView: results.images[2]?.url
        });
      }

    } catch (error) {
      console.error(`${designMode} generation failed:`, error);
      showToast.error(`Failed to generate ${designMode} design: ${error}`);
    } finally {
      setIsGeneratingWithMode(false);
    }
  };

  // Download manufacturing specifications
  const downloadManufacturingSpecs = () => {
    if (!manufacturingReport) return;

    const data = {
      report: manufacturingReport,
      formData,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `manufacturing_specs_${manufacturingReport.designId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Load user preferences on component mount
  useEffect(() => {
    if (user?.id) {
      const preferences = UserPreferencesService.loadDesignModePreference(user.id);
      if (preferences) {
        setDesignMode(preferences.defaultMode);
        console.log('📖 Loaded user design mode preference:', preferences.defaultMode);
      }
    }
  }, [user?.id]);

  const renderFilePreview = (file: File | string | null, alt: string) => {
    if (!file) return null;
    
    if (typeof file === 'string') {
      // It's a URL
      return (
        <div className="mt-2 relative inline-block">
          <img 
            src={file} 
            alt={alt}
            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
          />
          <span className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            ✓
          </span>
        </div>
      );
    } else {
      // It's a File object
      const url = URL.createObjectURL(file);
      return (
        <div className="mt-2 relative inline-block">
          <img 
            src={url} 
            alt={alt}
            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            onLoad={() => URL.revokeObjectURL(url)}
          />
          <span className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            📁
          </span>
        </div>
      );
    }
  };

  const renderMultipleFilePreview = (files: File[] | string[]) => {
    if (!files || files.length === 0) return null;
    
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {files.map((file, index) => {
          if (typeof file === 'string') {
            return (
              <div key={index} className="relative">
                <img 
                  src={file} 
                  alt={`Example ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                />
                <span className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                  ✓
                </span>
              </div>
            );
          } else {
            const url = URL.createObjectURL(file);
            return (
              <div key={index} className="relative">
                <img 
                  src={url} 
                  alt={`Example ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  onLoad={() => URL.revokeObjectURL(url)}
                />
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                  📁
                </span>
              </div>
            );
          }
        })}
      </div>
    );
  };
  return (
    <motion.div 
      className="max-w-6xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="p-6 md:p-8 gradient">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI-Powered Design Studio
            </h2>
          </div>
          <p className="text-lg text-gray-600 leading-relaxed">
            Create professional POP display stands with our advanced AI system. Simply fill in your requirements and watch as we generate stunning 2D renderings tailored to your brand.
          </p>
        </motion.div>
      </Card>

      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="mb-6"
          >
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center">
                <LoadingSpinner size="sm" variant="dots" className="mr-3" />
                <div>
                  <p className="text-blue-900 font-medium">Uploading files...</p>
                  <p className="text-blue-700 text-sm">Please wait while we process your assets</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {/* Basic Information Section */}
        <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300" hover>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg mr-3">
                <FileText className="w-5 h-5 text-white" />
              </div>
              Basic Information
            </h3>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Submission ID (Başvuru Kimliği)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.submissionId}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-mono text-sm focus:outline-none"
                />
                <div className="absolute right-3 top-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Respondent ID (Yanıtlayan Kimliği) *
              </label>
              <Input
                type="text"
                value={formData.respondentId}
                onChange={(e) => handleInputChange('respondentId', e.target.value)}
                error={errors.respondentId}
                placeholder="PqM601"
                className="font-mono"
              />
            </motion.div>

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
        </Card>

        {/* Brand & Product Information */}
        <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300" hover gradient>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg mr-3">
                <Package className="w-5 h-5 text-white" />
              </div>
              Brand & Product Information
            </h3>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Brand (Marka) *
              </label>
              <Input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                error={errors.brand}
                placeholder="Ülker"
              />
            </motion.div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="w-4 h-4 inline mr-1" />
                Marka Logosu (Brand Logo)
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                disabled={!user}
                onChange={(e) => handleFileUpload('brandLogo', e.target.files)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !user ? 'border-gray-300 bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                }`}
              />
              {!user && (
                <p className="text-sm text-amber-600 mt-1">
                  Please sign in to upload files
                </p>
              )}
              {errors.brandLogo && <p className="text-red-500 text-sm mt-1">{errors.brandLogo}</p>}
              {renderFilePreview(formData.brandLogo, "Brand Logo")}
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
                placeholder="Çikolatalı Gofret"
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
                disabled={!user}
                onChange={(e) => handleFileUpload('productImage', e.target.files)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !user ? 'border-gray-300 bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                }`}
              />
              {!user && (
                <p className="text-sm text-amber-600 mt-1">
                  Please sign in to upload files
                </p>
              )}
              {errors.productImage && <p className="text-red-500 text-sm mt-1">{errors.productImage}</p>}
              {renderFilePreview(formData.productImage, "Product Image")}
            </div>
          </div>
        </Card>

        {/* Product Dimensions */}
        <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300" hover>
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
        </Card>

        {/* Visual Assets */}
        <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300" hover>
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
                disabled={!user}
                onChange={(e) => handleFileUpload('keyVisual', e.target.files)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !user ? 'border-gray-300 bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                }`}
              />
              {!user && (
                <p className="text-sm text-amber-600 mt-1">
                  Please sign in to upload files
                </p>
              )}
              {errors.keyVisual && <p className="text-red-500 text-sm mt-1">{errors.keyVisual}</p>}
              {renderFilePreview(formData.keyVisual, "Key Visual")}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Örnek Stantlar (Example Stands)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={!user}
                onChange={(e) => handleFileUpload('exampleStands', e.target.files)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !user ? 'border-gray-300 bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">You can upload multiple reference images</p>
              {!user && (
                <p className="text-sm text-amber-600 mt-1">
                  Please sign in to upload files
                </p>
              )}
              {errors.exampleStands && <p className="text-red-500 text-sm mt-1">{errors.exampleStands}</p>}
              {renderMultipleFilePreview(formData.exampleStands)}
            </div>
          </div>
        </Card>

        {/* Stand Specifications */}
        <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300" hover>
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
        </Card>

        {/* Additional Details */}
        <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300" hover>
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
              placeholder="Yıllardır en çok satılan ve sevilen ürünümüz olan Ülker Çikolatalı gofret için ürünü satış noktalarında öne çıkaracak yenilikçi bir masa üstü stant tasarımı rica ediyoruz."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>
        </Card>

        {/* Submit Button */}
        <motion.div 
          className="flex justify-center pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            size="xl"
            icon={<Send />}
            className="px-12 py-4 shadow-2xl hover:shadow-purple-200"
          >
            {isSubmitting ? 'Submitting Design Request...' : 'Submit Design Request'}
          </Button>
        </motion.div>
      </motion.form>

      {/* Design Mode Selector & Generation */}
      <DesignModeSelector
        mode={designMode}
        onModeChange={setDesignMode}
        disabled={isGeneratingWithMode}
      />

      {/* Mode-specific Generation Button */}
      <motion.div
        className="flex justify-center pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={handleGenerateWithMode}
          disabled={isGeneratingWithMode || !isFormValid}
          loading={isGeneratingWithMode}
          size="xl"
          icon={designMode === 'production' ? <Package /> : designMode === 'hybrid' ? <Sparkles /> : <Palette />}
          className={`px-8 py-4 shadow-lg ${
            designMode === 'production' ? 'bg-blue-600 hover:bg-blue-700' :
            designMode === 'hybrid' ? 'bg-green-600 hover:bg-green-700' :
            'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isGeneratingWithMode ?
            `Generating ${designMode.charAt(0).toUpperCase() + designMode.slice(1)} Design...` :
            `Generate ${designMode.charAt(0).toUpperCase() + designMode.slice(1)} Design`
          }
        </Button>
      </motion.div>

      {/* Mode-specific Results Display */}
      {modeGenerationResults && (
        <motion.div
          className="mt-8 bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            {designMode === 'production' && <Package className="w-6 h-6 mr-2 text-blue-600" />}
            {designMode === 'hybrid' && <Sparkles className="w-6 h-6 mr-2 text-green-600" />}
            {designMode === 'concept' && <Palette className="w-6 h-6 mr-2 text-purple-600" />}
            {designMode.charAt(0).toUpperCase() + designMode.slice(1)} Design Results
          </h3>

          {modeGenerationResults.images && modeGenerationResults.images.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {modeGenerationResults.images.map((image: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <img
                    src={image.url}
                    alt={`Generated design ${index + 1}`}
                    className="w-full h-48 object-contain rounded-lg mb-2"
                  />
                  <p className="text-sm text-gray-600 text-center">
                    View {index + 1}
                  </p>
                </div>
              ))}
            </div>
          )}

          {designMode === 'production' && modeGenerationResults.manufacturability && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">Manufacturability Assessment</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Score:</span> {modeGenerationResults.manufacturability.score}%
                </div>
                <div>
                  <span className="font-medium">Issues:</span> {modeGenerationResults.manufacturability.issues.length}
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-1 ${modeGenerationResults.manufacturability.isManufacturable ? 'text-green-600' : 'text-red-600'}`}>
                    {modeGenerationResults.manufacturability.isManufacturable ? 'Ready for Production' : 'Needs Review'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {designMode === 'hybrid' && modeGenerationResults.creativeElements && (
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-green-900">Creative Enhancements Applied</h4>
                <Button
                  onClick={() => setShowHybridResults(true)}
                  variant="secondary"
                  size="sm"
                  icon={<Sparkles />}
                >
                  View Full Report
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Enhancements:</span> {modeGenerationResults.creativeElements.appliedEnhancements.length}
                </div>
                <div>
                  <span className="font-medium">Additional Cost:</span> ${modeGenerationResults.creativeElements.additionalCost}
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium text-sm">Applied Features:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {modeGenerationResults.creativeElements.appliedEnhancements.slice(0, 5).map((enhancement: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                      {enhancement}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Manufacturing Report Modal */}
      {manufacturingReport && (
        <ManufacturingReportModal
          report={manufacturingReport}
          onClose={() => setShowManufacturingReport(false)}
          onDownload={downloadManufacturingSpecs}
          isOpen={showManufacturingReport}
        />
      )}

      {/* Hybrid Results Modal */}
      {hybridResults && (
        <HybridResultsModal
          result={hybridResults}
          onClose={() => setShowHybridResults(false)}
          isOpen={showHybridResults}
          onDownload={() => {
            // Handle hybrid results download if needed
            showToast.info('Hybrid report download feature coming soon!');
          }}
        />
      )}

      {/* Project Management */}
      <Suspense fallback={<LoadingSpinner size="lg" text="Loading project manager..." />}>
        <LazyProjectManager
          formData={formData}
          prompts={prompts}
          enhancedPrompts={enhancedPrompts}
          onLoadProject={handleLoadProject}
          currentProjectId={currentProjectId || undefined}
        />
      </Suspense>

      {/* 3D Precision Mode Configurator */}
      <Card className="p-6 md:p-8 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Ruler className="w-6 h-6 mr-3 text-purple-600" />
                🎯 Precision Mode
                <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                  New
                </span>
              </h3>
              <p className="text-gray-600 mt-1 text-sm">
                Use 3D scale references to ensure AI generates dimensionally accurate displays
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleTogglePrecisionMode}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                showPrecisionMode
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-50'
              }`}
            >
              {showPrecisionMode ? 'Exit Precision Mode' : 'Enable Precision Mode'}
            </motion.button>
          </div>

          {/* Benefits explanation */}
          {!showPrecisionMode && (
            <div className="bg-white/70 rounded-lg p-4 border border-purple-100">
              <h4 className="font-medium text-purple-800 mb-2">Why Use Precision Mode?</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• <strong>Visual Scale References:</strong> Place human, product, and reference objects to define exact scale</li>
                <li>• <strong>Dimensional Accuracy:</strong> AI receives visual context instead of relying on text descriptions</li>
                <li>• <strong>Better Results:</strong> Solves the "dimensions not matching inputs" problem with visual proof</li>
                <li>• <strong>Professional Quality:</strong> Museum-grade accuracy for client presentations</li>
              </ul>
            </div>
          )}

          {/* 3D Configurator */}
          <AnimatePresence mode="wait">
            {showPrecisionMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden"
              >
                <div className="mt-6 space-y-4">
                  {/* Status indicator */}
                  {capturedViews && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">
                          Scale references captured successfully
                        </span>
                        {visual3DPrompts && (
                          <span className="ml-2 text-green-600 text-sm">
                            ({(visual3DPrompts.scaleAccuracy.overallConfidence * 100).toFixed(1)}% scale accuracy)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isGeneratingVisual3D && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center">
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                        <span className="text-blue-800 font-medium">
                          Generating visual 3D prompts with dimensional intelligence...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mode Toggle */}
                  <div className="mb-4 flex justify-end">
                    <div className="bg-white rounded-lg p-1 border border-gray-200 flex">
                      <button
                        onClick={() => setConfiguratorMode('beginner')}
                        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                          configuratorMode === 'beginner'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Smart Mode
                      </button>
                      <button
                        onClick={() => setConfiguratorMode('advanced')}
                        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                          configuratorMode === 'advanced'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Advanced
                      </button>
                    </div>
                  </div>

                  {/* 3D Configurator Component */}
                  <Scene3DConfigurator
                    mode={configuratorMode}
                    onSceneCapture={handleSceneCapture}
                    productDimensions={formData.productWidth && formData.productHeight && formData.productDepth ? {
                      width: formData.productWidth,
                      height: formData.productHeight,
                      depth: formData.productDepth
                    } : undefined}
                    displayDimensions={formData.standWidth && formData.standHeight && formData.standDepth ? {
                      width: formData.standWidth,
                      height: formData.standHeight,
                      depth: formData.standDepth
                    } : undefined}
                  />

                  {/* Instructions */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-800 mb-2">How to Use:</h4>
                    <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
                      <li>Drag the <strong>product box</strong> to position your actual product</li>
                      <li>Adjust the <strong>display bounds</strong> to match your stand dimensions</li>
                      <li>Keep the <strong>human figure</strong> for scale reference (175cm)</li>
                      <li>Use different view modes to check proportions</li>
                      <li>Click <strong>"Capture Views"</strong> when satisfied with the arrangement</li>
                      <li>Generated images will use these exact scale relationships</li>
                    </ol>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Card>

      {/* Image Generation Section */}
      <Suspense fallback={<LoadingSpinner size="lg" text="Loading image generation..." />}>
        <LazyImageGeneration
          prompts={prompts}
          enhancedPrompts={enhancedPrompts}
          isFormValid={isFormValid}
          currentProjectId={currentProjectId}
          formData={formData} // Now all files are already URLs
          initialImages={generatedImages}
          onImagesUpdated={setGeneratedImages}
          capturedViews={capturedViews}
          visual3DPrompts={visual3DPrompts}
        />
      </Suspense>
    </motion.div>
  );
};

export default StandRequestForm;
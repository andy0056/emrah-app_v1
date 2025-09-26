/**
 * 3D Scene Configurator Component
 *
 * Implements Amir's visual scale reference solution using Three.js
 * Allows users to position reference objects (human, product, MacBook)
 * to provide AI models with accurate dimensional context
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, Download, RotateCcw, Eye, Camera, Grid3x3, Sparkles, CheckCircle, Package, Layout, Cpu, Shield, FileText, Settings } from 'lucide-react';
import type { CapturedViews } from '../hooks/useSceneCapture';
import { ProductPlacementService, type PlacementResult, type ProductInstance, type ShelfStructure } from '../services/productPlacementService';
import { VisualPlacementService, type VisualPlacementResult } from '../services/visualPlacementService';
import { PhysicsEngine, type PhysicsSimulationResult } from '../services/physicsEngine';
import { ManufacturingValidator, type ManufacturingValidationResult } from '../services/manufacturingValidator';
import { AdvancedMaterialService, type AdvancedMaterialResult } from '../services/advancedMaterialService';
import { CADExportService, type ManufacturingPackage, type CADExportOptions } from '../services/cadExportService';
import { SmartPositioningService, type SmartPositionResult } from '../services/smartPositioningService';
import type { FormData } from '../types';

// Reference object dimensions (in cm) - now mutable for dynamic updates
const REFERENCE_OBJECTS = {
  human: { width: 60, height: 175, depth: 30, color: '#4F46E5', label: 'Human (175cm)' },
  product: { width: 13, height: 5, depth: 2.5, color: '#059669', label: 'Product' },
  macbook: { width: 30.4, height: 2.2, depth: 21.2, color: '#6B7280', label: 'MacBook Pro' },
  displayBounds: { width: 15, height: 30, depth: 30, color: '#DC2626', label: 'Display Stand' }
};

// Smart dimension processor for dynamic scaling
const processSmartDimensions = (
  productDims?: { width: number; height: number; depth: number },
  displayDims?: { width: number; height: number; depth: number }
) => {
  if (productDims) {
    // Validate and apply product dimensions
    const minSize = 0.5, maxSize = 200; // cm
    REFERENCE_OBJECTS.product.width = Math.max(minSize, Math.min(maxSize, productDims.width));
    REFERENCE_OBJECTS.product.height = Math.max(minSize, Math.min(maxSize, productDims.height));
    REFERENCE_OBJECTS.product.depth = Math.max(minSize, Math.min(maxSize, productDims.depth));

    // Update label with dimensions
    REFERENCE_OBJECTS.product.label = `Product (${REFERENCE_OBJECTS.product.width}×${REFERENCE_OBJECTS.product.height}×${REFERENCE_OBJECTS.product.depth}cm)`;
  }

  if (displayDims) {
    // Auto-size display bounds based on product if not specified
    const autoWidth = displayDims.width || Math.max(15, REFERENCE_OBJECTS.product.width * 3);
    const autoHeight = displayDims.height || Math.max(30, REFERENCE_OBJECTS.product.height * 6);
    const autoDepth = displayDims.depth || Math.max(30, REFERENCE_OBJECTS.product.depth * 4);

    REFERENCE_OBJECTS.displayBounds.width = autoWidth;
    REFERENCE_OBJECTS.displayBounds.height = autoHeight;
    REFERENCE_OBJECTS.displayBounds.depth = autoDepth;

    REFERENCE_OBJECTS.displayBounds.label = `Display Stand (${autoWidth}×${autoHeight}×${autoDepth}cm)`;
  }

  return {
    product: { ...REFERENCE_OBJECTS.product },
    displayBounds: { ...REFERENCE_OBJECTS.displayBounds }
  };
};

type ObjectType = keyof typeof REFERENCE_OBJECTS;

interface ReferenceObjectProps {
  type: ObjectType;
  position: [number, number, number];
  onPositionChange: (type: ObjectType, position: [number, number, number]) => void;
  isSelected: boolean;
  onSelect: (type: ObjectType) => void;
}

interface Scene3DConfiguratorProps {
  onSceneCapture?: (views: CapturedViews) => void;
  productDimensions?: { width: number; height: number; depth: number };
  displayDimensions?: { width: number; height: number; depth: number };
  mode?: 'beginner' | 'advanced'; // New prop for user experience level
  formData?: FormData; // For product placement generation
  onPlacementUpdate?: (placement: PlacementResult) => void; // Callback for placement changes
  onVisualReferencesGenerated?: (visualReferences: VisualPlacementResult) => void; // Callback for visual references
  // Phase 3: Advanced features
  onPhysicsAnalysis?: (physics: PhysicsSimulationResult) => void;
  onManufacturingValidation?: (validation: ManufacturingValidationResult) => void;
  onMaterialAnalysis?: (material: AdvancedMaterialResult) => void;
  onCADExport?: (cadPackage: ManufacturingPackage) => void;
}

// Individual reference object component with enhanced drag mechanics
const ReferenceObject: React.FC<ReferenceObjectProps> = ({
  type,
  position,
  onPositionChange,
  isSelected,
  onSelect
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
  const [dragOffset, setDragOffset] = useState<THREE.Vector3>(new THREE.Vector3());
  const { camera, raycaster, scene } = useThree();

  const obj = REFERENCE_OBJECTS[type];

  // Convert cm to scene units with smart scaling
  const smartScale = Math.max(0.1, Math.min(2.0, obj.width / 10)); // Adaptive scaling
  const scaleX = obj.width / 10;
  const scaleY = obj.height / 10;
  const scaleZ = obj.depth / 10;

  // Enhanced drag mechanics with proper raycasting
  const handlePointerDown = useCallback((event: any) => {
    event.stopPropagation();

    if (meshRef.current) {
      setIsDragging(true);
      onSelect(type);

      // Store the intersection point for accurate dragging
      const intersectionPoint = event.point.clone();
      const objectPosition = meshRef.current.position.clone();

      setDragStart(intersectionPoint);
      setDragOffset(objectPosition.sub(intersectionPoint));
    }
  }, [onSelect, type]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const handlePointerMove = useCallback((event: any) => {
    if (isDragging && meshRef.current && dragStart) {
      event.stopPropagation();

      // Use proper raycasting for ground plane intersection
      const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );

      raycaster.setFromCamera(mouse, camera);

      // Create a ground plane for intersection
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectionPoint = new THREE.Vector3();

      if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
        // Apply constraints based on object type
        let constrainedPosition = intersectionPoint.clone().add(dragOffset);

        // Smart constraints
        const bounds = 8; // Scene bounds
        constrainedPosition.x = Math.max(-bounds, Math.min(bounds, constrainedPosition.x));
        constrainedPosition.z = Math.max(-bounds, Math.min(bounds, constrainedPosition.z));

        // Object-specific Y positioning
        switch (type) {
          case 'product':
            constrainedPosition.y = scaleY / 2; // Rest on ground
            break;
          case 'displayBounds':
            constrainedPosition.y = scaleY / 2 + 0.1; // Slightly elevated
            break;
          case 'macbook':
            constrainedPosition.y = scaleY / 2 + 0.05; // On ground
            break;
          case 'human':
            constrainedPosition.y = scaleY / 2; // Standing on ground
            break;
        }

        const newPosition: [number, number, number] = [
          constrainedPosition.x,
          constrainedPosition.y,
          constrainedPosition.z
        ];

        onPositionChange(type, newPosition);
      }
    }
  }, [isDragging, dragStart, dragOffset, onPositionChange, type, scaleY, raycaster, camera]);

  // Smooth position updates with interpolation
  useFrame(() => {
    if (meshRef.current && !isDragging) {
      const targetPosition = new THREE.Vector3(...position);
      meshRef.current.position.lerp(targetPosition, 0.1); // Smooth interpolation
    }
  });

  useEffect(() => {
    if (meshRef.current && !isDragging) {
      meshRef.current.position.set(...position);
    }
  }, [position, isDragging]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <boxGeometry args={[scaleX, scaleY, scaleZ]} />
        <meshStandardMaterial
          color={obj.color}
          transparent
          opacity={isSelected ? 0.8 : 0.6}
          wireframe={type === 'displayBounds'}
        />
      </mesh>

      {/* Optimized Label - only render when selected or in beginner mode */}
      {(isSelected || type === 'product') && (
        <Html position={[position[0], position[1] + scaleY/2 + 0.5, position[2]]}>
          <div className={`px-2 py-1 rounded text-xs font-medium pointer-events-none transition-all duration-200 ${
            isSelected ? 'bg-blue-500 text-white scale-110' : 'bg-gray-800 text-white'
          }`}>
            {obj.label}
            {type === 'product' && (
              <div className="text-xs opacity-75">
                {obj.width}×{obj.height}×{obj.depth}cm
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

// Ground plane for reference
const GroundPlane: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#f3f4f6" transparent opacity={0.3} />
    </mesh>
  );
};

// Grid helper
const GridHelper: React.FC = () => {
  return <gridHelper args={[20, 40, '#6b7280', '#9ca3af']} position={[0, 0, 0]} />;
};

// 3D Product component
interface Product3DProps {
  product: ProductInstance;
  productDims: { width: number; height: number; depth: number };
  isSelected: boolean;
  onSelect: (productId: string) => void;
  onPositionChange: (productId: string, position: [number, number, number]) => void;
}

const Product3D: React.FC<Product3DProps> = ({
  product,
  productDims,
  isSelected,
  onSelect,
  onPositionChange
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { camera, raycaster } = useThree();

  // Convert cm to scene units
  const scaleX = productDims.width / 10;
  const scaleY = productDims.height / 10;
  const scaleZ = productDims.depth / 10;

  const handlePointerDown = useCallback((event: any) => {
    event.stopPropagation();
    setIsDragging(true);
    onSelect(product.id);
  }, [onSelect, product.id]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handlePointerMove = useCallback((event: any) => {
    if (isDragging && meshRef.current) {
      event.stopPropagation();

      // Simple horizontal movement for now
      const newPosition: [number, number, number] = [
        event.point.x,
        product.position[1], // Keep Y fixed
        event.point.z
      ];

      onPositionChange(product.id, newPosition);
    }
  }, [isDragging, onPositionChange, product.id, product.position]);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={product.position}
        rotation={product.rotation}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <boxGeometry args={[scaleX, scaleY, scaleZ]} />
        <meshStandardMaterial
          color="#059669"
          transparent
          opacity={isSelected ? 0.9 : 0.7}
          emissive={isSelected ? "#022c22" : "#000000"}
        />
      </mesh>

      {/* Product label */}
      {isSelected && (
        <Html position={[product.position[0], product.position[1] + scaleY/2 + 0.3, product.position[2]]}>
          <div className="px-1 py-0.5 rounded text-xs font-medium bg-green-500 text-white pointer-events-none">
            {product.id}
          </div>
        </Html>
      )}
    </group>
  );
};

// 3D Shelf component
interface Shelf3DProps {
  shelf: ShelfStructure;
  isVisible: boolean;
}

const Shelf3D: React.FC<Shelf3DProps> = ({ shelf, isVisible }) => {
  if (!isVisible) return null;

  const scaleX = shelf.dimensions.width / 10;
  const scaleY = shelf.dimensions.height / 10;
  const scaleZ = shelf.dimensions.depth / 10;

  return (
    <group>
      <mesh position={shelf.position}>
        <boxGeometry args={[scaleX, scaleY, scaleZ]} />
        <meshStandardMaterial
          color="#8B4513"
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Shelf info */}
      <Html position={[shelf.position[0] - scaleX/2, shelf.position[1] + scaleY/2 + 0.2, shelf.position[2]]}>
        <div className="px-1 py-0.5 rounded text-xs bg-brown-600 text-white pointer-events-none">
          Shelf {shelf.id} ({shelf.products.length}/{shelf.capacity})
        </div>
      </Html>
    </group>
  );
};

// Main 3D scene component
const Scene3DConfigurator: React.FC<Scene3DConfiguratorProps> = ({
  onSceneCapture,
  productDimensions,
  displayDimensions,
  mode = 'beginner',
  formData,
  onPlacementUpdate,
  onVisualReferencesGenerated,
  // Phase 3: Advanced features callbacks
  onPhysicsAnalysis,
  onManufacturingValidation,
  onMaterialAnalysis,
  onCADExport
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [objectPositions, setObjectPositions] = useState<Record<ObjectType, [number, number, number]>>({
    human: [-5, 0, -3],
    product: [0, 0, 0],
    macbook: [3, 0, 2],
    displayBounds: [0, 1.5, 0] // Centered, elevated
  });

  const [selectedObject, setSelectedObject] = useState<ObjectType | null>('product');
  const [viewMode, setViewMode] = useState<'3d' | 'front' | 'side' | 'top'>('3d');
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // For beginner mode guidance
  const [hasCompletedSetup, setHasCompletedSetup] = useState(false);

  // Product placement system state
  const [productPlacement, setProductPlacement] = useState<PlacementResult | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showProducts, setShowProducts] = useState(true);
  const [showShelves, setShowShelves] = useState(true);
  const [placementMode, setPlacementMode] = useState<'reference' | 'placement'>('reference');

  // Phase 3: Advanced features state
  const [physicsResult, setPhysicsResult] = useState<PhysicsSimulationResult | null>(null);
  const [validationResult, setValidationResult] = useState<ManufacturingValidationResult | null>(null);
  const [materialResult, setMaterialResult] = useState<AdvancedMaterialResult | null>(null);
  const [cadPackage, setCADPackage] = useState<ManufacturingPackage | null>(null);
  const [isRunningPhysics, setIsRunningPhysics] = useState(false);
  const [isRunningValidation, setIsRunningValidation] = useState(false);
  const [isRunningMaterialAnalysis, setIsRunningMaterialAnalysis] = useState(false);
  const [isExportingCAD, setIsExportingCAD] = useState(false);
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);

  // Smart positioning state
  const [smartPositionResult, setSmartPositionResult] = useState<SmartPositionResult | null>(null);
  const [isAutoPositioning, setIsAutoPositioning] = useState(false);

  // Beginner mode guided steps
  const beginnerSteps = [
    {
      title: "Position Your Product",
      description: "Click and drag the green box to position your product in the center",
      target: 'product',
      hint: "This represents your actual product size and helps AI understand scale"
    },
    {
      title: "Place Display Stand",
      description: "Position the red wireframe to show where your display will be",
      target: 'displayBounds',
      hint: "This helps AI see how much space you have for your design"
    },
    {
      title: "Perfect! Ready to Capture",
      description: "Your setup looks great! Click 'Capture Scale References' to proceed",
      target: null,
      hint: "The human figure provides perfect scale reference for AI"
    }
  ];

  // Smart dimension processing on props change
  useEffect(() => {
    const updatedDimensions = processSmartDimensions(productDimensions, displayDimensions);

    console.log('🎯 Smart dimensions updated:', {
      product: updatedDimensions.product,
      displayBounds: updatedDimensions.displayBounds,
      autoSized: !displayDimensions
    });

    // Force re-render by updating a state flag if needed
    setObjectPositions(prev => ({ ...prev }));
  }, [productDimensions, displayDimensions]);

  // Generate product placement when form data changes
  useEffect(() => {
    if (formData && placementMode === 'placement') {
      try {
        console.log('🏭 Generating product placement from form data...');
        const placement = ProductPlacementService.generatePlacement(formData);
        setProductPlacement(placement);

        if (onPlacementUpdate) {
          onPlacementUpdate(placement);
        }

        console.log('✅ Product placement generated:', {
          totalProducts: placement.totalProducts,
          utilization: `${placement.overallUtilization.toFixed(1)}%`,
          shelves: placement.shelves.length
        });
      } catch (error) {
        console.error('❌ Failed to generate product placement:', error);
      }
    }
  }, [formData, placementMode, onPlacementUpdate]);

  const handlePositionChange = useCallback((type: ObjectType, position: [number, number, number]) => {
    setObjectPositions(prev => ({
      ...prev,
      [type]: position
    }));
  }, []);

  // Handle product position changes in placement mode
  const handleProductPositionChange = useCallback((productId: string, position: [number, number, number]) => {
    if (productPlacement) {
      const updatedPlacement = ProductPlacementService.updateProductPosition(
        productPlacement,
        productId,
        position
      );
      setProductPlacement(updatedPlacement);

      if (onPlacementUpdate) {
        onPlacementUpdate(updatedPlacement);
      }
    }
  }, [productPlacement, onPlacementUpdate]);

  const handleProductSelect = useCallback((productId: string) => {
    setSelectedProduct(productId);
  }, []);

  const generatePlacement = useCallback(() => {
    if (formData) {
      setPlacementMode('placement');
    }
  }, [formData]);

  const generateVisualReferences = useCallback(async () => {
    if (productPlacement && formData && onVisualReferencesGenerated) {
      try {
        console.log('📊 Generating visual placement references...');

        const visualReferences = await VisualPlacementService.generateVisualReferences(
          productPlacement,
          formData
        );

        onVisualReferencesGenerated(visualReferences);

        console.log('✅ Visual references generated:', {
          diagrams: Object.keys(visualReferences.diagrams).length,
          prompts: Object.keys(visualReferences.enhancedPrompts).length,
          confidence: visualReferences.enhancedPrompts.frontView.confidence
        });

      } catch (error) {
        console.error('❌ Failed to generate visual references:', error);
      }
    }
  }, [productPlacement, formData, onVisualReferencesGenerated]);

  // Phase 3: Advanced feature functions
  const runPhysicsSimulation = useCallback(async () => {
    if (!productPlacement || !formData) return;

    setIsRunningPhysics(true);
    try {
      console.log('🔬 Running physics simulation...');
      const physics = await PhysicsEngine.runSimulation(productPlacement, formData);
      setPhysicsResult(physics);

      if (onPhysicsAnalysis) {
        onPhysicsAnalysis(physics);
      }

      console.log('✅ Physics simulation complete:', {
        certified: physics.structural.certified,
        collisions: physics.collisions.hasCollisions,
        safetyFactor: physics.structural.safetyFactor
      });
    } catch (error) {
      console.error('❌ Physics simulation failed:', error);
    } finally {
      setIsRunningPhysics(false);
    }
  }, [productPlacement, formData, onPhysicsAnalysis]);

  const runManufacturingValidation = useCallback(async () => {
    if (!productPlacement || !formData) return;

    setIsRunningValidation(true);
    try {
      console.log('🏭 Running manufacturing validation...');
      const validation = await ManufacturingValidator.validateManufacturing(
        formData,
        productPlacement,
        physicsResult || undefined
      );
      setValidationResult(validation);

      if (onManufacturingValidation) {
        onManufacturingValidation(validation);
      }

      console.log('✅ Manufacturing validation complete:', {
        passed: validation.overall.passed,
        grade: validation.overall.grade,
        score: validation.overall.score
      });
    } catch (error) {
      console.error('❌ Manufacturing validation failed:', error);
    } finally {
      setIsRunningValidation(false);
    }
  }, [productPlacement, formData, physicsResult, onManufacturingValidation]);

  const runMaterialAnalysis = useCallback(async () => {
    if (!formData) return;

    setIsRunningMaterialAnalysis(true);
    try {
      console.log('🔬 Running material analysis...');
      const requirements = {
        structuralLoad: 50, // N - typical display load
        operatingTemp: 25, // °C - room temperature
        outdoorUse: false,
        foodContact: formData.productName?.toLowerCase().includes('food') || false,
        budgetConstraint: 10, // $ per part
        sustainabilityPriority: 'medium' as const,
        quantityRequired: 1
      };

      const material = await AdvancedMaterialService.selectOptimalMaterial(requirements, formData);
      setMaterialResult(material);

      if (onMaterialAnalysis) {
        onMaterialAnalysis(material);
      }

      console.log('✅ Material analysis complete:', {
        selectedMaterial: Object.keys(material.selectedMaterial)[0],
        sustainabilityScore: material.sustainability.recyclabilityScore,
        costOptimization: material.analysis.optimization.costSavings
      });
    } catch (error) {
      console.error('❌ Material analysis failed:', error);
    } finally {
      setIsRunningMaterialAnalysis(false);
    }
  }, [formData, onMaterialAnalysis]);

  const exportCADPackage = useCallback(async () => {
    if (!productPlacement || !formData || !physicsResult || !validationResult || !materialResult) {
      console.warn('⚠️ Missing required data for CAD export');
      return;
    }

    setIsExportingCAD(true);
    try {
      console.log('📦 Generating CAD export package...');
      const options: CADExportOptions = {
        format: 'STEP',
        includeAssembly: true,
        includeTechnicalDrawings: true,
        includeManufacturingSpecs: true,
        includeBOM: true,
        precision: 'standard',
        units: 'mm'
      };

      const cadData = await CADExportService.generateManufacturingPackage(
        formData,
        productPlacement,
        physicsResult,
        materialResult,
        validationResult,
        options
      );
      setCADPackage(cadData);

      if (onCADExport) {
        onCADExport(cadData);
      }

      console.log('✅ CAD package generated:', {
        geometryFiles: Object.keys(cadData.geometryFiles).length,
        documentation: Object.keys(cadData.documentation).length,
        specifications: Object.keys(cadData.specifications).length
      });
    } catch (error) {
      console.error('❌ CAD export failed:', error);
    } finally {
      setIsExportingCAD(false);
    }
  }, [productPlacement, formData, physicsResult, validationResult, materialResult, onCADExport]);

  // Auto-run analyses when data becomes available
  useEffect(() => {
    if (productPlacement && formData && mode === 'advanced') {
      // Auto-run physics simulation
      if (!physicsResult && !isRunningPhysics) {
        runPhysicsSimulation();
      }
    }
  }, [productPlacement, formData, mode, physicsResult, isRunningPhysics, runPhysicsSimulation]);

  useEffect(() => {
    if (productPlacement && formData && mode === 'advanced') {
      // Auto-run manufacturing validation
      if (!validationResult && !isRunningValidation) {
        runManufacturingValidation();
      }
    }
  }, [productPlacement, formData, mode, validationResult, isRunningValidation, runManufacturingValidation]);

  useEffect(() => {
    if (formData && mode === 'advanced') {
      // Auto-run material analysis
      if (!materialResult && !isRunningMaterialAnalysis) {
        runMaterialAnalysis();
      }
    }
  }, [formData, mode, materialResult, isRunningMaterialAnalysis, runMaterialAnalysis]);

  // Smart positioning function for client-friendly product placement
  const runSmartPositioning = useCallback(async () => {
    if (!productPlacement || !formData) return;

    setIsAutoPositioning(true);
    try {
      console.log('🎯 Running smart positioning for client-friendly experience...');

      const smartResult = SmartPositioningService.autoPositionForClient(productPlacement, formData);

      // Update the product placement with smart positioning
      const updatedPlacement: PlacementResult = {
        ...productPlacement,
        shelves: smartResult.shelves
      };

      setProductPlacement(updatedPlacement);
      setSmartPositionResult(smartResult);

      if (onPlacementUpdate) {
        onPlacementUpdate(updatedPlacement);
      }

      console.log('✅ Smart positioning complete:', {
        improvements: smartResult.improvements.length,
        autoAdjustments: smartResult.autoAdjustments,
        clientTips: smartResult.clientTips.length
      });

      // Show user-friendly notification
      if (smartResult.autoAdjustments > 0) {
        console.log(`🚀 Made ${smartResult.autoAdjustments} automatic improvements for better client experience`);
      }

    } catch (error) {
      console.error('❌ Smart positioning failed:', error);
    } finally {
      setIsAutoPositioning(false);
    }
  }, [productPlacement, formData, onPlacementUpdate]);

  // Auto-run smart positioning when placement is first generated
  useEffect(() => {
    if (productPlacement && formData && placementMode === 'placement' && !smartPositionResult) {
      // Delay slightly to allow placement to settle
      setTimeout(() => {
        runSmartPositioning();
      }, 100);
    }
  }, [productPlacement, formData, placementMode, smartPositionResult, runSmartPositioning]);

  const handleObjectSelect = useCallback((type: ObjectType) => {
    setSelectedObject(type);

    // Beginner mode step progression
    if (mode === 'beginner' && !hasCompletedSetup) {
      const currentStepData = beginnerSteps[currentStep];
      if (currentStepData && currentStepData.target === type) {
        // User clicked the correct object for current step
        if (currentStep < beginnerSteps.length - 1) {
          setTimeout(() => setCurrentStep(currentStep + 1), 1000);
        } else {
          setHasCompletedSetup(true);
        }
      }
    }
  }, [mode, currentStep, hasCompletedSetup, beginnerSteps]);

  // Auto-position objects for beginner mode
  const useOptimalLayout = useCallback(() => {
    setObjectPositions({
      human: [-6, 0, -4], // Left side for scale reference
      product: [0, 0, 0], // Center - user's main focus
      macbook: [4, 0, 3], // Right side for secondary reference
      displayBounds: [0, 1.5, 0] // Centered around product
    });
    setHasCompletedSetup(true);
    setCurrentStep(beginnerSteps.length - 1);
  }, [beginnerSteps.length]);

  const resetPositions = useCallback(() => {
    setObjectPositions({
      human: [-5, 0, -3],
      product: [0, 0, 0],
      macbook: [3, 0, 2],
      displayBounds: [0, 1.5, 0]
    });
  }, []);

  // Camera positions for different views
  const getCameraPosition = (mode: string): [number, number, number] => {
    switch (mode) {
      case 'front': return [0, 5, 15];
      case 'side': return [15, 5, 0];
      case 'top': return [0, 20, 0];
      default: return [8, 8, 8];
    }
  };

  const captureScene = useCallback(async () => {
    if (!canvasRef.current || !onSceneCapture) return;

    setIsCapturing(true);

    try {
      console.log('🎯 Capturing scene from multiple angles...');

      // Get the current WebGL context and create a temporary renderer
      const canvas = canvasRef.current;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) throw new Error('WebGL not supported');

      // Create temporary renderer for capturing
      const tempRenderer = new THREE.WebGLRenderer({
        canvas: document.createElement('canvas'),
        preserveDrawingBuffer: true,
        antialias: true
      });

      const captureSize = { width: 1024, height: 1024 };
      tempRenderer.setSize(captureSize.width, captureSize.height);
      tempRenderer.setClearColor('#f8fafc');

      // Create scene with current object positions
      const scene = new THREE.Scene();

      // Add lighting
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 5);
      scene.add(directionalLight);

      // Add ground plane
      const groundGeometry = new THREE.PlaneGeometry(20, 20);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: '#f3f4f6',
        transparent: true,
        opacity: 0.3
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.1;
      scene.add(ground);

      // Add reference objects
      Object.entries(REFERENCE_OBJECTS).forEach(([type, obj]) => {
        const position = objectPositions[type as ObjectType];
        const scaleX = obj.width / 10;
        const scaleY = obj.height / 10;
        const scaleZ = obj.depth / 10;

        const geometry = new THREE.BoxGeometry(scaleX, scaleY, scaleZ);
        const material = new THREE.MeshStandardMaterial({
          color: obj.color,
          transparent: true,
          opacity: type === 'displayBounds' ? 0.3 : 0.6,
          wireframe: type === 'displayBounds'
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...position);
        scene.add(mesh);
      });

      // Define cameras for different views
      const cameras = {
        front: new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000),
        side: new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 1000),
        threeQuarter: new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
      };

      // Position cameras
      cameras.front.position.set(0, 5, 15);
      cameras.front.lookAt(0, 0, 0);

      cameras.side.position.set(15, 5, 0);
      cameras.side.lookAt(0, 0, 0);

      cameras.threeQuarter.position.set(8, 8, 8);
      cameras.threeQuarter.lookAt(0, 0, 0);

      // Capture each view
      const capturedImages: { [key: string]: string } = {};

      for (const [viewName, camera] of Object.entries(cameras)) {
        tempRenderer.render(scene, camera);

        // Extract image data
        const dataURL = tempRenderer.domElement.toDataURL('image/png', 0.95);
        capturedImages[viewName] = dataURL;
      }

      // Clean up
      tempRenderer.dispose();
      scene.clear();

      console.log('✅ Scene captured successfully from all angles');

      // Create proper CapturedViews object with metadata
      const capturedViews: CapturedViews = {
        front: capturedImages.front,
        side: capturedImages.side,
        threeQuarter: capturedImages.threeQuarter,
        metadata: {
          timestamp: Date.now(),
          resolution: captureSize,
          scaleReferences: {
            humanHeight: 175,
            productDimensions: productDimensions || { width: 13, height: 5, depth: 2.5 },
            displayDimensions: displayDimensions || { width: 15, height: 30, depth: 30 }
          }
        }
      };

      onSceneCapture(capturedViews);

    } catch (error) {
      console.error('Failed to capture scene:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [onSceneCapture, objectPositions]);

  return (
    <div className="w-full h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg overflow-hidden relative">
      {/* Controls Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center">
            <Grid3x3 className="w-4 h-4 mr-2 text-blue-600" />
            {mode === 'beginner' ? 'Smart Scale Setup' : '3D Scale Configurator'}
          </h3>
          {mode === 'beginner' ? (
            <div className="text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <span className="flex items-center">
                  Step {currentStep + 1} of {beginnerSteps.length}:
                </span>
                <span className="font-medium text-blue-600">
                  {beginnerSteps[currentStep]?.title}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-600">Drag objects to define scale references</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Mode Toggle */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPlacementMode('reference')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  placementMode === 'reference'
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Ruler className="w-3 h-3 mr-1 inline" />
                Scale
              </button>
              <button
                onClick={() => setPlacementMode('placement')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  placementMode === 'placement'
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Package className="w-3 h-3 mr-1 inline" />
                Products
              </button>
            </div>
          </div>

          {/* Product Placement Controls */}
          {placementMode === 'placement' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
              <div className="flex items-center space-x-1">
                <button
                  onClick={generatePlacement}
                  disabled={!formData}
                  className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Layout className="w-3 h-3 mr-1 inline" />
                  Generate
                </button>
                {productPlacement && (
                  <>
                    <button
                      onClick={runSmartPositioning}
                      disabled={isAutoPositioning}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Fix product positioning automatically"
                    >
                      {isAutoPositioning ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1 inline-block" />
                      ) : (
                        <Sparkles className="w-3 h-3 mr-1 inline" />
                      )}
                      {isAutoPositioning ? 'Fixing...' : 'Smart Fix'}
                    </button>
                    <button
                      onClick={generateVisualReferences}
                      className="bg-purple-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-purple-600 transition-colors"
                    >
                      <Camera className="w-3 h-3 mr-1 inline" />
                      Capture
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowShelves(!showShelves)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    showShelves ? 'bg-brown-500 text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Shelves
                </button>
                <button
                  onClick={() => setShowProducts(!showProducts)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    showProducts ? 'bg-green-500 text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Products
                </button>
              </div>
            </div>
          )}

          {/* Beginner Mode: Simplified Controls */}
          {mode === 'beginner' && placementMode === 'reference' ? (
            <>
              {!hasCompletedSetup && (
                <button
                  onClick={useOptimalLayout}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Auto-Position</span>
                </button>
              )}
              <button
                onClick={captureScene}
                disabled={isCapturing || (!hasCompletedSetup && currentStep < beginnerSteps.length - 1)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isCapturing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isCapturing ? 'Capturing...' : 'Capture Scale References'}
                </span>
              </button>
            </>
          ) : (
            /* Advanced Mode: Full Controls */
            <>
              {/* View Mode Selector */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
                {(['3d', 'front', 'side', 'top'] as const).map((vMode) => (
                  <button
                    key={vMode}
                    onClick={() => setViewMode(vMode)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      viewMode === vMode
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {vMode.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <button
                onClick={resetPositions}
                className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm hover:bg-gray-100 transition-colors"
                title="Reset positions"
              >
                <RotateCcw className="w-4 h-4 text-gray-600" />
              </button>

              <button
                onClick={captureScene}
                disabled={isCapturing}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isCapturing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isCapturing ? 'Capturing...' : 'Capture Views'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        ref={canvasRef}
        camera={{
          position: getCameraPosition(viewMode),
          fov: viewMode === '3d' ? 50 : 75,
          type: viewMode === 'top' ? 'orthographic' : 'perspective'
        }}
        shadows
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          stencil: false,
          preserveDrawingBuffer: false
        }}
        performance={{
          min: 0.5,
          max: 1,
          debounce: 100
        }}
        frameloop="demand" // Only render when needed
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.3} />

        {/* Scene Objects */}
        <GroundPlane />
        <GridHelper />

        {/* Reference Objects - only show in reference mode */}
        {placementMode === 'reference' && (Object.keys(REFERENCE_OBJECTS) as ObjectType[]).map((type) => (
          <ReferenceObject
            key={type}
            type={type}
            position={objectPositions[type]}
            onPositionChange={handlePositionChange}
            isSelected={selectedObject === type}
            onSelect={handleObjectSelect}
          />
        ))}

        {/* Product Placement System - only show in placement mode */}
        {placementMode === 'placement' && productPlacement && (
          <>
            {/* Render Shelves */}
            {showShelves && productPlacement.shelves.map((shelf) => (
              <Shelf3D
                key={shelf.id}
                shelf={shelf}
                isVisible={showShelves}
              />
            ))}

            {/* Render Products */}
            {showProducts && productPlacement.shelves.map((shelf) =>
              shelf.products.map((product) => (
                <Product3D
                  key={product.id}
                  product={product}
                  productDims={{
                    width: formData?.productWidth || 13,
                    height: formData?.productHeight || 5,
                    depth: formData?.productDepth || 2.5
                  }}
                  isSelected={selectedProduct === product.id}
                  onSelect={handleProductSelect}
                  onPositionChange={handleProductPositionChange}
                />
              ))
            )}
          </>
        )}

        {/* Controls */}
        {viewMode === '3d' && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2}
          />
        )}
      </Canvas>

      {/* Object Info Panel - Reference Mode */}
      <AnimatePresence>
        {placementMode === 'reference' && selectedObject && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm"
          >
            <h4 className="font-semibold text-gray-800 mb-2">
              {REFERENCE_OBJECTS[selectedObject].label}
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Dimensions:</strong> {REFERENCE_OBJECTS[selectedObject].width}×
                {REFERENCE_OBJECTS[selectedObject].height}×
                {REFERENCE_OBJECTS[selectedObject].depth}cm
              </p>
              <p>
                <strong>Position:</strong> X: {objectPositions[selectedObject][0].toFixed(1)},
                Y: {objectPositions[selectedObject][1].toFixed(1)},
                Z: {objectPositions[selectedObject][2].toFixed(1)}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                💡 Drag to reposition this reference object
              </p>
            </div>
          </motion.div>
        )}

        {/* Product Placement Info Panel */}
        {placementMode === 'placement' && productPlacement && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-sm"
          >
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
              <Package className="w-4 h-4 mr-2 text-green-600" />
              Product Placement
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Total Products:</strong> {productPlacement.totalProducts}
              </p>
              <p>
                <strong>Shelves:</strong> {productPlacement.shelves.length}
              </p>
              <p>
                <strong>Utilization:</strong> {productPlacement.overallUtilization.toFixed(1)}%
              </p>
              <p>
                <strong>Spacing:</strong> {productPlacement.manufacturingSpecs.productSpacing.x.toFixed(1)}cm
              </p>
              {selectedProduct && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-green-600">Selected: {selectedProduct}</p>
                  <p className="text-xs text-gray-500 mt-1">💡 Drag to reposition product</p>
                </div>
              )}
              {productPlacement.placementErrors.length > 0 && !smartPositionResult && (
                <div className="mt-2 pt-2 border-t border-red-200">
                  <p className="text-xs font-medium text-red-600 mb-1">⚠️ Issues:</p>
                  {productPlacement.placementErrors.slice(0, 2).map((error, index) => (
                    <p key={index} className="text-xs text-red-500">{error}</p>
                  ))}
                  <button
                    onClick={runSmartPositioning}
                    disabled={isAutoPositioning}
                    className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {isAutoPositioning ? 'Fixing...' : '🎯 Auto Fix'}
                  </button>
                </div>
              )}

              {/* Smart Positioning Results */}
              {smartPositionResult && smartPositionResult.autoAdjustments > 0 && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="text-xs font-medium text-green-600 mb-1">✅ Smart Positioning Applied</p>
                  <p className="text-xs text-green-700 mb-1">
                    Made {smartPositionResult.autoAdjustments} improvements
                  </p>
                  {smartPositionResult.clientTips.slice(0, 2).map((tip, index) => (
                    <p key={index} className="text-xs text-gray-600 mb-1">{tip}</p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beginner Mode: Step Guidance */}
      {mode === 'beginner' && !hasCompletedSetup && (
        <div className="absolute bottom-4 left-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 shadow-lg max-w-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {currentStep + 1}
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 text-sm mb-1">
                {beginnerSteps[currentStep]?.title}
              </h4>
              <p className="text-sm text-blue-700 mb-2">
                {beginnerSteps[currentStep]?.description}
              </p>
              <p className="text-xs text-blue-600 italic">
                💡 {beginnerSteps[currentStep]?.hint}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Mode: Instructions */}
      {mode === 'advanced' && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
          <h4 className="font-semibold text-gray-800 text-sm mb-1">Advanced Controls</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Click objects to select them</li>
            <li>• Drag to reposition objects</li>
            <li>• Use view buttons for different angles</li>
            <li>• Capture views when ready</li>
          </ul>
        </div>
      )}

      {/* Beginner Mode: Success Message */}
      {mode === 'beginner' && hasCompletedSetup && (
        <div className="absolute bottom-4 right-4 bg-green-50 border-2 border-green-200 rounded-lg p-3 shadow-lg max-w-xs">
          <h4 className="font-semibold text-green-800 text-sm mb-1 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Perfect Setup!
          </h4>
          <p className="text-xs text-green-700">
            Your scale references look great. Click "Capture Scale References" to continue.
          </p>
        </div>
      )}

      {/* Phase 3: Advanced Features Panel */}
      {mode === 'advanced' && placementMode === 'placement' && (
        <>
          {/* Advanced Features Toggle */}
          <button
            onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
            className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all flex items-center space-x-2 z-20"
          >
            <Cpu className="w-4 h-4" />
            <span className="text-sm font-medium">Advanced Analysis</span>
            {(physicsResult || validationResult || materialResult) && (
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </button>

          {/* Advanced Features Panel */}
          <AnimatePresence>
            {showAdvancedPanel && (
              <motion.div
                initial={{ opacity: 0, x: 400 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 400 }}
                className="absolute top-16 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-xl max-w-md z-10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-purple-600" />
                    Manufacturing Intelligence
                  </h3>
                  <button
                    onClick={() => setShowAdvancedPanel(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Physics Simulation */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-800 flex items-center">
                        <Cpu className="w-4 h-4 mr-2" />
                        Physics Analysis
                      </h4>
                      {physicsResult && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          physicsResult.structural.certified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {physicsResult.structural.certified ? 'Certified' : 'Review Needed'}
                        </div>
                      )}
                    </div>
                    {physicsResult ? (
                      <div className="text-xs text-blue-700 space-y-1">
                        <p>Safety Factor: {physicsResult.structural.safetyFactor}x</p>
                        <p>Max Stress: {physicsResult.structural.shelfStress.toLocaleString()} Pa</p>
                        <p>Deflection: {physicsResult.structural.deflection}mm</p>
                        {physicsResult.collisions.hasCollisions && (
                          <p className="text-red-600 font-medium">
                            ⚠️ {physicsResult.collisions.collisionPairs.length} collision(s) detected
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={runPhysicsSimulation}
                        disabled={isRunningPhysics}
                        className="w-full bg-blue-500 text-white px-3 py-2 rounded text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                      >
                        {isRunningPhysics ? 'Analyzing...' : 'Run Physics Simulation'}
                      </button>
                    )}
                  </div>

                  {/* Manufacturing Validation */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-green-800 flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Manufacturing Validation
                      </h4>
                      {validationResult && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          validationResult.overall.passed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Grade {validationResult.overall.grade}
                        </div>
                      )}
                    </div>
                    {validationResult ? (
                      <div className="text-xs text-green-700 space-y-1">
                        <p>Overall Score: {validationResult.overall.score}/100</p>
                        <p>Standards: {validationResult.standards.filter(s => s.compliance).length}/{validationResult.standards.length} passed</p>
                        <p>Quality Checks: {validationResult.qualityChecks.filter(q => q.passed).length}/{validationResult.qualityChecks.length} passed</p>
                        {validationResult.overall.certification.length > 0 && (
                          <p className="text-green-600 font-medium">
                            ✅ {validationResult.overall.certification.length} certification(s)
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={runManufacturingValidation}
                        disabled={isRunningValidation}
                        className="w-full bg-green-500 text-white px-3 py-2 rounded text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {isRunningValidation ? 'Validating...' : 'Run Manufacturing Validation'}
                      </button>
                    )}
                  </div>

                  {/* Material Analysis */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-purple-800 flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Material Analysis
                      </h4>
                      {materialResult && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          materialResult.sustainability.environmentalImpact === 'Low'
                            ? 'bg-green-100 text-green-800'
                            : materialResult.sustainability.environmentalImpact === 'Medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {materialResult.sustainability.environmentalImpact} Impact
                        </div>
                      )}
                    </div>
                    {materialResult ? (
                      <div className="text-xs text-purple-700 space-y-1">
                        <p>Tensile Strength: {materialResult.selectedMaterial.mechanical.tensileStrength} MPa</p>
                        <p>Density: {materialResult.selectedMaterial.physical.density} kg/m³</p>
                        <p>Recyclable: {materialResult.selectedMaterial.environmental.recyclable ? 'Yes' : 'No'}</p>
                        <p>Cost: ${materialResult.selectedMaterial.cost.totalCostPerPart.toFixed(2)}/part</p>
                      </div>
                    ) : (
                      <button
                        onClick={runMaterialAnalysis}
                        disabled={isRunningMaterialAnalysis}
                        className="w-full bg-purple-500 text-white px-3 py-2 rounded text-xs font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        {isRunningMaterialAnalysis ? 'Analyzing...' : 'Run Material Analysis'}
                      </button>
                    )}
                  </div>

                  {/* CAD Export */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        CAD Export
                      </h4>
                      {cadPackage && (
                        <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Ready
                        </div>
                      )}
                    </div>
                    {cadPackage ? (
                      <div className="text-xs text-gray-700 space-y-1">
                        <p>Geometry Files: {Object.keys(cadPackage.geometryFiles).length}</p>
                        <p>Documentation: {Object.keys(cadPackage.documentation).length} files</p>
                        <p>Specifications: Complete</p>
                        <button
                          onClick={() => {
                            // Download package (simplified)
                            const blob = new Blob([JSON.stringify(cadPackage, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = 'manufacturing-package.json';
                            link.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="w-full mt-2 bg-blue-500 text-white px-3 py-2 rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                        >
                          Download Package
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={exportCADPackage}
                        disabled={isExportingCAD || !physicsResult || !validationResult || !materialResult}
                        className="w-full bg-gray-500 text-white px-3 py-2 rounded text-xs font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        {isExportingCAD ? 'Generating...' : 'Generate CAD Package'}
                      </button>
                    )}
                    {(!physicsResult || !validationResult || !materialResult) && (
                      <p className="text-xs text-gray-500 mt-1">
                        Complete all analyses first
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default Scene3DConfigurator;
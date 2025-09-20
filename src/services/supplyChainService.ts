interface Supplier {
  id: string;
  name: string;
  location: string;
  specialties: string[];
  reliability: number; // 0-1 scale
  qualityRating: number; // 0-1 scale
  responseTime: string;
  minimumOrder: number;
  leadTime: {
    standard: string;
    rush: string;
  };
  certifications: string[];
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
  };
}

interface MaterialInventory {
  materialId: string;
  name: string;
  category: 'metal' | 'plastic' | 'glass' | 'fabric' | 'electronic' | 'other';
  specification: string;
  supplierId: string;
  currentStock: number;
  unit: string;
  pricePerUnit: number;
  currency: string;
  availability: 'in-stock' | 'low-stock' | 'out-of-stock' | 'pre-order';
  estimatedRestockDate?: Date;
  qualityGrade: 'A' | 'B' | 'C';
  sustainabilityScore: number; // 0-100
  lastUpdated: Date;
}

interface SupplyChainAlert {
  id: string;
  type: 'shortage' | 'delay' | 'price-change' | 'quality-issue' | 'new-supplier';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedMaterials: string[];
  impact: {
    costChange?: number;
    deliveryDelay?: string;
    qualityRisk?: string;
  };
  recommendations: string[];
  createdAt: Date;
  acknowledged: boolean;
}

interface SupplyChainOptimization {
  id: string;
  type: 'cost-reduction' | 'time-optimization' | 'risk-mitigation' | 'sustainability';
  title: string;
  description: string;
  potentialSavings: {
    cost?: number;
    time?: string;
    sustainability?: number;
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeline: string;
    requirements: string[];
  };
  confidence: number; // 0-1
}

interface SupplyChainReport {
  generatedAt: Date;
  suppliers: Supplier[];
  inventory: MaterialInventory[];
  alerts: SupplyChainAlert[];
  optimizations: SupplyChainOptimization[];
  metrics: {
    totalSuppliers: number;
    averageReliability: number;
    materialsInStock: number;
    criticalShortages: number;
    averageLeadTime: string;
    costTrends: {
      period: string;
      change: number;
    };
  };
  riskAssessment: {
    overall: 'low' | 'medium' | 'high';
    factors: {
      supplier: number;
      inventory: number;
      geopolitical: number;
      economic: number;
    };
  };
}

export class SupplyChainService {
  private static readonly TURKISH_SUPPLIERS: Supplier[] = [
    {
      id: 'supplier-1',
      name: 'Anadolu Metal İşleri',
      location: 'Istanbul, Turkey',
      specialties: ['Aluminum fabrication', 'Steel cutting', 'Metal finishing'],
      reliability: 0.92,
      qualityRating: 0.88,
      responseTime: '2-4 hours',
      minimumOrder: 500,
      leadTime: {
        standard: '5-7 days',
        rush: '2-3 days'
      },
      certifications: ['ISO 9001', 'CE Marking', 'TSE'],
      contactInfo: {
        email: 'orders@anadolumetal.com.tr',
        phone: '+90 212 555 0123',
        website: 'https://anadolumetal.com.tr'
      }
    },
    {
      id: 'supplier-2',
      name: 'Plastik Dünyası Ltd.',
      location: 'Izmir, Turkey',
      specialties: ['Acrylic sheets', 'PVC processing', 'Custom molding'],
      reliability: 0.87,
      qualityRating: 0.91,
      responseTime: '1-3 hours',
      minimumOrder: 250,
      leadTime: {
        standard: '3-5 days',
        rush: '1-2 days'
      },
      certifications: ['ISO 14001', 'REACH Compliance'],
      contactInfo: {
        email: 'info@plastikdunyasi.com',
        phone: '+90 232 555 0456'
      }
    },
    {
      id: 'supplier-3',
      name: 'LED Teknoloji A.Ş.',
      location: 'Ankara, Turkey',
      specialties: ['LED strips', 'Lighting controllers', 'Power supplies'],
      reliability: 0.95,
      qualityRating: 0.93,
      responseTime: '30 minutes - 2 hours',
      minimumOrder: 100,
      leadTime: {
        standard: '2-4 days',
        rush: '1 day'
      },
      certifications: ['CE', 'RoHS', 'Energy Star'],
      contactInfo: {
        email: 'sales@ledteknoloji.com.tr',
        phone: '+90 312 555 0789',
        website: 'https://ledteknoloji.com.tr'
      }
    },
    {
      id: 'supplier-4',
      name: 'Cam Sanatları',
      location: 'Bursa, Turkey',
      specialties: ['Tempered glass', 'Custom glass cutting', 'Glass etching'],
      reliability: 0.84,
      qualityRating: 0.89,
      responseTime: '4-8 hours',
      minimumOrder: 1000,
      leadTime: {
        standard: '7-10 days',
        rush: '3-5 days'
      },
      certifications: ['ISO 9001', 'Safety Glass Standards'],
      contactInfo: {
        email: 'orders@camsanatlari.com.tr',
        phone: '+90 224 555 0321'
      }
    }
  ];

  private static readonly MATERIAL_INVENTORY: MaterialInventory[] = [
    {
      materialId: 'mat-001',
      name: 'Aluminum Sheet 3mm',
      category: 'metal',
      specification: '3mm thickness, 1000x2000mm, 6061-T6 alloy',
      supplierId: 'supplier-1',
      currentStock: 45,
      unit: 'sheets',
      pricePerUnit: 185,
      currency: 'TRY',
      availability: 'in-stock',
      qualityGrade: 'A',
      sustainabilityScore: 85,
      lastUpdated: new Date()
    },
    {
      materialId: 'mat-002',
      name: 'Clear Acrylic 5mm',
      category: 'plastic',
      specification: '5mm thickness, cast acrylic, UV resistant',
      supplierId: 'supplier-2',
      currentStock: 12,
      unit: 'sheets',
      pricePerUnit: 145,
      currency: 'TRY',
      availability: 'low-stock',
      qualityGrade: 'A',
      sustainabilityScore: 65,
      lastUpdated: new Date()
    },
    {
      materialId: 'mat-003',
      name: 'LED Strip 5050 RGB',
      category: 'electronic',
      specification: '12V, 60 LEDs/meter, IP65 rated',
      supplierId: 'supplier-3',
      currentStock: 0,
      unit: 'meters',
      pricePerUnit: 25,
      currency: 'TRY',
      availability: 'out-of-stock',
      estimatedRestockDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      qualityGrade: 'A',
      sustainabilityScore: 70,
      lastUpdated: new Date()
    },
    {
      materialId: 'mat-004',
      name: 'Tempered Glass 6mm',
      category: 'glass',
      specification: '6mm thickness, safety tempered, polished edges',
      supplierId: 'supplier-4',
      currentStock: 28,
      unit: 'sheets',
      pricePerUnit: 95,
      currency: 'TRY',
      availability: 'in-stock',
      qualityGrade: 'A',
      sustainabilityScore: 90,
      lastUpdated: new Date()
    }
  ];

  static async getSupplyChainReport(
    requiredMaterials: { material: string; quantity: number }[] = []
  ): Promise<SupplyChainReport> {
    // Simulate real-time data fetching
    await new Promise(resolve => setTimeout(resolve, 1500));

    const suppliers = this.TURKISH_SUPPLIERS;
    const inventory = this.MATERIAL_INVENTORY;
    const alerts = await this.generateAlerts(inventory, requiredMaterials);
    const optimizations = await this.generateOptimizations(suppliers, inventory);
    const metrics = this.calculateMetrics(suppliers, inventory);
    const riskAssessment = this.assessRisks(suppliers, inventory, alerts);

    return {
      generatedAt: new Date(),
      suppliers,
      inventory,
      alerts,
      optimizations,
      metrics,
      riskAssessment
    };
  }

  private static async generateAlerts(
    inventory: MaterialInventory[],
    requiredMaterials: { material: string; quantity: number }[]
  ): Promise<SupplyChainAlert[]> {
    const alerts: SupplyChainAlert[] = [];

    // Low stock alerts
    inventory.forEach(item => {
      if (item.availability === 'low-stock') {
        alerts.push({
          id: `alert-${item.materialId}-stock`,
          type: 'shortage',
          severity: 'medium',
          title: `Low Stock Warning: ${item.name}`,
          description: `Only ${item.currentStock} ${item.unit} remaining`,
          affectedMaterials: [item.materialId],
          impact: {
            deliveryDelay: 'Potential 2-3 day delay if stock runs out'
          },
          recommendations: [
            'Reorder immediately to maintain buffer stock',
            'Consider alternative suppliers',
            'Inform clients of potential delays'
          ],
          createdAt: new Date(),
          acknowledged: false
        });
      }

      if (item.availability === 'out-of-stock') {
        alerts.push({
          id: `alert-${item.materialId}-outofstock`,
          type: 'shortage',
          severity: 'high',
          title: `Out of Stock: ${item.name}`,
          description: `Material currently unavailable`,
          affectedMaterials: [item.materialId],
          impact: {
            deliveryDelay: item.estimatedRestockDate ?
              `${Math.ceil((item.estimatedRestockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days delay` :
              'Indefinite delay'
          },
          recommendations: [
            'Contact supplier for emergency stock',
            'Source from alternative suppliers',
            'Consider material substitutions'
          ],
          createdAt: new Date(),
          acknowledged: false
        });
      }
    });

    // Price change alerts (simulated)
    alerts.push({
      id: 'alert-price-001',
      type: 'price-change',
      severity: 'medium',
      title: 'Material Price Increase',
      description: 'Aluminum prices increased by 8% due to global supply chain issues',
      affectedMaterials: ['mat-001'],
      impact: {
        costChange: 8
      },
      recommendations: [
        'Lock in current prices with advance orders',
        'Review project pricing to account for increases',
        'Consider alternative materials where possible'
      ],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      acknowledged: false
    });

    return alerts;
  }

  private static async generateOptimizations(
    suppliers: Supplier[],
    inventory: MaterialInventory[]
  ): Promise<SupplyChainOptimization[]> {
    return [
      {
        id: 'opt-001',
        type: 'cost-reduction',
        title: 'Bulk Order Discounts',
        description: 'Combine orders across multiple projects to achieve bulk pricing',
        potentialSavings: {
          cost: 15,
          time: '1-2 days faster delivery'
        },
        implementation: {
          difficulty: 'easy',
          timeline: '1 week',
          requirements: ['Order coordination system', 'Inventory space']
        },
        confidence: 0.85
      },
      {
        id: 'opt-002',
        type: 'time-optimization',
        title: 'Local Supplier Network',
        description: 'Develop relationships with suppliers within 50km radius',
        potentialSavings: {
          time: '2-3 days reduction in lead time',
          cost: 5
        },
        implementation: {
          difficulty: 'medium',
          timeline: '1 month',
          requirements: ['Supplier research', 'Quality audits', 'Contract negotiations']
        },
        confidence: 0.78
      },
      {
        id: 'opt-003',
        type: 'sustainability',
        title: 'Eco-Friendly Material Sourcing',
        description: 'Prioritize suppliers with high sustainability scores',
        potentialSavings: {
          sustainability: 25
        },
        implementation: {
          difficulty: 'medium',
          timeline: '2 months',
          requirements: ['Sustainability audit', 'Supplier certification', 'Premium pricing acceptance']
        },
        confidence: 0.72
      },
      {
        id: 'opt-004',
        type: 'risk-mitigation',
        title: 'Dual Supplier Strategy',
        description: 'Establish backup suppliers for critical materials',
        potentialSavings: {
          time: 'Eliminate stockout delays'
        },
        implementation: {
          difficulty: 'hard',
          timeline: '3 months',
          requirements: ['Supplier qualification', 'Contract management', 'Quality standardization']
        },
        confidence: 0.92
      }
    ];
  }

  private static calculateMetrics(
    suppliers: Supplier[],
    inventory: MaterialInventory[]
  ): SupplyChainReport['metrics'] {
    const totalSuppliers = suppliers.length;
    const averageReliability = suppliers.reduce((acc, s) => acc + s.reliability, 0) / suppliers.length;
    const materialsInStock = inventory.filter(m => m.availability === 'in-stock').length;
    const criticalShortages = inventory.filter(m => m.availability === 'out-of-stock').length;

    // Calculate average lead time (convert to days for calculation)
    const leadTimes = suppliers.map(s => {
      const days = parseInt(s.leadTime.standard.split('-')[0]);
      return days;
    });
    const avgLeadTime = Math.round(leadTimes.reduce((acc, t) => acc + t, 0) / leadTimes.length);

    return {
      totalSuppliers,
      averageReliability: Math.round(averageReliability * 100) / 100,
      materialsInStock,
      criticalShortages,
      averageLeadTime: `${avgLeadTime} days`,
      costTrends: {
        period: 'Last 30 days',
        change: 3.2 // 3.2% increase
      }
    };
  }

  private static assessRisks(
    suppliers: Supplier[],
    inventory: MaterialInventory[],
    alerts: SupplyChainAlert[]
  ): SupplyChainReport['riskAssessment'] {
    // Supplier risk (based on reliability and diversification)
    const avgReliability = suppliers.reduce((acc, s) => acc + s.reliability, 0) / suppliers.length;
    const supplierRisk = Math.max(0, 1 - avgReliability);

    // Inventory risk (based on stock levels and shortages)
    const outOfStock = inventory.filter(m => m.availability === 'out-of-stock').length;
    const lowStock = inventory.filter(m => m.availability === 'low-stock').length;
    const inventoryRisk = (outOfStock * 0.5 + lowStock * 0.2) / inventory.length;

    // Geopolitical risk (Turkey-specific factors)
    const geopoliticalRisk = 0.3; // Moderate risk due to regional factors

    // Economic risk (inflation, currency)
    const economicRisk = 0.4; // Higher risk due to currency volatility

    const overallRiskScore = (supplierRisk + inventoryRisk + geopoliticalRisk + economicRisk) / 4;

    let overallRisk: 'low' | 'medium' | 'high';
    if (overallRiskScore < 0.3) overallRisk = 'low';
    else if (overallRiskScore < 0.6) overallRisk = 'medium';
    else overallRisk = 'high';

    return {
      overall: overallRisk,
      factors: {
        supplier: Math.round(supplierRisk * 100),
        inventory: Math.round(inventoryRisk * 100),
        geopolitical: Math.round(geopoliticalRisk * 100),
        economic: Math.round(economicRisk * 100)
      }
    };
  }

  static async checkMaterialAvailability(
    materialRequirements: { material: string; quantity: number; urgency: 'standard' | 'rush' }[]
  ): Promise<{
    available: boolean;
    details: {
      material: string;
      requested: number;
      available: number;
      shortfall?: number;
      estimatedDelivery: string;
      cost: number;
      alternatives?: { name: string; cost: number; delivery: string }[];
    }[];
    totalCost: number;
    estimatedDelivery: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const details = materialRequirements.map(req => {
      const inventory = this.MATERIAL_INVENTORY.find(m =>
        m.name.toLowerCase().includes(req.material.toLowerCase())
      );

      if (!inventory) {
        return {
          material: req.material,
          requested: req.quantity,
          available: 0,
          shortfall: req.quantity,
          estimatedDelivery: '14-21 days',
          cost: 0,
          alternatives: [
            { name: 'Generic equivalent', cost: req.quantity * 80, delivery: '7-10 days' },
            { name: 'Premium alternative', cost: req.quantity * 120, delivery: '3-5 days' }
          ]
        };
      }

      const supplier = this.TURKISH_SUPPLIERS.find(s => s.id === inventory.supplierId);
      const available = Math.min(inventory.currentStock, req.quantity);
      const shortfall = req.quantity > inventory.currentStock ? req.quantity - inventory.currentStock : undefined;

      const deliveryTime = req.urgency === 'rush' ?
        supplier?.leadTime.rush || '2-3 days' :
        supplier?.leadTime.standard || '5-7 days';

      return {
        material: req.material,
        requested: req.quantity,
        available,
        shortfall,
        estimatedDelivery: shortfall ? '14-21 days' : deliveryTime,
        cost: available * inventory.pricePerUnit + (shortfall || 0) * inventory.pricePerUnit * 1.2,
        alternatives: shortfall ? [
          { name: 'Partial fulfillment now + later', cost: req.quantity * inventory.pricePerUnit, delivery: deliveryTime },
          { name: 'Alternative supplier', cost: req.quantity * inventory.pricePerUnit * 1.15, delivery: '7-10 days' }
        ] : undefined
      };
    });

    const allAvailable = details.every(d => !d.shortfall);
    const totalCost = details.reduce((sum, d) => sum + d.cost, 0);
    const maxDelivery = details.reduce((max, d) => {
      const days = parseInt(d.estimatedDelivery.split('-')[1] || d.estimatedDelivery.split('-')[0]);
      const maxDays = parseInt(max.split('-')[1] || max.split('-')[0]);
      return days > maxDays ? d.estimatedDelivery : max;
    }, '0 days');

    return {
      available: allAvailable,
      details,
      totalCost,
      estimatedDelivery: maxDelivery
    };
  }

  static async optimizeSupplyChain(
    currentRequirements: { material: string; quantity: number }[],
    constraints: {
      maxBudget?: number;
      maxDeliveryTime?: number;
      sustainabilityWeight?: number;
    } = {}
  ): Promise<{
    optimizedPlan: {
      supplier: string;
      materials: { name: string; quantity: number; cost: number }[];
      totalCost: number;
      deliveryTime: string;
      sustainabilityScore: number;
    }[];
    savings: {
      cost: number;
      time: string;
      sustainability: number;
    };
    recommendations: string[];
  }> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Simulate optimization algorithm
    const optimizedPlan = [
      {
        supplier: 'Anadolu Metal İşleri',
        materials: [
          { name: 'Aluminum Sheet 3mm', quantity: 10, cost: 1850 }
        ],
        totalCost: 1850,
        deliveryTime: '5-7 days',
        sustainabilityScore: 85
      },
      {
        supplier: 'Plastik Dünyası Ltd.',
        materials: [
          { name: 'Clear Acrylic 5mm', quantity: 5, cost: 725 }
        ],
        totalCost: 725,
        deliveryTime: '3-5 days',
        sustainabilityScore: 65
      }
    ];

    return {
      optimizedPlan,
      savings: {
        cost: 12.5,
        time: '2 days faster',
        sustainability: 8
      },
      recommendations: [
        'Combine orders with Anadolu Metal for bulk discount',
        'Schedule delivery timing to optimize logistics',
        'Consider sustainable packaging options',
        'Set up automated reorder points for frequently used materials'
      ]
    };
  }

  static async trackDelivery(orderId: string): Promise<{
    status: 'ordered' | 'in-production' | 'in-transit' | 'delivered';
    currentLocation: string;
    estimatedArrival: string;
    trackingEvents: {
      timestamp: Date;
      location: string;
      status: string;
      description: string;
    }[];
  }> {
    // Simulate delivery tracking
    return {
      status: 'in-transit',
      currentLocation: 'Ankara Distribution Center',
      estimatedArrival: 'Tomorrow, 2:00 PM - 4:00 PM',
      trackingEvents: [
        {
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          location: 'Istanbul Warehouse',
          status: 'Picked Up',
          description: 'Package picked up from supplier facility'
        },
        {
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          location: 'Ankara Hub',
          status: 'In Transit',
          description: 'Package sorted and dispatched to destination'
        },
        {
          timestamp: new Date(),
          location: 'Ankara Distribution Center',
          status: 'Out for Delivery',
          description: 'Package loaded on delivery vehicle'
        }
      ]
    };
  }

  static async predictSupplyDisruptions(): Promise<{
    predictions: {
      timeframe: string;
      probability: number;
      type: 'weather' | 'economic' | 'political' | 'supplier';
      description: string;
      impact: 'low' | 'medium' | 'high';
      affectedSuppliers: string[];
      mitigation: string[];
    }[];
    overallRisk: number;
  }> {
    return {
      predictions: [
        {
          timeframe: 'Next 2 weeks',
          probability: 0.65,
          type: 'weather',
          description: 'Heavy snow forecast may affect transportation in Ankara region',
          impact: 'medium',
          affectedSuppliers: ['LED Teknoloji A.Ş.'],
          mitigation: [
            'Advance orders before weather event',
            'Alternative transportation routes',
            'Local storage arrangements'
          ]
        },
        {
          timeframe: 'Next month',
          probability: 0.3,
          type: 'economic',
          description: 'Potential currency fluctuation affecting import costs',
          impact: 'high',
          affectedSuppliers: ['Plastik Dünyası Ltd.'],
          mitigation: [
            'Lock in current exchange rates',
            'Source from local suppliers',
            'Adjust pricing strategy'
          ]
        }
      ],
      overallRisk: 0.42
    };
  }
}
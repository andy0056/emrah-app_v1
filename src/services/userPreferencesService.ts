import { DesignMode } from '../components/DesignModeSelector';

export interface UserDesignPreferences {
  defaultMode: DesignMode;
  productionSettings: {
    autoValidate: boolean;
    generateTechnicals: boolean;
    includeCostEstimate: boolean;
    preferredManufacturer?: string;
    qualityLevel: 'basic' | 'standard' | 'premium';
    leadTimePreference: 'rush' | 'standard' | 'economy';
  };
  conceptSettings: {
    innovationLevel: 'conservative' | 'moderate' | 'experimental';
    preferredStyles: string[];
    allowUnconventional: boolean;
    prioritizeBrandStory: boolean;
  };
  hybridSettings: {
    creativityBalance: 'production-focused' | 'balanced' | 'creativity-focused';
    budgetConstraint: 'low' | 'medium' | 'high';
    preferredEnhancements: string[];
  };
  generalSettings: {
    autoSaveProjects: boolean;
    showCostEstimates: boolean;
    enableAnalytics: boolean;
    preferredUnits: 'metric' | 'imperial';
  };
}

export interface QuickSwitchProfile {
  id: string;
  name: string;
  description: string;
  mode: DesignMode;
  settings: Record<string, unknown>;
  icon: string;
  useCase: string;
}

export class UserPreferencesService {

  private static readonly STORAGE_KEY = 'user_design_preferences';
  private static readonly PROFILES_KEY = 'quick_switch_profiles';

  // Save user preferences
  static saveDesignModePreference(userId: string, preferences: UserDesignPreferences): void {
    try {
      const key = `${this.STORAGE_KEY}_${userId}`;
      localStorage.setItem(key, JSON.stringify(preferences));
      console.log('✅ User preferences saved:', { userId, defaultMode: preferences.defaultMode });
    } catch (error) {
      console.error('❌ Failed to save user preferences:', error);
    }
  }

  // Load user preferences
  static loadDesignModePreference(userId: string): UserDesignPreferences | null {
    try {
      const key = `${this.STORAGE_KEY}_${userId}`;
      const stored = localStorage.getItem(key);

      if (stored) {
        const preferences = JSON.parse(stored);
        console.log('📖 User preferences loaded:', { userId, defaultMode: preferences.defaultMode });
        return preferences;
      }
    } catch (error) {
      console.error('❌ Failed to load user preferences:', error);
    }

    return null;
  }

  // Get default preferences for new users
  static getDefaultPreferences(): UserDesignPreferences {
    return {
      defaultMode: 'production',
      productionSettings: {
        autoValidate: true,
        generateTechnicals: true,
        includeCostEstimate: true,
        qualityLevel: 'standard',
        leadTimePreference: 'standard'
      },
      conceptSettings: {
        innovationLevel: 'moderate',
        preferredStyles: ['modern', 'minimalist'],
        allowUnconventional: false,
        prioritizeBrandStory: true
      },
      hybridSettings: {
        creativityBalance: 'balanced',
        budgetConstraint: 'medium',
        preferredEnhancements: ['led-lighting', 'branded-graphics']
      },
      generalSettings: {
        autoSaveProjects: true,
        showCostEstimates: true,
        enableAnalytics: true,
        preferredUnits: 'metric'
      }
    };
  }

  // Quick switch profiles for common scenarios
  static getQuickSwitchProfiles(): QuickSwitchProfile[] {
    return [
      {
        id: 'urgent-production',
        name: 'Urgent Production',
        description: 'Fast turnaround for immediate manufacturing',
        mode: 'production',
        icon: '⚡',
        useCase: 'Client needs display ASAP',
        settings: {
          referenceStyle: 'minimal',
          skipValidation: false,
          fastGeneration: true,
          autoValidate: true,
          generateTechnicals: true,
          qualityLevel: 'basic',
          leadTimePreference: 'rush'
        }
      },
      {
        id: 'client-pitch',
        name: 'Client Pitch',
        description: 'Impressive concepts for presentations',
        mode: 'concept',
        icon: '✨',
        useCase: 'Impressing potential clients',
        settings: {
          innovationLevel: 'experimental',
          multipleVariations: true,
          allowUnconventional: true,
          prioritizeBrandStory: true,
          preferredStyles: ['modern', 'innovative', 'premium']
        }
      },
      {
        id: 'prototype-development',
        name: 'Prototype Development',
        description: 'Balanced approach for testing and refinement',
        mode: 'hybrid',
        icon: '🔬',
        useCase: 'Testing concepts before production',
        settings: {
          creativityBalance: 'balanced',
          includeAlternatives: true,
          showCostComparison: true,
          budgetConstraint: 'medium',
          generateTechnicals: true
        }
      },
      {
        id: 'budget-conscious',
        name: 'Budget-Conscious',
        description: 'Cost-optimized designs for tight budgets',
        mode: 'production',
        icon: '💰',
        useCase: 'Working with limited budget',
        settings: {
          referenceStyle: 'minimal',
          qualityLevel: 'basic',
          autoValidate: true,
          includeCostEstimate: true,
          preferredManufacturer: 'economy',
          leadTimePreference: 'economy'
        }
      },
      {
        id: 'premium-showcase',
        name: 'Premium Showcase',
        description: 'High-end designs with premium finishes',
        mode: 'hybrid',
        icon: '👑',
        useCase: 'Luxury brands and high-end retail',
        settings: {
          creativityBalance: 'creativity-focused',
          budgetConstraint: 'high',
          qualityLevel: 'premium',
          preferredEnhancements: ['led-lighting', 'premium-finishes', 'interactive-elements'],
          allowUnconventional: true
        }
      },
      {
        id: 'trade-show',
        name: 'Trade Show',
        description: 'Eye-catching displays for exhibitions',
        mode: 'concept',
        icon: '🎪',
        useCase: 'Trade shows and exhibitions',
        settings: {
          innovationLevel: 'experimental',
          preferredStyles: ['bold', 'interactive', 'innovative'],
          prioritizeBrandStory: true,
          allowUnconventional: true,
          multipleVariations: true
        }
      }
    ];
  }

  // Apply quick switch profile
  static applyQuickSwitchProfile(profileId: string, userId: string): DesignMode | null {
    const profiles = this.getQuickSwitchProfiles();
    const profile = profiles.find(p => p.id === profileId);

    if (!profile) {
      console.warn('❌ Quick switch profile not found:', profileId);
      return null;
    }

    // Track usage for analytics
    this.trackProfileUsage(profileId, userId);

    console.log('🔄 Applied quick switch profile:', {
      profileId,
      mode: profile.mode,
      useCase: profile.useCase
    });

    return profile.mode;
  }

  // Track profile usage for analytics
  private static trackProfileUsage(profileId: string, userId: string): void {
    try {
      const usageKey = `profile_usage_${userId}`;
      const existing = localStorage.getItem(usageKey);
      const usage = existing ? JSON.parse(existing) : {};

      usage[profileId] = (usage[profileId] || 0) + 1;
      usage.lastUsed = new Date().toISOString();

      localStorage.setItem(usageKey, JSON.stringify(usage));
    } catch (error) {
      console.warn('Failed to track profile usage:', error);
    }
  }

  // Get usage statistics
  static getProfileUsageStats(userId: string): Record<string, number> {
    try {
      const usageKey = `profile_usage_${userId}`;
      const stored = localStorage.getItem(usageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load usage stats:', error);
      return {};
    }
  }

  // Update specific preference section
  static updatePreferenceSection<K extends keyof UserDesignPreferences>(
    userId: string,
    section: K,
    updates: Partial<UserDesignPreferences[K]>
  ): void {
    const current = this.loadDesignModePreference(userId) || this.getDefaultPreferences();

    current[section] = { ...current[section], ...updates } as UserDesignPreferences[K];

    this.saveDesignModePreference(userId, current);
  }

  // Export preferences for backup
  static exportPreferences(userId: string): string {
    const preferences = this.loadDesignModePreference(userId);
    const usage = this.getProfileUsageStats(userId);

    const exportData = {
      preferences,
      usage,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import preferences from backup
  static importPreferences(userId: string, importData: string): boolean {
    try {
      const data = JSON.parse(importData);

      if (data.preferences) {
        this.saveDesignModePreference(userId, data.preferences);
      }

      if (data.usage) {
        const usageKey = `profile_usage_${userId}`;
        localStorage.setItem(usageKey, JSON.stringify(data.usage));
      }

      console.log('✅ Preferences imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to import preferences:', error);
      return false;
    }
  }

  // Reset to defaults
  static resetToDefaults(userId: string): void {
    const defaults = this.getDefaultPreferences();
    this.saveDesignModePreference(userId, defaults);

    // Clear usage stats
    const usageKey = `profile_usage_${userId}`;
    localStorage.removeItem(usageKey);

    console.log('🔄 User preferences reset to defaults');
  }

  // Get mode-specific settings for current context
  static getModeSettings(mode: DesignMode, userId: string): Record<string, unknown> {
    const preferences = this.loadDesignModePreference(userId) || this.getDefaultPreferences();

    switch (mode) {
      case 'production':
        return preferences.productionSettings;
      case 'concept':
        return preferences.conceptSettings;
      case 'hybrid':
        return preferences.hybridSettings;
      default:
        return {};
    }
  }

  // Recommend optimal mode based on user history and context
  static recommendMode(
    userId: string,
    context: {
      projectType?: string;
      urgency?: 'low' | 'medium' | 'high';
      budget?: 'low' | 'medium' | 'high';
      client?: 'internal' | 'external';
    }
  ): { mode: DesignMode; reason: string; confidence: number } {
    const preferences = this.loadDesignModePreference(userId);
    const usage = this.getProfileUsageStats(userId);

    // Default to user's preferred mode
    let recommendedMode = preferences?.defaultMode || 'production';
    let reason = 'Based on your default preference';
    let confidence = 60;

    // Adjust based on context
    if (context.urgency === 'high') {
      recommendedMode = 'production';
      reason = 'Production mode recommended for urgent requests';
      confidence = 85;
    } else if (context.client === 'external' && context.budget === 'high') {
      recommendedMode = 'concept';
      reason = 'Concept mode recommended for external clients with high budget';
      confidence = 80;
    } else if (context.projectType === 'prototype') {
      recommendedMode = 'hybrid';
      reason = 'Hybrid mode recommended for prototype development';
      confidence = 75;
    }

    // Factor in usage history
    const mostUsedProfile = Object.entries(usage)
      .filter(([key]) => key !== 'lastUsed')
      .sort(([,a], [,b]) => (b as number) - (a as number))[0];

    if (mostUsedProfile) {
      const profile = this.getQuickSwitchProfiles().find(p => p.id === mostUsedProfile[0]);
      if (profile && confidence < 70) {
        recommendedMode = profile.mode;
        reason = `Based on your frequent use of ${profile.name} profile`;
        confidence = 70;
      }
    }

    return { mode: recommendedMode, reason, confidence };
  }

  // Analytics data for preference optimization
  static getAnalyticsData(userId: string) {
    const preferences = this.loadDesignModePreference(userId);
    const usage = this.getProfileUsageStats(userId);

    return {
      defaultMode: preferences?.defaultMode,
      profileUsage: usage,
      settingsOptimization: {
        autoValidateEnabled: preferences?.productionSettings.autoValidate,
        innovationLevel: preferences?.conceptSettings.innovationLevel,
        creativityBalance: preferences?.hybridSettings.creativityBalance
      },
      timestamp: new Date().toISOString()
    };
  }
}
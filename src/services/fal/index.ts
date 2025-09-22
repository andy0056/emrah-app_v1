/**
 * FAL AI Services
 * Modular export of FAL AI functionality
 */

export * from './types';
export * from './config';
export * from './utils';
export { FalCoreService } from './core';
export { FalBrandIntegrationService } from './brandIntegration';

// Re-export for backward compatibility
export { FalCoreService as FalService } from './core';
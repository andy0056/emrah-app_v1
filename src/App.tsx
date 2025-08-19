import React from 'react';
import { useEffect } from 'react';
import StandRequestForm from './components/StandRequestForm';
import { MonitoringService } from './utils/monitoring';
import { PerformanceUtils } from './utils/performance';

function App() {
  useEffect(() => {
    // Initialize monitoring in production
    if (process.env.NODE_ENV === 'production') {
      MonitoringService.initialize();
    }
    
    // Initialize performance monitoring
    PerformanceUtils.reportWebVitals();
    
    // Preload critical resources
    PerformanceUtils.preloadCriticalResources([
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
    ]);
    
    // Initialize lazy image loading
    PerformanceUtils.lazyLoadImages();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Brand2Stand</h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            AI-powered POP (Point of Purchase) display design automation platform. 
            Create innovative, stylized, and unique stand designs with Google Imagen 4 rendering via Fal.ai.
          </p>
        </div>
        <StandRequestForm />
      </div>
    </div>
  );
}

export default App;
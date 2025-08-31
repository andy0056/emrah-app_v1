import React, { useState, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import StandRequestForm from './components/StandRequestForm';
import AuthModal from './components/AuthModal';
import { MonitoringService } from './utils/monitoring';
import { PerformanceUtils } from './utils/performance';
import AuthDebugPanel from './components/AuthDebugPanel';

function App() {
  const { user, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-2 sm:px-4">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Brand2Stand</h1>
            
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <User size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {user ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">AI-Powered POP Display Designer</h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
                Create innovative, stylized, and unique stand designs with advanced AI rendering via Fal.ai.
              </p>
            </div>
            <StandRequestForm />
          </>
        ) : (
          <div className="max-w-4xl mx-auto text-center py-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Transform Your Brand with AI-Powered POP Displays
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create stunning Point of Purchase display designs in minutes using advanced AI technology. 
              Generate photorealistic mockups with just a few clicks.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-3xl mb-4">🎨</div>
                <h3 className="font-semibold text-lg mb-2">AI-Powered Design</h3>
                <p className="text-gray-600">Advanced AI models create unique, professional designs tailored to your brand</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
                <p className="text-gray-600">Generate multiple design variations in seconds, not hours</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-3xl mb-4">🎯</div>
                <h3 className="font-semibold text-lg mb-2">Brand Focused</h3>
                <p className="text-gray-600">Designs that perfectly match your brand identity and target audience</p>
              </div>
            </div>

            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-lg"
            >
              Get Started - Sign Up Free
            </button>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Debug Panel (development only) */}
      {process.env.NODE_ENV === 'development' && <AuthDebugPanel />}
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, Sparkles, Zap, Wand2, Star, ArrowRight, BarChart3 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import StandRequestForm from './components/StandRequestForm';
import AuthModal from './components/AuthModal';
import AnalyticsOverview from './components/AnalyticsOverview';
import { MonitoringService } from './utils/monitoring';
import { PerformanceUtils } from './utils/performance';
import AuthDebugPanel from './components/AuthDebugPanel';
import { ToastProvider, Button, Card, LoadingSpinner } from './components/ui';

function App() {
  const { user, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentView, setCurrentView] = useState<'form' | 'analytics'>('form');

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <LoadingSpinner size="xl" variant="ai" text="Loading your creative workspace..." />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-sm text-gray-500"
          >
            Preparing AI-powered design tools
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <ToastProvider />
      
      {/* World-class Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-xl border-b border-purple-100/50 px-6 py-4 sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 bg-pink-400 rounded-full"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Brand2Stand
            </span>
            {user && (
              <motion.span
                className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs font-medium rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                Pro Studio
              </motion.span>
            )}
          </motion.div>
          
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                {/* View Navigation */}
                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                  <Button
                    onClick={() => setCurrentView('form')}
                    variant={currentView === 'form' ? 'primary' : 'ghost'}
                    size="sm"
                    icon={<Wand2 />}
                  >
                    Creator
                  </Button>
                  <Button
                    onClick={() => setCurrentView('analytics')}
                    variant={currentView === 'analytics' ? 'primary' : 'ghost'}
                    size="sm"
                    icon={<BarChart3 />}
                  >
                    Analytics
                  </Button>
                </div>

                <motion.div
                  className="hidden md:flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                >
                  <User className="w-4 h-4" />
                  <span>{user.email}</span>
                </motion.div>

                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  icon={<LogOut />}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setShowAuthModal(true)}
                variant="secondary"
                icon={<ArrowRight />}
                iconPosition="right"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </motion.nav>

      {user ? (
        /* Authenticated Dashboard */
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <motion.h1
                    className="text-4xl font-bold text-gray-900 mb-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Welcome to your{' '}
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Design Studio
                    </span>
                  </motion.h1>
                  <motion.p
                    className="text-lg text-gray-600"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Create professional POP displays with AI-powered design automation
                  </motion.p>
                </div>
                
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {currentView === 'form' ? (
                <StandRequestForm />
              ) : (
                <AnalyticsOverview />
              )}
            </motion.div>
          </div>
        </main>
      ) : (
        /* Unauthenticated Landing Page */
        <div className="overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
              animate={{
                x: [0, 100, 0],
                y: [0, -100, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.div
              className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
              animate={{
                x: [0, -100, 0],
                y: [0, 100, 0],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>

          <main className="relative z-10 px-6 py-20">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
              >
                <motion.h1
                  className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Transform Your Brand Into{' '}
                  <motion.span
                    className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 bg-clip-text text-transparent relative"
                    animate={{
                      backgroundPosition: ['0%', '100%', '0%'],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    Stunning Displays
                    <motion.div
                      className="absolute -right-4 -top-4"
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity
                      }}
                    >
                      <Star className="w-8 h-8 text-yellow-400" />
                    </motion.div>
                  </motion.span>
                </motion.h1>
                
                <motion.p
                  className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  AI-powered POP display design automation that creates professional retail displays 
                  in minutes, not days. Turn your brand vision into eye-catching reality.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    size="xl"
                    icon={<Wand2 />}
                    className="shadow-2xl hover:shadow-purple-200"
                  >
                    Start Creating Magic
                  </Button>
                  
                  <motion.div
                    className="flex items-center space-x-2 text-gray-500"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">No design experience needed</span>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Feature showcase */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="grid md:grid-cols-3 gap-8 mt-20"
              >
                {[
                  {
                    icon: <Sparkles className="w-8 h-8 text-purple-600" />,
                    title: "AI-Powered Design",
                    description: "Advanced AI creates stunning displays from your brand assets"
                  },
                  {
                    icon: <Zap className="w-8 h-8 text-pink-600" />,
                    title: "Lightning Fast",
                    description: "Generate professional displays in under 30 seconds"
                  },
                  {
                    icon: <Star className="w-8 h-8 text-yellow-500" />,
                    title: "Brand Perfect",
                    description: "Every design perfectly matches your brand identity"
                  }
                ].map((feature, index) => (
                  <Card
                    key={index}
                    hover
                    gradient
                    className="p-8 text-center"
                  >
                    <motion.div
                      className="mb-4 flex justify-center"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </Card>
                ))}
              </motion.div>
            </div>
          </main>
        </div>
      )}

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
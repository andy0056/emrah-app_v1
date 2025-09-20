import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Camera,
  QrCode,
  Share,
  Download,
  Maximize,
  RotateCcw,
  Zap,
  Wifi,
  Battery,
  Signal,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormData } from '../types';
import { ARPreviewService } from '../services/arPreviewService';

interface ARPreviewProps {
  formData: FormData;
  generatedImages: string[];
  onModelGenerated?: (modelUrls: any) => void;
  className?: string;
}

export const ARPreview: React.FC<ARPreviewProps> = ({
  formData,
  generatedImages,
  onModelGenerated,
  className = ""
}) => {
  const [arSupport, setArSupport] = useState<any>(null);
  const [arConfig, setArConfig] = useState<any>(null);
  const [modelUrls, setModelUrls] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [arSession, setArSession] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [shareInfo, setShareInfo] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'preview' | 'qr' | 'share' | 'performance'>('preview');

  const arViewerRef = useRef<HTMLDivElement>(null);
  const modelViewerRef = useRef<any>(null);

  useEffect(() => {
    initializeAR();
  }, [formData, generatedImages]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (arSession?.active) {
      interval = setInterval(updatePerformanceMetrics, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [arSession]);

  const initializeAR = async () => {
    try {
      setError('');

      // Detect AR support
      const support = await ARPreviewService.detectARSupport();
      setArSupport(support);

      // Get best AR configuration
      const config = await ARPreviewService.getBestARConfiguration(
        formData.displayType || 'standard',
        formData.dimensions || { width: 1000, height: 700 },
        formData.environment || 'indoor'
      );
      setArConfig(config);

      // Generate AR models if we have images
      if (generatedImages.length > 0) {
        await generateARModels();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'AR initialization failed');
    }
  };

  const generateARModels = async () => {
    setIsGenerating(true);
    try {
      const models = await ARPreviewService.generateARModel(formData, generatedImages);
      setModelUrls(models);
      onModelGenerated?.(models);

      // Generate QR code
      if (models.gltfUrl) {
        const qr = await ARPreviewService.generateQRCode(models.gltfUrl, {
          title: formData.title || 'Display Design',
          dimensions: formData.dimensions,
          material: formData.material
        });
        setQrCode(qr);
      }

    } catch (err) {
      setError('Model generation failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const startARSession = async () => {
    if (!arConfig) return;

    try {
      const session = await ARPreviewService.startARSession(arConfig);
      setArSession(session);
    } catch (err) {
      setError('Failed to start AR session: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const endARSession = async () => {
    await ARPreviewService.endARSession();
    setArSession(null);
  };

  const updatePerformanceMetrics = async () => {
    try {
      const metrics = await ARPreviewService.measureARPerformance();
      setPerformance(metrics);
    } catch (err) {
      console.error('Performance monitoring failed:', err);
    }
  };

  const shareARExperience = async () => {
    try {
      const shareData = await ARPreviewService.shareARExperience();
      setShareInfo(shareData);
      setViewMode('share');
    } catch (err) {
      setError('Failed to generate share links');
    }
  };

  const captureScreenshot = async () => {
    try {
      const screenshot = await ARPreviewService.captureARScreenshot();
      // Create download link
      const link = document.createElement('a');
      link.href = screenshot;
      link.download = `ar-preview-${Date.now()}.png`;
      link.click();
    } catch (err) {
      setError('Screenshot capture failed');
    }
  };

  const getARModeIcon = (mode: string) => {
    switch (mode) {
      case 'webxr': return <Zap className="w-4 h-4 text-green-600" />;
      case 'model-viewer': return <Smartphone className="w-4 h-4 text-blue-600" />;
      case '8thwall': return <Wifi className="w-4 h-4 text-purple-600" />;
      case 'qr-fallback': return <QrCode className="w-4 h-4 text-orange-600" />;
      default: return <Camera className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrackingQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Camera className="w-6 h-6 text-indigo-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold">AR Preview</h3>
              <p className="text-sm text-gray-600">Interactive augmented reality experience</p>
            </div>
          </div>

          {arSupport && (
            <div className="flex items-center space-x-2">
              {getARModeIcon(arConfig?.mode)}
              <span className="text-sm text-gray-600 capitalize">
                {arConfig?.mode?.replace('-', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Mode Tabs */}
        <div className="mt-4 flex space-x-2">
          {['preview', 'qr', 'share', 'performance'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-3 py-1 text-sm rounded-md capitalize ${
                viewMode === mode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {viewMode === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* AR Support Status */}
              {arSupport && (
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Device Capabilities</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>WebXR Support</span>
                        {arSupport.hasWebXR ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>ARCore/ARKit</span>
                        {(arSupport.hasARCore || arSupport.hasARKit) ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>WebAR Libraries</span>
                        {arSupport.supports8thWall ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">AR Configuration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Mode</span>
                        <span className="capitalize">{arConfig?.mode?.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tracking</span>
                        <span className="capitalize">{arConfig?.trackingType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Model Format</span>
                        <span className="uppercase">{arConfig?.modelFormat}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Scale</span>
                        <span>{arConfig?.scale}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AR Viewer */}
              <div className="bg-black rounded-lg overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
                <div ref={arViewerRef} className="w-full h-full relative">
                  {modelUrls?.gltfUrl ? (
                    <div className="w-full h-full flex items-center justify-center relative">
                      {/* Model Viewer for AR-capable devices */}
                      {(arSupport?.hasARKit || arSupport?.hasARCore) ? (
                        <model-viewer
                          ref={modelViewerRef}
                          src={modelUrls.gltfUrl}
                          ios-src={modelUrls.usdzUrl}
                          ar
                          ar-modes="webxr scene-viewer quick-look"
                          camera-controls
                          tone-mapping="neutral"
                          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23000'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white'%3ELoading AR Model%3C/text%3E%3C/svg%3E"
                          shadow-intensity="1"
                          style={{ width: '100%', height: '100%' }}
                        >
                          <div className="progress-bar hide" slot="progress-bar">
                            <div className="update-bar"></div>
                          </div>
                          <button
                            slot="ar-button"
                            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full font-medium shadow-lg"
                          >
                            View in AR
                          </button>
                        </model-viewer>
                      ) : (
                        /* Fallback for non-AR devices */
                        <div className="flex flex-col items-center justify-center text-white">
                          <QrCode className="w-16 h-16 mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">AR Not Available</p>
                          <p className="text-sm opacity-75 text-center">
                            Scan QR code on AR-capable device<br />
                            or use the share options below
                          </p>
                        </div>
                      )}

                      {/* AR Session Controls */}
                      {arSession?.active && (
                        <div className="absolute top-4 right-4 flex space-x-2">
                          <button
                            onClick={captureScreenshot}
                            className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                          >
                            <Camera className="w-5 h-5" />
                          </button>
                          <button
                            onClick={endARSession}
                            className="p-2 bg-red-600 bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                          >
                            <Pause className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Generating AR Model...</p>
                            <p className="text-sm opacity-75 mt-2">
                              Creating 3D model from your design
                            </p>
                          </>
                        ) : (
                          <>
                            <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">Ready for AR</p>
                            <button
                              onClick={generateARModels}
                              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                              Generate AR Model
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {!arSession?.active ? (
                  <button
                    onClick={startARSession}
                    disabled={!modelUrls?.gltfUrl || isGenerating}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start AR Session
                  </button>
                ) : (
                  <button
                    onClick={endARSession}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    End AR Session
                  </button>
                )}

                <button
                  onClick={shareARExperience}
                  disabled={!modelUrls?.gltfUrl}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share AR
                </button>

                <button
                  onClick={() => setViewMode('qr')}
                  disabled={!qrCode}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </button>
              </div>
            </motion.div>
          )}

          {viewMode === 'qr' && qrCode && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h4 className="text-lg font-medium mb-4">Scan to View in AR</h4>
              <div className="bg-white p-8 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                <img src={qrCode} alt="AR QR Code" className="w-64 h-64" />
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Scan with your phone's camera to open AR preview
              </p>
            </motion.div>
          )}

          {viewMode === 'share' && shareInfo && (
            <motion.div
              key="share"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h4 className="text-lg font-medium mb-4">Share AR Experience</h4>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Direct Link
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={shareInfo.shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-white"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(shareInfo.shareUrl)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <a
                    href={shareInfo.socialLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={shareInfo.socialLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Telegram
                  </a>
                  <a
                    href={shareInfo.socialLinks.email}
                    className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Email
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === 'performance' && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h4 className="text-lg font-medium mb-4">AR Performance Metrics</h4>
              {performance ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Frame Rate</span>
                      <span className="text-2xl font-bold">{performance.fps.toFixed(0)} FPS</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min(performance.fps / 60 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Tracking Quality</span>
                      <span className={`font-bold capitalize ${getTrackingQualityColor(performance.trackingQuality)}`}>
                        {performance.trackingQuality}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Render Time</span>
                      <span className="text-lg font-bold">{performance.renderTime.toFixed(1)}ms</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Memory Usage</span>
                      <span className="text-lg font-bold">{performance.memoryUsage.toFixed(0)}MB</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Signal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Start AR session to view performance metrics</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
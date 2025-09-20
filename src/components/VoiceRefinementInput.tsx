import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Loader2, Volume2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRefinementInputProps {
  onRefinementRequest: (refinement: DesignRefinement) => void;
  isProcessing?: boolean;
  disabled?: boolean;
  currentDesignContext?: {
    imageUrl: string;
    designMode: string;
    materials: string[];
    colors: string[];
  };
}

export interface DesignRefinement {
  type: 'voice' | 'text';
  originalText: string;
  parsedInstructions: {
    action: 'modify' | 'add' | 'remove' | 'adjust';
    target: string; // header, shelf, color, material, etc.
    description: string;
    intensity?: 'subtle' | 'moderate' | 'significant';
  }[];
  confidence: number;
  suggestedFollowups?: string[];
}

export const VoiceRefinementInput: React.FC<VoiceRefinementInputProps> = ({
  onRefinementRequest,
  isProcessing = false,
  disabled = false,
  currentDesignContext
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setTranscript(finalTranscript + interimTranscript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Audio level visualization
  const updateAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255);
    }

    if (isListening) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const startListening = async () => {
    if (!recognitionRef.current) return;

    try {
      // Setup audio context for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      setIsListening(true);
      setTranscript('');
      recognitionRef.current.start();
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const processRefinementRequest = async (text: string) => {
    if (!text.trim()) return;

    setIsAnalyzing(true);

    try {
      // Parse the refinement request using AI
      const refinement = await parseDesignRefinement(text, currentDesignContext);
      onRefinementRequest(refinement);

      // Clear inputs
      setTranscript('');
      setTextInput('');
    } catch (error) {
      console.error('Error processing refinement:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    const text = inputMode === 'voice' ? transcript : textInput;
    processRefinementRequest(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isVoiceSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Volume2 className="w-5 h-5 mr-2 text-purple-600" />
          Smart Design Refinement
        </h3>

        {isVoiceSupported && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setInputMode('voice')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                inputMode === 'voice'
                  ? 'bg-white shadow-sm text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Voice
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                inputMode === 'text'
                  ? 'bg-white shadow-sm text-purple-600'
                  : 'text-gray-600 hover:text-purple-600'
              }`}
            >
              Text
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {inputMode === 'voice' && isVoiceSupported ? (
          <div className="space-y-4">
            {/* Voice Input Controls */}
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={isListening ? stopListening : startListening}
                disabled={disabled || isProcessing}
                className={`relative p-4 rounded-full transition-all shadow-lg ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } ${(disabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={!disabled ? { scale: 1.05 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}

                {/* Audio level visualization */}
                {isListening && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-white"
                    animate={{
                      scale: 1 + audioLevel * 0.3,
                      opacity: 0.7 + audioLevel * 0.3
                    }}
                    transition={{ duration: 0.1 }}
                  />
                )}
              </motion.button>

              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">
                  {isListening ? 'Listening... Speak your design changes' : 'Click to start recording'}
                </p>
                {isListening && (
                  <div className="flex space-x-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-purple-600 rounded-full"
                        animate={{
                          height: [4, 12, 4],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Live Transcript */}
            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-purple-50 rounded-lg p-4 border border-purple-200"
                >
                  <p className="text-sm text-gray-600 mb-2">Transcript:</p>
                  <p className="text-purple-800">{transcript}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* Text Input */
          <div className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe the changes you'd like to make... (e.g., 'Make the header bigger and add more blue accents')"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              disabled={disabled || isProcessing}
            />

            <div className="text-xs text-gray-500">
              💡 Try: "Make the shelves wider", "Add more LED lighting", "Change to metal material", "Increase header size by 20%"
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <motion.button
            onClick={handleSubmit}
            disabled={
              disabled ||
              isProcessing ||
              isAnalyzing ||
              !(inputMode === 'voice' ? transcript.trim() : textInput.trim())
            }
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700
                     text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Apply Changes</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Context Display */}
        {currentDesignContext && (
          <div className="bg-gray-50 rounded-lg p-3 border">
            <p className="text-xs text-gray-600 mb-2">Current Design Context:</p>
            <div className="flex items-center space-x-4 text-xs">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {currentDesignContext.designMode}
              </span>
              <span className="text-gray-600">
                Materials: {currentDesignContext.materials.join(', ')}
              </span>
              <span className="text-gray-600">
                Colors: {currentDesignContext.colors.join(', ')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Parse natural language design refinement requests into structured instructions
 */
async function parseDesignRefinement(
  text: string,
  context?: any
): Promise<DesignRefinement> {
  // This would typically call an AI service to parse the request
  // For now, we'll implement basic keyword parsing

  const instructions = [];
  const lowerText = text.toLowerCase();

  // Basic parsing logic - in production this would use a proper NLP service
  if (lowerText.includes('bigger') || lowerText.includes('larger') || lowerText.includes('increase')) {
    if (lowerText.includes('header')) {
      instructions.push({
        action: 'adjust' as const,
        target: 'header',
        description: 'Increase header size',
        intensity: 'moderate' as const
      });
    }
    if (lowerText.includes('shelf') || lowerText.includes('shelves')) {
      instructions.push({
        action: 'adjust' as const,
        target: 'shelves',
        description: 'Increase shelf dimensions',
        intensity: 'moderate' as const
      });
    }
  }

  if (lowerText.includes('blue') || lowerText.includes('color')) {
    instructions.push({
      action: 'modify' as const,
      target: 'color',
      description: 'Add more blue accents',
      intensity: 'moderate' as const
    });
  }

  if (lowerText.includes('led') || lowerText.includes('lighting') || lowerText.includes('light')) {
    instructions.push({
      action: 'add' as const,
      target: 'lighting',
      description: 'Add LED lighting elements',
      intensity: 'moderate' as const
    });
  }

  return {
    type: 'voice',
    originalText: text,
    parsedInstructions: instructions,
    confidence: instructions.length > 0 ? 0.8 : 0.3,
    suggestedFollowups: [
      'Would you like to adjust the material finish?',
      'Should we modify the shelf spacing?',
      'Want to see this in a different color scheme?'
    ]
  };
}

// Extend window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
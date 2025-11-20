'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '../store/sessionStore';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Settings,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { VoiceRecognition } from '../types';

export default function VoiceInput() {
  const {
    voiceEnabled,
    transcriptionMode,
    voiceRecognition,
    setVoiceRecognition,
    setVoiceEnabled,
    setTranscriptionMode,
    theme,
  } = useSessionStore();

  const { sendVoiceTranscript, sendChatMessage, connectionStatus } = useRealtimeChat();
  const [inputValue, setInputValue] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [autoSendDelay, setAutoSendDelay] = useState(3000);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Check browser support for Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    setVoiceRecognition({
      isSupported: !!SpeechRecognition,
      isListening: false,
      transcript: '',
      confidence: 0,
    });

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsTranscribing(true);
        setVoiceRecognition({
          isListening: true,
          transcript: '',
          confidence: 0,
        });
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            setVoiceRecognition(prev => ({
              ...prev,
              confidence,
            }));
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;

        setVoiceRecognition(prev => ({
          ...prev,
          transcript: fullTranscript,
        }));

        setInputValue(fullTranscript);

        // Handle auto-send in continuous mode
        if (transcriptionMode === 'continuous' && finalTranscript) {
          if (silenceTimer) clearTimeout(silenceTimer);

          const timer = setTimeout(() => {
            if (finalTranscript.trim()) {
              sendVoiceTranscript(finalTranscript, voiceRecognition.confidence, 0);
              setInputValue('');
              setVoiceRecognition(prev => ({ ...prev, transcript: '' }));
            }
          }, autoSendDelay);

          setSilenceTimer(timer);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setVoiceRecognition(prev => ({
          ...prev,
          error: getErrorMessage(event.error),
          isListening: false,
        }));
        setIsTranscribing(false);
        stopListening();
      };

      recognition.onend = () => {
        setIsTranscribing(false);
        setVoiceRecognition(prev => ({
          ...prev,
          isListening: false,
        }));
        stopListening();
      };

      recognitionRef.current = recognition;
    }
  }, [transcriptionMode, autoSendDelay, voiceRecognition.confidence, sendVoiceTranscript, setVoiceRecognition]);

  // Get user-friendly error message
  const getErrorMessage = (error: string): string => {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'Microphone not available. Please check permissions.',
      'not-allowed': 'Microphone access denied. Please allow microphone access.',
      'network': 'Network error. Please check your connection.',
      'service-not-allowed': 'Speech recognition service not available.',
    };
    return errorMessages[error] || 'Speech recognition error occurred.';
  };

  // Setup audio visualization
  const setupAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneRef.current = stream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      visualizeAudio();
    } catch (error) {
      console.error('Failed to setup audio visualization:', error);
    }
  };

  // Visualize audio waveform
  const visualizeAudio = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const draw = () => {
      if (!voiceRecognition.isListening) return;

      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalized = average / 255;

      // Generate waveform data
      const wavePoints = 20;
      const waveform = Array.from({ length: wavePoints }, (_, i) => {
        const phase = (i / wavePoints) * Math.PI * 2;
        return Math.sin(phase + Date.now() * 0.002) * normalized * 0.5 + 0.5;
      });

      setWaveformData(waveform);
    };

    draw();
  };

  // Start voice recognition
  const startListening = async () => {
    if (!recognitionRef.current || voiceRecognition.isListening) return;

    try {
      await setupAudioVisualization();
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setVoiceRecognition(prev => ({
        ...prev,
        error: 'Failed to start speech recognition.',
      }));
    }
  };

  // Stop voice recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current && voiceRecognition.isListening) {
      recognitionRef.current.stop();
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (microphoneRef.current) {
      microphoneRef.current.getTracks().forEach(track => track.stop());
      microphoneRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setWaveformData([]);
  }, [recognitionRef, voiceRecognition.isListening]);

  // Toggle voice recognition
  const toggleVoiceRecognition = () => {
    if (voiceRecognition.isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle manual send
  const handleSend = () => {
    const messageText = inputValue.trim() || voiceRecognition.transcript.trim();
    if (!messageText || !connectionStatus.connected) return;

    if (voiceRecognition.isListening) {
      stopListening();
    }

    sendChatMessage(messageText);
    setInputValue('');
    setVoiceRecognition(prev => ({ ...prev, transcript: '' }));
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && voiceRecognition.isListening) {
      stopListening();
    }
  };

  // Voice commands
  useEffect(() => {
    const transcript = voiceRecognition.transcript.toLowerCase();

    if (voiceRecognition.isListening && transcript) {
      // Voice commands
      if (transcript.includes('clear')) {
        setInputValue('');
        setVoiceRecognition(prev => ({ ...prev, transcript: '' }));
      } else if (transcript.includes('send') || transcript.includes('go')) {
        handleSend();
      } else if (transcript.includes('stop listening') || transcript.includes('stop')) {
        stopListening();
      }
    }
  }, [voiceRecognition.transcript, voiceRecognition.isListening, stopListening, handleSend]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
      if (silenceTimer) clearTimeout(silenceTimer);
    };
  }, [stopListening, silenceTimer]);

  return (
    <div className={`border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
      {/* Voice Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}
        >
          <div className="p-4 space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Transcription Mode
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTranscriptionMode('push-to-talk')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    transcriptionMode === 'push-to-talk'
                      ? 'bg-un-blue text-white'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Push to Talk
                </button>
                <button
                  onClick={() => setTranscriptionMode('continuous')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    transcriptionMode === 'continuous'
                      ? 'bg-un-blue text-white'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Continuous
                </button>
              </div>
            </div>

            {transcriptionMode === 'continuous' && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Auto-send Delay: {autoSendDelay / 1000}s
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="1000"
                  value={autoSendDelay}
                  onChange={(e) => setAutoSendDelay(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            <div className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p>Voice Commands:</p>
              <ul className="mt-1 space-y-1">
                <li>• "Clear" - Clear input</li>
                <li>• "Send" or "Go" - Send message</li>
                <li>• "Stop listening" - Stop voice input</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Input Area */}
      <div className="p-4">
        {/* Voice Status Indicator */}
        {voiceEnabled && (
          <div className={`mb-3 px-3 py-2 rounded-lg ${
            voiceRecognition.error
              ? theme === 'dark' ? 'bg-red-900/50 text-red-400' : 'bg-red-50 text-red-600'
              : voiceRecognition.isListening
              ? theme === 'dark' ? 'bg-green-900/50 text-green-400' : 'bg-green-50 text-green-600'
              : theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
          } text-sm flex items-center space-x-2`}>
            {voiceRecognition.error ? (
              <AlertTriangle size={16} />
            ) : voiceRecognition.isListening ? (
              <Volume2 size={16} className="animate-pulse" />
            ) : (
              <VolumeX size={16} />
            )}
            <span>
              {voiceRecognition.error || (
                voiceRecognition.isListening
                  ? `Listening... (${transcriptionMode})`
                  : voiceRecognition.isSupported
                  ? 'Ready to listen'
                  : 'Speech recognition not supported'
              )}
            </span>
          </div>
        )}

        {/* Waveform Visualization */}
        {voiceRecognition.isListening && waveformData.length > 0 && (
          <div className="mb-3 h-8 flex items-center justify-center">
            <div className="flex items-end space-x-1">
              {waveformData.map((height, index) => (
                <motion.div
                  key={index}
                  className="w-1 bg-un-blue rounded-full"
                  style={{ height: `${height * 32}px` }}
                  animate={{
                    scaleY: [1, 1 + Math.random() * 0.5, 1],
                  }}
                  transition={{
                    duration: 0.2,
                    repeat: Infinity,
                    delay: index * 0.05,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Input Controls */}
        <div className="flex items-end space-x-2">
          {/* Voice Toggle Button */}
          {voiceEnabled && voiceRecognition.isSupported && (
            <button
              onClick={transcriptionMode === 'push-to-talk' ? toggleVoiceRecognition : undefined}
              onMouseDown={transcriptionMode === 'push-to-talk' ? startListening : undefined}
              onMouseUp={transcriptionMode === 'push-to-talk' ? stopListening : undefined}
              onTouchStart={transcriptionMode === 'push-to-talk' ? startListening : undefined}
              onTouchEnd={transcriptionMode === 'push-to-talk' ? stopListening : undefined}
              className={`p-3 rounded-lg transition-colors ${
                voiceRecognition.isListening
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              disabled={transcriptionMode === 'continuous'}
            >
              {voiceRecognition.isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}

          {/* Text Input */}
          <div className="flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => voiceRecognition.isListening && stopListening()}
              placeholder={
                voiceEnabled
                  ? voiceRecognition.isSupported
                    ? 'Type or speak your message...'
                    : 'Type your message...'
                  : 'Type your message...'
              }
              disabled={!connectionStatus.connected}
              className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:ring-2 focus:ring-un-blue focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!inputValue.trim() && !voiceRecognition.transcript.trim()) || !connectionStatus.connected}
            className={`p-3 rounded-lg transition-colors ${
              inputValue.trim() || voiceRecognition.transcript.trim()
                ? 'bg-un-blue text-white hover:bg-un-blue-dark'
                : theme === 'dark'
                ? 'bg-gray-700 text-gray-500'
                : 'bg-gray-200 text-gray-400'
            } disabled:cursor-not-allowed`}
          >
            <Send size={20} />
          </button>

          {/* Settings Button */}
          {voiceEnabled && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-lg transition-colors ${
                showSettings
                  ? 'bg-un-blue text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Settings size={20} />
            </button>
          )}
        </div>

        {/* Character Count and Status */}
        <div className={`mt-2 flex items-center justify-between text-xs ${
          theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <div>
            {inputValue.length > 0 && `${inputValue.length} characters`}
            {voiceRecognition.confidence > 0 && ` • ${Math.round(voiceRecognition.confidence * 100)}% confidence`}
          </div>
          <div className="flex items-center space-x-2">
            {transcriptionMode === 'push-to-talk' && voiceRecognition.isListening && (
              <span className="flex items-center space-x-1">
                <Zap size={12} className="animate-pulse" />
                <span>Push to talk</span>
              </span>
            )}
            {!connectionStatus.connected && (
              <span className="text-red-500">Disconnected</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
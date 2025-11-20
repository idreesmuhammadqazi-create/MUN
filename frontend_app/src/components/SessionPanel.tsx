'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '../store/sessionStore';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import {
  Globe,
  Clock,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  Download,
  Flag,
  MessageSquare,
  TrendingUp,
  Zap,
  BookOpen,
  Mic,
  Vote,
  Gavel,
} from 'lucide-react';
import { SessionPhase } from '../types';

interface PhaseConfig {
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  duration?: string;
  status?: 'active' | 'completed' | 'upcoming';
}

export default function SessionPanel() {
  const {
    currentSession,
    theme,
    changePhase,
    updateSession,
    exportSession,
  } = useSessionStore();

  const { sendSessionUpdate } = useRealtimeChat();
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [showPhaseDetails, setShowPhaseDetails] = useState(false);

  // Update session duration
  useEffect(() => {
    if (!currentSession || isSessionPaused) return;

    const timer = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSession, isSessionPaused]);

  // Format duration display
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Phase configurations
  const phaseConfigs: Record<SessionPhase, PhaseConfig> = {
    lobby: {
      name: 'Lobby',
      icon: BookOpen,
      color: 'bg-blue-500',
      description: 'Preparation and research phase',
      duration: '15-30 min',
    },
    mods: {
      name: 'Moderated Caucus',
      icon: Mic,
      color: 'bg-green-500',
      description: 'Formal debate with speaking time limits',
      duration: '30-60 min',
    },
    unmods: {
      name: 'Unmoderated Caucus',
      icon: Users,
      color: 'bg-purple-500',
      description: 'Informal negotiations and bloc formation',
      duration: '20-45 min',
    },
    gsl: {
      name: 'General Speakers List',
      icon: MessageSquare,
      color: 'bg-yellow-500',
      description: 'Open debate with speaking order',
      duration: '45-90 min',
    },
    crisis: {
      name: 'Crisis',
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'Emergency situation handling',
      duration: 'Varies',
    },
    resolution: {
      name: 'Resolutions',
      icon: FileText,
      color: 'bg-indigo-500',
      description: 'Drafting and voting on resolutions',
      duration: '30-60 min',
    },
  };

  // Get phase status
  const getPhaseStatus = (phase: SessionPhase): 'active' | 'completed' | 'upcoming' => {
    if (!currentSession) return 'upcoming';

    const phases: SessionPhase[] = ['lobby', 'mods', 'unmods', 'gsl', 'crisis', 'resolution'];
    const currentIndex = phases.indexOf(currentSession.phase);
    const phaseIndex = phases.indexOf(phase);

    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  // Handle phase change
  const handlePhaseChange = (newPhase: SessionPhase) => {
    if (!currentSession) return;

    changePhase(newPhase);
    sendSessionUpdate({ phase: newPhase });
  };

  // Quick action buttons
  const quickActions = [
    {
      icon: Play,
      label: 'Start Moderated Caucus',
      action: () => handlePhaseChange('mods'),
      phase: 'mods' as SessionPhase,
    },
    {
      icon: MessageSquare,
      label: 'Request GSL',
      action: () => handlePhaseChange('gsl'),
      phase: 'gsl' as SessionPhase,
    },
    {
      icon: FileText,
      label: 'Draft Resolution',
      action: () => handlePhaseChange('resolution'),
      phase: 'resolution' as SessionPhase,
    },
    {
      icon: AlertTriangle,
      label: 'Declare Crisis',
      action: () => handlePhaseChange('crisis'),
      phase: 'crisis' as SessionPhase,
    },
  ];

  // Session analytics
  const sessionAnalytics = {
    totalMessages: 12,
    speakingTime: 1800, // seconds
    participationScore: 85,
    votingPatterns: {
      for: 8,
      against: 3,
      abstain: 2,
    },
    proceduralCompliance: 92,
  };

  if (!currentSession) {
    return (
      <div className="p-4">
        <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <Globe size={48} className="mx-auto mb-4 opacity-50" />
          <p>No active session</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Session Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-3 mb-3">
          <div className={`w-10 h-10 rounded-full ${
            phaseConfigs[currentSession.phase].color
          } flex items-center justify-center`}>
            {React.createElement(phaseConfigs[currentSession.phase].icon, {
              size: 20,
              className: 'text-white',
            })}
          </div>
          <div className="flex-1">
            <h2 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentSession.country}
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentSession.committee}
            </p>
          </div>
        </div>

        {/* Session Timer */}
        <div className={`p-3 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Session Duration
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSessionPaused(!isSessionPaused)}
                className={`p-1 rounded ${
                  theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                }`}
              >
                {isSessionPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <span className={`font-mono text-sm ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {formatDuration(sessionDuration)}
              </span>
            </div>
          </div>

          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentSession.topic}
          </div>
        </div>
      </div>

      {/* Phase Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <h3 className={`text-sm font-semibold mb-3 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Session Phases
          </h3>

          <div className="space-y-2">
            {Object.entries(phaseConfigs).map(([phase, config]) => {
              const status = getPhaseStatus(phase as SessionPhase);
              const isActive = currentSession.phase === phase;
              const Icon = config.icon;

              return (
                <motion.button
                  key={phase}
                  onClick={() => handlePhaseChange(phase as SessionPhase)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    isActive
                      ? `${config.color} text-white border-transparent`
                      : status === 'completed'
                      ? theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-400'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                      : theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-white/20' : `${config.color} bg-opacity-10`
                    }`}>
                      <Icon size={16} className={isActive ? 'text-white' : ''} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${
                          isActive ? 'text-white' : theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
                        }`}>
                          {config.name}
                        </span>
                        {status === 'completed' && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                      </div>
                      <div className={`text-xs ${
                        isActive ? 'text-white/80' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {config.description}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className={`text-sm font-semibold mb-3 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Quick Actions
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const isActive = currentSession.phase === action.phase;

              return (
                <motion.button
                  key={index}
                  onClick={action.action}
                  disabled={isActive}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    isActive
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                  whileHover={!isActive ? { scale: 1.02 } : {}}
                  whileTap={!isActive ? { scale: 0.98 } : {}}
                >
                  <Icon size={16} className="mx-auto mb-1" />
                  <div className={`text-xs ${
                    isActive ? 'text-gray-400' : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {action.label}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Session Analytics */}
        <div className="mb-6">
          <h3 className={`text-sm font-semibold mb-3 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Session Analytics
          </h3>

          <div className={`p-3 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          } space-y-3`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Messages
              </span>
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {sessionAnalytics.totalMessages}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Speaking Time
              </span>
              <span className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {formatDuration(sessionAnalytics.speakingTime)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Participation
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${sessionAnalytics.participationScore}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {sessionAnalytics.participationScore}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Compliance
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${sessionAnalytics.proceduralCompliance}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {sessionAnalytics.proceduralCompliance}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Session Controls */}
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${
            theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Session Controls
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => {
                const exportData = exportSession();
                const blob = new Blob([exportData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `mun-session-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className={`w-full p-2 rounded-lg border text-sm transition-colors flex items-center justify-center space-x-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Download size={16} />
              <span>Export Session</span>
            </button>

            <button
              onClick={() => setShowPhaseDetails(!showPhaseDetails)}
              className={`w-full p-2 rounded-lg border text-sm transition-colors flex items-center justify-center space-x-2 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Flag size={16} />
              <span>Phase Details</span>
            </button>
          </div>
        </div>
      </div>

      {/* Phase Details Modal */}
      <AnimatePresence>
        {showPhaseDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPhaseDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } rounded-lg shadow-xl p-6`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {phaseConfigs[currentSession.phase].name} Phase
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Description
                  </h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {phaseConfigs[currentSession.phase].description}
                  </p>
                </div>

                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Typical Duration
                  </h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {phaseConfigs[currentSession.phase].duration}
                  </p>
                </div>

                <div>
                  <h4 className={`text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Active AI Agents
                  </h4>
                  <div className="space-y-1">
                    {currentSession.phase === 'crisis' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Crisis Agent (High Priority)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Research Agent (Supporting)
                          </span>
                        </div>
                      </>
                    )}
                    {currentSession.phase === 'resolution' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Writing Agent (Lead)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Policy Agent (Review)
                          </span>
                        </div>
                      </>
                    )}
                    {['mods', 'unmods'].includes(currentSession.phase) && (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Research Agent (Lead)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className={`text-sm ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Policy Agent (Supporting)
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPhaseDetails(false)}
                className="mt-6 w-full bg-un-blue text-white py-2 px-4 rounded-lg hover:bg-un-blue-dark transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
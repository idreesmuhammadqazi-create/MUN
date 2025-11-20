'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '../store/sessionStore';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import { Menu, X, Mic, MicOff, Settings, Globe, Clock } from 'lucide-react';
import SessionPanel from '../components/SessionPanel';
import ChatInterface from '../components/ChatInterface';
import VoiceInput from '../components/VoiceInput';
import AgentStatusPanel from '../components/AgentStatusPanel';
import UserProfile from '../components/UserProfile';
import DocumentUploader from '../components/DocumentUploader';
import { SessionPhase } from '../types';

export default function Home() {
  const {
    sidebarOpen,
    rightPanelOpen,
    voiceEnabled,
    theme,
    currentSession,
    toggleSidebar,
    toggleRightPanel,
    toggleVoice,
  } = useSessionStore();

  const { connectionStatus } = useRealtimeChat();
  const [isMobile, setIsMobile] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        // Auto-collapse sidebars on mobile
        if (sidebarOpen) toggleSidebar();
        if (rightPanelOpen) toggleRightPanel();
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarOpen, rightPanelOpen, toggleSidebar, toggleRightPanel]);

  // Apply theme
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
      },
    },
  };

  const sidebarVariants = {
    hidden: { x: -300 },
    visible: { x: 0 },
    exit: { x: -300 },
  };

  const rightPanelVariants = {
    hidden: { x: 320 },
    visible: { x: 0 },
    exit: { x: 320 },
  };

  if (!currentSession) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full mx-4"
        >
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-8`}>
            <div className="text-center mb-8">
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                MUN AI Assistant
              </h1>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Your intelligent Model United Nations debate partner
              </p>
            </div>

            <SessionSetup onComplete={() => {}} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`min-h-screen flex ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}
    >
      {/* Connection Status Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-xs text-center ${
        connectionStatus.connected
          ? 'bg-green-500 text-white'
          : connectionStatus.connecting
          ? 'bg-yellow-500 text-white'
          : 'bg-red-500 text-white'
      }`}>
        {connectionStatus.connected
          ? 'Connected to MUN AI Assistant'
          : connectionStatus.connecting
          ? 'Connecting...'
          : connectionStatus.error || 'Connection lost'}
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <div className={`fixed top-8 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="text-center">
            <h1 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {currentSession.country}
            </h1>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {currentSession.committee}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-lg ${
                voiceEnabled
                  ? 'bg-un-blue text-white'
                  : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {voiceEnabled ? <Mic size={16} /> : <MicOff size={16} />}
            </button>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Left Sidebar - Session Controls */}
      <motion.div
        variants={sidebarVariants}
        initial="hidden"
        animate={sidebarOpen ? 'visible' : 'hidden'}
        exit="exit"
        className={`fixed left-0 top-0 h-full w-80 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} z-30 ${
          !isMobile ? 'pt-16' : 'pt-24'
        }`}
      >
        <SessionPanel />
      </motion.div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isMobile
          ? 'w-full'
          : sidebarOpen
          ? 'ml-80'
          : 'ml-0'
      } ${!isMobile && rightPanelOpen ? 'mr-80' : ''}`}>
        {/* Desktop Header */}
        {!isMobile && (
          <div className={`h-16 flex items-center justify-between px-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>

              <div>
                <h1 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {currentSession.country} - {currentSession.committee}
                </h1>
                <div className="flex items-center space-x-2 text-sm">
                  <Globe size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {currentSession.topic}
                  </span>
                  <Clock size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentSession.phase === 'crisis'
                      ? 'bg-error-light text-white'
                      : 'bg-un-blue-light text-white'
                  }`}>
                    {currentSession.phase.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleVoice}
                className={`p-2 rounded-lg ${
                  voiceEnabled
                    ? 'bg-un-blue text-white'
                    : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                {voiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </button>
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <Settings size={18} />
              </button>
              <button
                onClick={toggleRightPanel}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                {rightPanelOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        )}

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatInterface />
          <VoiceInput />
        </div>
      </div>

      {/* Right Sidebar - Agent Status & Documents */}
      {!isMobile && (
        <motion.div
          variants={rightPanelVariants}
          initial="hidden"
          animate={rightPanelOpen ? 'visible' : 'hidden'}
          exit="exit"
          className={`fixed right-0 top-0 h-full w-80 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} z-30 pt-16`}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <AgentStatusPanel />
              <DocumentUploader />
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile Right Panel Overlay */}
      {isMobile && rightPanelOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className={`fixed right-0 top-0 h-full w-80 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} z-40 pt-24`}
        >
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Agent Status & Documents
              </h2>
              <button
                onClick={toggleRightPanel}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AgentStatusPanel />
              <DocumentUploader />
            </div>
          </div>
        </motion.div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowProfile(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`max-w-md w-full ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } rounded-lg shadow-xl max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <UserProfile onClose={() => setShowProfile(false)} />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Session Setup Component
function SessionSetup({ onComplete }: { onComplete: () => void }) {
  const { createSession } = useSessionStore();
  const [formData, setFormData] = useState({
    country: '',
    committee: '',
    council: '',
    topic: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.country && formData.committee && formData.topic) {
      createSession(formData);
      onComplete();
    }
  };

  const theme = 'light'; // Default theme for setup

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
          Country Representation *
        </label>
        <input
          type="text"
          required
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          className={`w-full px-4 py-2 rounded-lg border ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
          placeholder="United States"
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
          Committee *
        </label>
        <input
          type="text"
          required
          value={formData.committee}
          onChange={(e) => setFormData({ ...formData, committee: e.target.value })}
          className={`w-full px-4 py-2 rounded-lg border ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
          placeholder="General Assembly"
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
          Council
        </label>
        <input
          type="text"
          value={formData.council}
          onChange={(e) => setFormData({ ...formData, council: e.target.value })}
          className={`w-full px-4 py-2 rounded-lg border ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
          placeholder="UNGA"
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
          Topic *
        </label>
        <input
          type="text"
          required
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          className={`w-full px-4 py-2 rounded-lg border ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          } focus:ring-2 focus:ring-un-blue focus:border-transparent`}
          placeholder="Global Climate Change"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-un-blue text-white py-3 px-4 rounded-lg font-medium hover:bg-un-blue-dark transition-colors"
      >
        Start Session
      </button>
    </form>
  );
}
'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '../store/sessionStore';
import { useRealtimeChat } from '../hooks/useRealtimeChat';
import {
  Send,
  Copy,
  RefreshCw,
  Save,
  Download,
  User,
  Bot,
  AlertTriangle,
} from 'lucide-react';
import { Message, MessageType, AgentType } from '../types';

export default function ChatInterface() {
  const {
    messages,
    streamingMessage,
    activeAgent,
    agents,
    theme,
    exportSession,
  } = useSessionStore();

  const { sendChatMessage, connectionStatus } = useRealtimeChat();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !connectionStatus.connected) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setIsTyping(false);

    sendChatMessage(messageContent, {
      timestamp: new Date().toISOString(),
    });
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape') {
      setInputValue('');
      setIsTyping(false);
    }
  };

  // Copy message to clipboard
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // Regenerate response
  const regenerateResponse = (messageId: string) => {
    // Find the user message that triggered this response
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex > 0) {
      const userMessage = messages[messageIndex - 1];
      if (userMessage && userMessage.type === 'user') {
        sendChatMessage(userMessage.content, {
          regenerate: true,
          originalMessageId: messageId,
        });
      }
    }
  };

  // Get agent icon and color
  const getAgentInfo = (agentType?: AgentType) => {
    const agentConfig = {
      policy: { color: 'text-blue-500', bg: 'bg-blue-100', name: 'Policy Agent' },
      research: { color: 'text-green-500', bg: 'bg-green-100', name: 'Research Agent' },
      writing: { color: 'text-purple-500', bg: 'bg-purple-100', name: 'Writing Agent' },
      crisis: { color: 'text-red-500', bg: 'bg-red-100', name: 'Crisis Agent' },
      analytics: { color: 'text-yellow-500', bg: 'bg-yellow-100', name: 'Analytics Agent' },
    };

    return agentConfig[agentType as AgentType] || {
      color: 'text-gray-500',
      bg: 'bg-gray-100',
      name: 'Assistant'
    };
  };

  // Message animation variants
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex-1 flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={`w-16 h-16 rounded-full ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } flex items-center justify-center mb-4`}>
              <Bot size={32} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome to MUN AI Assistant
            </h3>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Ask me anything about MUN procedures, research, speech writing, or crisis management.
            </p>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message) => {
            const isUser = message.type === 'user';
            const agentInfo = getAgentInfo(message.agentType);

            return (
              <motion.div
                key={message.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-4xl space-x-3 ${
                  isUser ? 'space-x-reverse' : ''
                }`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isUser
                      ? 'bg-un-blue text-white'
                      : message.isError
                      ? 'bg-error text-white'
                      : agentInfo.bg
                  }`}>
                    {isUser ? (
                      <User size={16} />
                    ) : message.isError ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Bot size={16} className={agentInfo.color} />
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
                    {/* Agent Name */}
                    {!isUser && message.agentType && (
                      <div className={`text-xs font-medium mb-1 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {agentInfo.name}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`inline-block px-4 py-2 rounded-lg ${
                        isUser
                          ? 'bg-un-blue text-white'
                          : theme === 'dark'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-900'
                      } shadow-sm`}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                      </div>

                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className={`mt-2 pt-2 border-t ${
                          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <div className={`text-xs font-medium mb-1 ${
                            isUser ? 'text-blue-100' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            Sources:
                          </div>
                          {message.sources.slice(0, 3).map((source, index) => (
                            <div
                              key={index}
                              className={`text-xs ${
                                isUser ? 'text-blue-100' : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}
                            >
                              • {source.title}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Confidence Score */}
                      {message.confidence !== undefined && !isUser && (
                        <div className={`mt-1 text-xs ${
                          message.confidence > 0.8
                            ? 'text-green-500'
                            : message.confidence > 0.6
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}>
                          Confidence: {Math.round(message.confidence * 100)}%
                        </div>
                      )}
                    </div>

                    {/* Message Actions */}
                    <div className={`flex items-center space-x-2 mt-1 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}>
                      <span className={`text-xs ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {formatTimestamp(message.timestamp)}
                      </span>

                      {!isUser && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => copyMessage(message.content)}
                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}
                            title="Copy message"
                          >
                            <Copy size={12} />
                          </button>
                          {!message.isError && (
                            <button
                              onClick={() => regenerateResponse(message.id)}
                              className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}
                              title="Regenerate response"
                            >
                              <RefreshCw size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Streaming Message */}
        {streamingMessage && activeAgent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start space-x-3 max-w-4xl">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                getAgentInfo(activeAgent).bg
              }`}>
                <Bot size={16} className={getAgentInfo(activeAgent).color} />
              </div>
              <div>
                <div className={`text-xs font-medium mb-1 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {getAgentInfo(activeAgent).name}
                </div>
                <div
                  className={`inline-block px-4 py-2 rounded-lg ${
                    theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                  } shadow-sm`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-un-blue rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-un-blue rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-un-blue rounded-full animate-pulse delay-150"></div>
                    </div>
                    <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      {streamingMessage || 'Thinking...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Agent Status Indicators */}
        {Object.entries(agents).some(([_, agent]) => agent.status !== 'idle') && (
          <div className={`px-4 py-2 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-3 text-xs">
              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Agent Status:</span>
              {Object.entries(agents).map(([agentType, agent]) => (
                agent.status !== 'idle' && (
                  <div key={agentType} className="flex items-center space-x-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        agent.status === 'thinking' || agent.status === 'processing'
                          ? 'bg-yellow-500 animate-pulse'
                          : agent.status === 'responding'
                          ? 'bg-green-500 animate-pulse'
                          : 'bg-gray-300'
                      }`}
                    />
                    <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                      {agentType}
                    </span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Export Options */}
      {messages.length > 0 && (
        <div className={`px-4 py-2 border-t ${
          theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {messages.length} messages
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyMessage(messages.map(m => m.content).join('\n\n'))}
                className={`px-3 py-1 text-xs rounded ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } flex items-center space-x-1`}
              >
                <Copy size={12} />
                <span>Copy All</span>
              </button>
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
                className={`px-3 py-1 text-xs rounded ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } flex items-center space-x-1`}
              >
                <Download size={12} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
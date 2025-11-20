'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '../store/sessionStore';
import {
  Bot,
  UserCheck,
  Search,
  FileText,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Gavel,
} from 'lucide-react';
import { AgentType, AgentStatus } from '../types';

interface AgentConfig {
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  expertise: string[];
}

export default function AgentStatusPanel() {
  const { agents, theme, activeAgent } = useSessionStore();

  const agentConfigs: Record<AgentType, AgentConfig> = {
    policy: {
      name: 'Policy Agent',
      icon: Gavel,
      color: 'text-blue-500',
      description: 'MUN rules and procedures expertise',
      expertise: ['Parliamentary Procedure', 'MUN Rules', 'Diplomatic Protocol', 'Motion Guidance'],
    },
    research: {
      name: 'Research Agent',
      icon: Search,
      color: 'text-green-500',
      description: 'Real-time research and fact-checking',
      expertise: ['Fact Verification', 'Source Analysis', 'Data Research', 'Citation Management'],
    },
    writing: {
      name: 'Writing Agent',
      icon: FileText,
      color: 'text-purple-500',
      description: 'Speech and document drafting',
      expertise: ['Speech Writing', 'Resolution Drafting', 'Diplomatic Language', 'Position Papers'],
    },
    crisis: {
      name: 'Crisis Agent',
      icon: AlertTriangle,
      color: 'text-red-500',
      description: 'Crisis analysis and rapid response',
      expertise: ['Crisis Assessment', 'Rapid Response', 'Strategy Planning', 'Risk Analysis'],
    },
    analytics: {
      name: 'Analytics Agent',
      icon: TrendingUp,
      color: 'text-yellow-500',
      description: 'Session performance analysis',
      expertise: ['Performance Metrics', 'Voting Patterns', 'Participation Tracking', 'Strategic Insights'],
    },
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'idle':
        return <Clock size={14} className="text-gray-400" />;
      case 'thinking':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />;
      case 'processing':
        return <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />;
      case 'responding':
        return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />;
      case 'error':
        return <AlertCircle size={14} className="text-red-500" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  const getStatusText = (status: AgentStatus) => {
    switch (status) {
      case 'idle':
        return 'Idle';
      case 'thinking':
        return 'Thinking...';
      case 'processing':
        return 'Processing...';
      case 'responding':
        return 'Responding...';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'idle':
        return theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
      case 'thinking':
        return 'text-yellow-500';
      case 'processing':
        return 'text-blue-500';
      case 'responding':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className={`text-lg font-semibold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Agent Status
        </h3>
        <p className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Real-time monitoring of specialized AI agents
        </p>
      </div>

      {/* Agent List */}
      <div className="space-y-4">
        {Object.entries(agentConfigs).map(([agentType, config]) => {
          const agent = agents[agentType as AgentType];
          const Icon = config.icon;
          const isActive = activeAgent === agentType;

          return (
            <motion.div
              key={agentType}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Object.keys(agentConfigs).indexOf(agentType) * 0.1 }}
              className={`p-3 rounded-lg border transition-all ${
                isActive
                  ? theme === 'dark'
                    ? 'bg-gray-700 border-un-blue'
                    : 'bg-blue-50 border-un-blue'
                  : theme === 'dark'
                  ? 'bg-gray-700 border-gray-600'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Agent Header */}
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  theme === 'dark' ? 'bg-gray-600' : 'bg-white'
                }`}>
                  <Icon size={20} className={config.color} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {config.name}
                    </h4>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(agent.status)}
                      <span className={`text-xs ${getStatusColor(agent.status)}`}>
                        {getStatusText(agent.status)}
                      </span>
                    </div>
                  </div>
                  <p className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {config.description}
                  </p>
                </div>
              </div>

              {/* Agent Status Details */}
              <div className="space-y-2">
                {/* Expertise Tags */}
                <div className="flex flex-wrap gap-1">
                  {config.expertise.map((skill, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 text-xs rounded-full ${
                        theme === 'dark'
                          ? 'bg-gray-600 text-gray-300'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Performance Metrics */}
                {agent.lastResponse && (
                  <div className={`text-xs space-y-1 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span>Last Response:</span>
                      <span className={getConfidenceColor(agent.confidence)}>
                        {Math.round(agent.confidence * 100)}% confidence
                      </span>
                    </div>

                    {/* Context Items */}
                    {agent.context.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <Activity size={12} />
                        <span>{agent.context.length} context items</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Active Task */}
                {agent.taskId && (
                  <div className={`flex items-center space-x-2 text-xs ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Working on task...</span>
                  </div>
                )}
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className={`mt-3 pt-3 border-t ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                }`}>
                  <div className={`flex items-center space-x-2 text-xs ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    <CheckCircle size={12} />
                    <span>Currently active</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Agent Collaboration Status */}
      <div className={`mt-6 p-3 rounded-lg ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
      }`}>
        <h4 className={`text-sm font-medium mb-2 ${
          theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
        }`}>
          Collaboration Status
        </h4>

        <div className="space-y-2">
          {/* Active Agents Count */}
          <div className="flex items-center justify-between text-sm">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Active Agents
            </span>
            <span className={`font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {Object.values(agents).filter(agent => agent.status !== 'idle').length} / 5
            </span>
          </div>

          {/* Overall System Status */}
          <div className="flex items-center justify-between text-sm">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              System Status
            </span>
            <div className={`flex items-center space-x-1 ${
              Object.values(agents).some(agent => agent.status === 'error')
                ? 'text-red-500'
                : Object.values(agents).some(agent => agent.status !== 'idle')
                ? 'text-green-500'
                : 'text-gray-500'
            }`}>
              <Bot size={14} />
              <span className="font-medium">
                {Object.values(agents).some(agent => agent.status === 'error')
                  ? 'Issues Detected'
                  : Object.values(agents).some(agent => agent.status !== 'idle')
                  ? 'Operating'
                  : 'Standby'}
              </span>
            </div>
          </div>

          {/* Average Confidence */}
          <div className="flex items-center justify-between text-sm">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Avg. Confidence
            </span>
            <span className={`font-medium ${getConfidenceColor(
              Object.values(agents).reduce((sum, agent) => sum + agent.confidence, 0) / 5
            )}`}>
              {Math.round(
                (Object.values(agents).reduce((sum, agent) => sum + agent.confidence, 0) / 5) * 100
              )}%
            </span>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className={`mt-4 p-3 rounded-lg ${
        theme === 'dark' ? 'bg-gray-700' : 'bg-yellow-50 border border-yellow-200'
      }`}>
        <div className="flex items-start space-x-2">
          <UserCheck size={16} className={theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} />
          <div>
            <h4 className={`text-sm font-medium mb-1 ${
              theme === 'dark' ? 'text-yellow-400' : 'text-yellow-800'
            }`}>
              Performance Tips
            </h4>
            <ul className={`text-xs space-y-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <li>• Be specific with questions for better agent routing</li>
              <li>• Use phase-specific queries for optimal responses</li>
              <li>• Provide context when asking complex questions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
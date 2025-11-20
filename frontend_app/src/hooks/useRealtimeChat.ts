import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import {
  WebSocketMessage,
  ClientToServerMessages,
  ServerToClientMessages,
  AgentType,
  SessionPhase,
} from '../types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 15000]; // Exponential backoff
const MAX_RECONNECT_ATTEMPTS = 5;
const PING_INTERVAL = 30000; // 30 seconds
const MESSAGE_QUEUE_SIZE = 100;

export const useRealtimeChat = () => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);

  const {
    connectionStatus,
    setConnectionStatus,
    addMessage,
    updateAgentStatus,
    updateSession,
    setActiveAgent,
    setStreamingMessage,
    currentSession,
    agents,
  } = useSessionStore();

  // Clear reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Clear ping interval
  const clearPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Handle WebSocket connection
  const connect = useCallback(() => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;
    clearReconnectTimeout();

    setConnectionStatus({
      connecting: true,
      connected: false,
      error: undefined,
    });

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;

        setConnectionStatus({
          connected: true,
          connecting: false,
          error: undefined,
          lastConnected: new Date(),
          reconnectAttempts: 0,
        });

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL);

        // Send authentication if we have a session
        if (currentSession) {
          sendMessage({
            type: 'auth',
            userId: 'current-user', // This would come from auth context
            sessionId: currentSession.id,
          });
        }

        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const queuedMessage = messageQueueRef.current.shift();
          if (queuedMessage) {
            ws.send(JSON.stringify(queuedMessage));
          }
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        isConnectingRef.current = false;
        clearPingInterval();

        setConnectionStatus({
          connected: false,
          connecting: false,
        });

        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAYS[Math.min(reconnectAttemptsRef.current, RECONNECT_DELAYS.length - 1)];
          reconnectAttemptsRef.current++;

          setConnectionStatus({
            error: `Connection lost. Reconnecting... (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`,
            reconnectAttempts: reconnectAttemptsRef.current,
          });

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setConnectionStatus({
            error: 'Unable to reconnect. Please refresh the page.',
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnectingRef.current = false;
        setConnectionStatus({
          error: 'Connection error occurred.',
        });
      };

    } catch (error) {
      isConnectingRef.current = false;
      setConnectionStatus({
        error: 'Failed to establish connection.',
      });
    }
  }, [currentSession, setConnectionStatus, clearReconnectTimeout, clearPingInterval]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'system':
        console.log('System message:', message.message);
        addMessage({
          type: 'system',
          content: message.message,
          sessionId: currentSession?.id || 'default',
          metadata: { clientId: message.clientId },
        });
        break;

      case 'auth_success':
        console.log('Authentication successful');
        setConnectionStatus({
          connected: true,
          connecting: false,
          error: undefined,
        });
        break;

      case 'message':
        addMessage(message.message);
        break;

      case 'agent_status':
        updateAgentStatus(message.agentType as AgentType, {
          status: message.status as any,
          taskId: message.taskId,
        });
        break;

      case 'agent_response':
        // Handle streaming response
        if (message.content) {
          setStreamingMessage(message.content);
        }

        // Update agent status
        updateAgentStatus(message.agentType as AgentType, {
          status: 'responding',
          taskId: message.taskId,
        });

        // When streaming is complete, add the message
        if (!message.isError && message.content) {
          addMessage({
            type: 'agent',
            agentType: message.agentType as AgentType,
            content: message.content,
            sessionId: currentSession?.id || 'default',
            metadata: message.metadata,
            sources: message.sources,
            confidence: message.confidence,
            isError: message.isError,
          });

          // Clear streaming message after adding to chat
          setStreamingMessage('');
        }
        break;

      case 'session_update':
        updateSession({
          phase: message.session.currentPhase,
          ...message.session,
        });
        break;

      case 'document_processed':
        console.log('Document processed:', message.documentInfo);
        break;

      case 'error':
        console.error('Server error:', message.message);
        addMessage({
          type: 'system',
          content: `Error: ${message.message}`,
          sessionId: currentSession?.id || 'default',
          metadata: { type: 'error' },
        });
        break;

      case 'pong':
        // Ping-pong response, no action needed
        break;

      default:
        console.warn('Unknown message type:', message.type);
    }
  }, [currentSession, addMessage, updateAgentStatus, updateSession, setStreamingMessage, setConnectionStatus]);

  // Send message to WebSocket server
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      if (messageQueueRef.current.length < MESSAGE_QUEUE_SIZE) {
        messageQueueRef.current.push(message);
      } else {
        console.warn('Message queue full, dropping message:', message);
      }

      // Try to connect if not already connected
      if (!connectionStatus.connected && !connectionStatus.connecting) {
        connect();
      }
    }
  }, [connectionStatus.connected, connectionStatus.connecting, connect]);

  // Send chat message
  const sendChatMessage = useCallback((content: string, metadata: Record<string, any> = {}) => {
    sendMessage({
      type: 'chat',
      content,
      metadata: {
        timestamp: new Date().toISOString(),
        sessionId: currentSession?.id,
        ...metadata,
      },
    });
  }, [sendMessage, currentSession]);

  // Send session update
  const sendSessionUpdate = useCallback((updates: {
    phase?: SessionPhase;
    country?: string;
    council?: string;
    committee?: string;
    topic?: string;
    phaseData?: Record<string, any>;
  }) => {
    if (!currentSession) return;

    sendMessage({
      type: 'session_update',
      ...updates,
      country: updates.country || currentSession.country,
      council: updates.council || currentSession.council,
      committee: updates.committee || currentSession.committee,
      topic: updates.topic || currentSession.topic,
      phaseData: updates.phaseData || {},
    });
  }, [sendMessage, currentSession]);

  // Send voice transcript
  const sendVoiceTranscript = useCallback((transcript: string, confidence: number, duration: number) => {
    sendMessage({
      type: 'voice_transcript',
      transcript,
      confidence,
      duration,
    });
  }, [sendMessage]);

  // Send document upload
  const sendDocumentUpload = useCallback((documentInfo: {
    filename: string;
    fileType: string;
    fileSize: number;
    content: string;
    summary: string;
  }) => {
    sendMessage({
      type: 'document_upload',
      documentInfo,
    });
  }, [sendMessage]);

  // Request agent status
  const requestAgentStatus = useCallback(() => {
    sendMessage({
      type: 'agent_status',
    });
  }, [sendMessage]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    clearPingInterval();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    isConnectingRef.current = false;
    reconnectAttemptsRef.current = 0;
    messageQueueRef.current = [];

    setConnectionStatus({
      connected: false,
      connecting: false,
      error: undefined,
    });
  }, [clearReconnectTimeout, clearPingInterval, setConnectionStatus]);

  // Initialize connection on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearReconnectTimeout();
      clearPingInterval();
    };
  }, [clearReconnectTimeout, clearPingInterval]);

  return {
    connectionStatus,
    sendMessage,
    sendChatMessage,
    sendSessionUpdate,
    sendVoiceTranscript,
    sendDocumentUpload,
    requestAgentStatus,
    connect,
    disconnect,
  };
};
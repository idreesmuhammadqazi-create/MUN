import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  SessionState,
  AgentInfo,
  ChatMessage,
  DocumentInfo,
  AgentStatus,
  SessionPhase,
  AgentType,
  ConnectionStatus,
  VoiceRecognition,
  MUNSession
} from '../types';

interface SessionStore {
  // Session data
  currentSession: SessionState | null;
  sessions: MUNSession[];

  // Agent communication
  agents: Record<AgentType, AgentInfo>;

  // Message history
  messages: ChatMessage[];
  streamingMessage: string;
  activeAgent: AgentType | null;

  // Documents
  documents: DocumentInfo[];
  uploadingDocuments: boolean;

  // UI state
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  voiceEnabled: boolean;
  transcriptionMode: 'push-to-talk' | 'continuous';
  theme: 'light' | 'dark' | 'high-contrast';

  // Connection state
  connectionStatus: ConnectionStatus;

  // Voice recognition state
  voiceRecognition: VoiceRecognition;

  // Actions
  // Session management
  createSession: (sessionData: Partial<SessionState>) => string;
  updateSession: (updates: Partial<SessionState>) => void;
  changePhase: (newPhase: SessionPhase) => void;
  endSession: () => void;

  // Agent management
  updateAgentStatus: (agentType: AgentType, status: Partial<AgentInfo>) => void;
  setActiveAgent: (agentType: AgentType | null) => void;
  resetAgents: () => void;

  // Message management
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setStreamingMessage: (content: string) => void;

  // Document management
  addDocument: (document: Omit<DocumentInfo, 'id'>) => void;
  updateDocument: (documentId: string, updates: Partial<DocumentInfo>) => void;
  removeDocument: (documentId: string) => void;
  setUploadingDocuments: (uploading: boolean) => void;

  // UI actions
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  setSidebarOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleVoice: () => void;
  setTranscriptionMode: (mode: 'push-to-talk' | 'continuous') => void;
  setTheme: (theme: 'light' | 'dark' | 'high-contrast') => void;

  // Connection management
  setConnectionStatus: (status: Partial<ConnectionStatus>) => void;

  // Voice recognition management
  setVoiceRecognition: (recognition: Partial<VoiceRecognition>) => void;

  // Export functionality
  exportSession: () => string;
  importSession: (sessionData: string) => void;
}

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial agent state
const initialAgentState: Record<AgentType, AgentInfo> = {
  policy: {
    status: 'idle',
    lastResponse: '',
    confidence: 0,
    context: [],
  },
  research: {
    status: 'idle',
    lastResponse: '',
    confidence: 0,
    context: [],
  },
  writing: {
    status: 'idle',
    lastResponse: '',
    confidence: 0,
    context: [],
  },
  crisis: {
    status: 'idle',
    lastResponse: '',
    confidence: 0,
    context: [],
  },
  analytics: {
    status: 'idle',
    lastResponse: '',
    confidence: 0,
    context: [],
  },
};

// Initial voice recognition state
const initialVoiceRecognition: VoiceRecognition = {
  isSupported: false,
  isListening: false,
  transcript: '',
  confidence: 0,
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentSession: null,
      sessions: [],
      agents: initialAgentState,
      messages: [],
      streamingMessage: '',
      activeAgent: null,
      documents: [],
      uploadingDocuments: false,
      sidebarOpen: true,
      rightPanelOpen: true,
      voiceEnabled: false,
      transcriptionMode: 'push-to-talk',
      theme: 'light',
      connectionStatus: {
        connected: false,
        connecting: false,
        reconnectAttempts: 0,
      },
      voiceRecognition: initialVoiceRecognition,

      // Session management
      createSession: (sessionData) => {
        const sessionId = generateId();
        const newSession: SessionState = {
          id: sessionId,
          country: sessionData.country || 'United States',
          committee: sessionData.committee || 'General Assembly',
          council: sessionData.council || 'UNGA',
          topic: sessionData.topic || 'Global Climate Change',
          phase: sessionData.phase || 'lobby',
          startTime: new Date(),
          duration: 0,
        };

        set((state) => ({
          currentSession: newSession,
          sessions: [...state.sessions, {
            id: sessionId,
            userId: 'current-user', // This would come from auth
            country: newSession.country,
            council: newSession.council,
            committee: newSession.committee,
            topic: newSession.topic,
            currentPhase: newSession.phase,
            phaseData: {},
            agentContext: {
              documents: [],
            },
            messageHistory: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          }],
          messages: [],
        }));

        return sessionId;
      },

      updateSession: (updates) => {
        set((state) => {
          if (!state.currentSession) return state;

          const updatedSession = { ...state.currentSession, ...updates };
          return {
            currentSession: updatedSession,
            sessions: state.sessions.map(session =>
              session.id === updatedSession.id
                ? { ...session, ...updates, updatedAt: new Date() }
                : session
            ),
          };
        });
      },

      changePhase: (newPhase) => {
        const { currentSession } = get();
        if (!currentSession) return;

        get().updateSession({ phase: newPhase });
      },

      endSession: () => {
        set({
          currentSession: null,
          messages: [],
          activeAgent: null,
          streamingMessage: '',
        });
      },

      // Agent management
      updateAgentStatus: (agentType, status) => {
        set((state) => ({
          agents: {
            ...state.agents,
            [agentType]: { ...state.agents[agentType], ...status },
          },
        }));
      },

      setActiveAgent: (agentType) => {
        set({ activeAgent: agentType });
      },

      resetAgents: () => {
        set({ agents: initialAgentState, activeAgent: null });
      },

      // Message management
      addMessage: (messageData) => {
        const message: ChatMessage = {
          ...messageData,
          id: generateId(),
          timestamp: new Date(),
        };

        set((state) => ({
          messages: [...state.messages, message],
          streamingMessage: '',
        }));

        // Update agent's last response if it's an agent message
        if (message.type === 'agent' && message.agentType) {
          get().updateAgentStatus(message.agentType, {
            lastResponse: message.content,
            confidence: message.confidence || 0,
          });
        }
      },

      updateMessage: (messageId, updates) => {
        set((state) => ({
          messages: state.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        }));
      },

      clearMessages: () => {
        set({ messages: [], streamingMessage: '' });
      },

      setStreamingMessage: (content) => {
        set({ streamingMessage: content });
      },

      // Document management
      addDocument: (documentData) => {
        const document: DocumentInfo = {
          ...documentData,
          id: generateId(),
          uploadedAt: new Date(),
        };

        set((state) => ({
          documents: [...state.documents, document],
        }));
      },

      updateDocument: (documentId, updates) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === documentId ? { ...doc, ...updates } : doc
          ),
        }));
      },

      removeDocument: (documentId) => {
        set((state) => ({
          documents: state.documents.filter(doc => doc.id !== documentId),
        }));
      },

      setUploadingDocuments: (uploading) => {
        set({ uploadingDocuments: uploading });
      },

      // UI actions
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      toggleRightPanel: () => {
        set((state) => ({ rightPanelOpen: !state.rightPanelOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setRightPanelOpen: (open) => {
        set({ rightPanelOpen: open });
      },

      toggleVoice: () => {
        set((state) => ({ voiceEnabled: !state.voiceEnabled }));
      },

      setTranscriptionMode: (mode) => {
        set({ transcriptionMode: mode });
      },

      setTheme: (theme) => {
        set({ theme });
      },

      // Connection management
      setConnectionStatus: (status) => {
        set((state) => ({
          connectionStatus: { ...state.connectionStatus, ...status },
        }));
      },

      // Voice recognition management
      setVoiceRecognition: (recognition) => {
        set((state) => ({
          voiceRecognition: { ...state.voiceRecognition, ...recognition },
        }));
      },

      // Export functionality
      exportSession: () => {
        const { currentSession, messages, documents } = get();
        if (!currentSession) return '';

        const exportData = {
          session: currentSession,
          messages,
          documents,
          exportedAt: new Date().toISOString(),
        };

        return JSON.stringify(exportData, null, 2);
      },

      importSession: (sessionData) => {
        try {
          const parsedData = JSON.parse(sessionData);
          const { session, messages, documents } = parsedData;

          set({
            currentSession: session,
            messages: messages || [],
            documents: documents || [],
          });
        } catch (error) {
          console.error('Failed to import session:', error);
        }
      },
    }),
    {
      name: 'mun-session-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSession: state.currentSession,
        messages: state.messages.slice(-50), // Only persist last 50 messages
        documents: state.documents,
        theme: state.theme,
        voiceEnabled: state.voiceEnabled,
        transcriptionMode: state.transcriptionMode,
      }),
    }
  )
);
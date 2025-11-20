export type SessionPhase = 'lobby' | 'mods' | 'unmods' | 'gsl' | 'crisis' | 'resolution';

export type AgentType = 'policy' | 'research' | 'writing' | 'crisis' | 'analytics';

export type AgentStatus = 'idle' | 'thinking' | 'processing' | 'responding' | 'error';

export type MessageType = 'user' | 'agent' | 'system';

export interface SessionState {
  id: string;
  country: string;
  committee: string;
  council: string;
  topic: string;
  phase: SessionPhase;
  startTime: Date;
  duration: number;
}

export interface AgentInfo {
  status: AgentStatus;
  lastResponse: string;
  confidence: number;
  context: string[];
  taskId?: string;
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  agentType?: AgentType;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  sessionId: string;
  sources?: Array<{
    title: string;
    url: string;
    credibility: number;
  }>;
  confidence?: number;
  isError?: boolean;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface ClientToServerMessages {
  auth: {
    userId: string;
    sessionId: string;
  };
  chat: {
    content: string;
    metadata: Record<string, any>;
  };
  session_update: {
    phase: SessionPhase;
    country: string;
    council: string;
    committee: string;
    topic: string;
    phaseData: Record<string, any>;
  };
  voice_transcript: {
    transcript: string;
    confidence: number;
    duration: number;
  };
  document_upload: {
    documentInfo: {
      filename: string;
      fileType: string;
      fileSize: number;
      content: string; // base64
      summary: string;
    };
  };
  agent_status: Record<string, never>;
}

export interface ServerToClientMessages {
  system: {
    message: string;
    clientId: string;
  };
  auth_success: {
    clientId: string;
    userId: string;
    sessionId: string;
  };
  message: ChatMessage;
  agent_status: {
    agentType: AgentType;
    status: string;
    taskId: string;
  };
  agent_response: {
    agentType: AgentType;
    content: string;
    taskId: string;
    metadata: Record<string, any>;
    sources: Array<{
      title: string;
      url: string;
      credibility: number;
    }>;
    confidence: number;
    isError: boolean;
  };
  session_update: {
    session: SessionState;
  };
  document_processed: {
    documentInfo: {
      filename: string;
      fileType: string;
      summary: string;
    };
  };
  error: {
    message: string;
  };
}

export interface DocumentInfo {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  contentSummary: string;
  embeddingId?: string;
  tags: string[];
  uploadedAt: Date;
  processed: boolean;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredCountry?: string;
  preferredCouncil?: string;
  preferredCommittee?: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sessionReminders: boolean;
    deadlineAlerts: boolean;
  };
  voiceSettings: {
    language: string;
    accent: string;
    autoSend: boolean;
    pushToTalk: boolean;
  };
  theme: 'light' | 'dark' | 'high-contrast';
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionAnalytics {
  totalMessages: number;
  speakingTime: number; // in seconds
  participationScore: number;
  votingPatterns: {
    for: number;
    against: number;
    abstain: number;
  };
  blocAlignments: string[];
  proceduralCompliance: number;
  strategicInsights: string[];
}

export interface PhaseData {
  lobby?: {
    preparationChecklist: string[];
    documentsRequired: string[];
    researchSuggestions: string[];
  };
  mods?: {
    speakingQueue: Array<{
      delegate: string;
      country: string;
      timeRemaining: number;
    }>;
    currentSpeaker: string;
    timeRemaining: number;
  };
  unmods?: {
    negotiationTracker: Array<{
      countries: string[];
      topic: string;
      status: 'ongoing' | 'completed' | 'stalled';
    }>;
    blocFormations: string[];
  };
  gsl?: {
    speakingOrder: Array<{
      country: string;
      timeLimit: number;
      position: number;
    }>;
    currentPosition: number;
  };
  crisis?: {
    alertLevel: 'low' | 'medium' | 'high' | 'critical';
    breakingNews: Array<{
      title: string;
      content: string;
      timestamp: Date;
      source: string;
    }>;
    rapidResponseTools: string[];
  };
  resolution?: {
    draftResolutions: Array<{
      id: string;
      title: string;
      status: 'draft' | 'submitted' | 'amended' | 'voted';
      sponsors: string[];
      clauses: string[];
    }>;
    amendments: Array<{
      id: string;
      resolutionId: string;
      type: 'addition' | 'deletion' | 'modification';
      text: string;
      proposer: string;
    }>;
    votingStatus: 'not-started' | 'in-progress' | 'completed';
  };
}

export interface MUNSession {
  id: string;
  userId: string;
  country: string;
  council: string;
  committee: string;
  topic: string;
  currentPhase: SessionPhase;
  phaseData: PhaseData;
  agentContext: {
    documents: DocumentInfo[];
    [key: string]: any;
  };
  messageHistory: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceRecognition {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  confidence: number;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
}
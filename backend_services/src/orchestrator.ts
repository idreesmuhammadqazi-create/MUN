import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { Logger } from 'winston';
import Anthropic from '@anthropic-ai/sdk';
import { ResearchAgent, ResearchQuery, ResearchResult } from './agents/researchAgent';
import { PolicyAgent } from './agents/policyAgent';
import { WritingAgent } from './agents/writingAgent';
import { CrisisAgent } from './agents/crisisAgent';
import { AnalyticsAgent } from './agents/analyticsAgent';

export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'agent' | 'system';
  agentType?: 'policy' | 'research' | 'writing' | 'crisis' | 'analytics';
  timestamp: Date;
  metadata?: Record<string, any>;
  sessionId: string;
}

export interface AgentTask {
  id: string;
  type: 'research' | 'policy' | 'writing' | 'crisis' | 'analytics';
  priority: 'low' | 'medium' | 'high' | 'critical';
  query: any;
  context: any;
  dependencies: string[];
  assignedAgent?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MUNSession {
  id: string;
  userId: string;
  country: string;
  council: string;
  committee: string;
  topic: string;
  currentPhase: 'lobby' | 'mods' | 'unmods' | 'gsl' | 'crisis' | 'resolution';
  phaseData: Record<string, any>;
  agentContext: Record<string, any>;
  messageHistory: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WebSocketClient {
  id: string;
  socket: WebSocket;
  sessionId: string;
  userId: string;
  lastActivity: Date;
}

export class Orchestrator extends EventEmitter {
  private wsServer: WebSocket.Server;
  private clients: Map<string, WebSocketClient> = new Map();
  private sessions: Map<string, MUNSession> = new Map();
  private taskQueue: AgentTask[] = [];
  private activeTasks: Map<string, AgentTask> = new Map();

  private researchAgent: ResearchAgent;
  private policyAgent: PolicyAgent;
  private writingAgent: WritingAgent;
  private crisisAgent: CrisisAgent;
  private analyticsAgent: AnalyticsAgent;

  private anthropic: Anthropic;
  private logger: Logger;
  private isProcessingQueue = false;

  constructor(port: number, anthropicApiKey: string, logger: Logger) {
    super();
    this.logger = logger;
    this.anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Initialize WebSocket server
    this.wsServer = new WebSocket.Server({ port });
    this.setupWebSocketServer();

    // Initialize agents
    this.researchAgent = new ResearchAgent(anthropicApiKey, logger);
    this.policyAgent = new PolicyAgent(anthropicApiKey, logger);
    this.writingAgent = new WritingAgent(anthropicApiKey, logger);
    this.crisisAgent = new CrisisAgent(anthropicApiKey, logger);
    this.analyticsAgent = new AnalyticsAgent(anthropicApiKey, logger);

    // Start task processing
    this.startTaskProcessor();

    // Cleanup interval
    setInterval(() => this.cleanupInactiveClients(), 60000); // Every minute

    this.logger.info(`Orchestrator started on WebSocket port ${port}`);
  }

  private setupWebSocketServer(): void {
    this.wsServer.on('connection', (ws: WebSocket, req) => {
      const clientId = this.generateClientId();
      const client: WebSocketClient = {
        id: clientId,
        socket: ws,
        sessionId: '',
        userId: '',
        lastActivity: new Date()
      };

      this.clients.set(clientId, client);
      this.logger.info(`Client connected: ${clientId}`);

      ws.on('message', (data: WebSocket.Data) => {
        this.handleClientMessage(clientId, data);
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        this.logger.info(`Client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        this.logger.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'system',
        message: 'Connected to MUN AI Assistant',
        clientId
      });
    });
  }

  private async handleClientMessage(clientId: string, data: WebSocket.Data): Promise<void> {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      client.lastActivity = new Date();

      const message = JSON.parse(data.toString());
      this.logger.debug(`Received message from client ${clientId}:`, message);

      switch (message.type) {
        case 'auth':
          await this.handleAuth(clientId, message);
          break;
        case 'chat':
          await this.handleChatMessage(clientId, message);
          break;
        case 'session_update':
          await this.handleSessionUpdate(clientId, message);
          break;
        case 'voice_transcript':
          await this.handleVoiceTranscript(clientId, message);
          break;
        case 'document_upload':
          await this.handleDocumentUpload(clientId, message);
          break;
        case 'agent_status':
          this.sendAgentStatus(clientId);
          break;
        default:
          this.logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling client message:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Failed to process message'
      });
    }
  }

  private async handleAuth(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    // In production, verify JWT token
    client.userId = message.userId || 'anonymous';
    client.sessionId = message.sessionId || this.generateSessionId();

    this.sendToClient(clientId, {
      type: 'auth_success',
      clientId,
      userId: client.userId,
      sessionId: client.sessionId
    });
  }

  private async handleChatMessage(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    const chatMessage: ChatMessage = {
      id: this.generateMessageId(),
      content: message.content,
      type: 'user',
      timestamp: new Date(),
      sessionId: client.sessionId,
      metadata: message.metadata || {}
    };

    // Add to session history
    this.addToSessionHistory(client.sessionId, chatMessage);

    // Broadcast message to all clients in the session
    this.broadcastToSession(client.sessionId, {
      type: 'message',
      message: chatMessage
    });

    // Analyze and create tasks
    await this.analyzeMessageAndCreateTasks(client.sessionId, chatMessage);
  }

  private async analyzeMessageAndCreateTasks(sessionId: string, message: ChatMessage): Promise<void> {
    const session = this.getOrCreateSession(sessionId);

    try {
      // Analyze message to determine which agents should respond
      const analysis = await this.analyzeMessage(message, session);

      this.logger.info(`Message analysis for session ${sessionId}:`, analysis);

      // Create tasks based on analysis
      const tasks = this.createTasksFromAnalysis(message, session, analysis);

      // Add tasks to queue
      for (const task of tasks) {
        this.addTaskToQueue(task);
      }

    } catch (error) {
      this.logger.error(`Failed to analyze message for session ${sessionId}:`, error);

      // Send error message to client
      this.broadcastToSession(sessionId, {
        type: 'agent_response',
        agentType: 'system',
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        isError: true
      });
    }
  }

  private async analyzeMessage(message: ChatMessage, session: MUNSession): Promise<{
    needsResearch: boolean;
    needsPolicy: boolean;
    needsWriting: boolean;
    needsCrisis: boolean;
    needsAnalytics: boolean;
    priority: 'low' | 'medium' | 'high' | 'critical';
    agentSequence: string[];
  }> {
    const content = message.content.toLowerCase();
    const currentPhase = session.currentPhase;

    const analysis = {
      needsResearch: false,
      needsPolicy: false,
      needsWriting: false,
      needsCrisis: false,
      needsAnalytics: false,
      priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
      agentSequence: [] as string[]
    };

    // Research indicators
    if (content.match(/what|who|where|when|why|how|tell me|explain|research|find|look up|information|data|facts|statistics|source|evidence/)) {
      analysis.needsResearch = true;
    }

    // Policy/MUN procedure indicators
    if (content.match(/rule|procedure|motion|amendment|resolution|voting|caucus|speakers list|parliamentary|united nations|model un|mun|delegate|committee|council|moderated|unmoderated/)) {
      analysis.needsPolicy = true;
    }

    // Writing assistance indicators
    if (content.match(/write|draft|speech|statement|position paper|resolution clause|amendment|help me word|formal language|diplomatic/)) {
      analysis.needsWriting = true;
    }

    // Crisis indicators
    if (content.match(/crisis|emergency|urgent|breaking|latest news|current situation|developing|rapid response/)) {
      analysis.needsCrisis = true;
      analysis.priority = 'high';
    }

    // Analytics indicators
    if (content.match(/analyze|track|time|speaking order|voting patterns|bloc|strategy|assessment|progress|summary/)) {
      analysis.needsAnalytics = true;
    }

    // Phase-specific needs
    if (currentPhase === 'crisis') {
      analysis.needsCrisis = true;
      analysis.needsResearch = true;
      analysis.priority = 'high';
    } else if (currentPhase === 'resolution') {
      analysis.needsWriting = true;
      analysis.needsPolicy = true;
    } else if (currentPhase === 'mods' || currentPhase === 'unmods') {
      analysis.needsResearch = true;
      analysis.needsPolicy = true;
    }

    // Determine agent sequence based on content and phase
    if (analysis.needsResearch && analysis.needsWriting) {
      analysis.agentSequence = ['research', 'writing'];
    } else if (analysis.needsPolicy && analysis.needsResearch) {
      analysis.agentSequence = ['policy', 'research'];
    } else if (analysis.needsCrisis) {
      analysis.agentSequence = ['crisis', 'research'];
    } else if (analysis.needsWriting) {
      analysis.agentSequence = analysis.needsResearch ? ['research', 'writing'] : ['writing'];
    } else if (analysis.needsPolicy) {
      analysis.agentSequence = ['policy'];
    } else if (analysis.needsResearch) {
      analysis.agentSequence = ['research'];
    } else if (analysis.needsAnalytics) {
      analysis.agentSequence = ['analytics'];
    }

    // Default to research if no specific needs identified
    if (analysis.agentSequence.length === 0) {
      analysis.agentSequence = ['research'];
      analysis.needsResearch = true;
    }

    return analysis;
  }

  private createTasksFromAnalysis(message: ChatMessage, session: MUNSession, analysis: any): AgentTask[] {
    const tasks: AgentTask[] = [];

    for (const agentType of analysis.agentSequence) {
      const task: AgentTask = {
        id: this.generateTaskId(),
        type: agentType as 'research' | 'policy' | 'writing' | 'crisis' | 'analytics',
        priority: analysis.priority,
        query: message.content,
        context: {
          sessionId: session.id,
          phase: session.currentPhase,
          country: session.country,
          council: session.council,
          committee: session.committee,
          topic: session.topic,
          messageHistory: session.messageHistory.slice(-5), // Last 5 messages for context
          metadata: message.metadata
        },
        dependencies: [], // Will be filled based on agentSequence
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add dependencies based on sequence
      const agentIndex = analysis.agentSequence.indexOf(agentType);
      if (agentIndex > 0) {
        // Depends on previous agent in sequence
        task.dependencies = tasks.slice(-1).map(t => t.id);
      }

      tasks.push(task);
    }

    return tasks;
  }

  private addTaskToQueue(task: AgentTask): void {
    this.taskQueue.push(task);
    this.sortTaskQueue();
    this.logger.debug(`Added task to queue: ${task.id} (${task.type})`);
  }

  private sortTaskQueue(): void {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };

    this.taskQueue.sort((a, b) => {
      // First by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private async startTaskProcessor(): Promise<void> {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.taskQueue.length > 0) {
        await this.processTaskQueue();
      }
    }, 100); // Process every 100ms
  }

  private async processTaskQueue(): Promise<void> {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;

    try {
      while (this.taskQueue.length > 0 && this.activeTasks.size < 5) { // Max 5 concurrent tasks
        const task = this.taskQueue.shift();
        if (!task) break;

        // Check dependencies
        if (task.dependencies.length > 0) {
          const dependenciesMet = task.dependencies.every(depId => {
            const dep = this.activeTasks.get(depId);
            return !dep || dep.status === 'completed';
          });

          if (!dependenciesMet) {
            // Put back in queue
            this.taskQueue.push(task);
            continue;
          }
        }

        // Execute task
        this.activeTasks.set(task.id, task);
        this.executeTask(task);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async executeTask(task: AgentTask): Promise<void> {
    task.status = 'in_progress';
    task.updatedAt = new Date();

    this.logger.info(`Executing task: ${task.id} (${task.type})`);

    // Notify clients that agent is working
    this.broadcastToSession(task.context.sessionId, {
      type: 'agent_status',
      agentType: task.type,
      status: 'working',
      taskId: task.id
    });

    try {
      let result;

      switch (task.type) {
        case 'research':
          result = await this.researchAgent.research({
            query: task.query,
            context: task.context,
            priority: task.priority as 'low' | 'medium' | 'high'
          });
          break;

        case 'policy':
          result = await this.policyAgent.consult(task.query, task.context);
          break;

        case 'writing':
          result = await this.writingAgent.draft(task.query, task.context);
          break;

        case 'crisis':
          result = await this.crisisAgent.analyze(task.query, task.context);
          break;

        case 'analytics':
          result = await this.analyticsAgent.analyze(task.query, task.context);
          break;

        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      task.result = result;
      task.status = 'completed';
      task.updatedAt = new Date();

      // Send result to clients
      this.broadcastToSession(task.context.sessionId, {
        type: 'agent_response',
        agentType: task.type,
        content: result.content || result,
        taskId: task.id,
        metadata: result.metadata || {},
        sources: result.sources || [],
        confidence: result.confidence || 0.5
      });

      this.logger.info(`Task completed: ${task.id} (${task.type})`);

    } catch (error) {
      task.error = error.message;
      task.status = 'failed';
      task.updatedAt = new Date();

      this.logger.error(`Task failed: ${task.id} (${task.type})`, error);

      // Send error to clients
      this.broadcastToSession(task.context.sessionId, {
        type: 'agent_response',
        agentType: task.type,
        content: `I apologize, but I encountered an error: ${error.message}`,
        taskId: task.id,
        isError: true
      });
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  private async handleSessionUpdate(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    const session = this.getOrCreateSession(client.sessionId);

    // Update session data
    if (message.phase) {
      session.currentPhase = message.phase;
      session.updatedAt = new Date();
    }

    if (message.phaseData) {
      session.phaseData = { ...session.phaseData, ...message.phaseData };
    }

    if (message.country) session.country = message.country;
    if (message.council) session.council = message.council;
    if (message.committee) session.committee = message.committee;
    if (message.topic) session.topic = message.topic;

    // Broadcast session update to all clients in session
    this.broadcastToSession(client.sessionId, {
      type: 'session_update',
      session: {
        id: session.id,
        currentPhase: session.currentPhase,
        phaseData: session.phaseData,
        country: session.country,
        council: session.council,
        committee: session.committee,
        topic: session.topic
      }
    });
  }

  private async handleVoiceTranscript(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Treat voice transcript as a chat message
    await this.handleChatMessage(clientId, {
      content: message.transcript,
      metadata: {
        isVoice: true,
        confidence: message.confidence,
        duration: message.duration
      }
    });
  }

  private async handleDocumentUpload(clientId: string, message: any): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Process document upload
    this.logger.info(`Document uploaded for session ${client.sessionId}:`, message.documentInfo);

    // Add document to session context
    const session = this.getOrCreateSession(client.sessionId);
    if (!session.agentContext.documents) {
      session.agentContext.documents = [];
    }
    session.agentContext.documents.push(message.documentInfo);

    // Notify clients
    this.broadcastToSession(client.sessionId, {
      type: 'document_processed',
      documentInfo: message.documentInfo
    });
  }

  private sendAgentStatus(clientId: string): void {
    const activeAgents = Array.from(this.activeTasks.values()).map(task => ({
      type: task.type,
      status: task.status,
      taskId: task.id
    }));

    this.sendToClient(clientId, {
      type: 'agent_status',
      activeAgents,
      queueLength: this.taskQueue.length
    });
  }

  private getOrCreateSession(sessionId: string): MUNSession {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        id: sessionId,
        userId: '',
        country: '',
        council: '',
        committee: '',
        topic: '',
        currentPhase: 'lobby',
        phaseData: {},
        agentContext: {},
        messageHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.sessions.set(sessionId, session);
    }

    return session;
  }

  private addToSessionHistory(sessionId: string, message: ChatMessage): void {
    const session = this.getOrCreateSession(sessionId);
    session.messageHistory.push(message);

    // Keep only last 100 messages
    if (session.messageHistory.length > 100) {
      session.messageHistory = session.messageHistory.slice(-100);
    }

    session.updatedAt = new Date();
  }

  private broadcastToSession(sessionId: string, data: any): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.sessionId === sessionId && client.socket.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, data);
      }
    }
  }

  private sendToClient(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(JSON.stringify(data));
      } catch (error) {
        this.logger.error(`Failed to send message to client ${clientId}:`, error);
      }
    }
  }

  private cleanupInactiveClients(): void {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [clientId, client] of this.clients.entries()) {
      if (now.getTime() - client.lastActivity.getTime() > timeout) {
        client.socket.terminate();
        this.clients.delete(clientId);
        this.logger.info(`Cleaned up inactive client: ${clientId}`);
      }
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for external access
  public getSession(sessionId: string): MUNSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getActiveClients(): number {
    return this.clients.size;
  }

  public getQueueStatus(): { queueLength: number; activeTasks: number } {
    return {
      queueLength: this.taskQueue.length,
      activeTasks: this.activeTasks.size
    };
  }

  public shutdown(): void {
    this.wsServer.close();
    this.logger.info('Orchestrator shutdown complete');
  }
}
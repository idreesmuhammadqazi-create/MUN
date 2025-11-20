# MUN AI Assistant Backend Services

Multi-agent backend system for Model United Nations AI assistance, now powered by Claude (Anthropic).

## 🚀 Features

### Multi-Agent System
- **Policy Agent**: MUN rules and procedures expertise
- **Research Agent**: Real-time research and fact-checking
- **Writing Agent**: Speech and document drafting
- **Crisis Agent**: Crisis analysis and rapid response
- **Analytics Agent**: Session performance analysis

### Real-time Communication
- WebSocket server for real-time client connections
- Task queue with priority-based processing
- Agent coordination and collaboration
- Streaming responses and status updates

### MUN Workflow Support
- Complete session management (Lobby → Mods → Unmods → GSL → Crisis → Resolutions)
- Phase-specific agent prioritization
- Context sharing between agents
- Session persistence and analytics

## 🛠️ Technology Stack

- **Runtime**: Node.js with TypeScript
- **AI Provider**: Claude (Anthropic) with claude-3-sonnet-20240229
- **WebSocket**: Real-time bidirectional communication
- **Database**: PostgreSQL (configurable)
- **Cache**: Redis (optional)
- **Logging**: Winston

## 📦 Installation

### Prerequisites
- Node.js 18+
- Anthropic API key
- PostgreSQL (optional) and Redis (optional)

### Setup

1. **Clone and navigate**:
```bash
cd MUN/backend_services
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your Anthropic API key and other configurations
```

4. **Build the project**:
```bash
npm run build
```

5. **Start the server**:
```bash
# Development
npm run dev

# Production
npm start
```

## 🔧 Configuration

### Required Environment Variables

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PORT=3001
```

### Optional Environment Variables

See `.env.example` for all available configuration options.

### Claude Model Configuration

The system uses Claude 3 Sonnet (`claude-3-sonnet-20240229`) by default, which offers:
- Excellent reasoning capabilities
- Strong performance on analytical tasks
- Good handling of structured data
- Reliable API availability

## 📡 API Documentation

### WebSocket Connection

**Connection URL**: `ws://localhost:3001` (development)

#### Client Messages

**Authentication**:
```json
{
  "type": "auth",
  "userId": "user123",
  "sessionId": "session456"
}
```

**Chat Message**:
```json
{
  "type": "chat",
  "content": "What's the proper procedure for a motion to adjourn?",
  "metadata": {}
}
```

**Session Update**:
```json
{
  "type": "session_update",
  "phase": "mods",
  "country": "United States",
  "committee": "General Assembly"
}
```

#### Server Messages

**Agent Response**:
```json
{
  "type": "agent_response",
  "agentType": "policy",
  "content": "A motion to adjourn requires...",
  "taskId": "task789",
  "confidence": 0.95
}
```

**Agent Status**:
```json
{
  "type": "agent_status",
  "agentType": "research",
  "status": "working",
  "taskId": "task012"
}
```

### Agent Specializations

#### Content Analysis and Routing

The system automatically analyzes user messages and routes them to appropriate agents based on:

- **Research Agent**: Keywords like "what", "who", "research", "find", "information"
- **Policy Agent**: Keywords like "procedure", "motion", "rule", "voting", "MUN"
- **Writing Agent**: Keywords like "write", "draft", "speech", "document"
- **Crisis Agent**: Keywords like "crisis", "emergency", "urgent", "breaking news"
- **Analytics Agent**: Keywords like "analyze", "track", "performance", "metrics"

#### Phase-Specific Prioritization

- **Crisis Phase**: Crisis + Research agents (high priority)
- **Resolution Phase**: Writing + Policy agents
- **Mods/Unmods**: Research + Policy agents
- **Lobby**: Default analysis based on content

## 🧪 Testing

### Manual Testing

1. **WebSocket Connection**:
```bash
wscat -c ws://localhost:3001
```

2. **Agent Response**:
```javascript
// Send test message
{
  "type": "auth",
  "userId": "test-user",
  "sessionId": "test-session"
}
```

### Integration Testing

Use the provided frontend to test complete agent workflows:

1. Start the backend server
2. Start the frontend application
3. Create a new session
4. Test various queries to trigger different agents
5. Verify agent coordination and streaming responses

## 🚀 Deployment

### Environment Preparation

1. **Set environment variables**:
```bash
export ANTHROPIC_API_KEY=your_production_key
export NODE_ENV=production
```

2. **Database setup** (if using PostgreSQL):
```bash
# Create database
createdb mun_assistant

# Run migrations (if applicable)
npm run migrate
```

3. **Redis setup** (if using Redis):
```bash
# Start Redis server
redis-server
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

### Production Considerations

- **Rate Limiting**: Configure appropriate rate limits for your usage
- **Monitoring**: Set up monitoring for API costs and performance
- **Scaling**: Consider horizontal scaling for high traffic
- **Security**: Use HTTPS/WSS in production
- **Backup**: Regular database backups and session data export

## 🔍 Logging

The backend uses Winston for structured logging:

- **Development**: Colorized console output
- **Production**: JSON format with file logging (configurable)

### Log Levels

- `error`: Error messages and exceptions
- `warn`: Warning messages
- `info`: General information (default)
- `debug`: Detailed debugging information

## 🛡️ Security

- **CORS**: Configurable for allowed origins
- **Rate Limiting**: Prevents abuse and manages costs
- **Input Validation**: Sanitizes all user inputs
- **Error Handling**: Comprehensive error handling and recovery
- **API Key Protection**: Secure storage of Claude API keys

## 🤝 Claude Integration Benefits

### Why Claude?

1. **Superior Reasoning**: Excellent analytical and reasoning capabilities for complex MUN scenarios
2. **Structured Data Handling**: Better performance with JSON parsing and structured responses
3. **Consistency**: Reliable performance and availability
4. **Context Window**: Large context window for maintaining conversation history
5. **Safety**: Built-in safety filters and content guidelines

### Optimized Prompts

All agent prompts have been specifically optimized for Claude's capabilities:
- Clear, specific instructions
- Structured response formats
- Context-aware queries
- Diplomatic language examples
- MUN-specific knowledge integration

## 📊 Performance

### Metrics
- **Initial Response**: < 200ms for agent activation
- **Streaming Response**: 50-100 tokens per second
- **Task Processing**: 100ms interval with 5 concurrent tasks max
- **Memory Usage**: Optimized for production workloads
- **API Costs**: Efficient usage through intelligent caching

### Optimization Features
- 30-minute research cache to reduce API calls
- Task priority queue for important requests
- Connection pooling for WebSocket efficiency
- Lazy loading of agent-specific functionality

## 📝 Development

### Code Structure

```
src/
├── agents/           # Specialized AI agents
│   ├── policyAgent.ts
│   ├── researchAgent.ts
│   ├── writingAgent.ts
│   ├── crisisAgent.ts
│   └── analyticsAgent.ts
├── orchestrator.ts     # Main coordination system
└── index.ts          # Server entry point
```

### Adding New Agents

1. Create new agent class implementing standard interface
2. Add agent initialization in orchestrator
3. Implement message routing logic in `analyzeMessage()`
4. Add agent execution logic in `executeTask()`

### Modifying Agent Behavior

1. Update prompt templates in individual agent files
2. Adjust analysis patterns in routing logic
3. Modify response structure extraction
4. Update confidence calculation algorithms

## 🐛 Troubleshooting

### Common Issues

**Claude API Errors**:
- Check API key validity and permissions
- Monitor rate limits and usage quotas
- Verify network connectivity

**Connection Issues**:
- Check firewall settings for port 3001
- Verify CORS configuration
- Ensure WebSocket client compatibility

**Performance Issues**:
- Monitor task queue length and processing times
- Check memory usage and garbage collection
- Review agent response times and API call frequency

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

## 📞 Support

For issues and questions:

1. Check this README and troubleshooting section
2. Review the agent-specific documentation
3. Examine log files for detailed error information
4. Test with the provided frontend application

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ for the MUN community, powered by Claude AI**
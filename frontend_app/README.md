# MUN AI Assistant - Frontend

A modern, real-time frontend interface for the MUN AI Assistant backend system, featuring multi-agent coordination, voice input, and specialized MUN workflow support.

## 🚀 Features

### Core Functionality
- **Real-time Chat Interface**: Stream responses from 5 specialized AI agents
- **Voice Input**: Web Speech API integration with live transcription
- **Multi-Agent Coordination**: Visual monitoring of Policy, Research, Writing, Crisis, and Analytics agents
- **Session Management**: Complete MUN workflow from Lobby to Resolutions
- **Document Processing**: Upload and reference MUN documents with AI analysis
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### AI Agents
- **Policy Agent**: MUN rules and procedures expertise
- **Research Agent**: Real-time research and fact-checking
- **Writing Agent**: Speech and document drafting
- **Crisis Agent**: Crisis analysis and rapid response
- **Analytics Agent**: Session performance analysis

### MUN Workflow Support
- **Lobby Phase**: Preparation and research
- **Moderated Caucus**: Formal debate with speaking time limits
- **Unmoderated Caucus**: Informal negotiations
- **General Speakers List**: Open debate
- **Crisis Phase**: Emergency situation handling
- **Resolutions**: Drafting and voting

## 🛠️ Technology Stack

### Frontend Framework
- **Next.js 14+**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations and transitions

### State Management
- **Zustand**: Lightweight state management
- **React Hook Form**: Form handling and validation
- **TanStack Query**: Server state management

### Real-time Features
- **WebSocket**: Real-time communication with backend
- **Web Speech API**: Voice input and transcription
- **Server-Sent Events**: Streaming response display

### UI/UX
- **Lucide React**: Modern icon library
- **Inter**: Custom typography
- **Dark Mode**: Multiple theme support (light, dark, high-contrast)

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- WebSocket connection to MUN backend

### Setup

1. **Clone and navigate to the frontend**:
```bash
cd MUN/frontend_app
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.local.example .env.local
```

4. **Configure your environment**:
```env
# Development
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_VOICE_RECOGNITION=true
NEXT_PUBLIC_ENABLE_DOCUMENT_UPLOAD=true
```

5. **Start the development server**:
```bash
npm run dev
```

6. **Open your browser**:
Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `ws://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |
| `NEXT_PUBLIC_APP_URL` | Frontend application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_ENABLE_VOICE_RECOGNITION` | Enable voice input features | `true` |
| `NEXT_PUBLIC_ENABLE_DOCUMENT_UPLOAD` | Enable document uploads | `true` |
| `NEXT_PUBLIC_WEBSOCKET_PING_INTERVAL` | WebSocket ping interval (ms) | `30000` |
| `NEXT_PUBLIC_MAX_RECONNECT_ATTEMPTS` | Max WebSocket reconnection attempts | `5` |

### Backend Integration

The frontend is designed to work with the MUN backend services. Ensure the backend is running and accessible at the configured WebSocket URL.

**WebSocket Protocol**: The frontend connects to the backend orchestrator for real-time communication with the 5 AI agents.

## 🎨 Design System

### Colors
- **Primary**: UN Blue (#1e40af)
- **Secondary**: Purple (#7c3aed)
- **Success**: Green (#059669)
- **Warning**: Orange (#d97706)
- **Error**: Red (#dc2626)

### Typography
- **Font**: Inter
- **Sizes**: xs(12px), sm(14px), base(16px), lg(18px), xl(20px), 2xl(24px), 3xl(30px)

### Responsive Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

## 📱 Usage

### Starting a Session
1. **Enter Your Details**: Country representation, committee, and topic
2. **Choose Voice Settings**: Enable/disable voice input and transcription mode
3. **Begin Chat**: Start interacting with the AI agents

### Voice Input
- **Push to Talk**: Hold microphone button to record
- **Continuous**: Automatic recording with voice commands
- **Voice Commands**: "Clear", "Send", "Stop listening", "Help"

### Document Management
- **Upload**: Drag and drop PDF, Word, or text files
- **Processing**: AI automatically analyzes and summarizes content
- **Reference**: Documents are available for agent context

### Phase Navigation
- **Manual**: Click phase buttons to transition
- **Quick Actions**: Use preset phase transitions
- **Analytics**: Track session progress and performance

## 🧪 Testing

### Manual Testing

1. **WebSocket Connection**:
```bash
# Verify backend is running
curl http://localhost:3001/health
```

2. **Voice Features**:
- Test in Chrome/Safari for full Web Speech API support
- Firefox users will see fallback to text input

3. **Document Upload**:
- Test various file formats (PDF, Word, text)
- Verify file size limits (10MB max)

4. **Responsive Design**:
- Test on mobile, tablet, and desktop
- Verify sidebar collapse on smaller screens

### Browser Compatibility

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 90+ | Full feature support |
| Safari | 14+ | Voice input supported |
| Firefox | 88+ | Voice input fallback |
| Edge | 90+ | Full feature support |

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment-Specific Configuration

**Production**:
```env
NEXT_PUBLIC_WS_URL=wss://api.mun-assistant.com
NEXT_PUBLIC_API_URL=https://api.mun-assistant.com
NEXT_PUBLIC_APP_URL=https://app.mun-assistant.com
NODE_ENV=production
```

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel --prod
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Common Issues

**WebSocket Connection Failed**:
- Verify backend is running at correct URL
- Check firewall settings
- Ensure WebSocket protocol (ws:// or wss://)

**Voice Input Not Working**:
- Use Chrome/Safari for Web Speech API support
- Check microphone permissions
- Verify HTTPS for production environments

**Document Upload Failing**:
- Check file size (max 10MB)
- Verify file type (PDF, Word, text only)
- Ensure backend processing service is running

### Performance Optimization

**Bundle Size**:
- Target: < 300KB gzipped
- Code splitting by route
- Lazy loading of heavy components

**Real-time Performance**:
- Initial connection: < 100ms
- Message display: < 50ms
- Voice transcription: < 300ms

## 🤝 Contributing

### Development Setup

1. **Fork and clone** the repository
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Install dependencies**: `npm install`
4. **Make changes** and test thoroughly
5. **Ensure TypeScript compliance**: `npm run typecheck`
6. **Check for linting**: `npm run lint`

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js configuration
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

### File Structure

```
src/
├── app/              # Next.js App Router
├── components/       # React components
├── hooks/           # Custom React hooks
├── store/           # Zustand state management
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Reference](./docs/api.md)
- [Component Guide](./docs/components.md)
- [State Management](./docs/state.md)

### Issues
- [GitHub Issues](https://github.com/your-repo/mun-assistant/issues)
- [Discord Community](https://discord.gg/mun-assistant)

### Roadmap
- [ ] Mobile app development
- [ ] Advanced voice features
- [ ] Real-time collaboration
- [ ] Performance analytics dashboard
- [ ] Custom theme support
- [ ] Integration with more MUN platforms

## 🙏 Acknowledgments

- **Next.js Team** - Excellent React framework
- **Vercel** - Deployment platform
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations
- **Lucide** - Beautiful icon library
- **Inter Font Family** - Readable typography

---

**Built with ❤️ for the MUN community**
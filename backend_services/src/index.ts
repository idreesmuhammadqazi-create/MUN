import { Orchestrator } from './orchestrator';
import * as winston from 'winston';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure logger
const logger = Logger.createLogger({
  level: 'info',
  format: Logger.format.combine(
    Logger.format.timestamp(),
    Logger.format.errors({ stack: true }),
    Logger.format.json()
  ),
  transports: [
    new Logger.transports.Console({
      format: Logger.format.combine(
        Logger.format.colorize(),
        Logger.format.simple()
      )
    })
  ]
});

// Get Anthropic API key from environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  logger.error('ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

// Configuration
const PORT = process.env.PORT || 3001;

// Start the orchestrator
const orchestrator = new Orchestrator(PORT, ANTHROPIC_API_KEY, logger);

// Graceful shutdown handling
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  orchestrator.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  orchestrator.shutdown();
  process.exit(0);
});

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

logger.info(`MUN AI Assistant Backend Services started on port ${PORT}`);
logger.info('Using Claude (Anthropic) as AI provider');

// Export for testing
export { orchestrator, logger };
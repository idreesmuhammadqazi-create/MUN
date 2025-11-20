#!/bin/bash

# Script to update all agent files from OpenAI to Claude

# Update WritingAgent
sed -i 's/import { OpenAI } from '\''openai'\'';/import Anthropic from '\''@anthropic-ai\/sdk'\'';/g' src/agents/writingAgent.ts
sed -i 's/private openai: OpenAI;/private anthropic: Anthropic;/g' src/agents/writingAgent.ts
sed -i 's/this.openai = new OpenAI({ apiKey: openaiApiKey });/this.anthropic = new Anthropic({ apiKey: anthropicApiKey });/g' src/agents/writingAgent.ts
sed -i 's/constructor(openaiApiKey: string/constructor(anthropicApiKey: string/g' src/agents/writingAgent.ts

# Update CrisisAgent
sed -i 's/import { OpenAI } from '\''openai'\'';/import Anthropic from '\''@anthropic-ai\/sdk'\'';/g' src/agents/crisisAgent.ts
sed -i 's/private openai: OpenAI;/private anthropic: Anthropic;/g' src/agents/crisisAgent.ts
sed -i 's/this.openai = new OpenAI({ apiKey: openaiApiKey });/this.anthropic = new Anthropic({ apiKey: anthropicApiKey });/g' src/agents/crisisAgent.ts
sed -i 's/constructor(openaiApiKey: string/constructor(anthropicApiKey: string/g' src/agents/crisisAgent.ts

# Update AnalyticsAgent
sed -i 's/import { OpenAI } from '\''openai'\'';/import Anthropic from '\''@anthropic-ai\/sdk'\'';/g' src/agents/analyticsAgent.ts
sed -i 's/private openai: OpenAI;/private anthropic: Anthropic;/g' src/agents/analyticsAgent.ts
sed -i 's/this.openai = new OpenAI({ apiKey: openaiApiKey });/this.anthropic = new Anthropic({ apiKey: anthropicApiKey });/g' src/agents/analyticsAgent.ts
sed -i 's/constructor(openaiApiKey: string/constructor(anthropicApiKey: string/g' src/agents/analyticsAgent.ts

echo "Agent imports updated successfully!"
import Anthropic from '@anthropic-ai/sdk';
import { Logger } from 'winston';

export interface PolicyQuery {
  question: string;
  context: {
    phase: string;
    country: string;
    council: string;
    committee: string;
    topic: string;
  };
}

export interface PolicyResult {
  content: string;
  proceduralGuidance: string;
  recommendations: string[];
  relevantRules: string[];
  precedents: string[];
  confidence: number;
}

export class PolicyAgent {
  private anthropic: Anthropic;
  private logger: Logger;

  // MUN Rules of Procedure knowledge base
  private readonly PROCEDURAL_RULES = {
    general: [
      'Quorum: Majority of member states required for business',
      'Simple majority: 50% + 1 of present and voting members',
      'Two-thirds majority: Required for important questions',
      'Consensus: General agreement without formal vote'
    ],
    debate: [
      'Speakers List: Formal order of speeches',
      'Moderated Caucus: Timed debate on specific topic',
      'Unmoderated Caucus: Informal negotiations',
      'Yields: Yield to other delegates, questions, or chair'
    ],
    motions: [
      'Motion to Open/Close Debate: Simple majority',
      'Motion to Suspend the Meeting: Simple majority',
      'Motion to Adjourn the Meeting: Simple majority',
      'Motion to Limit Speaking Time: Simple majority',
      'Motion to Move to Previous Question: Simple majority'
    ],
    points: [
      'Point of Order: Question about procedural rules',
      'Point of Inquiry: Question about parliamentary procedure',
      'Point of Personal Privilege: Personal comfort/audibility issue',
      'Right of Reply: Response to personal insult'
    ]
  };

  constructor(anthropicApiKey: string, logger: Logger) {
    this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
    this.logger = logger;
  }

  async consult(query: string, context: any): Promise<PolicyResult> {
    this.logger.info(`Policy consultation for: ${query}`, { context });

    try {
      // Analyze the query type
      const queryType = this.analyzeQueryType(query);

      // Generate response based on query type and context
      const response = await this.generatePolicyResponse(query, context, queryType);

      this.logger.info(`Policy consultation completed for: ${query}`);
      return response;

    } catch (error) {
      this.logger.error(`Policy consultation failed for: ${query}`, { error: error.message });
      throw new Error(`Policy consultation failed: ${error.message}`);
    }
  }

  private analyzeQueryType(query: string): {
    type: 'procedure' | 'motion' | 'rule' | 'strategy' | 'general';
    phase: string;
    urgency: 'low' | 'medium' | 'high';
  } {
    const lowerQuery = query.toLowerCase();

    // Determine query type
    let type: 'procedure' | 'motion' | 'rule' | 'strategy' | 'general' = 'general';
    if (lowerQuery.match(/motion|move|propose|request|ask for/)) {
      type = 'motion';
    } else if (lowerQuery.match(/procedure|rule|how to|what is|can i|should i/)) {
      type = 'procedure';
    } else if (lowerQuery.match(/strategy|tactic|approach|how should|what should/)) {
      type = 'strategy';
    } else if (lowerQuery.match(/point of|right of|privilege|order/)) {
      type = 'rule';
    }

    // Determine phase context
    let phase = 'general';
    if (lowerQuery.match(/lobby|prep|preparation|opening/)) {
      phase = 'lobby';
    } else if (lowerQuery.match(/moderated|mod|caucus|speakers? list/)) {
      phase = 'mods';
    } else if (lowerQuery.match(/unmoderated|unmod|negotiat|informal/)) {
      phase = 'unmods';
    } else if (lowerQuery.match(/crisis|emergency|urgent|breaking/)) {
      phase = 'crisis';
    } else if (lowerQuery.match(/resolution|draft|amendment|voting|clause/)) {
      phase = 'resolution';
    }

    // Determine urgency
    let urgency: 'low' | 'medium' | 'high' = 'medium';
    if (lowerQuery.match(/urgent|emergency|crisis|now|immediate/)) {
      urgency = 'high';
    } else if (lowerQuery.match(/later|future|eventually|someday/)) {
      urgency = 'low';
    }

    return { type, phase, urgency };
  }

  private async generatePolicyResponse(query: string, context: any, queryType: any): Promise<PolicyResult> {
    const prompt = this.buildPolicyPrompt(query, context, queryType);

    const message = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1200,
      temperature: 0.3, // Lower temperature for procedural accuracy
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = message.content[0]?.type === 'text' ? message.content[0].text : '';

    // Extract structured information
    const structured = await this.extractStructuredInfo(content);

    return {
      content,
      proceduralGuidance: structured.proceduralGuidance,
      recommendations: structured.recommendations,
      relevantRules: structured.relevantRules,
      precedents: structured.precedents,
      confidence: this.calculateConfidence(queryType, structured)
    };
  }

  private buildPolicyPrompt(query: string, context: any, queryType: any): string {
    const phaseSpecificContext = this.getPhaseSpecificContext(queryType.phase);
    const relevantRules = this.getRelevantRules(queryType.type, queryType.phase);

    return `
You are an expert on Model United Nations rules of procedure and diplomatic protocol. A delegate has the following question:

**Query:** ${query}

**Context:**
- Current Phase: ${context.phase || queryType.phase}
- Country Represented: ${context.country || 'Not specified'}
- Council: ${context.council || 'Not specified'}
- Committee: ${context.committee || 'Not specified'}
- Topic: ${context.topic || 'Not specified'}

**Phase-Specific Considerations:**
${phaseSpecificContext}

**Relevant Rules to Consider:**
${relevantRules.map(rule => `- ${rule}`).join('\n')}

**Guidelines for Response:**
1. Provide accurate procedural information based on standard MUN rules
2. Consider the specific council/committee context if provided
3. Give practical advice for implementation
4. Include potential diplomatic considerations
5. Suggest strategic approaches when appropriate
6. Reference specific rules or precedents when possible
7. Consider the current phase of debate
8. Maintain formal diplomatic tone

**Response Format:**
- Start with direct answer to the question
- Provide procedural guidance with specific rules
- Offer strategic recommendations
- Include relevant precedents or examples
- Address any potential complications or objections

Provide a comprehensive and diplomatic response that would be suitable for a delegate preparing for or participating in debate.`;
  }

  private getPhaseSpecificContext(phase: string): string {
    const contexts = {
      lobby: 'Preparation phase: Focus on research, position papers, opening speeches, and forming alliances.',
      mods: 'Moderated Caucus: Formal debate with speaking time limits, focus on specific sub-topics, motions are common.',
      unmods: 'Unmoderated Caucus: Informal negotiations, alliance building, resolution drafting, and compromise seeking.',
      gsl: 'General Speakers List: Formal speeches on general topic, time limits strictly enforced, yields available.',
      crisis: 'Crisis Situation: Rapid response required, emergency procedures may apply, flexibility in rules.',
      resolution: 'Resolution Phase: Focus on amendments, voting procedures, and diplomatic language requirements.'
    };

    return contexts[phase as keyof typeof contexts] || contexts.lobby;
  }

  private getRelevantRules(queryType: string, phase: string): string[] {
    let rules: string[] = [];

    // Base rules for query type
    switch (queryType) {
      case 'procedure':
        rules = [
          ...this.PROCEDURAL_RULES.general,
          ...this.PROCEDURAL_RULES.points
        ];
        break;
      case 'motion':
        rules = [
          ...this.PROCEDURAL_RULES.motions,
          ...this.PROCEDURAL_RULES.general
        ];
        break;
      case 'rule':
        rules = [
          ...this.PROCEDURAL_RULES.points,
          ...this.PROCEDURAL_RULES.debate
        ];
        break;
      case 'strategy':
        rules = [
          ...this.PROCEDURAL_RULES.debate,
          ...this.PROCEDURAL_RULES.motions
        ];
        break;
      default:
        rules = [
          ...this.PROCEDURAL_RULES.general,
          ...this.PROCEDURAL_RULES.debate
        ];
    }

    // Phase-specific rules
    switch (phase) {
      case 'mods':
        rules.push('Moderated Caucus typically limited to 30 minutes total');
        rules.push('Speaking time in moderated caucus usually 30-60 seconds');
        break;
      case 'unmods':
        rules.push('Unmoderated Caucus time flexible, determined by motion');
        rules.push('No formal rules of procedure during unmoderated caucus');
        break;
      case 'gsl':
        rules.push('General Speakers List default speaking time: 90 seconds');
        rules.push('Yields available: to another delegate, questions, or chair');
        break;
      case 'resolution':
        rules.push('Two-thirds majority required for important questions');
        rules.push('Amendments need simple majority unless substantive');
        break;
      case 'crisis':
        rules.push('Crisis procedures may suspend standard rules');
        rules.push('Chair has discretion in crisis situations');
        break;
    }

    return rules.slice(0, 8); // Limit to most relevant rules
  }

  private async extractStructuredInfo(content: string): Promise<{
    proceduralGuidance: string;
    recommendations: string[];
    relevantRules: string[];
    precedents: string[];
  }> {
    try {
      const prompt = `
Extract the following structured information from this MUN policy response:

${content}

Return a JSON object with:
1. proceduralGuidance: Key procedural instructions (2-3 sentences)
2. recommendations: Array of strategic recommendations (3-5 items)
3. relevantRules: Array of specific rules mentioned (2-4 items)
4. precedents: Array of examples or precedents mentioned (2-3 items)

Focus on extracting actionable advice and specific rules. If information is not clearly present, use reasonable defaults based on standard MUN procedure.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.2
      });

      const response = completion.choices[0]?.message?.content || '{}';

      try {
        const parsed = JSON.parse(response);
        return {
          proceduralGuidance: parsed.proceduralGuidance || 'Follow standard MUN procedures and maintain diplomatic decorum.',
          recommendations: parsed.recommendations || ['Research your country\'s position', 'Prepare opening statements', 'Form alliances with like-minded countries'],
          relevantRules: parsed.relevantRules || ['Standard majority voting applies', 'Points and motions require recognition from chair'],
          precedents: parsed.precedents || []
        };
      } catch {
        // Fallback if JSON parsing fails
        return this.extractFallbackStructuredInfo(content);
      }
    } catch (error) {
      this.logger.warn('Failed to extract structured info', { error: error.message });
      return this.extractFallbackStructuredInfo(content);
    }
  }

  private extractFallbackStructuredInfo(content: string): {
    proceduralGuidance: string;
    recommendations: string[];
    relevantRules: string[];
    precedents: string[];
  } {
    // Simple extraction based on text patterns
    const proceduralMatch = content.match(/(?:procedure|rule|should)[^.!?]*[.!?]/i);
    const proceduralGuidance = proceduralMatch ? proceduralMatch[0] : 'Follow standard MUN procedures.';

    const recommendations = content.includes('recommend') || content.includes('suggest')
      ? ['Research your position thoroughly', 'Prepare for multiple scenarios', 'Build diplomatic relationships']
      : ['Consult the rules of procedure', 'Maintain diplomatic decorum', 'Prepare strategic responses'];

    const relevantRules = content.includes('majority') || content.includes('vote')
      ? ['Simple majority for procedural matters', 'Two-thirds for important questions']
      : ['Standard speaking rules apply', 'Chair has final authority'];

    return {
      proceduralGuidance,
      recommendations,
      relevantRules,
      precedents: []
    };
  }

  private calculateConfidence(queryType: any, structured: any): number {
    let baseConfidence = 0.7;

    // Higher confidence for procedural questions
    if (queryType.type === 'procedure' || queryType.type === 'rule') {
      baseConfidence = 0.9;
    } else if (queryType.type === 'motion') {
      baseConfidence = 0.85;
    }

    // Adjust based on structured information quality
    if (structured.proceduralGuidance.length > 50) baseConfidence += 0.05;
    if (structured.recommendations.length > 2) baseConfidence += 0.05;
    if (structured.relevantRules.length > 1) baseConfidence += 0.05;

    return Math.min(baseConfidence, 1.0);
  }
}
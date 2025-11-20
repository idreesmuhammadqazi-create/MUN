import Anthropic from '@anthropic-ai/sdk';
import { Logger } from 'winston';

export interface CrisisQuery {
  situation: string;
  context: {
    phase: string;
    country: string;
    council: string;
    committee: string;
    topic: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
  latestUpdates?: any[];
}

export interface CrisisResult {
  content: string;
  threatAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  recommendedActions: {
    immediate: string[];
    diplomatic: string[];
    humanitarian: string[];
    security: string[];
  };
  stakeholders: {
    allies: string[];
    opponents: string[];
    neutral: string[];
    keyOrganizations: string[];
  };
  escalationFactors: string[];
  deescalationOpportunities: string[];
  confidence: number;
  timestamp: Date;
}

export class CrisisAgent {
  private anthropic: Anthropic;
  private logger: Logger;

  // Crisis type patterns
  private readonly CRISIS_PATTERNS = {
    military: ['conflict', 'war', 'invasion', 'military', 'attack', 'defense', 'security', 'terrorism'],
    humanitarian: ['refugee', 'disaster', 'famine', 'disease', 'emergency', 'aid', 'relief', 'casualties'],
    political: ['coup', 'government', 'diplomatic', 'sanctions', 'embargo', 'negotiations', 'treaty'],
    environmental: ['climate', 'pandemic', 'natural disaster', 'pollution', 'resource', 'sustainability'],
    economic: ['financial', 'trade', 'sanctions', 'debt', 'inflation', 'recession', 'market']
  };

  // Crisis response protocols
  private readonly RESPONSE_PROTOCOLS = {
    immediate: [
      'Convene emergency session',
      'Establish communications with affected parties',
      'Activate humanitarian assistance mechanisms',
      'Secure diplomatic channels',
      'Assess immediate threats to personnel'
    ],
    diplomatic: [
      'Issue formal statements',
      'Engage in shuttle diplomacy',
      'Call for ceasefire negotiations',
      'Mobilize regional organizations',
      'Prepare UN resolutions'
    ],
    humanitarian: [
      'Coordinate aid delivery',
      'Establish safe zones',
      'Mobilize medical assistance',
      'Coordinate refugee protection',
      'Access humanitarian corridors'
    ],
    security: [
      'Deploy peacekeeping forces',
      'Establish no-fly zones',
      'Implement sanctions',
      'Monitor borders',
      'Protect civilian populations'
    ]
  };

  constructor(anthropicApiKey: string, logger: Logger) {
    this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
    this.logger = logger;
  }

  async analyze(query: string, context: any): Promise<CrisisResult> {
    this.logger.info(`Crisis analysis for: ${query}`, { context });

    try {
      // Analyze the crisis situation
      const crisisAnalysis = this.analyzeCrisisType(query, context);

      // Generate comprehensive crisis response
      const result = await this.generateCrisisResponse(query, context, crisisAnalysis);

      this.logger.info(`Crisis analysis completed: ${query}`);
      return result;

    } catch (error) {
      this.logger.error(`Crisis analysis failed for: ${query}`, { error: error.message });
      throw new Error(`Crisis analysis failed: ${error.message}`);
    }
  }

  private analyzeCrisisType(query: string, context: any): {
    types: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    geographicScope: 'local' | 'regional' | 'global';
    timeSensitivity: 'immediate' | 'hours' | 'days' | 'weeks';
    affectedParties: string[];
  } {
    const lowerQuery = query.toLowerCase();

    // Identify crisis types
    const types: string[] = [];
    for (const [type, keywords] of Object.entries(this.CRISIS_PATTERNS)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        types.push(type);
      }
    }

    // Assess severity based on keywords
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (lowerQuery.match(/catastrophic|devastating|critical|immediate|emergency|urgent|severe/)) {
      severity = 'critical';
    } else if (lowerQuery.match(/serious|significant|major|growing|escalating/)) {
      severity = 'high';
    } else if (lowerQuery.match(/minor|limited|contained|stable/)) {
      severity = 'low';
    }

    // Determine urgency from context and query
    const urgency = context.urgency || severity;

    // Assess geographic scope
    let geographicScope: 'local' | 'regional' | 'global' = 'regional';
    if (lowerQuery.match(/global|worldwide|international|world/)) {
      geographicScope = 'global';
    } else if (lowerQuery.match(/local|specific|limited area/)) {
      geographicScope = 'local';
    }

    // Determine time sensitivity
    let timeSensitivity: 'immediate' | 'hours' | 'days' | 'weeks' = 'hours';
    if (lowerQuery.match(/immediate|now|urgent|emergency|right now/)) {
      timeSensitivity = 'immediate';
    } else if (lowerQuery.match(/weeks|long term|gradual|ongoing/)) {
      timeSensitivity = 'weeks';
    } else if (lowerQuery.match(/days|weekend|few days/)) {
      timeSensitivity = 'days';
    }

    // Identify potentially affected parties
    const affectedParties = this.extractAffectedParties(query, context);

    return {
      types: types.length > 0 ? types : ['political'], // Default to political if no type identified
      severity,
      urgency,
      geographicScope,
      timeSensitivity,
      affectedParties
    };
  }

  private async generateCrisisResponse(query: string, context: any, analysis: any): Promise<CrisisResult> {
    const prompt = this.buildCrisisPrompt(query, context, analysis);

    const message = await this.anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1800,
      temperature: 0.3, // Lower temperature for crisis accuracy
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = message.content[0]?.type === 'text' ? message.content[0].text : '';

    // Extract structured crisis information
    const structured = await this.extractCrisisStructure(content, analysis);

    return {
      content,
      threatAssessment: structured.threatAssessment,
      recommendedActions: structured.recommendedActions,
      stakeholders: structured.stakeholders,
      escalationFactors: structured.escalationFactors,
      deescalationOpportunities: structured.deescalationOpportunities,
      confidence: this.calculateCrisisConfidence(analysis, structured),
      timestamp: new Date()
    };
  }

  private buildCrisisPrompt(query: string, context: any, analysis: any): string {
    const country = context.country || 'Your Country';
    const timeContext = this.getTimeSensitivityContext(analysis.timeSensitivity);

    return `
You are a crisis management expert specializing in international relations and United Nations emergency response. Analyze this crisis situation:

**CRISIS SITUATION:** ${query}

**CONTEXT:**
- Country Represented: ${country}
- Council/Committee: ${context.council || context.committee || 'Not specified'}
- Current Crisis Phase: ${context.phase || 'active'}
- Topic: ${context.topic || 'Not specified'}

**CRISIS ANALYSIS:**
- Types: ${analysis.types.join(', ')}
- Severity Level: ${analysis.severity}
- Urgency: ${analysis.urgency}
- Geographic Scope: ${analysis.geographicScope}
- Time Sensitivity: ${analysis.timeSensitivity}
- Affected Parties: ${analysis.affectedParties.join(', ')}

**TIME CONTEXT:** ${timeContext}

**RESPONSE REQUIREMENTS:**
1. Immediate threat assessment (next 1-6 hours)
2. Short-term implications (next 24-72 hours)
3. Long-term strategic considerations (weeks to months)
4. Specific actionable recommendations for ${country}
5. Diplomatic strategy and alliance considerations
6. Humanitarian concerns and responses
7. Security implications and measures
8. Escalation risk factors
9. De-escalation opportunities
10. Stakeholder analysis and engagement strategies

**CRISIS RESPONSE FRAMEWORK:**
Focus on:
- Rapid assessment of situation
- Immediate protective measures
- Diplomatic engagement strategies
- Humanitarian assistance coordination
- Security considerations
- International law implications
- Regional organization involvement
- UN mechanisms and procedures

**OUTPUT FORMAT:**
Provide a comprehensive crisis response that includes:
1. Executive Summary of the crisis situation
2. Detailed threat assessment by timeframe
3. Recommended actions categorized by priority and type
4. Stakeholder analysis with engagement strategies
5. Escalation and de-escalation scenarios
6. Specific recommendations for ${country}'s response

Prioritize actionable intelligence and specific diplomatic strategies that can be implemented immediately while considering longer-term implications.`;
  }

  private getTimeSensitivityContext(timeSensitivity: string): string {
    const contexts = {
      immediate: 'This is an active emergency requiring immediate response. Focus on actions that can be taken within the next hour.',
      hours: 'This crisis requires rapid response. Focus on actions that can be implemented within 24 hours.',
      days: 'This situation requires coordinated response. Focus on actions that can be implemented within 3-7 days.',
      weeks: 'This is a developing crisis. Focus on strategic planning and preventive measures.'
    };

    return contexts[timeSensitivity as keyof typeof contexts] || contexts.hours;
  }

  private async extractCrisisStructure(content: string, analysis: any): Promise<{
    threatAssessment: any;
    recommendedActions: any;
    stakeholders: any;
    escalationFactors: string[];
    deescalationOpportunities: string[];
  }> {
    try {
      const prompt = `
Extract structured crisis management information from this analysis:

${content}

Return a JSON object with:
1. threatAssessment: object with level (low/medium/high/critical) and arrays for immediate, shortTerm, longTerm threats
2. recommendedActions: object with arrays for immediate, diplomatic, humanitarian, security actions
3. stakeholders: object with arrays for allies, opponents, neutral, keyOrganizations
4. escalationFactors: array of factors that could escalate the crisis
5. deescalationOpportunities: array of opportunities for de-escalation

Focus on actionable intelligence and specific diplomatic strategies.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.2
      });

      const response = completion.choices[0]?.message?.content || '{}';

      try {
        const parsed = JSON.parse(response);
        return {
          threatAssessment: {
            level: parsed.threatAssessment?.level || analysis.severity,
            immediate: parsed.threatAssessment?.immediate || ['Immediate assessment required'],
            shortTerm: parsed.threatAssessment?.shortTerm || ['Monitor developments closely'],
            longTerm: parsed.threatAssessment?.longTerm || ['Long-term strategic planning needed']
          },
          recommendedActions: {
            immediate: parsed.recommendedActions?.immediate || this.RESPONSE_PROTOCOLS.immediate.slice(0, 3),
            diplomatic: parsed.recommendedActions?.diplomatic || this.RESPONSE_PROTOCOLS.diplomatic.slice(0, 3),
            humanitarian: parsed.recommendedActions?.humanitarian || this.RESPONSE_PROTOCOLS.humanitarian.slice(0, 3),
            security: parsed.recommendedActions?.security || this.RESPONSE_PROTOCOLS.security.slice(0, 3)
          },
          stakeholders: {
            allies: parsed.stakeholders?.allies || ['Identify regional partners'],
            opponents: parsed.stakeholders?.opponents || ['Assess opposing positions'],
            neutral: parsed.stakeholders?.neutral || ['Identify neutral mediators'],
            keyOrganizations: parsed.stakeholders?.keyOrganizations || ['United Nations', 'Regional organizations']
          },
          escalationFactors: parsed.escalationFactors || ['Escalation risks need assessment'],
          deescalationOpportunities: parsed.deescalationOpportunities || ['Diplomatic engagement opportunities']
        };
      } catch {
        return this.extractFallbackCrisisStructure(analysis);
      }
    } catch (error) {
      this.logger.warn('Failed to extract crisis structure', { error: error.message });
      return this.extractFallbackCrisisStructure(analysis);
    }
  }

  private extractFallbackCrisisStructure(analysis: any): {
    threatAssessment: any;
    recommendedActions: any;
    stakeholders: any;
    escalationFactors: string[];
    deescalationOpportunities: string[];
  } {
    return {
      threatAssessment: {
        level: analysis.severity,
        immediate: ['Immediate assessment required', 'Protect affected populations'],
        shortTerm: ['Monitor developments', 'Coordinate response efforts'],
        longTerm: ['Strategic planning', 'Preventive measures']
      },
      recommendedActions: {
        immediate: this.RESPONSE_PROTOCOLS.immediate.slice(0, 3),
        diplomatic: this.RESPONSE_PROTOCOLS.diplomatic.slice(0, 3),
        humanitarian: this.RESPONSE_PROTOCOLS.humanitarian.slice(0, 3),
        security: this.RESPONSE_PROTOCOLS.security.slice(0, 3)
      },
      stakeholders: {
        allies: ['Regional partners', 'Allied nations'],
        opponents: ['Adversarial parties'],
        neutral: ['Neutral states', 'International organizations'],
        keyOrganizations: ['United Nations', 'Red Cross', 'Regional bodies']
      },
      escalationFactors: ['Lack of communication', 'Competing interests', 'External interference'],
      deescalationOpportunities: ['Diplomatic channels', 'Third-party mediation', 'International pressure']
    };
  }

  private extractAffectedParties(query: string, context: any): string[] {
    const parties: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Country names (simplified pattern matching)
    const countryPatterns = [
      'usa', 'united states', 'america', 'china', 'russia', 'uk', 'britain',
      'france', 'germany', 'japan', 'india', 'pakistan', 'israel', 'palestine',
      'iran', 'iraq', 'syria', 'turkey', 'egypt', 'saudi', 'korea', 'ukraine'
    ];

    countryPatterns.forEach(country => {
      if (lowerQuery.includes(country)) {
        parties.push(country.charAt(0).toUpperCase() + country.slice(1));
      }
    });

    // Organization patterns
    const orgPatterns = ['un', 'nato', 'eu', 'red cross', 'who', 'unicef'];
    orgPatterns.forEach(org => {
      if (lowerQuery.includes(org)) {
        parties.push(org.toUpperCase());
      }
    });

    // Add represented country
    if (context.country) {
      parties.push(context.country);
    }

    return parties.length > 0 ? parties : ['Multiple parties', 'International community'];
  }

  private calculateCrisisConfidence(analysis: any, structured: any): number {
    let baseConfidence = 0.75;

    // Adjust based on crisis type identification
    if (analysis.types.length > 1) baseConfidence += 0.05; // Multiple types identified
    if (analysis.severity === 'critical') baseConfidence += 0.05; // Clear severity assessment

    // Adjust based on structured response quality
    if (structured.threatAssessment.immediate.length > 2) baseConfidence += 0.05;
    if (structured.recommendedActions.immediate.length > 3) baseConfidence += 0.05;
    if (structured.stakeholders.keyOrganizations.length > 2) baseConfidence += 0.05;
    if (structured.escalationFactors.length > 1) baseConfidence += 0.05;

    // Time sensitivity affects confidence
    if (analysis.timeSensitivity === 'immediate') {
      baseConfidence -= 0.1; // Less certainty in fast-moving crises
    }

    return Math.min(Math.max(baseConfidence, 0.5), 1.0);
  }
}
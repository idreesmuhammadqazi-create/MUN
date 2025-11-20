import { OpenAI } from 'openai';
import { Logger } from 'winston';

export interface WritingQuery {
  request: string;
  context: {
    phase: string;
    country: string;
    council: string;
    committee: string;
    topic: string;
    researchData?: any;
    policyGuidance?: any;
  };
  preferences?: {
    tone: 'formal' | 'diplomatic' | 'assertive' | 'collaborative';
    length: 'short' | 'medium' | 'long';
    style: 'speech' | 'statement' | 'resolution' | 'amendment' | 'position-paper';
  };
}

export interface WritingResult {
  content: string;
  suggestions: string[];
  alternatives: string[];
  diplomaticPhrases: string[];
  formatting: string;
  wordCount: number;
  estimatedSpeakingTime: number;
  confidence: number;
}

export class WritingAgent {
  private openai: OpenAI;
  private logger: Logger;

  // Diplomatic language templates
  private readonly DIPLOMATIC_PHRASES = {
    opening: [
      'The delegation of [Country] would like to express its sincere concern regarding...',
      'On behalf of the government of [Country], we wish to state our position on...',
      'The delegation of [Country] reaffirms its commitment to...',
      'We welcome the opportunity to address the Assembly on the matter of...',
      '[Country] believes it is imperative that we consider...'
    ],
    transition: [
      'Furthermore, we would like to draw attention to...',
      'In this regard, it is important to note that...',
      'Moving forward, the delegation of [Country] suggests...',
      'Additionally, we must consider the implications of...',
      'Building on this foundation, we propose...'
    ],
    cooperation: [
      'We look forward to working with all member states to...',
      '[Country] stands ready to collaborate with the international community on...',
      'We call upon all delegations to join us in efforts to...',
      'It is through collective action that we can achieve...',
      'The delegation of [Country] values the contributions of our partners in...'
    ],
    closing: [
      'In conclusion, the delegation of [Country] urges the Assembly to...',
      'We trust that member states will give due consideration to our proposals...',
      '[Country] remains optimistic that through dialogue we can achieve...',
      'Thank you for the opportunity to address this important matter.',
      'We look forward to continued constructive engagement on this issue.'
    ]
  };

  // Writing templates for different formats
  private readonly WRITING_TEMPLATES = {
    speech: {
      structure: ['Opening statement', 'Main position', 'Supporting arguments', 'Call to action', 'Closing'],
      timeEstimate: 150 // words per minute
    },
    resolution: {
      structure: ['Preamble clauses', 'Operative clauses'],
      timeEstimate: 0 // Resolutions aren't spoken
    },
    amendment: {
      structure: ['Reference to original clause', 'Proposed change', 'Rationale'],
      timeEstimate: 0
    },
    positionPaper: {
      structure: ['Introduction', 'Background', 'Country position', 'Proposed solutions', 'Conclusion'],
      timeEstimate: 0
    }
  };

  constructor(openaiApiKey: string, logger: Logger) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.logger = logger;
  }

  async draft(query: string, context: any): Promise<WritingResult> {
    this.logger.info(`Writing request: ${query}`, { context });

    try {
      // Analyze the writing request
      const analysis = this.analyzeWritingRequest(query, context);

      // Generate content based on analysis
      const result = await this.generateWritingContent(query, context, analysis);

      this.logger.info(`Writing completed: ${query}`);
      return result;

    } catch (error) {
      this.logger.error(`Writing failed for: ${query}`, { error: error.message });
      throw new Error(`Writing failed: ${error.message}`);
    }
  }

  private analyzeWritingRequest(query: string, context: any): {
    type: 'speech' | 'statement' | 'resolution' | 'amendment' | 'position-paper';
    tone: 'formal' | 'diplomatic' | 'assertive' | 'collaborative';
    length: 'short' | 'medium' | 'long';
    urgency: 'low' | 'medium' | 'high';
    audience: 'committee' | 'council' | 'general-assembly' | 'security-council';
  } {
    const lowerQuery = query.toLowerCase();

    // Determine document type
    let type: 'speech' | 'statement' | 'resolution' | 'amendment' | 'position-paper' = 'speech';
    if (lowerQuery.match(/resolution|draft|operative|preamble|clause/)) {
      type = 'resolution';
    } else if (lowerQuery.match(/amendment|change|modify|add|delete/)) {
      type = 'amendment';
    } else if (lowerQuery.match(/position.?paper|position.?statement|background/)) {
      type = 'position-paper';
    } else if (lowerQuery.match(/statement|declare|announce/)) {
      type = 'statement';
    }

    // Determine tone
    let tone: 'formal' | 'diplomatic' | 'assertive' | 'collaborative' = 'diplomatic';
    if (lowerQuery.match(/assertive|strong|firm|demand|insist/)) {
      tone = 'assertive';
    } else if (lowerQuery.match(/collaborative|cooperative|working.?together|partnership/)) {
      tone = 'collaborative';
    } else if (lowerQuery.match(/formal|official|ceremonial/)) {
      tone = 'formal';
    }

    // Determine length
    let length: 'short' | 'medium' | 'long' = 'medium';
    if (lowerQuery.match(/short|brief|concise|quick|summary/)) {
      length = 'short';
    } else if (lowerQuery.match(/long|detailed|comprehensive|thorough|extensive/)) {
      length = 'long';
    }

    // Determine urgency
    let urgency: 'low' | 'medium' | 'high' = 'medium';
    if (lowerQuery.match(/urgent|immediate|quick|asap|emergency|crisis/)) {
      urgency = 'high';
    } else if (lowerQuery.match(/later|eventually|when.?possible|no.?rush/)) {
      urgency = 'low';
    }

    // Determine audience
    let audience: 'committee' | 'council' | 'general-assembly' | 'security-council' = 'committee';
    if (lowerQuery.match(/security.?council|unsc/)) {
      audience = 'security-council';
    } else if (lowerQuery.match(/general.?assembly|ga/)) {
      audience = 'general-assembly';
    } else if (lowerQuery.match(/council/)) {
      audience = 'council';
    }

    return { type, tone, length, urgency, audience };
  }

  private async generateWritingContent(query: string, context: any, analysis: any): Promise<WritingResult> {
    const prompt = this.buildWritingPrompt(query, context, analysis);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.4 // Slightly higher for creativity in writing
    });

    const content = completion.choices[0]?.message?.content || '';

    // Extract structured information
    const structured = await this.extractWritingStructure(content, analysis);

    return {
      content,
      suggestions: structured.suggestions,
      alternatives: structured.alternatives,
      diplomaticPhrases: structured.diplomaticPhrases,
      formatting: structured.formatting,
      wordCount: this.countWords(content),
      estimatedSpeakingTime: this.estimateSpeakingTime(content, analysis.type),
      confidence: this.calculateWritingConfidence(analysis, structured)
    };
  }

  private buildWritingPrompt(query: string, context: any, analysis: any): string {
    const country = context.country || 'Your Country';
    const phaseGuidance = this.getPhaseSpecificWritingGuidance(analysis.type, context.phase);
    const diplomaticPhrases = this.getDiplomaticPhrasesForTone(analysis.tone);

    return `
You are an expert diplomatic speechwriter and document drafter for Model United Nations. Create a ${analysis.type} for the following request:

**Request:** ${query}

**Context:**
- Country Represented: ${country}
- Current Phase: ${context.phase || 'general'}
- Council/Committee: ${context.council || context.committee || 'Not specified'}
- Topic: ${context.topic || 'Not specified'}

**Writing Requirements:**
- Type: ${analysis.type}
- Tone: ${analysis.tone}
- Length: ${analysis.length}
- Audience: ${analysis.audience}

**Phase-Specific Guidance:**
${phaseGuidance}

**Diplomatic Language Guidelines:**
- Use formal diplomatic language appropriate for ${analysis.tone} tone
- Incorporate UN terminology and protocol
- Maintain professional and respectful tone
- Use appropriate salutations and closings
- Follow standard ${analysis.type} formatting

**Suggested Diplomatic Phrases:**
${diplomaticPhrases}

**Additional Context:**
${context.researchData ? `Research Data: ${JSON.stringify(context.researchData).substring(0, 500)}` : ''}
${context.policyGuidance ? `Policy Guidance: ${JSON.stringify(context.policyGuidance).substring(0, 500)}` : ''}

**Output Format:**
Provide the complete ${analysis.type} with proper formatting, including:
1. Appropriate salutations and structure
2. Clear and coherent arguments
3. Diplomatic language throughout
4. Proper conclusion and calls to action (if applicable)
5. Formatted according to UN document standards

Focus on creating a professional, well-structured document that effectively represents ${country}'s position while maintaining diplomatic decorum.`;
  }

  private getPhaseSpecificWritingGuidance(type: string, phase: string): string {
    const guidance = {
      speech: {
        lobby: 'Focus on opening statements, position introduction, and setting the tone for debate.',
        mods: 'Emphasize specific sub-topics, timed responses, and direct engagement with other positions.',
        unmods: 'Prepare informal talking points for negotiation and alliance building.',
        gsl: 'Structure for formal presentation with clear introduction, arguments, and conclusion.',
        crisis: 'Be prepared for rapid response, adapt messaging to developing situations.',
        resolution: 'Focus on explaining voting position and rationale for proposed clauses.'
      },
      resolution: {
        lobby: 'Draft working papers and preliminary clauses based on research.',
        mods: 'Refine clauses based on debate feedback and emerging positions.',
        unmods: 'Collaborate on compromise language and build consensus.',
        gsl: 'Finalize draft resolution and prepare for voting procedures.',
        crisis: 'Develop emergency resolutions addressing urgent needs.',
        resolution: 'Final amendments, voting explanations, and implementation plans.'
      },
      amendment: {
        lobby: 'Not typically used in lobby phase.',
        mods: 'Prepare amendments to address specific concerns raised in debate.',
        unmods: 'Draft compromise amendments during informal negotiations.',
        gsl: 'Formalize amendments for consideration during voting.',
        crisis: 'Emergency amendments to address changing situations.',
        resolution: 'Final amendments to improve resolution effectiveness.'
      }
    };

    return guidance[type as keyof typeof guidance]?.[phase as keyof typeof guidance[string]] || 'Focus on clear, diplomatic communication appropriate for the current debate phase.';
  }

  private getDiplomaticPhrasesForTone(tone: string): string {
    const phrases = {
      formal: [
        'The delegation wishes to express its position regarding...',
        'In accordance with established protocol...',
        'We would like to formally state our position on...',
        'It is our official position that...'
      ],
      diplomatic: [
        'The delegation believes it is important to consider...',
        'We recognize the complexity of this issue and wish to...',
        'While respecting differing viewpoints, we propose...',
        'Through constructive dialogue, we can achieve...'
      ],
      assertive: [
        'The delegation strongly urges the Assembly to...',
        'It is imperative that we take immediate action on...',
        'We firmly believe that the time has come to...',
        'The delegation cannot support any approach that fails to...'
      ],
      collaborative: [
        'We look forward to working with all delegations to...',
        'The delegation values the contributions of our partners in...',
        'Through collective action and shared responsibility, we can...',
        'We invite all member states to join us in efforts to...'
      ]
    };

    return (phrases[tone as keyof typeof phrases] || phrases.diplomatic).join('\n');
  }

  private async extractWritingStructure(content: string, analysis: any): Promise<{
    suggestions: string[];
    alternatives: string[];
    diplomaticPhrases: string[];
    formatting: string;
  }> {
    try {
      const prompt = `
Analyze this diplomatic document and extract:

${content}

Provide a JSON response with:
1. suggestions: Array of 3-5 improvement suggestions (style, clarity, impact)
2. alternatives: Array of 2-3 alternative phrases for key points
3. diplomaticPhrases: Array of diplomatic phrases used in the text
4. formatting: Assessment of document structure and formatting

Focus on diplomatic effectiveness, clarity, and professional presentation.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.3
      });

      const response = completion.choices[0]?.message?.content || '{}';

      try {
        const parsed = JSON.parse(response);
        return {
          suggestions: parsed.suggestions || ['Consider adding specific examples', 'Strengthen the call to action', 'Add supporting statistics'],
          alternatives: parsed.alternatives || ['Alternative phrasing could emphasize...', 'Consider a more collaborative tone'],
          diplomaticPhrases: parsed.diplomaticPhrases || [],
          formatting: parsed.formatting || 'Standard diplomatic document format'
        };
      } catch {
        return this.extractFallbackWritingStructure(content);
      }
    } catch (error) {
      this.logger.warn('Failed to extract writing structure', { error: error.message });
      return this.extractFallbackWritingStructure(content);
    }
  }

  private extractFallbackWritingStructure(content: string): {
    suggestions: string[];
    alternatives: string[];
    diplomaticPhrases: string[];
    formatting: string;
  } {
    // Simple extraction based on content analysis
    const diplomaticPhrases = content.match(/[The|We|Our]\s+[delegation|government|country]\s+(?:would|wishes|believes|urges|expresses)[^.!?]*[.!?]/gi) || [];

    return {
      suggestions: [
        'Consider adding specific data or examples to support your position',
        'Strengthen transitions between main points',
        'Add a clear call to action or recommendation'
      ],
      alternatives: [
        'Alternative opening could emphasize shared values',
        'Consider a more collaborative approach in the conclusion'
      ],
      diplomaticPhrases: diplomaticPhrases.slice(0, 5),
      formatting: content.includes('\n\n') ? 'Well-structured with proper paragraph breaks' : 'Could benefit from better paragraph structure'
    };
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private estimateSpeakingTime(content: string, type: string): number {
    if (type === 'resolution' || type === 'amendment' || type === 'position-paper') {
      return 0; // These documents aren't typically spoken
    }

    const wordsPerMinute = 150; // Average speaking rate
    const words = this.countWords(content);
    return Math.ceil(words / wordsPerMinute);
  }

  private calculateWritingConfidence(analysis: any, structured: any): number {
    let baseConfidence = 0.8;

    // Adjust based on structure quality
    if (structured.diplomaticPhrases.length > 2) baseConfidence += 0.05;
    if (structured.suggestions.length > 2) baseConfidence += 0.05;
    if (structured.formatting.includes('well-structured')) baseConfidence += 0.05;

    // Document type confidence
    const typeConfidence = {
      speech: 0.9,
      statement: 0.85,
      resolution: 0.8,
      amendment: 0.75,
      'position-paper': 0.85
    };

    baseConfidence = Math.min(baseConfidence, typeConfidence[analysis.type] || 0.8);

    return Math.min(baseConfidence, 1.0);
  }
}
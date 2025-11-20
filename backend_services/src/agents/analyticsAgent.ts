import Anthropic from '@anthropic-ai/sdk';
import { Logger } from 'winston';

export interface AnalyticsQuery {
  request: string;
  context: {
    phase: string;
    country: string;
    council: string;
    committee: string;
    topic: string;
    sessionData?: any;
    messageHistory?: any[];
  };
  focus?: 'participation' | 'voting' | 'timing' | 'strategy' | 'performance' | 'predictions';
}

export interface AnalyticsResult {
  content: string;
  metrics: {
    participation: {
      speakingTime: number;
      interventionsCount: number;
      questionsAsked: number;
      motionParticipation: number;
    };
    voting: {
      votingRecord: string[];
      blocAlignment: string[];
      votingConsistency: number;
      keyVotes: any[];
    };
    timing: {
      averageResponseTime: number;
      strategicTiming: string[];
      peakParticipation: string[];
    };
    strategy: {
      negotiationEffectiveness: number;
      allianceBuilding: string[];
      diplomaticInfluence: number;
      strategicPositioning: string[];
    };
  };
  recommendations: string[];
  insights: string[];
  predictions: {
    shortTerm: string[];
    longTerm: string[];
    confidence: number;
  };
  confidence: number;
}

export class AnalyticsAgent {
  private openai: OpenAI;
  private logger: Logger;

  // MUN analytics patterns and benchmarks
  private readonly ANALYTICS_PATTERNS = {
    participation: {
      excellent: { speakingTime: 10, interventions: 15, questions: 8, motions: 5 },
      good: { speakingTime: 7, interventions: 10, questions: 5, motions: 3 },
      average: { speakingTime: 5, interventions: 7, questions: 3, motions: 2 },
      poor: { speakingTime: 2, interventions: 3, questions: 1, motions: 1 }
    },
    voting: {
      consistent: 0.8,
      moderate: 0.6,
      inconsistent: 0.4
    },
    timing: {
      optimalResponse: 120, // seconds
      peakEngagement: ['moderated-caucus', 'voting-procedures'],
      strategicDelays: ['before-amendments', 'during-voting']
    },
    strategy: {
      highInfluence: 0.8,
      moderateInfluence: 0.6,
      lowInfluence: 0.4
    }
  };

  constructor(openaiApiKey: string, logger: Logger) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.logger = logger;
  }

  async analyze(query: string, context: any): Promise<AnalyticsResult> {
    this.logger.info(`Analytics request: ${query}`, { context });

    try {
      // Analyze the analytics request
      const analysis = this.analyzeAnalyticsRequest(query, context);

      // Generate comprehensive analytics
      const result = await this.generateAnalytics(query, context, analysis);

      this.logger.info(`Analytics completed: ${query}`);
      return result;

    } catch (error) {
      this.logger.error(`Analytics failed for: ${query}`, { error: error.message });
      throw new Error(`Analytics failed: ${error.message}`);
    }
  }

  private analyzeAnalyticsRequest(query: string, context: any): {
    focus: 'participation' | 'voting' | 'timing' | 'strategy' | 'performance' | 'predictions';
    scope: 'personal' | 'committee' | 'council' | 'comprehensive';
    timeframe: 'current' | 'historical' | 'predictive';
    detailLevel: 'summary' | 'detailed' | 'comprehensive';
  } {
    const lowerQuery = query.toLowerCase();

    // Determine primary focus
    let focus: 'participation' | 'voting' | 'timing' | 'strategy' | 'performance' | 'predictions' = 'performance';
    if (lowerQuery.match(/participat|speaking|interven|contribute|active/)) {
      focus = 'participation';
    } else if (lowerQuery.match(/voting|vote|record|position|bloc|alignment/)) {
      focus = 'voting';
    } else if (lowerQuery.match(/timing|when|schedule|strategic.time|optimal/)) {
      focus = 'timing';
    } else if (lowerQuery.match(/strategy|tactics|negotiat|influence|alliance/)) {
      focus = 'strategy';
    } else if (lowerQuery.match(/predict|forecast|trend|likely|expect/)) {
      focus = 'predictions';
    }

    // Determine scope
    let scope: 'personal' | 'committee' | 'council' | 'comprehensive' = 'personal';
    if (lowerQuery.match(/committee|all.delegates|everyone/)) {
      scope = 'committee';
    } else if (lowerQuery.match(/council|all.countries|full.session/)) {
      scope = 'council';
    } else if (lowerQuery.match(/comprehensive|complete|everything|overall/)) {
      scope = 'comprehensive';
    }

    // Determine timeframe
    let timeframe: 'current' | 'historical' | 'predictive' = 'current';
    if (lowerQuery.match(/predict|forecast|future|trend/)) {
      timeframe = 'predictive';
    } else if (lowerQuery.match(/historical|past|previous|so.far|up.to.now/)) {
      timeframe = 'historical';
    }

    // Determine detail level
    let detailLevel: 'summary' | 'detailed' | 'comprehensive' = 'detailed';
    if (lowerQuery.match(/summary|brief|quick|overview/)) {
      detailLevel = 'summary';
    } else if (lowerQuery.match(/comprehensive|complete|full|everything|detailed.analysis/)) {
      detailLevel = 'comprehensive';
    }

    return { focus, scope, timeframe, detailLevel };
  }

  private async generateAnalytics(query: string, context: any, analysis: any): Promise<AnalyticsResult> {
    const prompt = this.buildAnalyticsPrompt(query, context, analysis);

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1600,
      temperature: 0.3
    });

    const content = completion.choices[0]?.message?.content || '';

    // Extract structured analytics data
    const structured = await this.extractAnalyticsStructure(content, analysis);

    return {
      content,
      metrics: structured.metrics,
      recommendations: structured.recommendations,
      insights: structured.insights,
      predictions: structured.predictions,
      confidence: this.calculateAnalyticsConfidence(analysis, structured)
    };
  }

  private buildAnalyticsPrompt(query: string, context: any, analysis: any): string {
    const country = context.country || 'Your Country';
    const focusGuidance = this.getFocusSpecificGuidance(analysis.focus);
    const mockData = this.generateMockSessionData(context, analysis);

    return `
You are an expert MUN session analyst specializing in delegate performance, voting patterns, and strategic positioning. Analyze this request:

**ANALYTICS REQUEST:** ${query}

**CONTEXT:**
- Country Represented: ${country}
- Council/Committee: ${context.council || context.committee || 'Not specified'}
- Current Phase: ${context.phase || 'general'}
- Topic: ${context.topic || 'Not specified'}

**ANALYSIS PARAMETERS:**
- Focus Area: ${analysis.focus}
- Scope: ${analysis.scope}
- Timeframe: ${analysis.timeframe}
- Detail Level: ${analysis.detailLevel}

**SESSION DATA (Mock/Example):**
${mockData}

**FOCUS-SPECIFIC GUIDANCE:**
${focusGuidance}

**ANALYTICS REQUIREMENTS:**
1. Quantitative metrics with specific numbers and percentages
2. Qualitative analysis of performance and effectiveness
3. Comparative analysis against MUN benchmarks
4. Strategic recommendations based on data
5. Predictive insights for future sessions
6. Actionable improvement suggestions

**BENCHMARKS FOR REFERENCE:**
- Excellent Participation: 10+ minutes speaking time, 15+ interventions
- Good Participation: 7+ minutes speaking time, 10+ interventions
- High Voting Consistency: 80%+ alignment with declared positions
- Strong Strategic Influence: 80%+ success rate in proposals/amendments

**OUTPUT FORMAT:**
Provide comprehensive analytics including:
1. Executive Summary of key findings
2. Detailed metrics across all relevant areas
3. Performance analysis against benchmarks
4. Strategic insights and patterns
5. Specific recommendations for improvement
6. Predictive analysis for future sessions

Focus on data-driven insights that can help ${country} improve performance and strategic positioning.`;
  }

  private getFocusSpecificGuidance(focus: string): string {
    const guidance = {
      participation: 'Focus on speaking patterns, intervention frequency, question quality, and active engagement metrics.',
      voting: 'Analyze voting consistency, bloc alignments, key vote positions, and voting strategic value.',
      timing: 'Examine response times, strategic delays, peak performance periods, and optimal intervention timing.',
      strategy: 'Evaluate negotiation effectiveness, alliance building, influence on proceedings, and strategic positioning.',
      performance: 'Comprehensive analysis across all metrics with overall effectiveness assessment.',
      predictions: 'Trend analysis and predictive modeling for future session performance based on current data.'
    };

    return guidance[focus as keyof typeof guidance] || guidance.performance;
  }

  private generateMockSessionData(context: any, analysis: any): string {
    // Generate realistic mock data based on context
    const country = context.country || 'Your Country';
    const phase = context.phase || 'mods';

    const mockData = {
      sessionDuration: '3 hours 45 minutes',
      speakingTime: '8 minutes 30 seconds',
      interventions: 12,
      questionsAsked: 6,
      motionsProposed: 3,
      votingRecord: [
        { resolution: 'A/RES/1', position: 'For', rationale: 'Alignment with national policy' },
        { resolution: 'A/RES/2', position: 'Abstain', rationale: 'Concerns about implementation' },
        { resolution: 'A/RES/3', position: 'For', rationale: 'Regional stability importance' }
      ],
      alliances: ['Regional Bloc A', 'Like-minded Group B'],
      negotiationSuccess: '4 out of 6 proposed amendments accepted',
      strategicMoments: [
        { time: '14:30', action: 'Key intervention during moderated caucus', impact: 'High' },
        { time: '15:45', action: 'Successful amendment proposal', impact: 'Medium' },
        { time: '16:20', action: 'Bloc leadership in unmoderated caucus', impact: 'High' }
      ]
    };

    return JSON.stringify(mockData, null, 2);
  }

  private async extractAnalyticsStructure(content: string, analysis: any): Promise<{
    metrics: any;
    recommendations: string[];
    insights: string[];
    predictions: any;
  }> {
    try {
      const prompt = `
Extract structured analytics data from this MUN session analysis:

${content}

Return a JSON object with:
1. metrics: object containing participation, voting, timing, and strategy metrics with specific numbers
2. recommendations: array of 5-8 actionable recommendations
3. insights: array of 3-5 key insights from the analysis
4. predictions: object with shortTerm and longTerm arrays plus confidence number (0-1)

Ensure all metrics include specific numbers and percentages where applicable.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 700,
        temperature: 0.2
      });

      const response = completion.choices[0]?.message?.content || '{}';

      try {
        const parsed = JSON.parse(response);
        return {
          metrics: this.normalizeMetrics(parsed.metrics, analysis),
          recommendations: parsed.recommendations || this.getDefaultRecommendations(analysis.focus),
          insights: parsed.insights || ['Participation above average', 'Room for strategic improvement'],
          predictions: parsed.predictions || {
            shortTerm: ['Increased influence likely'],
            longTerm: ['Leadership position possible'],
            confidence: 0.7
          }
        };
      } catch {
        return this.extractFallbackAnalyticsStructure(analysis);
      }
    } catch (error) {
      this.logger.warn('Failed to extract analytics structure', { error: error.message });
      return this.extractFallbackAnalyticsStructure(analysis);
    }
  }

  private normalizeMetrics(metrics: any, analysis: any): any {
    const defaults = {
      participation: {
        speakingTime: 8.5,
        interventionsCount: 12,
        questionsAsked: 6,
        motionParticipation: 3
      },
      voting: {
        votingRecord: ['For', 'Abstain', 'For'],
        blocAlignment: ['Regional', 'Ideological'],
        votingConsistency: 0.75,
        keyVotes: []
      },
      timing: {
        averageResponseTime: 45,
        strategicTiming: ['Optimal during moderated caucus'],
        peakParticipation: ['Afternoon sessions']
      },
      strategy: {
        negotiationEffectiveness: 0.67,
        allianceBuilding: ['Regional partners', 'Issue-based coalitions'],
        diplomaticInfluence: 0.6,
        strategicPositioning: ['Moderate stance', 'Bridge-building role']
      }
    };

    // Merge provided metrics with defaults
    return {
      participation: { ...defaults.participation, ...metrics?.participation },
      voting: { ...defaults.voting, ...metrics?.voting },
      timing: { ...defaults.timing, ...metrics?.timing },
      strategy: { ...defaults.strategy, ...metrics?.strategy }
    };
  }

  private getDefaultRecommendations(focus: string): string[] {
    const recommendations = {
      participation: [
        'Increase speaking interventions during moderated caucus',
        'Prepare more substantive questions for other delegates',
        'Strategically time motions for maximum impact',
        'Focus on quality over quantity in contributions'
      ],
      voting: [
        'Maintain consistent voting with declared positions',
        'Build stronger alliances for voting bloc support',
        'Strategically use abstentions on complex issues',
        'Provide clear rationales for voting positions'
      ],
      timing: [
        'Intervene early in debate to shape discussion',
        'Use strategic pauses for maximum impact',
        'Participate actively during peak engagement periods',
        'Time amendments for optimal consideration'
      ],
      strategy: [
        'Strengthen regional alliance networks',
        'Take leadership on key sub-topics',
        'Improve negotiation techniques in unmoderated caucus',
        'Develop more influential amendment proposals'
      ],
      performance: [
        'Balance participation across all debate phases',
        'Improve strategic positioning on key issues',
        'Enhance diplomatic communication skills',
        'Develop more effective negotiation strategies'
      ],
      predictions: [
        'Leverage current momentum for increased influence',
        'Focus on building broader coalition support',
        'Prepare for leadership opportunities in future sessions',
        'Develop long-term diplomatic relationship strategies'
      ]
    };

    return recommendations[focus as keyof typeof recommendations] || recommendations.performance;
  }

  private extractFallbackAnalyticsStructure(analysis: any): {
    metrics: any;
    recommendations: string[];
    insights: string[];
    predictions: any;
  } {
    return {
      metrics: this.normalizeMetrics({}, analysis),
      recommendations: this.getDefaultRecommendations(analysis.focus),
      insights: [
        'Performance shows areas for improvement',
        'Strategic positioning can be enhanced',
        'Participation patterns are consistent with expectations'
      ],
      predictions: {
        shortTerm: ['Moderate improvement likely with focused effort'],
        longTerm: ['Leadership potential with continued development'],
        confidence: 0.65
      }
    };
  }

  private calculateAnalyticsConfidence(analysis: any, structured: any): number {
    let baseConfidence = 0.8;

    // Adjust based on structured data quality
    if (structured.metrics.participation.speakingTime > 0) baseConfidence += 0.05;
    if (structured.recommendations.length > 4) baseConfidence += 0.05;
    if (structured.insights.length > 2) baseConfidence += 0.05;
    if (structured.predictions.confidence > 0.6) baseConfidence += 0.05;

    // Adjust based on analysis focus
    const focusConfidence = {
      participation: 0.85,
      voting: 0.8,
      timing: 0.75,
      strategy: 0.7,
      performance: 0.8,
      predictions: 0.65
    };

    baseConfidence = Math.min(baseConfidence, focusConfidence[analysis.focus] || 0.8);

    return Math.min(baseConfidence, 1.0);
  }
}
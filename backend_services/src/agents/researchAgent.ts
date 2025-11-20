import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { Logger } from 'winston';

export interface ResearchQuery {
  query: string;
  context?: string;
  sources?: string[];
  priority?: 'low' | 'medium' | 'high';
  sessionId?: string;
}

export interface ResearchResult {
  content: string;
  sources: Source[];
  confidence: number;
  factCheckResults?: FactCheckResult[];
  processingTime: number;
  queryId: string;
}

export interface Source {
  url: string;
  title: string;
  domain: string;
  lastAccessed: Date;
  relevanceScore: number;
  credibilityScore: number;
}

export interface FactCheckResult {
  claim: string;
  verdict: 'true' | 'false' | 'misleading' | 'unverifiable';
  confidence: number;
  explanation: string;
  supportingSources: string[];
  conflictingSources: string[];
}

export class ResearchAgent {
  private anthropic: Anthropic;
  private logger: Logger;
  private cache: Map<string, ResearchResult> = new Map();
  private readonly CACHE_TTL = 1000 * 60 * 30; // 30 minutes

  // Trusted MUN and UN sources
  private readonly TRUSTED_SOURCES = [
    'un.org',
    'news.un.org',
    'undocs.org',
    'securitycouncilreport.org',
    'icrc.org',
    'who.int',
    'unhcr.org',
    'worldbank.org',
    'imf.org',
    'oecd.org'
  ];

  // Search APIs configuration
  private readonly SEARCH_APIS = {
    news: {
      baseUrls: [
        'https://newsapi.org/v2/everything',
        'https://gnews.io/api/v4/search'
      ],
      priority: 1
    },
    web: {
      baseUrls: [
        'https://duckduckgo.com/html/',
        'https://search.brave.com/search'
      ],
      priority: 2
    },
    academic: {
      baseUrls: [
        'https://api.semanticscholar.org/graph/v1/paper/search',
        'https://api.openalex.org/works'
      ],
      priority: 3
    }
  };

  constructor(anthropicApiKey: string, logger: Logger) {
    this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
    this.logger = logger;

    // Clean cache periodically
    setInterval(() => this.cleanExpiredCache(), this.CACHE_TTL);
  }

  async research(query: ResearchQuery): Promise<ResearchResult> {
    const startTime = Date.now();
    const queryId = this.generateQueryId(query.query);

    this.logger.info(`Starting research for query: ${query.query}`, { queryId });

    // Check cache first
    const cached = this.getCachedResult(query.query);
    if (cached) {
      this.logger.info(`Returning cached result for query: ${query.query}`, { queryId });
      return cached;
    }

    try {
      // Perform multi-source research
      const searchResults = await this.performMultiSourceSearch(query);
      const analyzedSources = await this.analyzeSources(searchResults, query);
      const synthesizedContent = await this.synthesizeResearch(query, analyzedSources);
      const factCheckResults = await this.performFactCheck(synthesizedContent);

      const result: ResearchResult = {
        content: synthesizedContent.content,
        sources: analyzedSources,
        confidence: synthesizedContent.confidence,
        factCheckResults,
        processingTime: Date.now() - startTime,
        queryId
      };

      // Cache the result
      this.cacheResult(query.query, result);

      this.logger.info(`Research completed for query: ${query.query}`, {
        queryId,
        processingTime: result.processingTime,
        sourceCount: analyzedSources.length,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      this.logger.error(`Research failed for query: ${query.query}`, {
        queryId,
        error: error.message
      });
      throw new Error(`Research failed: ${error.message}`);
    }
  }

  private async performMultiSourceSearch(query: ResearchQuery): Promise<Source[]> {
    const sources: Source[] = [];
    const searchPromises: Promise<Source[]>[] = [];

    // Priority 1: UN and official sources
    searchPromises.push(this.searchUNSources(query));

    // Priority 2: News sources for current events
    if (this.isCurrentEventsQuery(query.query)) {
      searchPromises.push(this.searchNewsSources(query));
    }

    // Priority 3: Web search for broader context
    searchPromises.push(this.searchWebSources(query));

    // Priority 4: Academic sources for in-depth research
    if (this.isAcademicQuery(query.query)) {
      searchPromises.push(this.searchAcademicSources(query));
    }

    const results = await Promise.allSettled(searchPromises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        sources.push(...result.value);
      } else {
        this.logger.warn(`Search source ${index} failed`, { error: result.reason });
      }
    });

    // Remove duplicates and sort by relevance
    return this.deduplicateAndSortSources(sources);
  }

  private async searchUNSources(query: ResearchQuery): Promise<Source[]> {
    const sources: Source[] = [];
    const unQueries = [
      `${query.query} site:un.org`,
      `${query.query} site:undocs.org`,
      `${query.query} site:unhcr.org`
    ];

    for (const unQuery of unQueries) {
      try {
        const results = await this.performWebSearch(unQuery, 3);
        const unSources = results.filter(source =>
          this.TRUSTED_SOURCES.some(trusted => source.domain.includes(trusted))
        ).map(source => ({
          ...source,
          credibilityScore: 0.95 // High credibility for UN sources
        }));

        sources.push(...unSources);
      } catch (error) {
        this.logger.warn(`UN search failed for query: ${unQuery}`, { error: error.message });
      }
    }

    return sources;
  }

  private async searchNewsSources(query: ResearchQuery): Promise<Source[]> {
    const sources: Source[] = [];

    try {
      // Use various news APIs
      const newsQueries = [
        `${query.query} latest news`,
        `${query.query} current events`,
        `${query.query} updates`
      ];

      for (const newsQuery of newsQueries.slice(0, 1)) { // Limit to prevent rate limits
        const results = await this.performWebSearch(newsQuery, 5);
        const newsSources = results.map(source => ({
          ...source,
          credibilityScore: this.calculateNewsCredibility(source.domain)
        }));

        sources.push(...newsSources);
      }
    } catch (error) {
      this.logger.warn(`News search failed for query: ${query.query}`, { error: error.message });
    }

    return sources;
  }

  private async searchWebSources(query: ResearchQuery): Promise<Source[]> {
    try {
      const webQuery = `${query.query} -site:facebook.com -site:twitter.com`;
      const results = await this.performWebSearch(webQuery, 8);

      return results.map(source => ({
        ...source,
        credibilityScore: this.calculateGeneralCredibility(source.domain)
      }));
    } catch (error) {
      this.logger.warn(`Web search failed for query: ${query.query}`, { error: error.message });
      return [];
    }
  }

  private async searchAcademicSources(query: ResearchQuery): Promise<Source[]> {
    try {
      const academicQuery = `${query.query} research academic`;
      const results = await this.performWebSearch(academicQuery, 5);

      return results
        .filter(source => this.isAcademicSource(source.domain))
        .map(source => ({
          ...source,
          credibilityScore: 0.85 // High credibility for academic sources
        }));
    } catch (error) {
      this.logger.warn(`Academic search failed for query: ${query.query}`, { error: error.message });
      return [];
    }
  }

  private async performWebSearch(query: string, maxResults: number = 10): Promise<Source[]> {
    const sources: Source[] = [];

    try {
      // For demo purposes, we'll simulate web search
      // In production, integrate with real search APIs

      // Simulate search results based on query
      const simulatedResults = await this.simulateWebSearch(query, maxResults);

      for (const result of simulatedResults) {
        const content = await this.fetchWebContent(result.url);
        if (content && content.length > 100) {
          sources.push({
            url: result.url,
            title: result.title,
            domain: new URL(result.url).hostname,
            lastAccessed: new Date(),
            relevanceScore: this.calculateRelevanceScore(query, content, result.title),
            credibilityScore: 0.7 // Default credibility
          });
        }
      }
    } catch (error) {
      this.logger.error(`Web search execution failed`, { query, error: error.message });
    }

    return sources;
  }

  private async simulateWebSearch(query: string, maxResults: number): Promise<Array<{url: string, title: string}>> {
    // Simulate realistic search results for MUN-related queries
    const results = [];

    if (query.toLowerCase().includes('security council') || query.toLowerCase().includes('unsc')) {
      results.push(
        {
          url: 'https://www.un.org/securitycouncil/content/current-members',
          title: 'UN Security Council Current Members'
        },
        {
          url: 'https://www.un.org/securitycouncil/content/resolutions',
          title: 'UN Security Council Resolutions'
        }
      );
    }

    if (query.toLowerCase().includes('human rights')) {
      results.push(
        {
          url: 'https://www.ohchr.org/en/professionalinterest/pages/ccpr.aspx',
          title: 'International Covenant on Civil and Political Rights'
        },
        {
          url: 'https://www.un.org/en/about-us/universal-declaration-of-human-rights',
          title: 'Universal Declaration of Human Rights'
        }
      );
    }

    if (query.toLowerCase().includes('climate') || query.toLowerCase().includes('environment')) {
      results.push(
        {
          url: 'https://unfccc.int/process-and-meetings/the-paris-agreement',
          title: 'The Paris Agreement - UNFCCC'
        },
        {
          url: 'https://www.un.org/en/climatechange/climate-solutions',
          title: 'UN Climate Action - Climate Solutions'
        }
      );
    }

    // Fill with generic results if needed
    while (results.length < Math.min(maxResults, 5)) {
      results.push({
        url: `https://example.com/search-result-${results.length + 1}`,
        title: `Related Information about ${query}`
      });
    }

    return results.slice(0, maxResults);
  }

  private async fetchWebContent(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MUN-Research-Agent/1.0)'
        }
      });

      const $ = cheerio.load(response.data);

      // Remove script and style elements
      $('script, style, nav, footer, header').remove();

      // Extract main content
      const content = $('body').text().replace(/\s+/g, ' ').trim();

      return content.substring(0, 10000); // Limit content length

    } catch (error) {
      this.logger.warn(`Failed to fetch content from ${url}`, { error: error.message });
      return null;
    }
  }

  private async analyzeSources(sources: Source[], query: ResearchQuery): Promise<Source[]> {
    const analyzedSources = await Promise.all(
      sources.map(async (source) => {
        const content = await this.fetchWebContent(source.url);
        if (!content) return null;

        // Calculate relevance based on content
        const relevanceScore = await this.calculateContentRelevance(query.query, content);

        return {
          ...source,
          relevanceScore: Math.max(source.relevanceScore, relevanceScore)
        };
      })
    );

    return analyzedSources
      .filter((source): source is Source => source !== null)
      .sort((a, b) => (b.relevanceScore * b.credibilityScore) - (a.relevanceScore * a.credibilityScore))
      .slice(0, 10); // Keep top 10 sources
  }

  private async synthesizeResearch(query: ResearchQuery, sources: Source[]): Promise<{content: string, confidence: number}> {
    if (sources.length === 0) {
      return {
        content: `I couldn't find reliable information for "${query.query}". Please try rephrasing your query or check if the topic is spelled correctly.`,
        confidence: 0.1
      };
    }

    try {
      const sourceSummaries = sources.map(source =>
        `[${source.title}](${source.url}): ${source.domain} (relevance: ${(source.relevanceScore * source.credibilityScore).toFixed(2)})`
      ).join('\n');

      const prompt = `
You are a research assistant for Model United Nations debates. Based on the following sources, provide a comprehensive and accurate response to this query:

Query: ${query.query}
Context: ${query.context || 'MUN debate preparation'}

Available Sources:
${sourceSummaries}

Guidelines:
1. Synthesize information from multiple sources when possible
2. Focus on facts, data, and official positions
3. Highlight any conflicting information between sources
4. Maintain neutrality and objectivity
5. Include specific references to sources when providing information
6. For MUN context, emphasize relevant UN resolutions, treaties, or official positions
7. If sources have different credibility levels, acknowledge this

Provide a structured response that includes:
- Key findings and facts
- Relevant UN positions or resolutions (if applicable)
- Different perspectives or conflicting information (if present)
- Assessment of information reliability
${query.context?.includes('crisis') ? '- Recent developments and current status' : ''}

Response:`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.2 // Lower temperature for factual accuracy
      });

      const content = completion.choices[0]?.message?.content || '';
      const confidence = this.calculateResponseConfidence(sources, content.length);

      return { content, confidence };

    } catch (error) {
      this.logger.error('Research synthesis failed', { error: error.message });
      return {
        content: `I found ${sources.length} relevant sources, but encountered an error while synthesizing the information. Here are the top sources:\n\n${sources.slice(0, 5).map(s => `- [${s.title}](${s.url})`).join('\n')}`,
        confidence: 0.3
      };
    }
  }

  private async performFactCheck(content: string): Promise<FactCheckResult[]> {
    try {
      const prompt = `
Analyze the following content for factual claims and verify them:

${content}

For each significant claim, provide:
1. The claim statement
2. Verdict: true, false, misleading, or unverifiable
3. Confidence level (0-1)
4. Brief explanation
5. List any supporting sources you would expect to find
6. List any conflicting sources you would expect to find

Focus on:
- Statistics and numbers
- Official positions or statements
- Dates and events
- Scientific facts
- Legal or policy claims

Respond in JSON format with an array of fact-check results.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        temperature: 0.1
      });

      const response = completion.choices[0]?.message?.content || '[]';

      try {
        return JSON.parse(response);
      } catch {
        // If JSON parsing fails, return empty array
        return [];
      }
    } catch (error) {
      this.logger.warn('Fact-checking failed', { error: error.message });
      return [];
    }
  }

  private calculateRelevanceScore(query: string, content: string, title: string): number {
    const queryTerms = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();
    const titleLower = title.toLowerCase();

    let score = 0;

    // Title matches are more important
    queryTerms.forEach(term => {
      if (titleLower.includes(term)) {
        score += 0.3;
      }
      if (contentLower.includes(term)) {
        score += 0.1;
      }
    });

    // Normalize score
    return Math.min(score, 1);
  }

  private async calculateContentRelevance(query: string, content: string): Promise<number> {
    const queryTerms = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();

    let matches = 0;
    queryTerms.forEach(term => {
      const occurrences = (contentLower.match(new RegExp(term, 'g')) || []).length;
      matches += occurrences;
    });

    // Normalize by content length and query terms
    return Math.min(matches / (queryTerms.length * 10), 1);
  }

  private calculateNewsCredibility(domain: string): number {
    const highCredibility = [
      'reuters.com', 'ap.org', 'bbc.com', 'npr.org', 'aljazeera.com',
      'theguardian.com', 'washingtonpost.com', 'nytimes.com', 'wsj.com'
    ];

    const mediumCredibility = [
      'cnn.com', 'msnbc.com', 'foxnews.com', 'politico.com', 'bloomberg.com'
    ];

    if (highCredibility.some(hc => domain.includes(hc))) return 0.85;
    if (mediumCredibility.some(mc => domain.includes(mc))) return 0.70;
    return 0.50;
  }

  private calculateGeneralCredibility(domain: string): number {
    // Base credibility score
    let score = 0.5;

    // Boost for educational and government domains
    if (domain.endsWith('.edu') || domain.endsWith('.gov')) score += 0.3;
    if (domain.endsWith('.org')) score += 0.2;

    // Penalty for social media and content farms
    if (['facebook.com', 'twitter.com', 'tiktok.com', 'youtube.com'].some(s => domain.includes(s))) {
      score -= 0.2;
    }

    return Math.max(0.1, Math.min(1.0, score));
  }

  private isAcademicSource(domain: string): boolean {
    const academicIndicators = [
      '.edu', 'scholar.google.com', 'jstor.org', 'sciencedirect.com',
      'springer.com', 'nature.com', 'cell.com', 'academic.oup.com',
      'researchgate.net', 'semanticscholar.org', 'arxiv.org'
    ];

    return academicIndicators.some(indicator => domain.includes(indicator));
  }

  private isCurrentEventsQuery(query: string): boolean {
    const currentEventsTerms = [
      'latest', 'recent', 'current', 'today', 'news', 'breaking',
      '2024', '2025', 'happening', 'now', 'update'
    ];

    return currentEventsTerms.some(term =>
      query.toLowerCase().includes(term)
    );
  }

  private isAcademicQuery(query: string): boolean {
    const academicTerms = [
      'research', 'study', 'analysis', 'paper', 'journal', 'academic',
      'scholarly', 'peer-reviewed', 'thesis', 'dissertation'
    ];

    return academicTerms.some(term =>
      query.toLowerCase().includes(term)
    );
  }

  private calculateResponseConfidence(sources: Source[], contentLength: number): number {
    if (sources.length === 0) return 0.1;

    // Base confidence on source quality
    const avgCredibility = sources.reduce((sum, source) =>
      sum + source.credibilityScore, 0) / sources.length;

    const avgRelevance = sources.reduce((sum, source) =>
      sum + source.relevanceScore, 0) / sources.length;

    // Content length factor (longer, more detailed responses tend to be better)
    const lengthFactor = Math.min(contentLength / 1000, 1);

    // Number of sources factor
    const sourceFactor = Math.min(sources.length / 5, 1);

    return (avgCredibility * 0.4 + avgRelevance * 0.3 + lengthFactor * 0.2 + sourceFactor * 0.1);
  }

  private generateQueryId(query: string): string {
    return Buffer.from(`${query}_${Date.now()}`).toString('base64').substring(0, 16);
  }

  private getCachedResult(query: string): ResearchResult | null {
    const cached = this.cache.get(query);
    if (cached && Date.now() - cached.processingTime < this.CACHE_TTL) {
      return cached;
    }
    return null;
  }

  private cacheResult(query: string, result: ResearchResult): void {
    this.cache.set(query, result);
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.processingTime > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  private deduplicateAndSortSources(sources: Source[]): Source[] {
    const seen = new Set<string>();
    const deduplicated = sources.filter(source => {
      const key = source.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduplicated.sort((a, b) =>
      (b.relevanceScore * b.credibilityScore) - (a.relevanceScore * a.credibilityScore)
    );
  }
}
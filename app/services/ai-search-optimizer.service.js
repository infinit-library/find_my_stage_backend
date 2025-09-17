const axios = require('axios');

class AISearchOptimizerService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  /**
   * Optimize search terms for Eventbrite using AI
   * @param {string} industry - The industry from the search modal
   * @param {string} topic - The speaking topic from the search modal
   * @returns {Object} Optimized search parameters for Eventbrite
   */
  async optimizeEventbriteSearchTerms(industry, topic) {
    try {
      // If no OpenAI API key, use fallback optimization
      if (!this.openaiApiKey) {
        console.log('No OpenAI API key found, using fallback optimization');
        return this.fallbackOptimization(industry, topic);
      }

      const prompt = this.createOptimizationPrompt(industry, topic);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert at optimizing search terms for event discovery platforms like Eventbrite. Your job is to transform user input into the most effective search terms that will find relevant speaking opportunities and conferences."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      return this.parseAIResponse(aiResponse, industry, topic);

    } catch (error) {
      console.error('AI optimization failed:', error.message);
      console.log('Falling back to rule-based optimization');
      return this.fallbackOptimization(industry, topic);
    }
  }

  /**
   * Create a prompt for AI optimization
   */
  createOptimizationPrompt(industry, topic) {
    return `
Please optimize these search terms for finding speaking opportunities on Eventbrite:

Industry: "${industry}"
Speaking Topic: "${topic}"

Please provide:
1. Primary keyword (most important search term)
2. Alternative keywords (2-3 variations)
3. Eventbrite category ID (from: 102=Technology, 103=Business, 104=Science, 105=Music, 106=Fashion, 108=Health, 109=Travel, 110=Food)
4. Event type suggestions (conference, summit, workshop, etc.)
5. Target audience keywords

Format your response as JSON:
{
  "primaryKeyword": "string",
  "alternativeKeywords": ["string1", "string2", "string3"],
  "categoryId": "string",
  "eventTypes": ["string1", "string2"],
  "audienceKeywords": ["string1", "string2"],
  "reasoning": "brief explanation of optimization strategy"
}
`;
  }

  /**
   * Parse AI response and extract optimization data
   */
  parseAIResponse(aiResponse, industry, topic) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          primaryKeyword: parsed.primaryKeyword || `${topic} ${industry}`,
          alternativeKeywords: parsed.alternativeKeywords || [`${industry} conference`, `${topic} summit`],
          categoryId: parsed.categoryId || this.getDefaultCategory(industry),
          eventTypes: parsed.eventTypes || ['conference', 'summit'],
          audienceKeywords: parsed.audienceKeywords || [industry.toLowerCase()],
          reasoning: parsed.reasoning || 'AI-optimized search terms',
          source: 'AI'
        };
      }
    } catch (error) {
      console.error('Failed to parse AI response:', error.message);
    }

    // Fallback if parsing fails
    return this.fallbackOptimization(industry, topic);
  }

  /**
   * Fallback optimization using rule-based approach
   */
  fallbackOptimization(industry, topic) {
    console.log('Using fallback optimization for:', industry, topic);
    
    // Industry-specific optimizations
    const industryOptimizations = {
      'Technology': {
        keywords: ['tech conference', 'technology summit', 'innovation conference'],
        category: '102',
        eventTypes: ['conference', 'summit', 'workshop']
      },
      'Healthcare': {
        keywords: ['healthcare conference', 'medical summit', 'health innovation'],
        category: '108',
        eventTypes: ['conference', 'summit', 'symposium']
      },
      'Finance': {
        keywords: ['finance conference', 'fintech summit', 'investment conference'],
        category: '103',
        eventTypes: ['conference', 'summit', 'forum']
      },
      'Education': {
        keywords: ['education conference', 'learning summit', 'edtech conference'],
        category: '104',
        eventTypes: ['conference', 'summit', 'workshop']
      },
      'Marketing': {
        keywords: ['marketing conference', 'digital marketing summit', 'brand conference'],
        category: '103',
        eventTypes: ['conference', 'summit', 'workshop']
      }
    };

    // Topic-specific optimizations
    const topicOptimizations = {
      'Artificial Intelligence': {
        keywords: ['AI conference', 'artificial intelligence summit', 'machine learning conference'],
        category: '102',
        eventTypes: ['conference', 'summit', 'workshop']
      },
      'Machine Learning': {
        keywords: ['ML conference', 'machine learning summit', 'data science conference'],
        category: '102',
        eventTypes: ['conference', 'summit', 'workshop']
      },
      'Digital Marketing': {
        keywords: ['digital marketing conference', 'online marketing summit', 'social media conference'],
        category: '103',
        eventTypes: ['conference', 'summit', 'workshop']
      },
      'Leadership': {
        keywords: ['leadership conference', 'management summit', 'executive conference'],
        category: '103',
        eventTypes: ['conference', 'summit', 'forum']
      }
    };

    // Try topic-specific optimization first
    if (topicOptimizations[topic]) {
      const topicOpt = topicOptimizations[topic];
      return {
        primaryKeyword: topicOpt.keywords[0],
        alternativeKeywords: topicOpt.keywords.slice(1),
        categoryId: topicOpt.category,
        eventTypes: topicOpt.eventTypes,
        audienceKeywords: [industry.toLowerCase(), topic.toLowerCase()],
        reasoning: 'Topic-specific optimization',
        source: 'Rule-based'
      };
    }

    // Fall back to industry-specific optimization
    if (industryOptimizations[industry]) {
      const industryOpt = industryOptimizations[industry];
      return {
        primaryKeyword: industryOpt.keywords[0],
        alternativeKeywords: industryOpt.keywords.slice(1),
        categoryId: industryOpt.category,
        eventTypes: industryOpt.eventTypes,
        audienceKeywords: [industry.toLowerCase(), topic.toLowerCase()],
        reasoning: 'Industry-specific optimization',
        source: 'Rule-based'
      };
    }

    // Default optimization
    return {
      primaryKeyword: `${topic} ${industry}`,
      alternativeKeywords: [`${industry} conference`, `${topic} summit`, `${industry} ${topic}`],
      categoryId: '103', // Business & Professional
      eventTypes: ['conference', 'summit'],
      audienceKeywords: [industry.toLowerCase(), topic.toLowerCase()],
      reasoning: 'Default optimization',
      source: 'Rule-based'
    };
  }

  /**
   * Get default category for industry
   */
  getDefaultCategory(industry) {
    const categoryMap = {
      'Technology': '102',
      'Healthcare': '108',
      'Finance': '103',
      'Education': '104',
      'Marketing': '103',
      'Real Estate': '103',
      'Entertainment': '105',
      'Sports': '108',
      'Food & Beverage': '110',
      'Fashion': '106',
      'Travel': '109'
    };
    return categoryMap[industry] || '103';
  }

  /**
   * Generate multiple search strategies for better coverage
   */
  async generateSearchStrategies(industry, topic) {
    const optimization = await this.optimizeEventbriteSearchTerms(industry, topic);
    
    const strategies = [
      {
        keyword: optimization.primaryKeyword,
        category: optimization.categoryId,
        eventTypes: optimization.eventTypes,
        priority: 1
      }
    ];

    // Add alternative strategies
    optimization.alternativeKeywords.forEach((keyword, index) => {
      strategies.push({
        keyword: keyword,
        category: optimization.categoryId,
        eventTypes: optimization.eventTypes,
        priority: index + 2
      });
    });

    // Add audience-specific strategies
    optimization.audienceKeywords.forEach((audience, index) => {
      strategies.push({
        keyword: `${audience} conference`,
        category: optimization.categoryId,
        eventTypes: optimization.eventTypes,
        priority: strategies.length + index + 1
      });
    });

    return {
      strategies: strategies.sort((a, b) => a.priority - b.priority),
      optimization: optimization
    };
  }
}

module.exports = AISearchOptimizerService;

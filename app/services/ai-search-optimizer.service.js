const axios = require('axios');

class AISearchOptimizerService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1';
  }


  async optimizeCallForDataSpeakersSearchTerms(industry, topic) {
    try {
      
      if (!this.openaiApiKey) {
        console.log('No OpenAI API key found, using fallback optimization for Call for Data Speakers');
        return this.fallbackCallForDataSpeakersOptimization(industry, topic);
      }

      const prompt = this.createCallForDataSpeakersOptimizationPrompt(industry, topic);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert at optimizing search terms for Call for Data Speakers (callfordataspeakers.com), a platform that lists speaking opportunities for data science, AI, and tech conferences. Your job is to transform user input into the most effective search terms that will find relevant speaking opportunities and conference calls for papers."
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
      return this.parseCallForDataSpeakersAIResponse(aiResponse, industry, topic);

    } catch (error) {
      console.error('AI optimization failed for Call for Data Speakers:', error.message);
      console.log('Falling back to rule-based optimization for Call for Data Speakers');
      return this.fallbackCallForDataSpeakersOptimization(industry, topic);
    }
  }

  async optimizeOpenWebNinjaSearchTerms(industry, topic) {
    try {
      if (!this.openaiApiKey) {
        console.log('No OpenAI API key found, using fallback optimization for OpenWebNinja');
        return this.fallbackOpenWebNinjaOptimization(industry, topic);
      }

      const prompt = this.createOpenWebNinjaOptimizationPrompt(industry, topic);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert at optimizing search terms for OpenWebNinja, a platform that provides real-time event data and networking opportunities. Your job is to transform user input into the most effective search terms that will find relevant events, conferences, and networking opportunities."
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
      return this.parseOpenWebNinjaAIResponse(aiResponse, industry, topic);

    } catch (error) {
      console.error('AI optimization failed for OpenWebNinja:', error.message);
      console.log('Falling back to rule-based optimization for OpenWebNinja');
      return this.fallbackOpenWebNinjaOptimization(industry, topic);
    }
  }

  async optimizeEventbriteSearchTerms(industry, topic) {
    try {
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

  createOpenWebNinjaOptimizationPrompt(industry, topic) {
    return `
Please optimize these search terms for finding events and networking opportunities on OpenWebNinja (api.openwebninja.com):

Industry: "${industry}"
Speaking Topic: "${topic}"

OpenWebNinja focuses on:
- Real-time event data
- Networking opportunities
- Industry conferences and events
- Professional meetups and gatherings
- Business events and trade shows

Please provide:
1. Primary search keyword (most effective for finding relevant events)
2. Alternative keywords (2-3 variations that might find different but related events)
3. Industry-specific terms (jargon, technologies, or methodologies specific to this industry)
4. Event types (conference, summit, meetup, workshop, trade show, etc.)
5. Target audience keywords (professionals, practitioners, entrepreneurs, etc.)

Format your response as JSON:
{
  "primaryKeyword": "string",
  "alternativeKeywords": ["string1", "string2", "string3"],
  "industryTerms": ["string1", "string2"],
  "eventTypes": ["string1", "string2"],
  "audienceKeywords": ["string1", "string2"],
  "reasoning": "brief explanation of optimization strategy for OpenWebNinja events"
}
`;
  }

  createCallForDataSpeakersOptimizationPrompt(industry, topic) {
    return `
Please optimize these search terms for finding speaking opportunities on Call for Data Speakers (callfordataspeakers.com):

Industry: "${industry}"
Speaking Topic: "${topic}"

Call for Data Speakers focuses on:
- Data science conferences
- AI/ML speaking opportunities  
- Tech conference calls for papers
- Academic and industry conferences
- Research presentation opportunities

Please provide:
1. Primary search keyword (most effective for finding relevant conferences)
2. Alternative keywords (2-3 variations that might find different but related events)
3. Technical terms (specific technologies, methodologies, or frameworks)
4. Conference types (workshop, symposium, summit, etc.)
5. Target audience keywords (researchers, practitioners, students, etc.)

Format your response as JSON:
{
  "primaryKeyword": "string",
  "alternativeKeywords": ["string1", "string2", "string3"],
  "technicalTerms": ["string1", "string2"],
  "conferenceTypes": ["string1", "string2"],
  "audienceKeywords": ["string1", "string2"],
  "reasoning": "brief explanation of optimization strategy for data science conferences"
}
`;
  }


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


  parseOpenWebNinjaAIResponse(aiResponse, industry, topic) {
    try {
      
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          primaryKeyword: parsed.primaryKeyword || `${topic} ${industry}`,
          alternativeKeywords: parsed.alternativeKeywords || [`${industry} conference`, `${topic} summit`],
          industryTerms: parsed.industryTerms || [topic.toLowerCase()],
          eventTypes: parsed.eventTypes || ['conference', 'summit'],
          audienceKeywords: parsed.audienceKeywords || [industry.toLowerCase()],
          reasoning: parsed.reasoning || 'AI-optimized search terms for OpenWebNinja events',
          source: 'AI'
        };
      }
    } catch (error) {
      console.error('Failed to parse OpenWebNinja AI response:', error.message);
    }

    
    return this.fallbackOpenWebNinjaOptimization(industry, topic);
  }

  parseCallForDataSpeakersAIResponse(aiResponse, industry, topic) {
    try {
      
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          primaryKeyword: parsed.primaryKeyword || `${topic} ${industry}`,
          alternativeKeywords: parsed.alternativeKeywords || [`${industry} conference`, `${topic} summit`],
          technicalTerms: parsed.technicalTerms || [topic.toLowerCase()],
          conferenceTypes: parsed.conferenceTypes || ['conference', 'summit'],
          audienceKeywords: parsed.audienceKeywords || [industry.toLowerCase()],
          reasoning: parsed.reasoning || 'AI-optimized search terms for data science conferences',
          source: 'AI'
        };
      }
    } catch (error) {
      console.error('Failed to parse Call for Data Speakers AI response:', error.message);
    }

    
    return this.fallbackCallForDataSpeakersOptimization(industry, topic);
  }

  /**
   * Parse AI response and extract optimization data
   */
  parseAIResponse(aiResponse, industry, topic) {
    try {
      
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

    
    return this.fallbackOptimization(industry, topic);
  }

  /**
   * Fallback optimization for OpenWebNinja using rule-based approach
   */
  fallbackOpenWebNinjaOptimization(industry, topic) {
    console.log('Using fallback optimization for OpenWebNinja:', industry, topic);
    
    const industryOptimizations = {
      'Technology': {
        keywords: ['tech conference', 'technology summit', 'innovation event', 'digital conference'],
        industryTerms: ['tech', 'digital', 'innovation', 'startup', 'software'],
        eventTypes: ['conference', 'summit', 'meetup', 'workshop', 'trade show']
      },
      'Healthcare': {
        keywords: ['healthcare conference', 'medical summit', 'health innovation', 'healthcare event'],
        industryTerms: ['healthcare', 'medical', 'health', 'pharma', 'biotech'],
        eventTypes: ['conference', 'summit', 'symposium', 'workshop']
      },
      'Finance': {
        keywords: ['finance conference', 'fintech summit', 'investment event', 'banking conference'],
        industryTerms: ['finance', 'fintech', 'investment', 'banking', 'trading'],
        eventTypes: ['conference', 'summit', 'forum', 'workshop']
      },
      'Education': {
        keywords: ['education conference', 'learning summit', 'edtech event', 'academic conference'],
        industryTerms: ['education', 'learning', 'edtech', 'academic', 'training'],
        eventTypes: ['conference', 'summit', 'workshop', 'symposium']
      },
      'Marketing': {
        keywords: ['marketing conference', 'digital marketing summit', 'brand event', 'advertising conference'],
        industryTerms: ['marketing', 'digital', 'brand', 'advertising', 'social media'],
        eventTypes: ['conference', 'summit', 'workshop', 'meetup']
      },
      'Data & Analytics': {
        keywords: ['data conference', 'analytics summit', 'big data event', 'data science conference'],
        industryTerms: ['data', 'analytics', 'big data', 'data science', 'business intelligence'],
        eventTypes: ['conference', 'summit', 'workshop', 'meetup']
      },
      'Design': {
        keywords: ['design conference', 'UX summit', 'creative event', 'design thinking conference'],
        industryTerms: ['design', 'UX', 'UI', 'creative', 'user experience'],
        eventTypes: ['conference', 'summit', 'workshop', 'meetup']
      },
      'Manufacturing': {
        keywords: ['manufacturing conference', 'industrial summit', 'production event', 'industry conference'],
        industryTerms: ['manufacturing', 'industrial', 'production', 'automation', 'IoT'],
        eventTypes: ['conference', 'summit', 'trade show', 'workshop']
      },
      'Retail': {
        keywords: ['retail conference', 'e-commerce summit', 'retail event', 'commerce conference'],
        industryTerms: ['retail', 'e-commerce', 'commerce', 'shopping', 'customer'],
        eventTypes: ['conference', 'summit', 'trade show', 'workshop']
      },
      'Government': {
        keywords: ['government conference', 'public sector summit', 'civic event', 'policy conference'],
        industryTerms: ['government', 'public sector', 'civic', 'policy', 'public service'],
        eventTypes: ['conference', 'summit', 'forum', 'workshop']
      },
      'Nonprofit': {
        keywords: ['nonprofit conference', 'social impact summit', 'charity event', 'NGO conference'],
        industryTerms: ['nonprofit', 'social impact', 'charity', 'NGO', 'philanthropy'],
        eventTypes: ['conference', 'summit', 'workshop', 'forum']
      }
    };

    const topicOptimizations = {
      'Artificial Intelligence': {
        keywords: ['AI conference', 'artificial intelligence summit', 'machine learning event', 'AI meetup'],
        industryTerms: ['AI', 'artificial intelligence', 'machine learning', 'deep learning', 'neural networks'],
        eventTypes: ['conference', 'summit', 'workshop', 'meetup']
      },
      'Machine Learning': {
        keywords: ['ML conference', 'machine learning summit', 'data science event', 'ML workshop'],
        industryTerms: ['machine learning', 'ML', 'data science', 'algorithms', 'predictive modeling'],
        eventTypes: ['conference', 'summit', 'workshop', 'meetup']
      },
      'Digital Marketing': {
        keywords: ['digital marketing conference', 'online marketing summit', 'social media event', 'digital marketing workshop'],
        industryTerms: ['digital marketing', 'social media', 'SEO', 'content marketing', 'online advertising'],
        eventTypes: ['conference', 'summit', 'workshop', 'meetup']
      },
      'Leadership': {
        keywords: ['leadership conference', 'management summit', 'executive event', 'leadership workshop'],
        industryTerms: ['leadership', 'management', 'executive', 'strategy', 'business'],
        eventTypes: ['conference', 'summit', 'forum', 'workshop']
      },
      'Cloud Computing & Infrastructure': {
        keywords: ['cloud conference', 'infrastructure summit', 'cloud computing event', 'cloud tech conference'],
        industryTerms: ['cloud', 'infrastructure', 'cloud computing', 'AWS', 'Azure', 'GCP', 'DevOps'],
        eventTypes: ['conference', 'summit', 'workshop', 'meetup']
      },
      'Software Development & Engineering': {
        keywords: ['software development conference', 'engineering summit', 'dev conference', 'software engineering event'],
        industryTerms: ['software development', 'engineering', 'programming', 'coding', 'development'],
        eventTypes: ['conference', 'summit', 'workshop', 'meetup']
      },
      'Data Science': {
        keywords: ['data science conference', 'analytics summit', 'data conference', 'data science event'],
        industryTerms: ['data science', 'analytics', 'machine learning', 'statistics', 'data'],
        eventTypes: ['conference', 'summit', 'workshop', 'meetup']
      },
      'Cybersecurity': {
        keywords: ['cybersecurity conference', 'security summit', 'cyber conference', 'security event'],
        industryTerms: ['cybersecurity', 'security', 'cyber', 'information security', 'network security'],
        eventTypes: ['conference', 'summit', 'workshop', 'meetup']
      }
    };

    // Check for exact topic match first
    if (topicOptimizations[topic]) {
      const topicOpt = topicOptimizations[topic];
      return {
        primaryKeyword: topicOpt.keywords[0],
        alternativeKeywords: topicOpt.keywords.slice(1),
        industryTerms: topicOpt.industryTerms,
        eventTypes: topicOpt.eventTypes,
        audienceKeywords: [industry.toLowerCase(), topic.toLowerCase()],
        reasoning: 'Topic-specific optimization for OpenWebNinja events',
        source: 'Rule-based'
      };
    }

    // Check for partial topic matches (handle special characters and variations)
    const normalizedTopic = topic.toLowerCase().replace(/[&]/g, 'and').replace(/\s+/g, ' ').trim();
    for (const [key, topicOpt] of Object.entries(topicOptimizations)) {
      const normalizedKey = key.toLowerCase().replace(/[&]/g, 'and').replace(/\s+/g, ' ').trim();
      if (normalizedTopic.includes(normalizedKey) || normalizedKey.includes(normalizedTopic)) {
        return {
          primaryKeyword: topicOpt.keywords[0],
          alternativeKeywords: topicOpt.keywords.slice(1),
          industryTerms: topicOpt.industryTerms,
          eventTypes: topicOpt.eventTypes,
          audienceKeywords: [industry.toLowerCase(), topic.toLowerCase()],
          reasoning: 'Topic-specific optimization for OpenWebNinja events (partial match)',
          source: 'Rule-based'
        };
      }
    }

    if (industryOptimizations[industry]) {
      const industryOpt = industryOptimizations[industry];
      return {
        primaryKeyword: industryOpt.keywords[0],
        alternativeKeywords: industryOpt.keywords.slice(1),
        industryTerms: industryOpt.industryTerms,
        eventTypes: industryOpt.eventTypes,
        audienceKeywords: [industry.toLowerCase(), topic.toLowerCase()],
        reasoning: 'Industry-specific optimization for OpenWebNinja events',
        source: 'Rule-based'
      };
    }

    return {
      primaryKeyword: `${topic} ${industry}`,
      alternativeKeywords: [`${industry} conference`, `${topic} summit`, `${industry} ${topic}`],
      industryTerms: [topic.toLowerCase(), industry.toLowerCase()],
      eventTypes: ['conference', 'summit', 'workshop', 'meetup'],
      audienceKeywords: [industry.toLowerCase(), topic.toLowerCase()],
      reasoning: `Generic optimization for ${industry} industry`,
      source: 'Rule-based'
    };
  }

  /**
   * Fallback optimization for Call for Data Speakers using rule-based approach
   */
  fallbackCallForDataSpeakersOptimization(industry, topic) {
    console.log('Using fallback optimization for Call for Data Speakers:', industry, topic);
    
    
    const dataScienceOptimizations = {
      'Technology': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'data analytics', 'cloud', 'cloud data', 'cloud tech'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'analytics', 'cloud', 'cloud computing', 'infrastructure'],
        conferenceTypes: ['conference', 'usergroup', 'summit', 'workshop']
      },
      'Finance': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'financial data', 'fintech', 'banking data'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'financial', 'fintech', 'banking'],
        conferenceTypes: ['conference', 'usergroup', 'summit']
      },
      'Healthcare': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'healthcare data', 'medical data', 'health analytics'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'healthcare', 'medical', 'health data'],
        conferenceTypes: ['conference', 'usergroup', 'workshop']
      },
      'Education': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'educational data', 'learning analytics', 'edtech'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'education', 'learning', 'edtech'],
        conferenceTypes: ['conference', 'usergroup', 'workshop']
      },
      'Business': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'business intelligence', 'data analytics', 'business data'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'business intelligence', 'analytics', 'business'],
        conferenceTypes: ['conference', 'usergroup', 'summit']
      },
      'Marketing': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'marketing data', 'customer analytics', 'marketing analytics'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'marketing', 'customer', 'analytics'],
        conferenceTypes: ['conference', 'usergroup', 'summit']
      },
      'Data & Analytics': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'data analytics', 'business intelligence', 'data science'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'analytics', 'business intelligence', 'data science'],
        conferenceTypes: ['conference', 'usergroup', 'summit']
      },
      'Design': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'data visualization', 'analytics', 'data design'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'visualization', 'analytics', 'design'],
        conferenceTypes: ['conference', 'usergroup', 'workshop']
      },
      'Manufacturing': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'industrial data', 'manufacturing analytics', 'IoT data'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'industrial', 'manufacturing', 'IoT'],
        conferenceTypes: ['conference', 'usergroup', 'summit']
      },
      'Retail': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'retail data', 'customer analytics', 'e-commerce data'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'retail', 'customer', 'e-commerce'],
        conferenceTypes: ['conference', 'usergroup', 'summit']
      },
      'Government': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'government data', 'public sector analytics', 'civic data'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'government', 'public sector', 'civic'],
        conferenceTypes: ['conference', 'usergroup', 'summit']
      },
      'Nonprofit': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'nonprofit data', 'social impact analytics', 'charity data'],
        technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'nonprofit', 'social impact', 'charity'],
        conferenceTypes: ['conference', 'usergroup', 'workshop']
      }
    };

    
    const topicOptimizations = {
      'Artificial Intelligence': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure AI'],
        technicalTerms: ['AI', 'machine learning', 'data platform', 'analytics'],
        conferenceTypes: ['conference', 'usergroup', 'workshop']
      },
      'Machine Learning': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure ML'],
        technicalTerms: ['machine learning', 'ML', 'data platform', 'analytics'],
        conferenceTypes: ['conference', 'usergroup', 'workshop']
      },
      'Data Science': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'data analytics'],
        technicalTerms: ['data science', 'data platform', 'analytics', 'SQL'],
        conferenceTypes: ['conference', 'usergroup', 'summit']
      },
      'Big Data': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data'],
        technicalTerms: ['big data', 'data platform', 'data engineering', 'Azure'],
        conferenceTypes: ['conference', 'usergroup', 'summit']
      },
      'Software Development & Engineering': {
        keywords: ['data platform', 'SQL', 'Power BI', 'Microsoft Fabric', 'Azure'],
        technicalTerms: ['data platform', 'SQL', 'Power BI', 'Fabric', 'Azure'],
        conferenceTypes: ['conference', 'usergroup', 'workshop']
      },
      'Cloud Computing & Infrastructure': {
        keywords: ['cloud', 'cloud data', 'Azure', 'Microsoft Fabric', 'infrastructure', 'cloud tech'],
        technicalTerms: ['cloud', 'cloud data', 'Azure', 'Fabric', 'infrastructure', 'cloud computing'],
        conferenceTypes: ['conference', 'usergroup', 'summit']
      }
    };

    
    if (topicOptimizations[topic]) {
      const topicOpt = topicOptimizations[topic];
      return {
        primaryKeyword: topicOpt.keywords[0],
        alternativeKeywords: topicOpt.keywords.slice(1),
        technicalTerms: topicOpt.technicalTerms,
        conferenceTypes: topicOpt.conferenceTypes,
        audienceKeywords: [industry.toLowerCase(), topic.toLowerCase()],
        reasoning: 'Topic-specific optimization for data science conferences',
        source: 'Rule-based'
      };
    }

    
    if (dataScienceOptimizations[industry]) {
      const industryOpt = dataScienceOptimizations[industry];
      return {
        primaryKeyword: industryOpt.keywords[0],
        alternativeKeywords: industryOpt.keywords.slice(1),
        technicalTerms: industryOpt.technicalTerms,
        conferenceTypes: industryOpt.conferenceTypes,
        audienceKeywords: [industry.toLowerCase(), topic.toLowerCase()],
        reasoning: 'Industry-specific optimization for data science conferences',
        source: 'Rule-based'
      };
    }

    
    return {
      primaryKeyword: 'data platform',
      alternativeKeywords: ['SQL', 'Power BI', 'Microsoft Fabric', 'Azure Data', 'data analytics'],
      technicalTerms: ['SQL Server', 'Power BI', 'Fabric', 'Azure', 'data platform', 'analytics'],
      conferenceTypes: ['conference', 'usergroup', 'summit', 'workshop'],
      audienceKeywords: [industry.toLowerCase(), topic.toLowerCase()],
      reasoning: `Generic optimization for ${industry} industry - using data platform terms`,
      source: 'Rule-based'
    };
  }

  /**
   * Fallback optimization using rule-based approach
   */
  fallbackOptimization(industry, topic) {
    console.log('Using fallback optimization for:', industry, topic);
    
    
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

    
    return {
      primaryKeyword: `${topic} ${industry}`,
      alternativeKeywords: [`${industry} conference`, `${topic} summit`, `${industry} ${topic}`],
      categoryId: '103', 
      eventTypes: ['conference', 'summit'],
      audienceKeywords: [industry.toLowerCase(), topic.toLowerCase()],
      reasoning: 'Default optimization',
      source: 'Rule-based'
    };
  }

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


  async generateCallForDataSpeakersSearchStrategies(industry, topic) {
    const optimization = await this.optimizeCallForDataSpeakersSearchTerms(industry, topic);
    
    const strategies = [
      {
        keyword: optimization.primaryKeyword,
        technicalTerms: optimization.technicalTerms,
        conferenceTypes: optimization.conferenceTypes,
        priority: 1
      }
    ];

    
    optimization.alternativeKeywords.forEach((keyword, index) => {
      strategies.push({
        keyword: keyword,
        technicalTerms: optimization.technicalTerms,
        conferenceTypes: optimization.conferenceTypes,
        priority: index + 2
      });
    });

    
    optimization.technicalTerms.forEach((term, index) => {
      strategies.push({
        keyword: `${term} conference`,
        technicalTerms: [term],
        conferenceTypes: optimization.conferenceTypes,
        priority: strategies.length + index + 1
      });
    });

    
    optimization.audienceKeywords.forEach((audience, index) => {
      strategies.push({
        keyword: `${audience} data science conference`,
        technicalTerms: optimization.technicalTerms,
        conferenceTypes: optimization.conferenceTypes,
        priority: strategies.length + index + 1
      });
    });

    return {
      strategies: strategies.sort((a, b) => a.priority - b.priority),
      optimization: optimization
    };
  }

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

    
    optimization.alternativeKeywords.forEach((keyword, index) => {
      strategies.push({
        keyword: keyword,
        category: optimization.categoryId,
        eventTypes: optimization.eventTypes,
        priority: index + 2
      });
    });

    
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

const { request } = require('undici');
const AISearchOptimizerService = require('../services/ai-search-optimizer.service');

class OpenWebNinjaController {
    static async getData(req, res) {
        try {
            // Handle both POST (body) and GET (query) requests
            const { topic, industry } = req.method === 'POST' ? req.body : req.query;
            console.log('Topic and Industry:============================================================================', topic, industry);
            if(!topic || !industry) {
                return res.status(400).json({ error: 'Topic and industry are required', statusCode: 400 });
            }
            
            // Use AI to optimize search keywords
            const aiOptimizer = new AISearchOptimizerService();
            const optimization = await aiOptimizer.optimizeOpenWebNinjaSearchTerms(industry, topic);
            
            console.log('AI Optimization Result:', optimization);
            
            // Use the AI-optimized primary keyword for the search
            const optimizedKeyword = optimization.primaryKeyword;
            const encodedKeyword = encodeURIComponent(optimizedKeyword);
            const url = `https://api.openwebninja.com/realtime-events-data/search-events?query=${encodedKeyword}&date=month&is_virtual=false&start=0`;
            console.log('AI-Optimized URL:=====================================================================================================', url);
            
            const {statusCode, body} = await request(url, {
                headers: {
                    'X-API-Key': process.env.OPENWEBNINJA_API_KEY
                }
            });
            
            if(statusCode !== 200) {
                return res.status(500).json({ error: 'Failed to get data from OpenWebNinja', statusCode });
            }
            
            // Consume the body stream and convert to text, then parse JSON
            const bodyText = await body.text();
            const data = JSON.parse(bodyText);
            
            // Add optimization metadata to the response
            const responseData = {
                ...data,
                optimization: {
                    originalTopic: topic,
                    originalIndustry: industry,
                    optimizedKeyword: optimizedKeyword,
                    alternativeKeywords: optimization.alternativeKeywords,
                    industryTerms: optimization.industryTerms,
                    eventTypes: optimization.eventTypes,
                    reasoning: optimization.reasoning,
                    source: optimization.source
                }
            };
            
            return res.status(200).json(responseData);
        } catch (error) {
            console.error('OpenWebNinja API Error:', error);
            return res.status(500).json({ 
                error: 'Internal server error while fetching data from OpenWebNinja',
                statusCode: 500 
            });
        }
    }
}

module.exports = OpenWebNinjaController;
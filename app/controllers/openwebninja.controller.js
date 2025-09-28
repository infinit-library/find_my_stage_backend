const { request } = require('undici');
const AISearchOptimizerService = require('../services/ai-search-optimizer.service');

class OpenWebNinjaController {
    static async getData(req, res) {
        try {
            const { topic, industry } = req.body;

            if(!topic || !industry) {
                return res.status(400).json({ error: 'Topic and industry are required', statusCode: 400 });
            }
            
            // Use AI to optimize search keywords
            const aiOptimizer = new AISearchOptimizerService();
            const optimization = await aiOptimizer.optimizeOpenWebNinjaSearchTerms(industry, topic);
            

            
            // Use the AI-optimized primary keyword for the search
            const optimizedKeyword = optimization.primaryKeyword;
            // Use the primary keyword directly (as shown in your working example)
            const encodedKeyword = encodeURIComponent(optimizedKeyword);
            const url = `https://api.openwebninja.com/realtime-events-data/search-events?query=${encodedKeyword}&date=month&is_virtual=false&start=0`;
            
            console.log('OpenWebNinja URL:', url);
            console.log('API Key (first 10 chars):', process.env.OPENWEBNINJA_API_KEY ? process.env.OPENWEBNINJA_API_KEY.substring(0, 10) + '...' : 'NOT SET');
          
            // Use the API key from environment variables
            const {statusCode, body} = await request(url, {
                headers: {
                    'X-API-Key': process.env.OPENWEBNINJA_API_KEY
                },
                timeout: 25000 // 25 second timeout to be under the 30s frontend timeout
            });

            console.log("Status Code:", statusCode);
        
         
            if(statusCode !== 200) {
                console.error('OpenWebNinja API returned non-200 status:', statusCode);
                
                // Try to get the error response body
                let errorBody = '';
                try {
                    errorBody = await body.text();
                    console.error('Error response body:', errorBody);
                } catch (e) {
                    console.error('Could not read error response body:', e.message);
                }
                
                return res.status(500).json({ 
                    error: 'Failed to get data from OpenWebNinja', 
                    statusCode,
                    errorDetails: errorBody,
                    top20: [],
                    more100: []
                });
            }      
            
            // Consume the body stream and convert to text, then parse JSON
            const bodyText = await body.text();
            console.log('Response body length:', bodyText.length);
            
            let data;
            try {
                data = JSON.parse(bodyText);
                console.log('Successfully parsed JSON response');
            } catch (parseError) {
                console.error('Failed to parse OpenWebNinja response:', parseError);
                return res.status(500).json({ 
                    error: 'Invalid response format from OpenWebNinja',
                    top20: [],
                    more100: []
                });
            }
            
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
            
            // Handle timeout errors specifically
            if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                return res.status(408).json({ 
                    error: 'Request timeout - OpenWebNinja API took too long to respond',
                    statusCode: 408,
                    top20: [],
                    more100: []
                });
            }
            
            return res.status(500).json({ 
                error: 'Internal server error while fetching data from OpenWebNinja',
                statusCode: 500,
                top20: [],
                more100: []
            });
        }
    }
}

module.exports = OpenWebNinjaController;


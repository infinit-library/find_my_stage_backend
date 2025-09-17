// Ticketmaster Parameter Mapping System (Backend)
// Converts our industry and topic selections to Ticketmaster-compatible search parameters

// Industry to Ticketmaster mapping
const INDUSTRY_TO_TICKETMASTER = {
  // Technology
  'Technology': {
    keyword: 'technology conference',
    classificationId: 'KZFzniwnSyZfZ7v7n1', // Miscellaneous
    classificationName: 'Miscellaneous',
    segmentId: 'KZFzniwnSyZfZ7v7n1',
    segmentName: 'Other'
  },
  
  // Finance
  'Finance': {
    keyword: 'finance conference',
    classificationId: 'KZFzniwnSyZfZ7v7n1',
    classificationName: 'Miscellaneous',
    segmentId: 'KZFzniwnSyZfZ7v7n1',
    segmentName: 'Other'
  },
  
  // Healthcare
  'Healthcare': {
    keyword: 'medical device conference',
    classificationId: 'KZFzniwnSyZfZ7v7n1', // Miscellaneous - healthcare events are rare in Ticketmaster
    classificationName: 'Miscellaneous',
    segmentId: 'KZFzniwnSyZfZ7v7n1',
    segmentName: 'Other'
  },
  
  // Education
  'Education': {
    keyword: 'education conference',
    classificationId: 'KZFzniwnSyZfZ7v7n1',
    classificationName: 'Miscellaneous',
    segmentId: 'KZFzniwnSyZfZ7v7n1',
    segmentName: 'Other'
  },
  
  // Business
  'Business': {
    keyword: 'business conference',
    classificationId: 'KZFzniwnSyZfZ7v7n1',
    classificationName: 'Miscellaneous',
    segmentId: 'KZFzniwnSyZfZ7v7n1',
    segmentName: 'Other'
  },
  
  // Marketing
  'Marketing': {
    keyword: 'marketing conference',
    classificationId: 'KZFzniwnSyZfZ7v7n1',
    classificationName: 'Miscellaneous',
    segmentId: 'KZFzniwnSyZfZ7v7n1',
    segmentName: 'Other'
  },
  
  // Data & Analytics
  'Data & Analytics': {
    keyword: 'data analytics conference',
    classificationId: 'KZFzniwnSyZfZ7v7n1',
    classificationName: 'Miscellaneous',
    segmentId: 'KZFzniwnSyZfZ7v7n1',
    segmentName: 'Other'
  },
  
  // Design
  'Design': {
    keyword: 'design conference',
    classificationId: 'KZFzniwnSyZfZ7v7n1',
    classificationName: 'Miscellaneous',
    segmentId: 'KZFzniwnSyZfZ7v7n1',
    segmentName: 'Other'
  }
};

// AI-optimized keyword generation for better Ticketmaster search results
function generateOptimizedKeywords(industry, topic) {
  // Generate multiple keyword variations optimized for Ticketmaster search
  const keywords = [];
  
  // Extract core terms from topic
  const coreTerms = topic.toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(term => term.length > 2);
  
  const industryLower = industry.toLowerCase();
  const topicLower = topic.toLowerCase();
  
  // 1. Add industry-specific broad terms that might exist in Ticketmaster FIRST
  if (industryLower === 'healthcare') {
    keywords.push('health');
    keywords.push('medical');
    keywords.push('healthcare');
    keywords.push('medicine');
    keywords.push('wellness');
  } else if (industryLower === 'technology') {
    keywords.push('tech');
    keywords.push('technology');
    keywords.push('innovation');
    keywords.push('digital');
    keywords.push('software');
    keywords.push('ai');
    keywords.push('artificial intelligence');
  } else if (industryLower === 'finance') {
    keywords.push('finance');
    keywords.push('financial');
    keywords.push('banking');
    keywords.push('investment');
    keywords.push('fintech');
    keywords.push('crypto');
    keywords.push('blockchain');
  } else if (industryLower === 'education') {
    keywords.push('education');
    keywords.push('learning');
    keywords.push('teaching');
    keywords.push('training');
    keywords.push('edtech');
    keywords.push('academic');
  } else if (industryLower === 'business') {
    keywords.push('business');
    keywords.push('corporate');
    keywords.push('leadership');
    keywords.push('management');
    keywords.push('entrepreneurship');
    keywords.push('startup');
  } else if (industryLower === 'marketing') {
    keywords.push('marketing');
    keywords.push('advertising');
    keywords.push('branding');
    keywords.push('digital marketing');
    keywords.push('social media');
    keywords.push('content');
  } else if (industryLower === 'data & analytics') {
    keywords.push('data');
    keywords.push('analytics');
    keywords.push('big data');
    keywords.push('business intelligence');
    keywords.push('machine learning');
    keywords.push('data science');
  } else if (industryLower === 'design') {
    keywords.push('design');
    keywords.push('creative');
    keywords.push('ux');
    keywords.push('ui');
    keywords.push('graphic design');
    keywords.push('user experience');
  } else {
    // Generic fallback for any other industry
    keywords.push(industryLower);
    keywords.push('professional');
    keywords.push('industry');
  }
  
  // 2. Add topic-specific terms that might exist in Ticketmaster
  if (topicLower.includes('artificial intelligence') || topicLower.includes('ai')) {
    keywords.push('ai');
    keywords.push('artificial intelligence');
    keywords.push('machine learning');
    keywords.push('tech');
    keywords.push('innovation');
  } else if (topicLower.includes('digital marketing')) {
    keywords.push('digital marketing');
    keywords.push('marketing');
    keywords.push('advertising');
    keywords.push('social media');
  } else if (topicLower.includes('customer experience')) {
    keywords.push('customer experience');
    keywords.push('customer service');
    keywords.push('cx');
    keywords.push('experience');
  } else if (topicLower.includes('leadership')) {
    keywords.push('leadership');
    keywords.push('management');
    keywords.push('business');
    keywords.push('corporate');
  } else if (topicLower.includes('innovation')) {
    keywords.push('innovation');
    keywords.push('technology');
    keywords.push('startup');
    keywords.push('entrepreneurship');
  } else if (topicLower.includes('data analytics')) {
    keywords.push('data');
    keywords.push('analytics');
    keywords.push('big data');
    keywords.push('business intelligence');
  } else if (topicLower.includes('user experience') || topicLower.includes('ux')) {
    keywords.push('ux');
    keywords.push('user experience');
    keywords.push('design');
    keywords.push('ui');
  } else if (topicLower.includes('cloud computing')) {
    keywords.push('cloud');
    keywords.push('cloud computing');
    keywords.push('technology');
    keywords.push('tech');
  } else if (topicLower.includes('cybersecurity')) {
    keywords.push('cybersecurity');
    keywords.push('security');
    keywords.push('tech');
    keywords.push('technology');
  } else if (topicLower.includes('blockchain')) {
    keywords.push('blockchain');
    keywords.push('crypto');
    keywords.push('cryptocurrency');
    keywords.push('fintech');
  } else if (topicLower.includes('medical device')) {
    keywords.push('medical device');
    keywords.push('medical technology');
    keywords.push('medtech');
    keywords.push('health');
    keywords.push('medical');
  } else if (topicLower.includes('digital health')) {
    keywords.push('digital health');
    keywords.push('health technology');
    keywords.push('telemedicine');
    keywords.push('health');
  } else if (topicLower.includes('edtech')) {
    keywords.push('edtech');
    keywords.push('education technology');
    keywords.push('learning');
    keywords.push('education');
  } else if (topicLower.includes('fintech')) {
    keywords.push('fintech');
    keywords.push('financial technology');
    keywords.push('banking');
    keywords.push('finance');
  } else {
    // Generic topic handling - extract key terms
    const topicWords = topicLower.split(/\s+/).filter(word => word.length > 3);
    topicWords.forEach(word => {
      keywords.push(word);
      keywords.push(`${word} conference`);
      keywords.push(`${word} event`);
      keywords.push(`${word} summit`);
    });
  }
  
  // 3. Add industry + topic combinations
  keywords.push(`${industryLower} conference`);
  keywords.push(`${industryLower} summit`);
  keywords.push(`${industryLower} event`);
  keywords.push(`${industryLower} meeting`);
  keywords.push(`${topicLower} conference`);
  keywords.push(`${topicLower} summit`);
  keywords.push(`${topicLower} event`);
  keywords.push(`${industryLower} ${topicLower} conference`);
  keywords.push(`${topicLower} ${industryLower} conference`);
  keywords.push(`${industryLower} ${topicLower} summit`);
  keywords.push(`${topicLower} ${industryLower} event`);
  
  // 4. Add very broad terms that exist in Ticketmaster for ANY industry (fallback)
  keywords.push('conference');
  keywords.push('summit');
  keywords.push('event');
  keywords.push('meeting');
  keywords.push('convention');
  keywords.push('workshop');
  keywords.push('seminar');
  keywords.push('expo');
  keywords.push('exhibition');
  keywords.push('show');
  keywords.push('festival');
  keywords.push('symposium');
  keywords.push('forum');
  keywords.push('gala');
  keywords.push('awards');
  keywords.push('ceremony');
  keywords.push('launch');
  keywords.push('demo');
  keywords.push('presentation');
  
  // Remove duplicates and return
  return [...new Set(keywords)];
}

// Topic to keyword mapping for better search results
const TOPIC_TO_KEYWORDS = {
  // Technology topics
  'Artificial Intelligence & Machine Learning': ['AI conference', 'machine learning summit', 'artificial intelligence event'],
  'Cloud Computing & Infrastructure': ['cloud computing conference', 'infrastructure summit', 'cloud technology event'],
  'Cybersecurity & Data Protection': ['cybersecurity conference', 'data protection summit', 'security event'],
  'Digital Transformation & Innovation': ['digital transformation conference', 'innovation summit', 'digital event'],
  'Software Development & Engineering': ['software development conference', 'engineering summit', 'programming event'],
  'Data Science & Analytics': ['data science conference', 'analytics summit', 'big data event'],
  'DevOps & Automation': ['devops conference', 'automation summit', 'devops event'],
  'Mobile App Development': ['mobile development conference', 'app development summit', 'mobile event'],
  'Web Development & Frontend': ['web development conference', 'frontend summit', 'web technology event'],
  'Backend Development & APIs': ['backend development conference', 'API summit', 'backend event'],
  'Database Management & Design': ['database conference', 'data management summit', 'database event'],
  'Network Security & Infrastructure': ['network security conference', 'infrastructure summit', 'networking event'],
  'IoT & Connected Devices': ['IoT conference', 'connected devices summit', 'internet of things event'],
  'Blockchain & Distributed Systems': ['blockchain conference', 'distributed systems summit', 'cryptocurrency event'],
  'User Experience (UX) Design': ['UX design conference', 'user experience summit', 'UX event'],
  'Product Management & Strategy': ['product management conference', 'strategy summit', 'product event'],
  'Agile & Scrum Methodologies': ['agile conference', 'scrum summit', 'agile methodology event'],
  'Quality Assurance & Testing': ['QA conference', 'testing summit', 'quality assurance event'],
  'System Architecture & Design': ['architecture conference', 'system design summit', 'architecture event'],
  'Emerging Technologies & Trends': ['emerging technology conference', 'tech trends summit', 'innovation event'],

  // Finance topics
  'Fintech Innovation & Digital Banking': ['fintech conference', 'digital banking summit', 'financial technology event'],
  'Cryptocurrency & Blockchain Technology': ['cryptocurrency conference', 'blockchain summit', 'crypto event'],
  'Investment Strategies & Portfolio Management': ['investment conference', 'portfolio management summit', 'investment event'],
  'Risk Management & Regulatory Compliance': ['risk management conference', 'compliance summit', 'regulatory event'],
  'Financial Planning & Wealth Management': ['financial planning conference', 'wealth management summit', 'financial planning event'],
  'Sustainable Finance & ESG Investing': ['sustainable finance conference', 'ESG investing summit', 'sustainable finance event'],
  'Payment Systems & Digital Wallets': ['payment systems conference', 'digital wallets summit', 'payment technology event'],
  'Alternative Lending & Credit Solutions': ['alternative lending conference', 'credit solutions summit', 'lending event'],
  'Financial Data Analytics & AI': ['financial analytics conference', 'AI in finance summit', 'financial data event'],
  'InsurTech & Digital Insurance': ['insurtech conference', 'digital insurance summit', 'insurance technology event'],
  'Trading Algorithms & Quantitative Finance': ['trading algorithms conference', 'quantitative finance summit', 'algorithmic trading event'],
  'Financial Inclusion & Accessibility': ['financial inclusion conference', 'accessibility summit', 'financial inclusion event'],
  'Open Banking & API Integration': ['open banking conference', 'API integration summit', 'open banking event'],
  'Fraud Detection & Cybersecurity': ['fraud detection conference', 'financial cybersecurity summit', 'fraud prevention event'],
  'Corporate Finance & M&A': ['corporate finance conference', 'M&A summit', 'corporate finance event'],
  'Real Estate Finance & Investment': ['real estate finance conference', 'property investment summit', 'real estate finance event'],
  'International Finance & Forex': ['international finance conference', 'forex summit', 'foreign exchange event'],
  'Financial Modeling & Valuation': ['financial modeling conference', 'valuation summit', 'financial modeling event'],
  'Retail Banking & Customer Experience': ['retail banking conference', 'customer experience summit', 'banking event'],
  'Central Bank Digital Currencies (CBDC)': ['CBDC conference', 'digital currencies summit', 'central bank digital currency event'],

  // Healthcare topics
  'Digital Health & Telemedicine': ['digital health conference', 'telemedicine summit', 'health technology event'],
  'Healthcare Data Analytics': ['healthcare analytics conference', 'health data summit', 'healthcare data event'],
  'Medical Device Innovation': [
    'medical device conference', 
    'medical device summit', 
    'medical device event',
    'medical technology conference',
    'medtech conference',
    'medical innovation conference',
    'healthcare technology conference',
    'medical device innovation',
    'medical device meeting',
    'medtech summit',
    'healthcare innovation conference',
    'medical technology summit',
    'device innovation conference',
    'medical device workshop',
    'healthcare technology summit',
    'medical device convention',
    'healthcare innovation event',
    'medical technology event',
    'device innovation summit',
    'medical device seminar'
  ],
  'Healthcare Policy & Regulation': ['healthcare policy conference', 'health regulation summit', 'healthcare policy event'],
  'Mental Health Technology': ['mental health conference', 'mental health technology summit', 'mental health event'],
  'Preventive Care & Wellness': ['preventive care conference', 'wellness summit', 'healthcare wellness event'],
  'Electronic Health Records (EHR)': ['EHR conference', 'health records summit', 'electronic health records event'],
  'Healthcare AI & Machine Learning': ['healthcare AI conference', 'AI in healthcare summit', 'healthcare AI event'],
  'Patient Care Technology': ['patient care conference', 'care technology summit', 'patient care event'],
  'Healthcare Cybersecurity': ['healthcare cybersecurity conference', 'health security summit', 'healthcare security event'],
  'Medical Imaging & Diagnostics': ['medical imaging conference', 'diagnostics summit', 'medical imaging event'],
  'Pharmaceutical Innovation': ['pharmaceutical conference', 'drug innovation summit', 'pharmaceutical event'],
  'Healthcare Operations & Management': ['healthcare operations conference', 'healthcare management summit', 'healthcare operations event'],
  'Population Health Management': ['population health conference', 'public health summit', 'population health event'],
  'Healthcare Interoperability': ['healthcare interoperability conference', 'health data exchange summit', 'healthcare interoperability event'],
  'Clinical Decision Support Systems': ['clinical decision support conference', 'healthcare decision systems summit', 'clinical decision event'],
  'Healthcare Quality & Safety': ['healthcare quality conference', 'patient safety summit', 'healthcare quality event'],
  'Healthcare Finance & Economics': ['healthcare finance conference', 'health economics summit', 'healthcare finance event'],
  'Healthcare Workforce Development': ['healthcare workforce conference', 'healthcare training summit', 'healthcare workforce event'],
  'Healthcare Innovation & Research': ['healthcare innovation conference', 'medical research summit', 'healthcare research event'],

  // Education topics
  'EdTech Solutions & Digital Learning': ['edtech conference', 'digital learning summit', 'education technology event'],
  'Online Learning Platforms & MOOCs': ['online learning conference', 'MOOC summit', 'e-learning event'],
  'Student Engagement & Experience': ['student engagement conference', 'education experience summit', 'student experience event'],
  'Educational Data Analytics': ['educational analytics conference', 'education data summit', 'educational data event'],
  'Digital Literacy & Skills': ['digital literacy conference', 'digital skills summit', 'digital literacy event'],
  'STEM Education & Innovation': ['STEM education conference', 'STEM innovation summit', 'STEM education event'],
  'Learning Management Systems': ['LMS conference', 'learning systems summit', 'learning management event'],
  'Educational Assessment & Testing': ['educational assessment conference', 'testing summit', 'education assessment event'],
  'Personalized Learning & AI': ['personalized learning conference', 'AI in education summit', 'personalized education event'],
  'Virtual & Augmented Reality in Education': ['VR in education conference', 'AR education summit', 'virtual reality education event'],
  'Educational Content Creation': ['educational content conference', 'content creation summit', 'education content event'],
  'Teacher Training & Development': ['teacher training conference', 'educator development summit', 'teacher development event'],
  'Educational Policy & Reform': ['educational policy conference', 'education reform summit', 'education policy event'],
  'Special Education & Inclusion': ['special education conference', 'inclusive education summit', 'special needs education event'],
  'Higher Education & Research': ['higher education conference', 'university research summit', 'higher education event'],
  'Corporate Training & Development': ['corporate training conference', 'workplace learning summit', 'corporate education event'],
  'Educational Technology Integration': ['edtech integration conference', 'technology in education summit', 'education technology event'],
  'Learning Analytics & Insights': ['learning analytics conference', 'education insights summit', 'learning data event'],
  'Educational Accessibility & Equity': ['educational accessibility conference', 'education equity summit', 'accessible education event'],
  'Future of Education & Skills': ['future of education conference', 'education trends summit', 'education future event'],

  // Business topics
  'Business Strategy & Planning': ['business strategy conference', 'strategic planning summit', 'business strategy event'],
  'Leadership Development & Management': ['leadership conference', 'management development summit', 'leadership event'],
  'Change Management & Transformation': ['change management conference', 'transformation summit', 'change management event'],
  'Organizational Culture & Behavior': ['organizational culture conference', 'workplace culture summit', 'organizational behavior event'],
  'Business Process Optimization': ['business process conference', 'process optimization summit', 'business optimization event'],
  'Customer Experience & Service': ['customer experience conference', 'customer service summit', 'CX event'],
  'Digital Transformation': ['digital transformation conference', 'digital business summit', 'digital transformation event'],
  'Business Analytics & Intelligence': ['business analytics conference', 'business intelligence summit', 'business analytics event'],
  'Project Management & Delivery': ['project management conference', 'project delivery summit', 'project management event'],
  'Supply Chain & Operations': ['supply chain conference', 'operations management summit', 'supply chain event'],
  'Human Resources & Talent Management': ['HR conference', 'talent management summit', 'human resources event'],
  'Marketing & Brand Strategy': ['marketing conference', 'brand strategy summit', 'marketing strategy event'],
  'Sales & Revenue Growth': ['sales conference', 'revenue growth summit', 'sales growth event'],
  'Innovation & Entrepreneurship': ['innovation conference', 'entrepreneurship summit', 'startup event'],
  'Corporate Governance & Ethics': ['corporate governance conference', 'business ethics summit', 'governance event'],
  'Business Development & Partnerships': ['business development conference', 'partnerships summit', 'business development event'],
  'Performance Management & KPIs': ['performance management conference', 'KPI summit', 'performance metrics event'],
  'Risk Management & Compliance': ['business risk conference', 'compliance summit', 'business risk event'],
  'Business Model Innovation': ['business model conference', 'business innovation summit', 'business model event'],
  'Global Business & International Trade': ['global business conference', 'international trade summit', 'global business event'],

  // Marketing topics
  'Digital Marketing & Strategy': ['digital marketing conference', 'marketing strategy summit', 'digital marketing event'],
  'Content Marketing & Creation': ['content marketing conference', 'content creation summit', 'content marketing event'],
  'Social Media Marketing & Management': ['social media conference', 'social media marketing summit', 'social media event'],
  'Brand Strategy & Development': ['brand strategy conference', 'brand development summit', 'branding event'],
  'Marketing Analytics & Measurement': ['marketing analytics conference', 'marketing measurement summit', 'marketing analytics event'],
  'Customer Experience & Journey': ['customer experience conference', 'customer journey summit', 'CX marketing event'],
  'Email Marketing & Automation': ['email marketing conference', 'marketing automation summit', 'email marketing event'],
  'Search Engine Optimization (SEO)': ['SEO conference', 'search optimization summit', 'SEO event'],
  'Pay-Per-Click (PPC) Advertising': ['PPC conference', 'paid advertising summit', 'PPC event'],
  'Influencer Marketing & Partnerships': ['influencer marketing conference', 'influencer partnerships summit', 'influencer event'],
  'Marketing Technology & Tools': ['martech conference', 'marketing technology summit', 'marketing tools event'],
  'Marketing Automation & CRM': ['marketing automation conference', 'CRM summit', 'marketing automation event'],
  'Growth Hacking & Acquisition': ['growth hacking conference', 'customer acquisition summit', 'growth marketing event'],
  'Marketing Research & Insights': ['marketing research conference', 'market insights summit', 'marketing research event'],
  'Creative & Design Strategy': ['creative strategy conference', 'design strategy summit', 'creative marketing event'],
  'Public Relations & Communications': ['PR conference', 'communications summit', 'public relations event'],
  'Event Marketing & Experiences': ['event marketing conference', 'experiential marketing summit', 'event marketing event'],
  'Mobile Marketing & Apps': ['mobile marketing conference', 'app marketing summit', 'mobile marketing event'],
  'Marketing Attribution & ROI': ['marketing attribution conference', 'marketing ROI summit', 'marketing measurement event'],
  'Future of Marketing & Trends': ['future of marketing conference', 'marketing trends summit', 'marketing future event'],

  // Data & Analytics topics
  'Data Science & Machine Learning': ['data science conference', 'machine learning summit', 'data science event'],
  'Business Intelligence & Analytics': ['business intelligence conference', 'analytics summit', 'BI event'],
  'Data Visualization & Storytelling': ['data visualization conference', 'data storytelling summit', 'data viz event'],
  'Big Data & Data Engineering': ['big data conference', 'data engineering summit', 'big data event'],
  'Statistical Analysis & Modeling': ['statistical analysis conference', 'data modeling summit', 'statistics event'],
  'Predictive Analytics & Forecasting': ['predictive analytics conference', 'forecasting summit', 'predictive analytics event'],
  'Data Mining & Discovery': ['data mining conference', 'data discovery summit', 'data mining event'],
  'Data Governance & Quality': ['data governance conference', 'data quality summit', 'data governance event'],
  'Data Architecture & Design': ['data architecture conference', 'data design summit', 'data architecture event'],
  'Real-time Analytics & Streaming': ['real-time analytics conference', 'streaming analytics summit', 'real-time data event'],
  'Data Privacy & Security': ['data privacy conference', 'data security summit', 'data privacy event'],
  'Data Strategy & Management': ['data strategy conference', 'data management summit', 'data strategy event'],
  'Advanced Analytics & AI': ['advanced analytics conference', 'AI analytics summit', 'advanced analytics event'],
  'Data-driven Decision Making': ['data-driven conference', 'decision making summit', 'data-driven event'],
  'Customer Analytics & Segmentation': ['customer analytics conference', 'customer segmentation summit', 'customer analytics event'],
  'Marketing Analytics & Attribution': ['marketing analytics conference', 'attribution summit', 'marketing analytics event'],
  'Financial Analytics & Risk': ['financial analytics conference', 'risk analytics summit', 'financial analytics event'],
  'Operational Analytics & Optimization': ['operational analytics conference', 'operations optimization summit', 'operational analytics event'],
  'Data Ethics & Responsible AI': ['data ethics conference', 'responsible AI summit', 'data ethics event'],
  'Future of Data & Analytics': ['future of data conference', 'analytics trends summit', 'data future event'],

  // Design topics
  'User Experience (UX) Design': ['UX design conference', 'user experience summit', 'UX event'],
  'User Interface (UI) Design': ['UI design conference', 'interface design summit', 'UI event'],
  'Product Design & Strategy': ['product design conference', 'product strategy summit', 'product design event'],
  'Design Thinking & Process': ['design thinking conference', 'design process summit', 'design thinking event'],
  'Visual Design & Branding': ['visual design conference', 'branding summit', 'visual design event'],
  'Interaction Design & Prototyping': ['interaction design conference', 'prototyping summit', 'interaction design event'],
  'Design Systems & Standards': ['design systems conference', 'design standards summit', 'design systems event'],
  'User Research & Testing': ['user research conference', 'usability testing summit', 'user research event'],
  'Information Architecture': ['information architecture conference', 'IA summit', 'information architecture event'],
  'Accessibility & Inclusive Design': ['accessibility conference', 'inclusive design summit', 'accessible design event'],
  'Mobile & Responsive Design': ['mobile design conference', 'responsive design summit', 'mobile design event'],
  'Service Design & Experience': ['service design conference', 'service experience summit', 'service design event'],
  'Design Leadership & Management': ['design leadership conference', 'design management summit', 'design leadership event'],
  'Creative Direction & Strategy': ['creative direction conference', 'creative strategy summit', 'creative direction event'],
  'Design Tools & Technologies': ['design tools conference', 'design technology summit', 'design tools event'],
  'Design Operations & Workflow': ['design operations conference', 'design workflow summit', 'design ops event'],
  'Design Ethics & Responsibility': ['design ethics conference', 'responsible design summit', 'design ethics event'],
  'Design Innovation & Trends': ['design innovation conference', 'design trends summit', 'design innovation event'],
  'Cross-platform Design': ['cross-platform design conference', 'multi-platform summit', 'cross-platform event'],
  'Future of Design & Technology': ['future of design conference', 'design technology summit', 'design future event']
};

/**
 * Convert industry and topic to Ticketmaster search parameters with AI optimization
 * @param {string} industry - Selected industry
 * @param {string} topic - Selected topic
 * @returns {Object} TicketmasterSearchParams object
 */
function convertToTicketmasterParams(industry, topic) {
  // Use AI-optimized keyword generation for better search results
  const optimizedKeywords = generateOptimizedKeywords(industry, topic);
  
  // Use the first (most relevant) keyword from the optimized list
  const primaryKeyword = optimizedKeywords[0];

  // UNIVERSAL STRATEGY: For ALL industries, don't use classification filters
  // as professional conferences are unlikely to be in Ticketmaster's entertainment categories
  // This ensures ALL industries get broader search results
  return {
    keyword: primaryKeyword,
    // No classification filters for better results across ALL industries
    classificationId: undefined,
    classificationName: undefined,
    segmentId: undefined,
    segmentName: undefined
  };
}

/**
 * Get alternative keywords for a topic (for fallback searches)
 * @param {string} topic - Selected topic
 * @returns {Array} Array of alternative keywords
 */
function getAlternativeKeywords(topic) {
  return TOPIC_TO_KEYWORDS[topic] || [`${topic.toLowerCase()} conference`];
}

/**
 * Generate multiple search strategies for better results with AI optimization
 * @param {string} industry - Selected industry
 * @param {string} topic - Selected topic
 * @returns {Array} Array of search parameter objects
 */
function generateSearchStrategies(industry, topic) {
  const strategies = [];
  
  // Get AI-optimized keywords
  const optimizedKeywords = generateOptimizedKeywords(industry, topic);
  
  // UNIVERSAL STRATEGY: For ALL industries, don't use classification filters
  // This ensures ALL industries get broader search results
  
  // Generate strategies without classification filters for ALL industries
  optimizedKeywords.slice(0, 5).forEach(keyword => {
    strategies.push({
      keyword,
      classificationId: undefined,
      classificationName: undefined,
      segmentId: undefined,
      segmentName: undefined
    });
  });
  
  // For healthcare, add some additional strategies with broader terms
  if (industry.toLowerCase() === 'healthcare') {
    // Add some broader search terms that might catch healthcare-related events
    const broaderTerms = [
      'health conference',
      'medical conference', 
      'healthcare event',
      'medical event',
      'health summit',
      'medical summit',
      'healthcare summit',
      'conference',
      'summit',
      'event'
    ];
    
    broaderTerms.forEach(term => {
      strategies.push({
        keyword: term,
        classificationId: undefined,
        classificationName: undefined,
        segmentId: undefined,
        segmentName: undefined
      });
    });
  }
  
  return strategies;
}

module.exports = {
  convertToTicketmasterParams,
  getAlternativeKeywords,
  generateSearchStrategies,
  INDUSTRY_TO_TICKETMASTER,
  TOPIC_TO_KEYWORDS
};

const express = require('express');
const router = express.Router(); 
const SerpApiController = require('../controllers/serpapi.controller');

// Get SerpAPI data for event search
router.post('/search', SerpApiController.getSerpApiData);

// Get SerpAPI data for event images
router.post('/images', SerpApiController.getSerpApiImages);

// Get SerpAPI data for news related to events
router.post('/news', SerpApiController.getSerpApiNews);

// Get detailed event information including contact details
router.post('/detailed-info', SerpApiController.getDetailedEventInfo);

// Legacy endpoint for backward compatibility
router.post('/getserpapidata', SerpApiController.getSerpApiData);

module.exports = router;

const express = require('express');
const router = express.Router(); 
const OpenWebNinjaController = require('../controllers/openwebninja.controller');


router.post('/getdata', OpenWebNinjaController.getData);
router.get('/getdata', OpenWebNinjaController.getData);

module.exports = router;

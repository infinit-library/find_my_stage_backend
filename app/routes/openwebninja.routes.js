const express = require('express');
const router = express.Router(); 
const OpenWebNinjaController = require('../controllers/openwebninja.controller');


router.post('/getdata', (req, res) => {
    console.log("req.body", req.body);
    OpenWebNinjaController.getData(req, res);
});

module.exports = router;

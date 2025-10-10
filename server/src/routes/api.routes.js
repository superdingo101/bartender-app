const express = require('express');
const apiController = require('../controllers/api.controller');

const router = express.Router();

router.get('/', apiController.getApiInfo);

module.exports = router;

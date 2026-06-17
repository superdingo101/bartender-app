const express = require('express');
const reportsController = require('../controllers/reports.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  reportsController.getReportingStats,
);

module.exports = router;

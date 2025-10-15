const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorize('ADMIN'));

// Get all users
router.get('/users', adminController.getAllUsers);

// Create admin account
router.post('/create-admin', adminController.createAdmin);

// Create bartender account
router.post('/create-bartender', adminController.createBartender);

// Reset password
router.post('/reset-password', adminController.resetPassword);

module.exports = router;
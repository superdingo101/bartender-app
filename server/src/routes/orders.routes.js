const express = require('express');
const ordersController = require('../controllers/orders.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Order creation can be done by guests or authenticated users
router.post('/', optionalAuth, ordersController.createOrder);

// Authenticated routes
router.get('/', authenticate, ordersController.getAllOrders);
router.get('/:id', authenticate, ordersController.getOrderById);
router.delete('/:id', authenticate, ordersController.cancelOrder);

// Bartender/Admin only
router.put(
  '/:id/status',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  ordersController.updateOrderStatus
);

router.get(
  '/event/:eventId/stats',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  ordersController.getEventOrderStats
);

module.exports = router;
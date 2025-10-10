const express = require('express');
const ordersController = require('../controllers/orders.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.get('/', authenticate, ordersController.getAllOrders);
router.get('/:id', authenticate, ordersController.getOrderById);
router.post('/', authenticate, ordersController.createOrder);
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
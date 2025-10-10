const express = require('express');
const eventsController = require('../controllers/events.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/code/:code', eventsController.getEventByCode);

// Protected routes - all users
router.get('/', authenticate, eventsController.getAllEvents);
router.get('/:id', authenticate, eventsController.getEventById);

// Protected routes - bartender and admin only
router.post(
  '/',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  eventsController.createEvent
);

router.put(
  '/:id',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  eventsController.updateEvent
);

router.delete(
  '/:id',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  eventsController.deleteEvent
);

// Event drinks management
router.post(
  '/:id/drinks',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  eventsController.addDrinkToEvent
);

router.delete(
  '/:id/drinks/:drinkId',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  eventsController.removeDrinkFromEvent
);

router.put(
  '/:id/drinks/:drinkId',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  eventsController.updateEventDrink
);

module.exports = router;
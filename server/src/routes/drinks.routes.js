const express = require('express');
const drinksController = require('../controllers/drinks.controller');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public/Optional auth routes
router.get('/', optionalAuth, drinksController.getAllDrinks);
router.get('/search', optionalAuth, drinksController.searchDrinks);
router.get('/popular', optionalAuth, drinksController.getPopularDrinks);
router.get('/categories', optionalAuth, drinksController.getCategories);
router.get('/category/:category', optionalAuth, drinksController.getDrinksByCategory);
router.get('/:id', optionalAuth, drinksController.getDrinkById);

// Protected routes - Bartender/Admin only
router.post(
  '/',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  drinksController.createDrink
);

router.put(
  '/:id',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  drinksController.updateDrink
);

router.patch(
  '/:id/toggle',
  authenticate,
  authorize('BARTENDER', 'ADMIN'),
  drinksController.toggleDrink
);

router.delete(
  '/:id',
  authenticate,
  authorize('BARTENDER','ADMIN'),
  drinksController.deleteDrink
);

module.exports = router;

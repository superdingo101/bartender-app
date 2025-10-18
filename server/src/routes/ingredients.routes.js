const express = require('express');
const ingredientsController = require('../controllers/ingredients.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication (Bartender/Admin)
router.use(authenticate);
router.use(authorize('BARTENDER', 'ADMIN'));

router.get('/', ingredientsController.getAllIngredients);
router.get('/types', ingredientsController.getIngredientTypes);
router.get('/:id', ingredientsController.getIngredientById);
router.post('/', ingredientsController.createIngredient);
router.put('/:id', ingredientsController.updateIngredient);
router.delete('/:id', ingredientsController.deleteIngredient);
router.post('/:id/purchases', ingredientsController.addPurchaseHistory);

module.exports = router;
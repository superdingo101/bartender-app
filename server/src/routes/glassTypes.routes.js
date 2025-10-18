const express = require('express');
const { 
  getAllGlassTypes, 
  getGlassTypeById, 
  createGlassType, 
  updateGlassType, 
  deleteGlassType 
} = require('../controllers/glassEquipment.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication (Bartender/Admin)
router.use(authenticate);
router.use(authorize('BARTENDER', 'ADMIN'));

router.get('/', getAllGlassTypes);
router.get('/:id', getGlassTypeById);
router.post('/', createGlassType);
router.put('/:id', updateGlassType);
router.delete('/:id', deleteGlassType);

module.exports = router;
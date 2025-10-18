const express = require('express');
const { 
  getAllEquipment, 
  getEquipmentById, 
  createEquipment, 
  updateEquipment, 
  deleteEquipment 
} = require('../controllers/glassEquipment.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication (Bartender/Admin)
router.use(authenticate);
router.use(authorize('BARTENDER', 'ADMIN'));

router.get('/', getAllEquipment);
router.get('/:id', getEquipmentById);
router.post('/', createEquipment);
router.put('/:id', updateEquipment);
router.delete('/:id', deleteEquipment);

module.exports = router;
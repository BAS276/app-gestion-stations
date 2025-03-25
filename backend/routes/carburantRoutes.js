const express = require('express');
const router = express.Router();
const carburantController = require('../controllers/carburantController');

router.get('/', carburantController.getCarburants);
router.post('/', carburantController.createCarburant);
router.put('/:id', carburantController.updateCarburant);
router.delete('/:id', carburantController.deleteCarburant);

module.exports = router;
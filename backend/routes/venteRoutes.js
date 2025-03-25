const express = require('express');
const router = express.Router();
const venteController = require('../controllers/venteController');

router.get('/', venteController.getVentes);
router.get('/:id', venteController.getVenteById); // Added to fetch a single sale
router.post('/', venteController.createVente);
router.put('/:id', venteController.updateVente);
router.delete('/:id', venteController.deleteVente);

module.exports = router;
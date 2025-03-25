const express = require('express');
const router = express.Router();
const {
  getVentesCarburant,
  getVenteCarburant,
  createVenteCarburant,
  updateVenteCarburant,
  deleteVenteCarburant,
} = require('../controllers/venteCarburantController');

router.route('/').get(getVentesCarburant).post(createVenteCarburant);
router.route('/:id').get(getVenteCarburant).put(updateVenteCarburant).delete(deleteVenteCarburant);

module.exports = router;
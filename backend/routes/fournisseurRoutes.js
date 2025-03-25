const express = require('express');
const router = express.Router();
const fournisseurController = require('../controllers/fournisseurController');

router.get('/', fournisseurController.getFournisseurs);
router.post('/', fournisseurController.createFournisseur);
router.put('/:id', fournisseurController.updateFournisseur);
router.delete('/:id', fournisseurController.deleteFournisseur);

module.exports = router;
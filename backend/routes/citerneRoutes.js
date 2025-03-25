const express = require('express');
const router = express.Router();
const citerneController = require('../controllers/citerneController');

router.get('/', citerneController.getCiternes);
router.post('/', citerneController.createCiterne);
router.put('/:id', citerneController.updateCiterne);
router.delete('/:id', citerneController.deleteCiterne);

module.exports = router;
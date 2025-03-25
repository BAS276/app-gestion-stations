const express = require('express');
const router = express.Router();
const pompeController = require('../controllers/pompeController');

router.get('/', pompeController.getPumps);
router.post('/', pompeController.createPump);
router.put('/:id', pompeController.updatePump);
router.delete('/:id', pompeController.deletePump);

module.exports = router;
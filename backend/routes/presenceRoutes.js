// presenceRoutes.js
const express = require('express');
const router = express.Router();
const presenceController = require('../controllers/presenceController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, presenceController.getPresences);
router.post('/', authMiddleware, presenceController.createPresence);
router.put('/:id', authMiddleware, presenceController.updatePresence);
router.delete('/:id', authMiddleware, presenceController.deletePresence);

module.exports = router;
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware'); // Your authentication middleware

// Protect all routes with authentication middleware
router.use(authMiddleware);

// GET /api/settings - Fetch settings (admin only)
router.get('/', (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé : réservé aux administrateurs' });
  }
  getSettings(req, res);
});

// PUT /api/settings - Update settings (admin only)
router.put('/', (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé : réservé aux administrateurs' });
  }
  updateSettings(req, res);
});

module.exports = router;
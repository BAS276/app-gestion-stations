const express = require('express');
const router = express.Router();
const { getPlannings, createPlanning, updatePlanning, deletePlanning } = require('../controllers/planningController');
const authMiddleware = require('../middleware/authMiddleware');

// Route to get all plannings for a specific year and week
router.get('/', authMiddleware, getPlannings);

// Route to create a new planning
router.post('/', authMiddleware, createPlanning);

// Route to update an existing planning
router.put('/:id', authMiddleware, updatePlanning);

// Route to delete a planning
router.delete('/:id', authMiddleware, deletePlanning);

module.exports = router;
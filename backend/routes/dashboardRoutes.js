const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/sales', dashboardController.getSalesData);
router.get('/tanks', dashboardController.getTankData);
router.get('/stats', dashboardController.getStats);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/sales-distribution', dashboardController.getSalesDistribution);

module.exports = router;
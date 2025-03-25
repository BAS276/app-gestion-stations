const express = require('express');
const router = express.Router();
const {
  getEntreesStock,
  getEntreeStock,
  createEntreeStock,
  updateEntreeStock,
  deleteEntreeStock,
} = require('../controllers/entreeStockController');

router.route('/').get(getEntreesStock).post(createEntreeStock);
router.route('/:id').get(getEntreeStock).put(updateEntreeStock).delete(deleteEntreeStock);

module.exports = router;
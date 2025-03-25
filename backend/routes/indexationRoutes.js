const express = require('express');
const router = express.Router();
const {
  getIndexations,
  getIndexation,
  createIndexation,
  updateIndexation,
  deleteIndexation,
} = require('../controllers/indexationController');

router.route('/').get(getIndexations).post(createIndexation);
router.route('/:id').get(getIndexation).put(updateIndexation).delete(deleteIndexation);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  getAffectations,
  getAffectation,
  createAffectation,
  updateAffectation,
  deleteAffectation,
} = require('../controllers/affectationController');

router.route('/').get(getAffectations).post(createAffectation);
router.route('/:id').get(getAffectation).put(updateAffectation).delete(deleteAffectation);

module.exports = router;
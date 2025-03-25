const express = require('express');
const router = express.Router();
const {
  getStations,
  getStation,
  createStation,
  updateStation,
  deleteStation,
} = require('../controllers/stationController');

router.route('/').get(getStations).post(createStation);
router.route('/:id').get(getStation).put(updateStation).delete(deleteStation);

module.exports = router;
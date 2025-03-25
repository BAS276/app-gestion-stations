const mongoose = require('mongoose');

const CiterneSchema = new mongoose.Schema({
  number: { type: String, required: true },
  fuelType: { type: String, required: true },
  capacity: { type: Number, required: true },
  currentLevel: { type: Number, required: true },
  lastRefill: { type: String, required: true },
  minLevel: { type: Number, required: true },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
});

module.exports = mongoose.model('Citerne', CiterneSchema);
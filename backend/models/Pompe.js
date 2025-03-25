const mongoose = require('mongoose');

const PompeSchema = new mongoose.Schema({
  idPompe: { type: Number, unique: true },
  number: { type: String, required: true },
  fuelType: { type: String, required: true },
  status: { type: String, required: true },
  lastMaintenance: { type: Date, required: true },
  tank: { type: mongoose.Schema.Types.ObjectId, ref: 'Citerne', required: true },
  flowRate: { type: Number, required: false },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
});

module.exports = mongoose.model('Pompe', PompeSchema);
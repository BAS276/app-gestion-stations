const mongoose = require('mongoose');

const StationSchema = new mongoose.Schema({
  idStation: { type: Number, unique: true },
  nomStation: { type: String, required: true },
  adresseStation: { type: String, required: true },
  villeStation: { type: String, required: true },
  telephoneStation: { type: String, required: true },
  emailStation: { type: String, required: true },
  capacity: { type: Number, required: false, default: 0 }, // Rétabli
  nombrePompes: { type: Number, default: 0 },
  employes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employe' }],
  pompes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pompe' }],
  services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServicesDisponibles' }],
});

module.exports = mongoose.model('Station', StationSchema);
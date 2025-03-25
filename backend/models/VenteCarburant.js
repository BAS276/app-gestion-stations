const mongoose = require('mongoose');

const VenteCarburantSchema = new mongoose.Schema({
  compteurDebut: { type: Number, required: true },
  compteurFin: { type: Number, required: true },
  indexation: { type: mongoose.Schema.Types.ObjectId, ref: 'Indexation' },
});

module.exports = mongoose.model('VenteCarburant', VenteCarburantSchema);
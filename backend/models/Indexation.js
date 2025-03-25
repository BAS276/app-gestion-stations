const mongoose = require('mongoose');

const IndexationSchema = new mongoose.Schema({
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  prixVentePrev: { type: Number, required: true },
  carburant: { type: mongoose.Schema.Types.ObjectId, ref: 'Carburant' },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  ventes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vente' }],
});

module.exports = mongoose.model('Indexation', IndexationSchema);
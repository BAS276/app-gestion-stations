const mongoose = require('mongoose');

const EntreeStockSchema = new mongoose.Schema({
  dateEntree: { type: Number, required: true }, // Note: devrait être Date?
  quantite: { type: Number, required: true },
  prixAchat: { type: Number, required: true },
  carburant: { type: mongoose.Schema.Types.ObjectId, ref: 'Carburant' },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  fournisseur: { type: mongoose.Schema.Types.ObjectId, ref: 'Fournisseur' },
});

module.exports = mongoose.model('EntreeStock', EntreeStockSchema);
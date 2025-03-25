const mongoose = require('mongoose');

const FournisseurSchema = new mongoose.Schema({
  idFournisseur: { type: String, unique: true },
  name: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  products: { type: String, required: true },
  contractNumber: { type: String, required: true },
});

module.exports = mongoose.model('Fournisseur', FournisseurSchema);
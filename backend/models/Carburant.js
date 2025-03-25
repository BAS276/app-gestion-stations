const mongoose = require('mongoose');

const CarburantSchema = new mongoose.Schema({
  idCarburant: { type: Number, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  minStock: { type: Number, required: true }, 
  supplier: { type: String, required: true },
});

module.exports = mongoose.model('Carburant', CarburantSchema);
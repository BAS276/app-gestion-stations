const mongoose = require('mongoose');

const EmployeSchema = new mongoose.Schema({
  idEmploye: { type: Number, unique: true },
  nomEmploye: { type: String, required: true },
  prenomEmploye: { type: String, required: true },
  adresseEmploye: { type: String, required: true },
  telephoneEmploye: { type: String, required: true },
  emailEmploye: { type: String, required: true, unique: true },
  position: { type: String, required: true, enum: ['manager', 'cashier', 'attendant', 'maintenance'] },
  startDate: { type: Date, required: true },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', default: null },
  presences: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Presence' }],
  plannings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Planning' }],
  image: { type: String, default: '' },
});

module.exports = mongoose.model('Employe', EmployeSchema);
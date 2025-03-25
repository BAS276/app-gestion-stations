// models/Presence.js
const mongoose = require('mongoose');

const PresenceSchema = new mongoose.Schema({
  idPresence: { type: String, default: '' },
  semaine: { type: Number, required: true },
  jour: { type: String, required: true },
  hDebut: { type: String, default: '' },
  hFin: { type: String, default: '' },
  annee: { type: Number, required: true },
  employe: { type: mongoose.Schema.Types.ObjectId, ref: 'Employe', required: true },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  isPresent: { type: Boolean, default: false },
});

module.exports = mongoose.model('Presence', PresenceSchema);
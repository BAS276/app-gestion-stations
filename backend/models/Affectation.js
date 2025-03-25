const mongoose = require('mongoose');

const AffectationSchema = new mongoose.Schema({
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  employe: { type: mongoose.Schema.Types.ObjectId, ref: 'Employe' },
});

module.exports = mongoose.model('Affectation', AffectationSchema);
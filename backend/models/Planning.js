const mongoose = require('mongoose');

const PlanningSchema = new mongoose.Schema({
  idPlanning: { type: String, required: true },
  employeeName: { type: String, required: true },
  monday: String,
  tuesday: String,
  wednesday: String,
  thursday: String,
  friday: String,
  saturday: String,
  sunday: String,
  year: { type: Number, required: true },
  week: { type: Number, required: true, min: 1, max: 53 },
  station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' }, // Optional station field
});

module.exports = mongoose.model('Planning', PlanningSchema);
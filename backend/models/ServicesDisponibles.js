const mongoose = require('mongoose');

const ServicesDisponiblesSchema = new mongoose.Schema({
  idService: { type: Number, unique: true },
  nomService: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: Number, required: true },
  availability: { type: String, required: true, enum: ['always', 'appointment', 'limited'] },
  technician: { type: String, required: true },
  stations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Station' }],
});

module.exports = mongoose.model('ServicesDisponibles', ServicesDisponiblesSchema);
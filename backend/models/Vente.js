const mongoose = require('mongoose');

const VenteSchema = new mongoose.Schema({
  idVente: { 
    type: String, 
    required: true, 
    unique: true // Ensure uniqueness of idVente
  },
  pumpNumber: { 
    type: String, 
    required: function() { return this.category === 'Carburant'; },
    trim: true // Remove whitespace
  },
  fuelType: { 
    type: String, 
    required: function() { return this.category === 'Carburant'; },
    enum: ['sp95', 'sp98', 'diesel', 'e85'], // Restrict to specific fuel types
    trim: true
  },
  quantity: { 
    type: Number, // Changed to Number
    required: function() { return this.category === 'Carburant'; },
    min: [0, 'La quantité doit être un nombre positif'], // Validation
  },
  unitPrice: { 
    type: Number, // Changed to Number
    required: function() { return this.category === 'Carburant'; },
    min: [0, 'Le prix unitaire doit être un nombre positif'],
  },
  price: { 
    type: Number, // Changed to Number
    required: function() { return this.category !== 'Carburant'; },
    min: [0, 'Le prix doit être un nombre positif'],
  },
  quantityPieces: { 
    type: Number, // Changed to Number
    required: function() { return this.category !== 'Carburant'; },
    min: [0, 'La quantité de pièces doit être un nombre positif'],
    validate: {
      validator: Number.isInteger, // Ensure it's an integer
      message: 'La quantité de pièces doit être un nombre entier'
    }
  },
  paymentMethod: { 
    type: String, 
    required: true, 
    enum: ['card', 'cash', 'check', 'fleet'], // Restrict to specific payment methods
    trim: true
  },
  customerType: { 
    type: String, 
    required: function() { return this.category !== 'Carburant'; },
    enum: ['individual', 'professional', 'fleet', null], // Allow null for Carburant
    trim: true
  },
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, // Changed to ObjectId
    ref: 'Employe', // Reference the Employe model
    required: true 
  },
  station: { 
    type: mongoose.Schema.Types.ObjectId, // New field for station
    ref: 'Station', // Reference the Station model
    required: true 
  },
  date: { 
    type: Date, 
    required: true,
    default: Date.now // Default to current date if not provided
  },
  category: { 
    type: String, 
    required: true, 
    enum: ['Carburant', 'Huile', 'Accessoires', 'Alimentation'], // Restrict to specific categories
    trim: true
  },
});

// Add indexes for better query performance
VenteSchema.index({ station: 1 }); // Index on station for filtering
VenteSchema.index({ employeeId: 1 }); // Index on employeeId for population
VenteSchema.index({ date: -1 }); // Index on date for sorting

module.exports = mongoose.model('Vente', VenteSchema);
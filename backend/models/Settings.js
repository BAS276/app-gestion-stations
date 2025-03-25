const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  appName: {
    type: String,
    default: 'Gestion Stations',
    trim: true,
  },
  defaultRole: {
    type: String,
    enum: ['manager', 'mainManager', 'admin'],
    default: 'manager',
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  theme: {
    type: String,
    enum: ['dark', 'light'],
    default: 'dark',
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Settings', settingsSchema);
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://OnlineStore:3KQugwRB3d6vTCG6@onlinestore.yav9l.mongodb.net/station?retryWrites=true&w=majority&appName=OnlineStore", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connecté');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
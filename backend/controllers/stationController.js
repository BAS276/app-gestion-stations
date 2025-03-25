const Station = require('../models/Station');

// Get all stations
const getStations = async (req, res) => {
  try {
    const stations = await Station.find().populate('employes pompes services');
    res.status(200).json(stations);
  } catch (err) {
    console.error('Erreur lors de la récupération des stations:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des stations.' });
  }
};

// Get a single station by ID
const getStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id).populate('employes pompes services');
    if (!station) {
      return res.status(404).json({ message: 'Station non trouvée.' });
    }
    res.status(200).json(station);
  } catch (err) {
    console.error(`Erreur lors de la récupération de la station ${req.params.id}:`, err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération de la station.' });
  }
};

// Create a new station
const createStation = async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['nomStation', 'adresseStation', 'villeStation', 'telephoneStation', 'emailStation', 'capacity'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `Le champ ${field} est requis.` });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.emailStation)) {
      return res.status(400).json({ message: 'Veuillez entrer une adresse email valide.' });
    }

    // Validate phone number format (at least 10 digits)
    const phoneRegex = /^\+?\d{10,}$/;
    if (!phoneRegex.test(req.body.telephoneStation)) {
      return res.status(400).json({ message: 'Le numéro de téléphone doit contenir au moins 10 chiffres.' });
    }

    // Validate capacity (must be greater than 0)
    if (req.body.capacity <= 0) {
      return res.status(400).json({ message: 'La capacité doit être supérieure à 0.' });
    }

    const station = new Station({
      idStation: Date.now().toString(), 
      nomStation: req.body.nomStation,
      adresseStation: req.body.adresseStation,
      villeStation: req.body.villeStation,
      telephoneStation: req.body.telephoneStation,
      emailStation: req.body.emailStation,
      capacity: req.body.capacity,
      nombrePompes: req.body.nombrePompes || 0, // Ajouté avec une valeur par défaut
      employes: req.body.employes || [],
      pompes: req.body.pompes || [],
      services: req.body.services || [],
    });

    const newStation = await station.save();
    // Populate the references in the response
    await newStation.populate('employes pompes services');
    res.status(201).json(newStation);
  } catch (err) {
    console.error('Erreur lors de la création de la station:', err);
    res.status(400).json({ message: err.message || 'Erreur lors de la création de la station.' });
  }
};

// Update an existing station
const updateStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ message: 'Station non trouvée.' });
    }

    // Validate required fields
    const requiredFields = ['nomStation', 'adresseStation', 'villeStation', 'telephoneStation', 'emailStation', 'capacity'];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        return res.status(400).json({ message: `Le champ ${field} est requis.` });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.emailStation)) {
      return res.status(400).json({ message: 'Veuillez entrer une adresse email valide.' });
    }

    // Validate phone number format (at least 10 digits)
    const phoneRegex = /^\+?\d{10,}$/;
    if (!phoneRegex.test(req.body.telephoneStation)) {
      return res.status(400).json({ message: 'Le numéro de téléphone doit contenir au moins 10 chiffres.' });
    }

    // Validate capacity (must be greater than 0)
    if (req.body.capacity <= 0) {
      return res.status(400).json({ message: 'La capacité doit être supérieure à 0.' });
    }

    // Update the station with the new data
    station.nomStation = req.body.nomStation;
    station.adresseStation = req.body.adresseStation;
    station.villeStation = req.body.villeStation;
    station.telephoneStation = req.body.telephoneStation;
    station.emailStation = req.body.emailStation;
    station.capacity = req.body.capacity;
    station.nombrePompes = req.body.nombrePompes !== undefined ? req.body.nombrePompes : station.nombrePompes; // Ajouté
    station.employes = req.body.employes || station.employes;
    station.pompes = req.body.pompes || station.pompes;
    station.services = req.body.services || station.services;

    const updatedStation = await station.save();
    // Populate the references in the response
    await updatedStation.populate('employes pompes services');
    res.status(200).json(updatedStation);
  } catch (err) {
    console.error(`Erreur lors de la mise à jour de la station ${req.params.id}:`, err);
    res.status(400).json({ message: err.message || 'Erreur lors de la mise à jour de la station.' });
  }
};

// Delete a station
const deleteStation = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ message: 'Station non trouvée.' });
    }

    await station.deleteOne();
    res.status(200).json({ message: 'Station supprimée avec succès.' });
  } catch (err) {
    console.error(`Erreur lors de la suppression de la station ${req.params.id}:`, err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de la station.' });
  }
};

module.exports = { getStations, getStation, createStation, updateStation, deleteStation };
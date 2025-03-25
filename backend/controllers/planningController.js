const Planning = require('../models/Planning');
const mongoose = require('mongoose');

// Get all plannings for a specific year and week
const getPlannings = async (req, res) => {
  try {
    const { year, week } = req.query;
    const user = req.user;

    console.log('getPlannings - User:', user);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    if (!user.role) {
      console.error('getPlannings - Rôle de l\'utilisateur non défini:', user);
      return res.status(400).json({ message: "Rôle de l'utilisateur non défini." });
    }

    if (!year || !week) {
      return res.status(400).json({ message: 'Année et semaine sont requises.' });
    }

    let query = { year: parseInt(year), week: parseInt(week) };

    if (user.role.toLowerCase() !== 'admin') {
      if (!user.station) {
        console.error('getPlannings - Station de l\'utilisateur non définie pour un utilisateur non-admin:', user);
        return res.status(400).json({ message: "Station de l'utilisateur non définie." });
      }
      query.station = user.station;
    }

    const plannings = await Planning.find(query).populate('station', 'nom');
    res.status(200).json(plannings);
  } catch (err) {
    console.error('Erreur lors de la récupération des plannings:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des plannings: ' + err.message });
  }
};

// Create a new planning
const createPlanning = async (req, res) => {
  try {
    const { employeeName, monday, tuesday, wednesday, thursday, friday, saturday, sunday, year, week, station: stationFromBody } = req.body;
    const user = req.user;

    console.log('createPlanning - User:', user, 'Request Body:', req.body);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    if (!user.role) {
      console.error('createPlanning - Rôle de l\'utilisateur non défini:', user);
      return res.status(400).json({ message: "Rôle de l'utilisateur non défini." });
    }

    const station = user.role.toLowerCase() === 'admin' ? stationFromBody : user.station;

    if (user.role.toLowerCase() !== 'admin' && !user.station) {
      console.error('createPlanning - Station non définie pour un utilisateur non-admin:', user);
      return res.status(400).json({ message: "Station de l'utilisateur non définie." });
    }

    if (user.role.toLowerCase() === 'admin' && !station) {
      console.error('createPlanning - Station non définie pour un admin:', { user, stationFromBody });
      return res.status(400).json({ message: "Station requise pour les administrateurs." });
    }

    if (!employeeName || !year || !week) {
      return res.status(400).json({ message: 'employeeName, year et week sont requis.' });
    }

    if (user.role.toLowerCase() === 'admin' && station) {
      const Station = mongoose.model('Station');
      const stationExists = await Station.findById(station);
      if (!stationExists) {
        return res.status(400).json({ message: 'Station spécifiée non trouvée.' });
      }
    }

    const planning = new Planning({
      idPlanning:Date.now(),
      employeeName,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      year,
      week,
      station,
    });

    await planning.save();
    const populatedPlanning = await Planning.findById(planning._id).populate('station', 'nom');
    res.status(201).json(populatedPlanning);
  } catch (err) {
    console.error('Erreur lors de la création du planning:', err);
    res.status(500).json({ message: 'Erreur lors de la création du planning: ' + err.message });
  }
};

// Update an existing planning
const updatePlanning = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeName, monday, tuesday, wednesday, thursday, friday, saturday, sunday, year, week, station: stationFromBody } = req.body;
    const user = req.user;

    console.log('updatePlanning - User:', user, 'Planning ID:', id, 'Request Body:', req.body);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    if (!user.role) {
      console.error('updatePlanning - Rôle de l\'utilisateur non défini:', user);
      return res.status(400).json({ message: "Rôle de l'utilisateur non défini." });
    }

    const planning = await Planning.findById(id);
    if (!planning) {
      return res.status(404).json({ message: 'Planning non trouvé.' });
    }

    if (user.role.toLowerCase() !== 'admin' && planning.station.toString() !== user.station?.toString()) {
      return res.status(403).json({ message: 'Accès refusé: Station non autorisée.' });
    }

    const station = user.role.toLowerCase() === 'admin' ? stationFromBody : user.station;

    if (user.role.toLowerCase() !== 'admin' && !user.station) {
      console.error('updatePlanning - Station non définie pour un utilisateur non-admin:', user);
      return res.status(400).json({ message: "Station de l'utilisateur non définie." });
    }

    if (user.role.toLowerCase() === 'admin' && !station) {
      console.error('updatePlanning - Station non définie pour un admin:', { user, stationFromBody });
      return res.status(400).json({ message: "Station requise pour les administrateurs." });
    }

    if (!employeeName || !year || !week) {
      return res.status(400).json({ message: 'employeeName, year et week sont requis.' });
    }

    if (user.role.toLowerCase() === 'admin' && station) {
      const Station = mongoose.model('Station');
      const stationExists = await Station.findById(station);
      if (!stationExists) {
        return res.status(400).json({ message: 'Station spécifiée non trouvée.' });
      }
    }

    planning.employeeName = employeeName;
    planning.monday = monday;
    planning.tuesday = tuesday;
    planning.wednesday = wednesday;
    planning.thursday = thursday;
    planning.friday = friday;
    planning.saturday = saturday;
    planning.sunday = sunday;
    planning.year = year;
    planning.week = week;
    planning.station = station;

    await planning.save();
    const updatedPlanning = await Planning.findById(id).populate('station', 'nom');
    res.status(200).json(updatedPlanning);
  } catch (err) {
    console.error('Erreur lors de la mise à jour du planning:', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du planning: ' + err.message });
  }
};

// Delete a planning
const deletePlanning = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    console.log('deletePlanning - User:', user, 'Planning ID:', id);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    if (!user.role) {
      console.error('deletePlanning - Rôle de l\'utilisateur non défini:', user);
      return res.status(400).json({ message: "Rôle de l'utilisateur non défini." });
    }

    const planning = await Planning.findById(id);
    if (!planning) {
      return res.status(404).json({ message: 'Planning non trouvé.' });
    }

    if (user.role.toLowerCase() !== 'admin' && planning.station.toString() !== user.station?.toString()) {
      return res.status(403).json({ message: 'Accès refusé: Station non autorisée.' });
    }

    await Planning.findByIdAndDelete(id);
    res.status(200).json({ message: 'Planning supprimé avec succès.' });
  } catch (err) {
    console.error('Erreur lors de la suppression du planning:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression du planning: ' + err.message });
  }
};

module.exports = { getPlannings, createPlanning, updatePlanning, deletePlanning };
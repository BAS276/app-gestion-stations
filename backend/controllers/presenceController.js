const Presence = require('../models/Presence');
const Employe = require('../models/Employe');
const Station = require('../models/Station');

const getPresences = async (req, res) => {
  try {
    const { year, week } = req.query;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    // Validate year and week
    if (!year || !week) {
      return res.status(400).json({ message: 'Année et semaine sont requises.' });
    }

    const parsedYear = parseInt(year);
    const parsedWeek = parseInt(week);

    if (isNaN(parsedYear) || isNaN(parsedWeek)) {
      return res.status(400).json({ message: 'Année et semaine doivent être des nombres valides.' });
    }

    if (parsedYear < 2000 || parsedYear > 2100) {
      return res.status(400).json({ message: 'Année doit être entre 2000 et 2100.' });
    }

    if (parsedWeek < 1 || parsedWeek > 53) {
      return res.status(400).json({ message: 'Semaine doit être entre 1 et 53.' });
    }

    let query = { annee: parsedYear, semaine: parsedWeek };

    if (user.role !== 'admin') {
      query.station = user.station;
    }

    const presences = await Presence.find(query)
      .populate('employe', 'nomEmploye prenomEmploye')
      .populate('station', 'nomStation');

    if (!presences || presences.length === 0) {
      return res.status(404).json({ message: 'Aucune présence trouvée pour cette année et semaine.' });
    }

    res.status(200).json(presences);
  } catch (err) {
    console.error('Erreur lors de la récupération des présences:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des présences: ' + err.message });
  }
};

const createPresence = async (req, res) => {
  try {
    const { semaine, jour, hDebut, hFin, annee, employe, station, isPresent } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    // Validate required fields
    if (!semaine || !jour || !annee || !employe || !station) {
      return res.status(400).json({ message: 'Les champs semaine, jour, année, employé et station sont requis.' });
    }

    // Validate semaine and annee
    const parsedSemaine = parseInt(semaine);
    const parsedAnnee = parseInt(annee);

    if (isNaN(parsedSemaine) || isNaN(parsedAnnee)) {
      return res.status(400).json({ message: 'Semaine et année doivent être des nombres valides.' });
    }

    if (parsedSemaine < 1 || parsedSemaine > 53) {
      return res.status(400).json({ message: 'Semaine doit être entre 1 et 53.' });
    }

    if (parsedAnnee < 2000 || parsedAnnee > 2100) {
      return res.status(400).json({ message: 'Année doit être entre 2000 et 2100.' });
    }

    // Validate jour
    const validDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    if (!validDays.includes(jour)) {
      return res.status(400).json({ message: 'Jour doit être un jour valide (Lundi à Dimanche).' });
    }

    // Validate employe and station existence
    const employeExists = await Employe.findById(employe);
    if (!employeExists) {
      return res.status(400).json({ message: 'Employé non trouvé.' });
    }

    const stationExists = await Station.findById(station);
    if (!stationExists) {
      return res.status(400).json({ message: 'Station non trouvée.' });
    }

    // Authorization check for station
    if (user.role !== 'admin' && station !== user.station.toString()) {
      return res.status(403).json({ message: 'Accès refusé: Vous ne pouvez créer des présences que pour votre station.' });
    }

    // Check for duplicate presence
    const existingPresence = await Presence.findOne({
      semaine: parsedSemaine,
      jour,
      annee: parsedAnnee,
      employe,
    });

    if (existingPresence) {
      return res.status(400).json({ message: 'Une présence existe déjà pour cet employé à cette date.' });
    }

    const presence = new Presence({
      idPresence:Date.now(),
      semaine: parsedSemaine,
      jour,
      hDebut: hDebut || '',
      hFin: hFin || '',
      annee: parsedAnnee,
      employe,
      station,
      isPresent: isPresent || false,
    });

    await presence.save();
    const populatedPresence = await Presence.findById(presence._id)
      .populate('employe', 'nomEmploye prenomEmploye')
      .populate('station', 'nomStation');

    if (!populatedPresence) {
      return res.status(404).json({ message: 'Présence non trouvée après création.' });
    }

    res.status(201).json(populatedPresence);
  } catch (err) {
    console.error('Erreur lors de la création de la présence:', err);
    res.status(500).json({ message: 'Erreur lors de la création de la présence: ' + err.message });
  }
};

const updatePresence = async (req, res) => {
  try {
    const { id } = req.params;
    const { semaine, jour, hDebut, hFin, annee, employe, station, isPresent } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    const presence = await Presence.findById(id);
    if (!presence) {
      return res.status(404).json({ message: 'Présence non trouvée.' });
    }

    if (user.role !== 'admin' && presence.station.toString() !== user.station.toString()) {
      return res.status(403).json({ message: 'Accès refusé: Station non autorisée.' });
    }

    // Validate fields if provided
    if (semaine !== undefined) {
      const parsedSemaine = parseInt(semaine);
      if (isNaN(parsedSemaine) || parsedSemaine < 1 || parsedSemaine > 53) {
        return res.status(400).json({ message: 'Semaine doit être un nombre entre 1 et 53.' });
      }
      presence.semaine = parsedSemaine;
    }

    if (jour !== undefined) {
      const validDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      if (!validDays.includes(jour)) {
        return res.status(400).json({ message: 'Jour doit être un jour valide (Lundi à Dimanche).' });
      }
      presence.jour = jour;
    }

    if (annee !== undefined) {
      const parsedAnnee = parseInt(annee);
      if (isNaN(parsedAnnee) || parsedAnnee < 2000 || parsedAnnee > 2100) {
        return res.status(400).json({ message: 'Année doit être un nombre entre 2000 et 2100.' });
      }
      presence.annee = parsedAnnee;
    }

    if (employe !== undefined) {
      const employeExists = await Employe.findById(employe);
      if (!employeExists) {
        return res.status(400).json({ message: 'Employé non trouvé.' });
      }
      presence.employe = employe;
    }

    if (station !== undefined) {
      const stationExists = await Station.findById(station);
      if (!stationExists) {
        return res.status(400).json({ message: 'Station non trouvée.' });
      }
      if (user.role !== 'admin' && station !== user.station.toString()) {
        return res.status(403).json({ message: 'Accès refusé: Vous ne pouvez modifier que les présences de votre station.' });
      }
      presence.station = station;
    }

    if (hDebut !== undefined) presence.hDebut = hDebut;
    if (hFin !== undefined) presence.hFin = hFin;
    if (isPresent !== undefined) presence.isPresent = isPresent;

    // Check for duplicate presence (if key fields are updated)
    if (semaine !== undefined || jour !== undefined || annee !== undefined || employe !== undefined) {
      const existingPresence = await Presence.findOne({
        semaine: semaine !== undefined ? parseInt(semaine) : presence.semaine,
        jour: jour || presence.jour,
        annee: annee !== undefined ? parseInt(annee) : presence.annee,
        employe: employe || presence.employe,
        _id: { $ne: id }, // Exclude the current presence
      });

      if (existingPresence) {
        return res.status(400).json({ message: 'Une présence existe déjà pour cet employé à cette date.' });
      }
    }

    await presence.save();
    const updatedPresence = await Presence.findById(id)
      .populate('employe', 'nomEmploye prenomEmploye')
      .populate('station', 'nomStation');

    if (!updatedPresence) {
      return res.status(404).json({ message: 'Présence non trouvée après mise à jour.' });
    }

    res.status(200).json(updatedPresence);
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la présence:', err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la présence: ' + err.message });
  }
};

const deletePresence = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    const presence = await Presence.findById(id);
    if (!presence) {
      return res.status(404).json({ message: 'Présence non trouvée.' });
    }

    if (user.role !== 'admin' && presence.station.toString() !== user.station.toString()) {
      return res.status(403).json({ message: 'Accès refusé: Station non autorisée.' });
    }

    await Presence.findByIdAndDelete(id);
    res.status(200).json({ message: 'Présence supprimée avec succès.' });
  } catch (err) {
    console.error('Erreur lors de la suppression de la présence:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression de la présence: ' + err.message });
  }
};

module.exports = { getPresences, createPresence, updatePresence, deletePresence };
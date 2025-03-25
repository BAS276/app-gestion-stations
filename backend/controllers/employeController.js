const Employe = require('../models/Employe');
const mongoose = require('mongoose');

exports.getEmployes = async (req, res) => {
  try {
    const employes = await Employe.find().populate('station presences plannings');
    res.json(employes);
  } catch (err) {
    console.error('Erreur lors de la récupération des employés:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des employés: ' + err.message });
  }
};

exports.getEmployeById = async (req, res) => {
  try {
    const employe = await Employe.findById(req.params.id).populate('station presences plannings');
    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }
    res.json(employe);
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'employé:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'employé: ' + err.message });
  }
};

exports.createEmploye = async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const employeData = {
      idEmploye: Date.now(),
      nomEmploye: req.body.nomEmploye,
      prenomEmploye: req.body.prenomEmploye,
      adresseEmploye: req.body.adresseEmploye,
      telephoneEmploye: req.body.telephoneEmploye,
      emailEmploye: req.body.emailEmploye.trim().toLowerCase(), // Normaliser l'email
      position: req.body.position,
      startDate: req.body.startDate,
      station: req.body.station || undefined,
      image: req.file ? `/uploads/${req.file.filename}` : '', // Image est optionnelle
    };

    const requiredFields = ['nomEmploye', 'prenomEmploye', 'adresseEmploye', 'telephoneEmploye', 'emailEmploye', 'position', 'startDate'];
    for (const field of requiredFields) {
      if (!employeData[field] || employeData[field].trim() === '') {
        return res.status(400).json({ message: `Le champ ${field} est requis.` });
      }
    }

    // Vérifier si l'email existe déjà
    const existingEmployee = await Employe.findOne({ emailEmploye: employeData.emailEmploye });
    if (existingEmployee) {
      console.log('Email already exists:', employeData.emailEmploye);
      return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre employé.' });
    }

    const employe = new Employe(employeData);
    const newEmploye = await employe.save();
    await newEmploye.populate('station presences plannings');
    res.status(201).json(newEmploye);
  } catch (err) {
    console.error('Erreur lors de la création de l’employé:', err);
    if (err.code === 11000) {
      res.status(400).json({ message: 'Cet email est déjà utilisé par un autre employé.' });
    } else {
      res.status(400).json({ message: 'Erreur lors de la création de l’employé: ' + err.message });
    }
  }
};

exports.updateEmploye = async (req, res) => {
  try {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const employeData = {
      nomEmploye: req.body.nomEmploye,
      prenomEmploye: req.body.prenomEmploye,
      adresseEmploye: req.body.adresseEmploye,
      telephoneEmploye: req.body.telephoneEmploye,
      emailEmploye: req.body.emailEmploye.trim().toLowerCase(), // Normaliser l'email
      position: req.body.position,
      startDate: req.body.startDate,
      station: req.body.station || undefined,
    };

    // Gérer l'image : utiliser la nouvelle image si fournie, sinon conserver l'ancienne
    if (req.file) {
      employeData.image = `/uploads/${req.file.filename}`;
    } else {
      // Si aucune nouvelle image n'est fournie, conserver l'image existante (elle sera déjà dans la base de données)
      const existingEmployee = await Employe.findById(req.params.id);
      if (existingEmployee) {
        employeData.image = existingEmployee.image || '';
      }
    }

    const requiredFields = ['nomEmploye', 'prenomEmploye', 'adresseEmploye', 'telephoneEmploye', 'emailEmploye', 'position', 'startDate'];
    for (const field of requiredFields) {
      if (!employeData[field] || employeData[field].trim() === '') {
        console.log(`Validation failed: ${field} is missing or empty`);
        return res.status(400).json({ message: `Le champ ${field} est requis.` });
      }
    }

    const existingEmployee = await Employe.findOne({ emailEmploye: employeData.emailEmploye, _id: { $ne: req.params.id } });
    if (existingEmployee) {
      console.log('Email already exists:', employeData.emailEmploye);
      return res.status(400).json({ message: 'Cet email est déjà utilisé par un autre employé.' });
    }

    const employe = await Employe.findByIdAndUpdate(req.params.id, employeData, { new: true }).populate('station presences plannings');
    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }
    res.json(employe);
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l’employé:', err);
    if (err.code === 11000) {
      res.status(400).json({ message: 'Cet email est déjà utilisé par un autre employé.' });
    } else {
      res.status(400).json({ message: 'Erreur lors de la mise à jour de l’employé: ' + err.message });
    }
  }
};

exports.deleteEmploye = async (req, res) => {
  try {
    const employe = await Employe.findById(req.params.id);
    if (!employe) {
      return res.status(404).json({ message: 'Employé non trouvé' });
    }

    if (employe.plannings && employe.plannings.length > 0) {
      return res.status(400).json({ message: 'Cet employé a des plannings associés. Supprimez d\'abord les plannings.' });
    }

    await Employe.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employé supprimé' });
  } catch (err) {
    console.error('Erreur lors de la suppression de l’employé:', err);
    res.status(500).json({ message: 'Erreur lors de la suppression de l’employé: ' + err.message });
  }
};
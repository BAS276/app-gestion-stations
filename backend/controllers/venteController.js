const Vente = require('../models/Vente');
const Employe = require('../models/Employe');

const getVentes = async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role !== 'admin' && user.station) {
      query.station = user.station; // Filter by station directly
    }

    const ventes = await Vente.find(query).populate({
      path: 'employeeId',
      populate: { path: 'station' },
    });
    res.status(200).json(ventes);
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des ventes', error: error.message });
  }
};

const getVenteById = async (req, res) => {
  try {
    const user = req.user;
    let query = { _id: req.params.id };

    if (user.role !== 'admin' && user.station) {
      query.station = user.station;
    }

    const vente = await Vente.findOne(query).populate({
      path: 'employeeId',
      populate: { path: 'station' },
    });
    if (!vente) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    res.status(200).json(vente);
  } catch (error) {
    console.error('Erreur lors de la récupération de la vente:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la vente', error: error.message });
  }
};

const createVente = async (req, res) => {
  try {
    const user = req.user;
    const venteData = { idVente: Date.now().toString(), ...req.body };

    // Fetch the employee to get the station
    const employee = await Employe.findById(venteData.employeeId);
    if (!employee) {
      return res.status(400).json({ message: 'Employé non trouvé' });
    }

    // For non-admins, ensure the employee belongs to their station
    if (user.role !== 'admin' && user.station) {
      if (employee.station.toString() !== user.station) {
        return res.status(403).json({ message: 'Accès interdit: Cet employé n\'appartient pas à votre station' });
      }
    }

    // Set the station field from the employee's station
    venteData.station = employee.station;

    // Additional validation
    if (venteData.category === 'Carburant') {
      if (!venteData.pumpNumber?.trim() || !venteData.fuelType || !venteData.quantity || !venteData.unitPrice) {
        return res.status(400).json({ message: 'Les champs pumpNumber, fuelType, quantity et unitPrice sont requis pour la catégorie Carburant' });
      }
      // Convert to numbers and validate
      venteData.quantity = Number(venteData.quantity);
      venteData.unitPrice = Number(venteData.unitPrice);
      if (isNaN(venteData.quantity) || venteData.quantity <= 0) {
        return res.status(400).json({ message: 'La quantité doit être un nombre positif' });
      }
      if (isNaN(venteData.unitPrice) || venteData.unitPrice <= 0) {
        return res.status(400).json({ message: 'Le prix unitaire doit être un nombre positif' });
      }
    } else {
      if (!venteData.price || !venteData.quantityPieces || !venteData.customerType) {
        return res.status(400).json({ message: 'Les champs price, quantityPieces et customerType sont requis pour les catégories non-Carburant' });
      }
      // Convert to numbers and validate
      venteData.price = Number(venteData.price);
      venteData.quantityPieces = Number(venteData.quantityPieces);
      if (isNaN(venteData.price) || venteData.price <= 0) {
        return res.status(400).json({ message: 'Le prix doit être un nombre positif' });
      }
      if (isNaN(venteData.quantityPieces) || venteData.quantityPieces <= 0 || !Number.isInteger(venteData.quantityPieces)) {
        return res.status(400).json({ message: 'La quantité de pièces doit être un nombre entier positif' });
      }
    }

    const newVente = new Vente(venteData);
    const savedVente = await newVente.save();
    const populatedVente = await Vente.findById(savedVente._id).populate({
      path: 'employeeId',
      populate: { path: 'station' },
    });
    res.status(201).json(populatedVente);
  } catch (error) {
    console.error('Erreur lors de la création de la vente:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Erreur de validation', errors: error.errors });
    }
    res.status(400).json({ message: error.message || 'Erreur lors de la création de la vente' });
  }
};

const updateVente = async (req, res) => {
  try {
    const user = req.user;
    const venteData = req.body;
    const venteId = req.params.id;

    // Fetch the employee to get the station
    const employee = await Employe.findById(venteData.employeeId);
    if (!employee) {
      return res.status(400).json({ message: 'Employé non trouvé' });
    }

    // For non-admins, ensure the employee belongs to their station
    if (user.role !== 'admin' && user.station) {
      if (employee.station.toString() !== user.station) {
        return res.status(403).json({ message: 'Accès interdit: Cet employé n\'appartient pas à votre station' });
      }
    }

    // Set the station field from the employee's station
    venteData.station = employee.station;

    // Additional validation
    if (venteData.category === 'Carburant') {
      if (!venteData.pumpNumber?.trim() || !venteData.fuelType || !venteData.quantity || !venteData.unitPrice) {
        return res.status(400).json({ message: 'Les champs pumpNumber, fuelType, quantity et unitPrice sont requis pour la catégorie Carburant' });
      }
      // Convert to numbers and validate
      venteData.quantity = Number(venteData.quantity);
      venteData.unitPrice = Number(venteData.unitPrice);
      if (isNaN(venteData.quantity) || venteData.quantity <= 0) {
        return res.status(400).json({ message: 'La quantité doit être un nombre positif' });
      }
      if (isNaN(venteData.unitPrice) || venteData.unitPrice <= 0) {
        return res.status(400).json({ message: 'Le prix unitaire doit être un nombre positif' });
      }
    } else {
      if (!venteData.price || !venteData.quantityPieces || !venteData.customerType) {
        return res.status(400).json({ message: 'Les champs price, quantityPieces et customerType sont requis pour les catégories non-Carburant' });
      }
      // Convert to numbers and validate
      venteData.price = Number(venteData.price);
      venteData.quantityPieces = Number(venteData.quantityPieces);
      if (isNaN(venteData.price) || venteData.price <= 0) {
        return res.status(400).json({ message: 'Le prix doit être un nombre positif' });
      }
      if (isNaN(venteData.quantityPieces) || venteData.quantityPieces <= 0 || !Number.isInteger(venteData.quantityPieces)) {
        return res.status(400).json({ message: 'La quantité de pièces doit être un nombre entier positif' });
      }
    }

    const updatedVente = await Vente.findByIdAndUpdate(venteId, venteData, { new: true, runValidators: true }).populate({
      path: 'employeeId',
      populate: { path: 'station' },
    });
    if (!updatedVente) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    res.status(200).json(updatedVente);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la vente:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Erreur de validation', errors: error.errors });
    }
    res.status(400).json({ message: error.message || 'Erreur lors de la mise à jour de la vente' });
  }
};

const deleteVente = async (req, res) => {
  try {
    const user = req.user;
    const venteId = req.params.id;
    const vente = await Vente.findById(venteId).populate({
      path: 'employeeId',
      populate: { path: 'station' },
    });

    if (!vente) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }

    // For non-admins, ensure the sale belongs to their station
    if (user.role !== 'admin' && user.station) {
      if (vente.station.toString() !== user.station) {
        return res.status(403).json({ message: 'Accès interdit: Cette vente n\'appartient pas à votre station' });
      }
    }

    await Vente.findByIdAndDelete(venteId);
    res.status(200).json({ message: 'Vente supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la vente:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la vente', error: error.message });
  }
};

module.exports = {
  getVentes,
  getVenteById,
  createVente,
  updateVente,
  deleteVente,
};
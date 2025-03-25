const VenteCarburant = require('../models/VenteCarburant');

const getVentesCarburant = async (req, res) => {
  try {
    const ventesCarburant = await VenteCarburant.find().populate('indexation');
    res.json(ventesCarburant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getVenteCarburant = async (req, res) => {
  try {
    const venteCarburant = await VenteCarburant.findById(req.params.id).populate('indexation');
    if (!venteCarburant) return res.status(404).json({ message: 'Vente carburant non trouvée' });
    res.json(venteCarburant);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createVenteCarburant = async (req, res) => {
  const venteCarburant = new VenteCarburant({
    idVenteCarburant: req.body.idVenteCarburant,
    compteurDebut: req.body.compteurDebut,
    compteurFin: req.body.compteurFin,
    indexation: req.body.indexation,
  });

  try {
    const newVenteCarburant = await venteCarburant.save();
    res.status(201).json(newVenteCarburant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateVenteCarburant = async (req, res) => {
  try {
    const venteCarburant = await VenteCarburant.findById(req.params.id);
    if (!venteCarburant) return res.status(404).json({ message: 'Vente carburant non trouvée' });
    Object.assign(venteCarburant, req.body);
    const updatedVenteCarburant = await venteCarburant.save();
    res.json(updatedVenteCarburant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteVenteCarburant = async (req, res) => {
  try {
    const venteCarburant = await VenteCarburant.findById(req.params.id);
    if (!venteCarburant) return res.status(404).json({ message: 'Vente carburant non trouvée' });
    await venteCarburant.deleteOne();
    res.json({ message: 'Vente carburant supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getVentesCarburant, getVenteCarburant, createVenteCarburant, updateVenteCarburant, deleteVenteCarburant };
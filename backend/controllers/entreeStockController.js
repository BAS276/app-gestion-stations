const EntreeStock = require('../models/EntreeStock');

const getEntreesStock = async (req, res) => {
  try {
    const entreesStock = await EntreeStock.find().populate('carburant station fournisseur');
    res.json(entreesStock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEntreeStock = async (req, res) => {
  try {
    const entreeStock = await EntreeStock.findById(req.params.id).populate('carburant station fournisseur');
    if (!entreeStock) return res.status(404).json({ message: 'Entrée stock non trouvée' });
    res.json(entreeStock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createEntreeStock = async (req, res) => {
  const entreeStock = new EntreeStock({
    idEntree: req.body.idEntree,
    dateEntree: req.body.dateEntree,
    quantite: req.body.quantite,
    prixAchat: req.body.prixAchat,
    carburant: req.body.carburant,
    station: req.body.station,
    fournisseur: req.body.fournisseur,
  });

  try {
    const newEntreeStock = await entreeStock.save();
    res.status(201).json(newEntreeStock);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateEntreeStock = async (req, res) => {
  try {
    const entreeStock = await EntreeStock.findById(req.params.id);
    if (!entreeStock) return res.status(404).json({ message: 'Entrée stock non trouvée' });
    Object.assign(entreeStock, req.body);
    const updatedEntreeStock = await entreeStock.save();
    res.json(updatedEntreeStock);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteEntreeStock = async (req, res) => {
  try {
    const entreeStock = await EntreeStock.findById(req.params.id);
    if (!entreeStock) return res.status(404).json({ message: 'Entrée stock non trouvée' });
    await entreeStock.deleteOne();
    res.json({ message: 'Entrée stock supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getEntreesStock, getEntreeStock, createEntreeStock, updateEntreeStock, deleteEntreeStock };
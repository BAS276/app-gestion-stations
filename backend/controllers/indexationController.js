const Indexation = require('../models/Indexation');

const getIndexations = async (req, res) => {
  try {
    const indexations = await Indexation.find().populate('carburant station ventes');
    res.json(indexations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getIndexation = async (req, res) => {
  try {
    const indexation = await Indexation.findById(req.params.id).populate('carburant station ventes');
    if (!indexation) return res.status(404).json({ message: 'Indexation non trouvée' });
    res.json(indexation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createIndexation = async (req, res) => {
  const indexation = new Indexation({
    idIndexation: req.body.idIndexation,
    dateDebut: req.body.dateDebut,
    dateFin: req.body.dateFin,
    prixVentePrev: req.body.prixVentePrev,
    carburant: req.body.carburant,
    station: req.body.station,
    ventes: req.body.ventes || [],
  });

  try {
    const newIndexation = await indexation.save();
    res.status(201).json(newIndexation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateIndexation = async (req, res) => {
  try {
    const indexation = await Indexation.findById(req.params.id);
    if (!indexation) return res.status(404).json({ message: 'Indexation non trouvée' });
    Object.assign(indexation, req.body);
    const updatedIndexation = await indexation.save();
    res.json(updatedIndexation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteIndexation = async (req, res) => {
  try {
    const indexation = await Indexation.findById(req.params.id);
    if (!indexation) return res.status(404).json({ message: 'Indexation non trouvée' });
    await indexation.deleteOne();
    res.json({ message: 'Indexation supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getIndexations, getIndexation, createIndexation, updateIndexation, deleteIndexation };
const Affectation = require('../models/Affectation');

const getAffectations = async (req, res) => {
  try {
    const affectations = await Affectation.find().populate('station employe');
    res.json(affectations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAffectation = async (req, res) => {
  try {
    const affectation = await Affectation.findById(req.params.id).populate('station employe');
    if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });
    res.json(affectation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createAffectation = async (req, res) => {
  const affectation = new Affectation({
    idAffectation: req.body.idAffectation,
    dateDebut: req.body.dateDebut,
    dateFin: req.body.dateFin,
    station: req.body.station,
    employe: req.body.employe,
  });

  try {
    const newAffectation = await affectation.save();
    res.status(201).json(newAffectation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateAffectation = async (req, res) => {
  try {
    const affectation = await Affectation.findById(req.params.id);
    if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });
    Object.assign(affectation, req.body);
    const updatedAffectation = await affectation.save();
    res.json(updatedAffectation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteAffectation = async (req, res) => {
  try {
    const affectation = await Affectation.findById(req.params.id);
    if (!affectation) return res.status(404).json({ message: 'Affectation non trouvée' });
    await affectation.deleteOne();
    res.json({ message: 'Affectation supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAffectations, getAffectation, createAffectation, updateAffectation, deleteAffectation };
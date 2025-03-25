const Citerne = require('../models/Citerne');

exports.getCiternes = async (req, res) => {
  try {
    const citernes = await Citerne.find().populate('station'); // Populate pour inclure les données de la station
    res.json(citernes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCiterne = async (req, res) => {
  const citerne = new Citerne({
    number: req.body.number,
    fuelType: req.body.fuelType,
    capacity: req.body.capacity,
    currentLevel: req.body.currentLevel,
    lastRefill: req.body.lastRefill,
    minLevel: req.body.minLevel,
    station: req.body.station, // Ajout du champ station
  });

  try {
    const newCiterne = await citerne.save();
    const populatedCiterne = await Citerne.findById(newCiterne._id).populate('station');
    res.status(201).json(populatedCiterne);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCiterne = async (req, res) => {
  try {
    const citerne = await Citerne.findByIdAndUpdate(
      req.params.id,
      {
        number: req.body.number,
        fuelType: req.body.fuelType,
        capacity: req.body.capacity,
        currentLevel: req.body.currentLevel,
        lastRefill: req.body.lastRefill,
        minLevel: req.body.minLevel,
        station: req.body.station, // Ajout du champ station
      },
      { new: true }
    ).populate('station');
    if (!citerne) return res.status(404).json({ message: 'Citerne non trouvée' });
    res.json(citerne);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCiterne = async (req, res) => {
  try {
    const citerne = await Citerne.findByIdAndDelete(req.params.id);
    if (!citerne) return res.status(404).json({ message: 'Citerne non trouvée' });
    res.json({ message: 'Citerne supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
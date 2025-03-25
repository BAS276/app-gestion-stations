const Carburant = require('../models/Carburant');

exports.getCarburants = async (req, res) => {
  try {
    const carburants = await Carburant.find();
    res.json(carburants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCarburant = async (req, res) => {
  const carburant = new Carburant({
    idCarburant: Date.now().toString(), 
    name: req.body.name,
    category: req.body.category,
    price: req.body.price,
    stock: req.body.stock,
    minStock: req.body.minStock,
    supplier: req.body.supplier,
  });

  try {
    const newCarburant = await carburant.save();
    res.status(201).json(newCarburant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCarburant = async (req, res) => {
  try {
    const carburant = await Carburant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!carburant) return res.status(404).json({ message: 'Carburant non trouvé' });
    res.json(carburant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCarburant = async (req, res) => {
  try {
    const carburant = await Carburant.findByIdAndDelete(req.params.id);
    if (!carburant) return res.status(404).json({ message: 'Carburant non trouvé' });
    res.json({ message: 'Carburant supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
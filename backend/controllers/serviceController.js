const ServicesDisponibles = require('../models/ServicesDisponibles');

exports.getServices = async (req, res) => {
  try {
    const services = await ServicesDisponibles.find().populate('stations');
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createService = async (req, res) => {
  const service = new ServicesDisponibles({
    idService: Date.now(),
    nomService: req.body.nomService,
    description: req.body.description,
    price: req.body.price,
    duration: req.body.duration,
    availability: req.body.availability,
    technician: req.body.technician,
    stations: req.body.stations || [],
  });

  try {
    const newService = await service.save();
    res.status(201).json(newService);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await ServicesDisponibles.findByIdAndUpdate(req.params.id, {
      nomService: req.body.nomService,
      description: req.body.description,
      price: req.body.price,
      duration: req.body.duration,
      availability: req.body.availability,
      technician: req.body.technician,
      stations: req.body.stations || [],
    }, { new: true }).populate('stations');
    if (!service) return res.status(404).json({ message: 'Service non trouvé' });
    res.json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await ServicesDisponibles.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service non trouvé' });
    res.json({ message: 'Service supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
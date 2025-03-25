const Pompe = require('../models/Pompe');

exports.getPumps = async (req, res) => {
  try {
    const pumps = await Pompe.find().populate(['station', 'tank']);
    // Filtrer les pompes qui n'ont pas de station ou de tank valide
    const validPumps = pumps.filter(pump => {
      if (!pump.station || !pump.tank) {
        console.warn(`Pompe ${pump.number} a des références invalides - Station: ${pump.station}, Tank: ${pump.tank}`);
        return false;
      }
      return true;
    });
    res.json(validPumps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPump = async (req, res) => {
  const pump = new Pompe({
    idPompe: Date.now().toString(),
    number: req.body.number,
    fuelType: req.body.fuelType,
    status: req.body.status,
    lastMaintenance: req.body.lastMaintenance,
    tank: req.body.tank,
    flowRate: req.body.flowRate,
    station: req.body.station,
  });

  try {
    const newPump = await pump.save();
    // Peupler les champs station et tank en un seul appel
    await newPump.populate(['station', 'tank']);
    if (!newPump.station || !newPump.tank) {
      throw new Error('Station ou citerne invalide pour la nouvelle pompe');
    }
    res.status(201).json(newPump);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updatePump = async (req, res) => {
  try {
    const pump = await Pompe.findByIdAndUpdate(
      req.params.id,
      {
        number: req.body.number,
        fuelType: req.body.fuelType,
        status: req.body.status,
        lastMaintenance: req.body.lastMaintenance,
        tank: req.body.tank,
        flowRate: req.body.flowRate,
        station: req.body.station,
      },
      { new: true }
    );
    if (!pump) return res.status(404).json({ message: 'Pompe non trouvée' });
    // Peupler les champs station et tank en un seul appel
    await pump.populate(['station', 'tank']);
    if (!pump.station || !pump.tank) {
      throw new Error('Station ou citerne invalide après mise à jour');
    }
    res.json(pump);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePump = async (req, res) => {
  try {
    const pump = await Pompe.findByIdAndDelete(req.params.id);
    if (!pump) return res.status(404).json({ message: 'Pompe non trouvée' });
    res.json({ message: 'Pompe supprimée' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
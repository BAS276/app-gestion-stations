const Fournisseur = require('../models/Fournisseur');

exports.getFournisseurs = async (req, res) => {
  try {
    const fournisseurs = await Fournisseur.find();
    res.json(fournisseurs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createFournisseur = async (req, res) => {
  const fournisseur = new Fournisseur({
    idFournisseur: req.body.idFournisseur || Date.now().toString(),
    name: req.body.name,
    contact: req.body.contact,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    products: req.body.products,
    contractNumber: req.body.contractNumber,
  });

  try {
    const newFournisseur = await fournisseur.save();
    res.status(201).json(newFournisseur);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur non trouvé' });
    res.json(fournisseur);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFournisseur = async (req, res) => {
  try {
    const fournisseur = await Fournisseur.findByIdAndDelete(req.params.id);
    if (!fournisseur) return res.status(404).json({ message: 'Fournisseur non trouvé' });
    res.json({ message: 'Fournisseur supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
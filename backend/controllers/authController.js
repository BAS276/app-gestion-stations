const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const login = async (req, res) => {
  const { email, password } = req.body;

  console.log('Login request received:', { email, password });

  if (!email || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ message: 'Email et mot de passe sont requis' });
  }

  try {
    const trimmedEmail = email.trim().toLowerCase();
    console.log('Looking for user with email:', trimmedEmail);
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      console.log(`Utilisateur non trouvé pour l'email: ${trimmedEmail}`);
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    const validRoles = ['manager', 'mainManager', 'admin'];
    if (!validRoles.includes(user.role)) {
      console.log(`Rôle invalide: ${user.role}`);
      return res.status(400).json({
        message: `Rôle invalide: ${user.role}. Les rôles valides sont: ${validRoles.join(', ')}`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Mot de passe incorrect pour l'email: ${trimmedEmail}`);
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role, // Include role in the token
        station: user.station ? user.station.toString() : null, // Include station (convert ObjectId to string)
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      {
        expiresIn: '24h', // Increase expiration to 24 hours for testing
      }
    );

    console.log('Login successful, sending response:', {
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        station: user.station || undefined,
      },
    });

    res.json({
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        station: user.station || undefined,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const register = async (req, res) => {
  const { nom, email, password, role, station } = req.body;

  if (!nom || !email || !password || !role) {
    return res.status(400).json({ message: 'Nom, email, mot de passe et rôle sont requis' });
  }

  const validRoles = ['manager', 'mainManager', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      message: `Rôle invalide: ${role}. Les rôles valides sont: ${validRoles.join(', ')}`,
    });
  }

  try {
    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Utilisateur déjà existant' });
    }

    const user = new User({
      nom,
      email: trimmedEmail,
      password,
      role,
      station: role === 'manager' ? station : undefined,
    });
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role, // Include role in the token
        station: user.station ? user.station.toString() : null, // Include station (convert ObjectId to string)
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      {
        expiresIn: '24h', // Increase expiration to 24 hours for testing
      }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        station: user.station || undefined,
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Other functions remain unchanged
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({
      _id: user._id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      station: user.station || undefined,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateProfile = async (req, res) => {
  const { nom, email } = req.body;

  if (!nom || !email) {
    return res.status(400).json({ message: 'Nom et email sont requis' });
  }

  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(400).json({ message: 'ID utilisateur invalide' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail !== user.email) {
      const existingUser = await User.findOne({ email: trimmedEmail });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    const validRoles = ['manager', 'mainManager', 'admin'];
    if (!validRoles.includes(user.role)) {
      return res.status(400).json({
        message: `Rôle invalide: ${user.role}. Les rôles valides sont: ${validRoles.join(', ')}`,
      });
    }

    user.nom = nom;
    user.email = trimmedEmail;

    await user.save();

    res.json({
      _id: user._id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      station: user.station || undefined,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return res.status(500).json({
      message: 'Erreur serveur',
      error: error.message,
      stack: error.stack,
    });
  }
};

const getUserActivity = async (req, res) => {
  try {
    const activities = [
      { event: 'Mise à jour du profil', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { event: 'Changement de station', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ];
    res.json(activities);
  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    await user.remove();
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

const updateUser = async (req, res) => {
  const { nom, email, role, station } = req.body;
  const userId = req.params.id;

  if (!nom || !email || !role) {
    return res.status(400).json({ message: 'Nom, email et rôle sont requis' });
  }

  const validRoles = ['manager', 'mainManager', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      message: `Rôle invalide: ${role}. Les rôles valides sont: ${validRoles.join(', ')}`,
    });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail !== user.email) {
      const existingUser = await User.findOne({ email: trimmedEmail });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }

    user.nom = nom;
    user.email = trimmedEmail;
    user.role = role;
    user.station = role === 'manager' ? station : undefined;

    await user.save();

    res.json({
      _id: user._id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      station: user.station || undefined,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { login, getMe, register, updateProfile, getUserActivity, getUsers, deleteUser, updateUser };
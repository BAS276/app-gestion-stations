const Settings = require('../models/Settings');

// Initialize default settings if none exist
const initializeSettings = async () => {
  try {
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      const defaultSettings = new Settings({
        appName: 'Gestion Stations',
        defaultRole: 'manager',
        emailNotifications: true,
        theme: 'dark',
      });
      await defaultSettings.save();
      console.log('Default settings initialized');
    }
  } catch (err) {
    console.error('Error initializing default settings:', err);
  }
};

// Get settings
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Paramètres non trouvés' });
    }
    res.status(200).json(settings);
  } catch (err) {
    console.error('Erreur lors de la récupération des paramètres:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des paramètres' });
  }
};

// Update settings
const updateSettings = async (req, res) => {
  const { appName, defaultRole, emailNotifications, theme } = req.body;

  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Paramètres non trouvés' });
    }

    // Update fields if provided in the request body
    settings.appName = appName !== undefined ? appName : settings.appName;
    settings.defaultRole = defaultRole !== undefined ? defaultRole : settings.defaultRole;
    settings.emailNotifications =
      emailNotifications !== undefined ? emailNotifications : settings.emailNotifications;
    settings.theme = theme !== undefined ? theme : settings.theme;

    await settings.save();
    res.status(200).json(settings);
  } catch (err) {
    console.error('Erreur lors de la mise à jour des paramètres:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour des paramètres' });
  }
};

module.exports = {
  initializeSettings,
  getSettings,
  updateSettings,
};
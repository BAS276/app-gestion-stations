const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('./middleware/authMiddleware');
require('dotenv').config();

console.log('Imported authMiddleware in server.js:', authMiddleware);

const app = express();

// Connexion à la base de données
connectDB();

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5175', 'http://localhost:5176'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
app.use('/uploads', express.static('uploads'));

// Routes publiques
app.use('/api/auth', require('./routes/authRoutes'));

// Routes protégées (avec authMiddleware)
app.use('/api/stations', authMiddleware, require('./routes/stationRoutes'));
app.use('/api/employes', authMiddleware, upload.single('image'), require('./routes/employeRoutes'));
app.use('/api/pompes', authMiddleware, require('./routes/pompeRoutes'));
app.use('/api/fournisseurs', authMiddleware, require('./routes/fournisseurRoutes'));
app.use('/api/services', authMiddleware, require('./routes/servicesRoutes'));
app.use('/api/affectations', authMiddleware, require('./routes/affectationRoutes'));
app.use('/api/plannings', authMiddleware, require('./routes/planningRoutes'));
app.use('/api/presences', require('./routes/presenceRoutes')); // Remove authMiddleware
app.use('/api/entreesStock', authMiddleware, require('./routes/entreeStockRoutes'));
app.use('/api/indexations', authMiddleware, require('./routes/indexationRoutes'));
app.use('/api/ventesCarburant', authMiddleware, require('./routes/venteCarburantRoutes'));
app.use('/api/ventes', authMiddleware, require('./routes/venteRoutes'));
app.use('/api/carburants', authMiddleware, require('./routes/carburantRoutes'));
app.use('/api/citernes', authMiddleware, require('./routes/citerneRoutes'));
app.use('/api/dashboard', authMiddleware, require('./routes/dashboardRoutes'));

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Une erreur est survenue sur le serveur',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Catch-all route for invalid endpoints
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
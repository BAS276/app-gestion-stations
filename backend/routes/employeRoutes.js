const express = require('express');
const router = express.Router();
const employeController = require('../controllers/employeController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Seules les images JPEG, JPG et PNG sont autorisées !'));
    }
  },
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    fields: 10, // Maximum number of non-file fields
    files: 1, // Maximum number of files
  },
}).single('image');

// Middleware to handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Le fichier est trop volumineux. La taille maximale est de 5MB.' });
    }
    return res.status(400).json({ message: `Erreur Multer: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Middleware to log raw request data
const logRawRequest = (req, res, next) => {
  console.log('Raw request headers:', req.headers);
  console.log('Raw request body (before multer):', req.body);
  next();
};

// Routes
router.get('/', employeController.getEmployes);
router.get('/:id', employeController.getEmployeById);
router.post('/', logRawRequest, upload, handleMulterError, employeController.createEmploye);
router.put('/:id', logRawRequest, upload, handleMulterError, employeController.updateEmploye);
router.delete('/:id', employeController.deleteEmploye);

module.exports = router;
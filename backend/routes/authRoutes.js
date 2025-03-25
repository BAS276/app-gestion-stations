// authRoutes.js
const express = require('express');
const router = express.Router();
const { login, getMe, register, updateProfile, getUserActivity, getUsers, deleteUser, updateUser } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

console.log('Imported authController functions:', { login, getMe, register, updateProfile, getUserActivity, getUsers, deleteUser, updateUser });

// Routes
router.get('/', (req, res) => {
  res.json({ message: 'Bienvenue à l\'API d\'authentification. Utilisez /login pour vous connecter ou /me pour obtenir les détails de l\'utilisateur.' });
});
router.post('/login', login); // Line 11
router.get('/me', authMiddleware, getMe); // Line 12
router.post('/register', authMiddleware, register); // Line 13
router.put('/update-profile', authMiddleware, updateProfile); // Line 14
router.get('/activity', authMiddleware, getUserActivity);
router.get('/users', authMiddleware, getUsers);
router.delete('/users/:id', authMiddleware, deleteUser);
router.put('/users/:id', authMiddleware, updateUser);

module.exports = router;
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.put('/:id/password', auth, userController.updatePassword);

module.exports = router;
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Connexion (admin ou agent)
router.post('/login', authController.login);

// Déconnexion (protégée par authentification)
router.post('/logout', authController.logout);

// ✅ Création manuelle d'un admin (temporaire, à supprimer ensuite)
router.post('/create-admin', authController.createAdmin);

// Changement de mot de passe (protégé par authentification)
router.post('/change-password', authController.changePassword);

module.exports = router;
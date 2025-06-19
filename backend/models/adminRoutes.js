const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdmin');

// ✅ Créer un agent
router.post('/create-agent', auth, isAdmin, adminController.createAgent);

// ✅ Liste des agents
router.get('/agents', auth, isAdmin, adminController.getAllAgents);

// ✅ Activer / bloquer un agent
router.put('/agents/:agentId/toggle', auth, isAdmin, adminController.toggleAgentStatus);

// ✅ Supprimer un agent
router.delete('/agents/:agentId', auth, isAdmin, adminController.deleteAgent);

module.exports = router;
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const auth = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdmin');

// ✅ Validation client
router.post('/validate', auth, clientController.initiateValidation);
router.post('/verify-otp', auth, clientController.validateWithOTP);

// ✅ Récupération clients
router.get('/my-clients', auth, clientController.getAgentClients); // Agent connecté
router.get('/agent/:agentId/clients', auth, isAdmin, clientController.getAgentClients); // Admin: clients d’un agent
router.get('/admin', auth, isAdmin, clientController.getAllClients); // ✅ Admin: tous les clients

// ✅ Vérification UltraMsg
router.get('/check-ultramsg-config', (req, res) => {
  res.json({
    status: 'OK',
    instanceId: process.env.ULTRAMSG_INSTANCE_ID ? 'configuré' : 'non configuré',
    token: process.env.ULTRAMSG_TOKEN ? '****' + process.env.ULTRAMSG_TOKEN.slice(-4) : 'non configuré',
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;

const axios = require('axios');
const qs = require('qs');
const Agent = require('../models/agent');
require('dotenv').config();

// Configuration UltraMsg
const INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const TOKEN = process.env.ULTRAMSG_TOKEN;

// Formatage numéro Sénégal
function formatPhoneNumber(phone) {
  let cleaned = (phone || '').toString().replace(/\D/g, '');

  if (cleaned.startsWith('00221')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('+221')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('0')) {
    cleaned = '221' + cleaned.substring(1);
  } else if (!cleaned.startsWith('221')) {
    cleaned = '221' + cleaned;
  }

  if (!/^221[0-9]{9}$/.test(cleaned)) {
    throw new Error(`Numéro invalide après formatage: ${cleaned}`);
  }

  return cleaned;
}

// Envoi WhatsApp
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    if (!INSTANCE_ID || !TOKEN) {
      throw new Error("UltraMsg: instance ID ou token manquant. Vérifiez votre fichier .env");
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const apiUrl = `https://api.ultramsg.com/${INSTANCE_ID}/messages/chat`;

    console.log("Envoi WhatsApp vers :", formattedPhone);
    console.log("Message:", message);
    console.log("API URL:", apiUrl);

    const response = await axios({
      method: 'post',
      url: apiUrl,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify({
        token: TOKEN,
        to: formattedPhone,
        body: message
      }),
      timeout: 10000
    });

    console.log("Réponse UltraMsg:", response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur UltraMsg:', {
      status: error.response?.status,
      error: error.response?.data?.error || error.message
    });
    throw new Error("Échec d'envoi du message WhatsApp");
  }
}

// ✅ Créer un nouvel agent avec envoi WhatsApp
exports.createAgent = async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    const existing = await Agent.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Agent existe déjà' });

    const newAgent = new Agent({ name, phone, password });
    await newAgent.save();

    // Envoi des identifiants par WhatsApp
    const whatsappMessage = `Bonjour ${name},\n\nVos identifiants agent ont été créés :\n\nTéléphone: ${phone}\nMot de passe: ${password}\n\nUtilisez ces informations pour vous connecter à l'application.`;
    
    await sendWhatsAppMessage(phone, whatsappMessage);

    res.status(201).json({ 
      message: 'Agent créé ✅ - Identifiants envoyés par WhatsApp', 
      agent: {
        _id: newAgent._id,
        name: newAgent.name,
        phone: newAgent.phone,
        isActive: newAgent.isActive
      }
    });

  } catch (err) {
    console.error(err);
    
    if (err.message.includes("UltraMsg")) {
      return res.status(500).json({ 
        message: "Agent créé mais échec d'envoi WhatsApp",
        error: err.message 
      });
    }
    
    res.status(500).json({ 
      message: "Erreur lors de la création de l'agent",
      error: err.message 
    });
  }
};

// ✅ Obtenir la liste des agents
exports.getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });
    res.status(200).json(agents);
  } catch (err) {
    res.status(500).json({ 
      message: "Erreur lors de la récupération des agents",
      error: err.message 
    });
  }
};

// ✅ Activer / bloquer un agent
exports.toggleAgentStatus = async (req, res) => {
  const { agentId } = req.params;

  try {
    const agent = await Agent.findById(agentId);
    if (!agent) return res.status(404).json({ message: "Agent introuvable" });

    agent.isActive = !agent.isActive;
    await agent.save();

    // Envoyer une notification WhatsApp lors du changement de statut
    const statusMessage = `Cher ${agent.name},\n\nVotre compte agent a été ${agent.isActive ? 'activé' : 'bloqué'}.\n\n${agent.isActive ? 'Vous pouvez maintenant vous connecter.' : 'Contactez l\'administrateur pour plus d\'informations.'}`;
    
    try {
      await sendWhatsAppMessage(agent.phone, statusMessage);
    } catch (whatsappError) {
      console.error("Erreur lors de l'envoi de la notification de statut:", whatsappError);
    }

    res.status(200).json({
      message: `Agent ${agent.isActive ? 'activé' : 'bloqué'}`,
      agent: {
        _id: agent._id,
        name: agent.name,
        phone: agent.phone,
        isActive: agent.isActive
      }
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Erreur de mise à jour de l'état de l'agent",
      error: err.message 
    });
  }
};

// ✅ Supprimer un agent
exports.deleteAgent = async (req, res) => {
  const { agentId } = req.params;

  try {
    const agent = await Agent.findByIdAndDelete(agentId);
    if (!agent) return res.status(404).json({ message: "Agent introuvable" });

    // Envoyer une notification WhatsApp pour informer l'agent de sa suppression
    const deleteMessage = `Cher ${agent.name},\n\nVotre compte agent a été supprimé du système.\n\nSi vous pensez qu'il s'agit d'une erreur, veuillez contacter l'administrateur.`;
    
    try {
      await sendWhatsAppMessage(agent.phone, deleteMessage);
    } catch (whatsappError) {
      console.error("Erreur lors de l'envoi de la notification de suppression:", whatsappError);
    }

    res.status(200).json({
      message: 'Agent supprimé avec succès',
      deletedAgent: {
        _id: agent._id,
        name: agent.name,
        phone: agent.phone
      }
    });
  } catch (err) {
    res.status(500).json({ 
      message: "Erreur lors de la suppression de l'agent",
      error: err.message 
    });
  }
};
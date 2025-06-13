const axios = require('axios');
const qs = require('qs');
const Client = require('../models/client');
const Agent = require('../models/agent');
require('dotenv').config();


// Configuration UltraMsg
const INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const TOKEN = process.env.ULTRAMSG_TOKEN;

// Génération OTP
function generateOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

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
      throw new Error("UltraMsg: instance ID ou token manquant. Vérifiez votre fichier .env.");
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

// Initier validation client
exports.initiateValidation = async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const agentId = req.user.id;

  try {
    const existingClient = await Client.findOne({ phone });
    if (existingClient) {
      return res.status(400).json({ 
        message: 'Ce numéro est déjà enregistré',
        clientId: existingClient._id,
        status: existingClient.isValidated ? 'validé' : 'en attente'
      });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const newClient = new Client({
      firstName,
      lastName,
      phone,
      otp,
      otpExpires,
      agent: agentId
    });

    await newClient.save();

    const message = `Bonjour ${firstName},\nVotre code de validation est: ${otp}\nValable 15 minutes`;

    await sendWhatsAppMessage(phone, message);

    res.status(200).json({ 
      message: 'OTP envoyé avec succès',
      clientId: newClient._id,
      expiresAt: otpExpires,
      ...(process.env.NODE_ENV !== 'production' && { debugOtp: otp })
    });

  } catch (error) {
    console.error('Erreur validation client:', error);
    res.status(500).json({ 
      message: "Erreur lors de la validation",
      error: error.message
    });
  }
};

// Valider avec OTP
exports.validateWithOTP = async (req, res) => {
  const { clientId, otp } = req.body;

  try {
    const client = await Client.findById(clientId).select('+otp +otpExpires');
    
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    console.log('Validation OTP - Données:', {
      dbOTP: client.otp,
      receivedOTP: otp,
      expires: client.otpExpires,
      now: new Date()
    });

    if (client.isValidated) {
      return res.status(400).json({ 
        message: 'Ce client est déjà validé',
        validatedAt: client.validatedAt
      });
    }

    if (!client.otp || !client.otpExpires) {
      return res.status(400).json({ 
        message: 'Aucun OTP actif pour ce client'
      });
    }

    if (client.otp !== otp.trim()) {
      return res.status(401).json({ message: 'Code OTP incorrect' });
    }

    if (client.otpExpires < new Date()) {
      return res.status(401).json({ message: 'Code OTP expiré' });
    }

    client.isValidated = true;
    client.validatedAt = new Date();
    client.otp = undefined;
    client.otpExpires = undefined;
    await client.save();

    res.status(200).json({ 
      message: 'Client validé avec succès',
      client: {
        _id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        validatedAt: client.validatedAt
      }
    });

  } catch (error) {
    console.error('Erreur validation OTP:', error);
    res.status(500).json({ 
      message: "Erreur lors de la validation OTP",
      error: error.message 
    });
  }
};

// Obtenir les clients d'un agent
exports.getAgentClients = async (req, res) => {
  try {
    const agentId = req.user.role === 'admin' && req.params.agentId 
      ? req.params.agentId 
      : req.user.id;

    const clients = await Client.find({ agent: agentId }).sort({ createdAt: -1 });

    res.status(200).json(clients);
  } catch (error) {
    console.error('Erreur récupération clients:', error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des clients",
      error: error.message 
    });
  }
};


// ✅ Obtenir tous les clients (accès admin uniquement)
exports.getAllClients = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Accès refusé: réservé à l'admin" });
    }

    const clients = await Client.find()
      .populate('agent', 'name phone') // Optionnel : afficher les infos de l’agent associé
      .sort({ createdAt: -1 });

    res.status(200).json(clients);
  } catch (error) {
    console.error('Erreur récupération tous les clients:', error);
    res.status(500).json({
      message: "Erreur lors de la récupération des clients",
      error: error.message
    });
  }
};


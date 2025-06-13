// utils/ultramsg.js
const axios = require('axios');
const qs = require('qs');

const INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const TOKEN = process.env.ULTRAMSG_TOKEN;

async function sendWhatsAppMessage(phoneNumber, message) {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const data = qs.stringify({ token: TOKEN, to: formattedPhone, body: message });

  const config = {
    method: 'post',
    url: `https://api.ultramsg.com/${INSTANCE_ID}/messages/chat`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: data
  };

  try {
    await axios(config);
    console.log("OTP envoyé avec succès");
  } catch (error) {
    console.error("Erreur UltraMsg:", error);
    throw new Error("Échec d'envoi de l'OTP");
  }
}

function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('221') && cleaned.length === 9) {
    cleaned = `221${cleaned}`; // Exemple pour Sénégal
  }
  return cleaned;
}
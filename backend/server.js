// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // ✅ Ajout de CORS
const connectToMongoDB = require('./database/mongo');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const clientRoutes = require('./routes/clientRoutes');

console.log('Node.js utilisé par le backend :', process.version);

// Charger les variables d'environnement
dotenv.config();

// Initialiser l'app
const app = express();

// Middleware
app.use(cors()); // ✅ Autoriser les requêtes cross-origin (depuis le front)
app.use(express.json()); // pour lire les JSON

// Connexion à MongoDB
connectToMongoDB();

// Utilisation des routes
app.use('/api/auth', authRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});

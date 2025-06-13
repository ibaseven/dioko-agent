const Admin = require('../models/admin');
const Agent = require('../models/agent');
const jwt = require('jsonwebtoken');

// Générer un token JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Connexion admin ou agent
exports.login = async (req, res) => {
  const { email, phone, password } = req.body;

  try {
    let user = null;

    // Si l'email est fourni, on cherche un admin
    if (email) {
      user = await Admin.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "Admin introuvable" });
      }
    }

    // Si le téléphone est fourni, on cherche un agent
    if (phone) {
      user = await Agent.findOne({ phone });
      if (!user) {
        return res.status(404).json({ message: "Agent introuvable" });
      }
      if (!user.isActive) {
        return res.status(403).json({ message: "Compte agent bloqué" });
      }
    }

    // Si aucun user trouvé (ni admin ni agent)
    if (!user) {
      return res.status(400).json({ message: "Email ou numéro requis" });
    }

    // Vérifie le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // Génère un token JWT
    const token = generateToken(user);
    res.json({ token, role: user.role, id: user._id, name: user.name });

  } catch (error) {
    console.error("Erreur dans la connexion :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Déconnexion simple
exports.logout = (req, res) => {
  // Côté client, on doit supprimer le token
  res.status(200).json({ message: "Déconnexion réussie ✅" });
};

// Création d'un admin
exports.createAdmin = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Cet admin existe déjà' });
    }

    const newAdmin = new Admin({ name, email, password });
    await newAdmin.save(); // le mot de passe sera hashé automatiquement

    res.status(201).json({ message: 'Admin créé avec succès ✅', admin: newAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la création de l'admin" });
  }
};

// Changement de mot de passe
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Les deux champs sont requis' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
  }

  try {
    const agent = await Agent.findById(userId).select('+password');
    if (!agent) {
      return res.status(404).json({ message: 'Agent non trouvé' });
    }

    if (!agent.isActive) {
      return res.status(403).json({ message: 'Compte agent désactivé' });
    }

    const isMatch = await agent.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }

    const isSamePassword = await agent.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({ 
        message: 'Le nouveau mot de passe doit être différent de l\'ancien' 
      });
    }

    await agent.changePassword(newPassword);

    res.status(200).json({ 
      message: 'Mot de passe mis à jour avec succès',
      updatedAt: new Date()
    });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({ 
      message: "Erreur lors du changement de mot de passe",
      error: error.message
    });
  }
};

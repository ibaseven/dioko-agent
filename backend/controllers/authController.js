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

    // Si l'email est fourni, on cherche un admin (pour compatibilité)
    if (email) {
      user = await Admin.findOne({ email }).select('+password');
      if (!user) {
        return res.status(404).json({ message: "Admin introuvable" });
      }
    }

    // Si le téléphone est fourni, on cherche d'abord un admin, puis un agent
    if (phone) {
      // Chercher d'abord dans les admins
      user = await Admin.findOne({ phone }).select('+password');
      
      // Si pas trouvé dans les admins, chercher dans les agents
      if (!user) {
        user = await Agent.findOne({ phone }).select('+password');
        if (!user) {
          return res.status(404).json({ message: "Utilisateur introuvable" });
        }
        // Vérifier si l'agent est actif
        if (!user.isActive) {
          return res.status(403).json({ message: "Compte agent bloqué" });
        }
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
  const { name, phone, password } = req.body;

  try {
    // Vérification des champs requis
    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Nom, téléphone et mot de passe sont requis' });
    }

    // Validation du format du téléphone (optionnel, adaptez selon vos besoins)
    const phoneRegex = /^[+]?[\d\s\-\(\)]{8,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Format de téléphone invalide' });
    }

    // Vérification de l'unicité du téléphone
    const existingAdmin = await Admin.findOne({ phone });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Un admin avec ce numéro existe déjà' });
    }

    // Validation du mot de passe
    if (password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    const newAdmin = new Admin({ name, phone, password });
    await newAdmin.save(); // le mot de passe sera hashé automatiquement

    // Retourner les informations sans le mot de passe
    const adminResponse = {
      id: newAdmin._id,
      name: newAdmin.name,
      phone: newAdmin.phone,
      role: newAdmin.role,
      createdAt: newAdmin.createdAt
    };

    res.status(201).json({ message: 'Admin créé avec succès ✅', admin: adminResponse });
  } catch (err) {
    console.error('Erreur création admin:', err);
    res.status(500).json({ 
      message: "Erreur lors de la création de l'admin",
      error: err.message 
    });
  }
};

// Création d'un agent (nouveau)
exports.createAgent = async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    // Vérification des champs requis
    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Nom, téléphone et mot de passe sont requis' });
    }

    // Validation du format du téléphone (optionnel, adaptez selon vos besoins)
    const phoneRegex = /^[+]?[\d\s\-\(\)]{8,15}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Format de téléphone invalide' });
    }

    // Vérification de l'unicité du téléphone
    const existingAgent = await Agent.findOne({ phone });
    if (existingAgent) {
      return res.status(400).json({ message: 'Un agent avec ce numéro existe déjà' });
    }

    // Validation du mot de passe
    if (password.length < 8) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    }

    // Création du nouvel agent
    const newAgent = new Agent({ 
      name, 
      phone, 
      password,
      isActive: true // Par défaut, l'agent est actif
    });
    
    await newAgent.save(); // le mot de passe sera hashé automatiquement

    // Retourner les informations sans le mot de passe
    const agentResponse = {
      id: newAgent._id,
      name: newAgent.name,
      phone: newAgent.phone,
      role: newAgent.role,
      isActive: newAgent.isActive,
      createdAt: newAgent.createdAt
    };

    res.status(201).json({ 
      message: 'Agent créé avec succès ✅', 
      agent: agentResponse 
    });
  } catch (err) {
    console.error('Erreur création agent:', err);
    res.status(500).json({ 
      message: "Erreur lors de la création de l'agent",
      error: err.message 
    });
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
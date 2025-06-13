const Agent = require('../models/agent');

// ✅ Créer un nouvel agent
exports.createAgent = async (req, res) => {
  const { name, phone, password } = req.body;

  try {
    const existing = await Agent.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Agent existe déjà' });

    const newAgent = new Agent({ name, phone, password });
    await newAgent.save();

    res.status(201).json({ message: 'Agent créé ✅', agent: newAgent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la création de l'agent" });
  }
};

// ✅ Obtenir la liste des agents
exports.getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });
    res.status(200).json(agents);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des agents" });
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

    res.status(200).json({
      message: `Agent ${agent.isActive ? 'activé' : 'bloqué'}`,
      agent
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur de mise à jour de l'état de l'agent" });
  }
};

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  role: { type: String, default: 'agent' },
  createdAt: { type: Date, default: Date.now }
});

// Méthode pour comparer les mots de passe
agentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour changer le mot de passe
agentSchema.methods.changePassword = async function(newPassword) {
  // Hash le nouveau mot de passe avant sauvegarde
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(newPassword, salt);
  await this.save();
};

// Middleware pour hasher le mot de passe avant sauvegarde
agentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('Agent', agentSchema);
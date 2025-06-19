// models/Admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    // unique: true,  // ← Commenté pour permettre les doublons
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false  // Par défaut, ne pas inclure le mot de passe dans les requêtes
  },
  role: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Hachage du mot de passe avant sauvegarde
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer un mot de passe
adminSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
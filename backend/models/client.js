const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  firstName: { 
    type: String, 
    required: true,
    trim: true
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true
  },
  phone: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^(0|221|\+221|00221)?[0-9]{9}$/.test(v);
      },
      message: props => `${props.value} n'est pas un numéro de téléphone valide!`
    }
  },
  otp: { 
    type: String,
    select: false
  },
  otpExpires: { 
    type: Date,
    select: false
  },
  isValidated: { 
    type: Boolean, 
    default: false 
  },
  validatedAt: { 
    type: Date 
  },
  agent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Agent', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Méthode pour vérifier l'OTP (accès sécurisé aux champs cachés)
clientSchema.methods.verifyOTP = async function(enteredOTP) {
  // Charge les champs normalement exclus
  const client = await this.model('Client')
    .findById(this._id)
    .select('+otp +otpExpires');
  
  return {
    isMatch: client.otp === enteredOTP,
    isExpired: client.otpExpires < new Date(),
    isValidated: client.isValidated
  };
};

// Index
clientSchema.index({ phone: 1 });
clientSchema.index({ agent: 1 });
clientSchema.index({ isValidated: 1 });

module.exports = mongoose.model('Client', clientSchema);
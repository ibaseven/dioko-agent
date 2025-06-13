// utils/otp.js
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4 chiffres
}

module.exports = { generateOTP };
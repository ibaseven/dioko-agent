const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux admins' });
  }
  next();
};

module.exports = isAdmin;

// Middleware to restrict access to specific roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Utilisateur non authentifié.' });
      }
  
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Accès refusé: Rôle non autorisé.' });
      }
  
      next();
    };
  };
  
  module.exports = restrictTo;
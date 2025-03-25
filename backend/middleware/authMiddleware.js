const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log('Authorization Header:', authHeader);

  if (!authHeader) {
    return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Format de token invalide.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    console.log('Decoded Token:', decoded);
    next();
  } catch (error) {
    console.error('Erreur dans authMiddleware:', error);
    res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

module.exports = authMiddleware;
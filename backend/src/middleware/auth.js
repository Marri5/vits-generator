const jwt = require('jsonwebtoken');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET_TOKEN || 'din-hemmelige-jwt-nokkel-her';

// Middleware for JWT autentisering
const authenticateToken = async (req, res, next) => {
  try {
    // Kun sjekk Authorization header, ikke cookies
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    if (!token) {
      return res.status(401).json({ message: 'Autentisering kreves' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Ugyldig eller utløpt token' });
  }
};

module.exports = { authenticateToken }; 
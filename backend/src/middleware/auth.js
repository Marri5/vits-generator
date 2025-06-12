const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET_TOKEN || 'din-hemmelige-jwt-nokkel-her';

// Middleware for JWT autentisering
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.authToken;
    
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

// Middleware for å håndtere bruker-cookies (gammel versjon, beholdes for bakoverkompatibilitet)
const ensureUserId = async (req, res, next) => {
  let userId = req.cookies.userId;
  
  if (!userId) {
    // Generer ny bruker-ID
    userId = uuidv4();
    
    // Sett cookie som varer i 1 år
    res.cookie('userId', userId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 år
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Opprett ny bruker i databasen
    try {
      await User.create({ userId, ratedJokes: [], totalRatings: 0 });
    } catch (error) {
      // Bruker eksisterer allerede (race condition)
      console.log('Bruker eksisterer allerede:', userId);
    }
  }
  
  req.userId = userId;
  next();
};

module.exports = { ensureUserId, authenticateToken }; 
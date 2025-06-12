const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

// Middleware for å håndtere bruker-cookies
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

module.exports = { ensureUserId }; 
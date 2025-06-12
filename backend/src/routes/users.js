const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Joke = require('../models/Joke');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// JWT Secret - bør være i .env
const JWT_SECRET = process.env.JWT_SECRET || 'din-hemmelige-jwt-nokkel-her';

/**
 * POST /api/user/register
 * Registrer ny bruker
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Valider input
    if (!username || !password) {
      return res.status(400).json({ message: 'Brukernavn og passord er påkrevd' });
    }
    
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: 'Brukernavn må være mellom 3 og 20 tegn' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Passordet må være minst 6 tegn' });
    }
    
    // Sjekk om brukernavnet allerede eksisterer
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Brukernavnet er allerede tatt' });
    }
    
    // Hash passordet
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Opprett ny bruker
    const newUser = new User({
      username,
      password: hashedPassword,
      userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      ratedJokes: [],
      totalRatings: 0,
      averageGivenRating: 0
    });
    
    await newUser.save();
    
    res.status(201).json({ 
      message: 'Bruker opprettet',
      username: newUser.username 
    });
    
  } catch (error) {
    console.error('Feil ved registrering:', error);
    res.status(500).json({ message: 'Kunne ikke opprette bruker' });
  }
});

/**
 * POST /api/user/login
 * Logg inn bruker
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Valider input
    if (!username || !password) {
      return res.status(400).json({ message: 'Brukernavn og passord er påkrevd' });
    }
    
    // Finn bruker
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Feil brukernavn eller passord' });
    }
    
    // Sjekk passord
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Feil brukernavn eller passord' });
    }
    
    // Generer JWT token
    const token = jwt.sign(
      { userId: user.userId, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send token som cookie også
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dager
    });
    
    res.json({ 
      message: 'Innlogging vellykket',
      token,
      username: user.username,
      userId: user.userId
    });
    
  } catch (error) {
    console.error('Feil ved innlogging:', error);
    res.status(500).json({ message: 'Kunne ikke logge inn' });
  }
});

/**
 * GET /api/user/verify
 * Verifiser JWT token
 */
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.authToken;
    
    if (!token) {
      return res.status(401).json({ message: 'Ingen token funnet' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({ 
      valid: true,
      user: {
        userId: decoded.userId,
        username: decoded.username
      }
    });
    
  } catch (error) {
    res.status(401).json({ message: 'Ugyldig token' });
  }
});

/**
 * GET /api/user/history
 * Henter brukerens vurderingshistorikk
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findOne({ userId });
    
    if (!user || user.ratedJokes.length === 0) {
      return res.json({
        message: 'Ingen vurderingshistorikk funnet',
        ratedJokes: [],
        totalRatings: 0,
        averageGivenRating: 0
      });
    }

    // Hent detaljer om vitsene brukeren har vurdert
    const jokeIds = user.ratedJokes.map(joke => joke.jokeId);
    const jokes = await Joke.find({ jokeId: { $in: jokeIds } });
    
    // Kombiner brukerdata med vitsdetaljer
    const detailedHistory = user.ratedJokes.map(userJoke => {
      const jokeDetails = jokes.find(joke => joke.jokeId == userJoke.jokeId);
      return {
        jokeId: userJoke.jokeId,
        userRating: userJoke.rating,
        timestamp: userJoke.timestamp,
        setup: jokeDetails ? jokeDetails.setup : 'Vits ikke funnet',
        punchline: jokeDetails ? jokeDetails.punchline : '',
        averageRating: jokeDetails ? jokeDetails.averageRating : 0,
        totalRatings: jokeDetails ? jokeDetails.totalRatings : 0
      };
    });

    // Sorter etter nyeste først
    detailedHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      ratedJokes: detailedHistory,
      totalRatings: user.totalRatings,
      averageGivenRating: user.averageGivenRating
    });

  } catch (error) {
    console.error('Feil ved henting av brukerhistorikk:', error);
    res.status(500).json({ 
      error: 'Kunne ikke hente brukerhistorikk', 
      message: 'Prøv igjen senere' 
    });
  }
});

module.exports = router; 
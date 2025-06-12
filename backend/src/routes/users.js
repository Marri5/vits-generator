const express = require('express');
const User = require('../models/User');
const Joke = require('../models/Joke');
const { ensureUserId } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/user/history
 * Henter brukerens vurderingshistorikk
 */
router.get('/history', ensureUserId, async (req, res) => {
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
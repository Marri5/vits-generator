const express = require('express');
const Joke = require('../models/Joke');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/stats
 * Henter statistikk om vitser og vurderinger
 */
router.get('/', async (req, res) => {
  try {
    const totalJokes = await Joke.countDocuments();
    const totalRatings = await Joke.aggregate([
      { $unwind: '$ratings' },
      { $count: 'total' }
    ]);
    
    const totalUsers = await User.countDocuments();
    
    const averageRating = await Joke.aggregate([
      { $match: { totalRatings: { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$averageRating' } } }
    ]);

    res.json({
      totalJokes,
      totalRatings: totalRatings.length > 0 ? totalRatings[0].total : 0,
      totalUsers,
      averageRating: averageRating.length > 0 ? averageRating[0].avgRating : 0
    });
  } catch (error) {
    console.error('Feil ved henting av statistikk:', error);
    res.status(500).json({ 
      error: 'Kunne ikke hente statistikk', 
      message: 'Prøv igjen senere' 
    });
  }
});

module.exports = router; 
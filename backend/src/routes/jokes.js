const express = require('express');
const axios = require('axios');
const Joke = require('../models/Joke');
const User = require('../models/User');
const { ensureUserId } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/joke/random
 * Henter en tilfeldig vits fra eksternt API
 */
router.get('/random', ensureUserId, async (req, res) => {
  try {
    const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
    const joke = response.data;

    // Sjekk om vitsen allerede finnes i databasen
    let existingJoke = await Joke.findOne({ jokeId: joke.id });
    
    // Sjekk om brukeren allerede har vurdert denne vitsen
    let userRating = null;
    if (existingJoke) {
      const userRatingObj = existingJoke.ratings.find(r => r.userId === req.userId);
      if (userRatingObj) {
        userRating = userRatingObj.rating;
      }
    }
    
    if (existingJoke) {
      // Returner vitsen med eksisterende vurderingsdata
      res.json({
        id: joke.id,
        type: joke.type,
        setup: joke.setup,
        punchline: joke.punchline,
        averageRating: existingJoke.averageRating,
        totalRatings: existingJoke.totalRatings,
        userRating: userRating // Brukerens tidligere vurdering
      });
    } else {
      // Returner ny vits uten vurderingsdata
      res.json({
        id: joke.id,
        type: joke.type,
        setup: joke.setup,
        punchline: joke.punchline,
        averageRating: 0,
        totalRatings: 0,
        userRating: null
      });
    }
  } catch (error) {
    console.error('Feil ved henting av vits:', error);
    res.status(500).json({ 
      error: 'Kunne ikke hente vits', 
      message: 'Prøv igjen senere' 
    });
  }
});

/**
 * POST /api/joke/:id/rate
 * Vurderer en vits
 * Body: { rating: number (1-5) }
 */
router.post('/:id/rate', ensureUserId, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.userId;

    // Validering av rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Ugyldig vurdering', 
        message: 'Vurdering må være mellom 1 og 5' 
      });
    }

    // Finn eller opprett vits i databasen
    let vits = await Joke.findOne({ jokeId: id });

    if (!vits) {
      // Hent vitsinfo fra eksternt API hvis den ikke finnes
      try {
        const response = await axios.get(`https://official-joke-api.appspot.com/jokes/${id}`);
        const jokeData = response.data;
        
        vits = new Joke({
          jokeId: id,
          type: jokeData.type,
          setup: jokeData.setup,
          punchline: jokeData.punchline,
          ratings: [],
          averageRating: 0,
          totalRatings: 0
        });
      } catch (apiError) {
        return res.status(404).json({ 
          error: 'Vits ikke funnet', 
          message: 'Kunne ikke finne vits med denne ID-en' 
        });
      }
    }

    // Sjekk om brukeren allerede har vurdert denne vitsen
    const existingRatingIndex = vits.ratings.findIndex(r => r.userId === userId);

    if (existingRatingIndex !== -1) {
      // Oppdater eksisterende vurdering
      const oldRating = vits.ratings[existingRatingIndex].rating;
      vits.ratings[existingRatingIndex].rating = rating;
      vits.ratings[existingRatingIndex].timestamp = new Date();

      // Oppdater brukerens historikk
      const user = await User.findOne({ userId });
      if (user) {
        const userJokeIndex = user.ratedJokes.findIndex(j => j.jokeId == id);
        if (userJokeIndex !== -1) {
          user.ratedJokes[userJokeIndex].rating = rating;
          user.ratedJokes[userJokeIndex].timestamp = new Date();
        }
        
        // Beregn ny gjennomsnittlig rating for brukeren
        const totalUserRating = user.ratedJokes.reduce((sum, joke) => sum + joke.rating, 0);
        user.averageGivenRating = user.ratedJokes.length > 0 ? totalUserRating / user.ratedJokes.length : 0;
        
        await user.save();
      }
    } else {
      // Legg til ny vurdering
      vits.ratings.push({
        userId,
        rating,
        timestamp: new Date()
      });

      // Oppdater brukerens historikk
      const user = await User.findOne({ userId });
      if (user) {
        user.ratedJokes.push({
          jokeId: id,
          rating,
          timestamp: new Date()
        });
        user.totalRatings = user.ratedJokes.length;
        
        // Beregn ny gjennomsnittlig rating for brukeren
        const totalUserRating = user.ratedJokes.reduce((sum, joke) => sum + joke.rating, 0);
        user.averageGivenRating = totalUserRating / user.totalRatings;
        
        await user.save();
      }
    }

    // Beregn ny gjennomsnittsrating
    const totalRatings = vits.ratings.length;
    const totalScore = vits.ratings.reduce((sum, r) => sum + r.rating, 0);
    vits.averageRating = totalRatings > 0 ? totalScore / totalRatings : 0;
    vits.totalRatings = totalRatings;

    await vits.save();

    res.json({
      message: 'Vurdering lagret',
      averageRating: vits.averageRating,
      totalRatings: vits.totalRatings,
      userRating: rating
    });

  } catch (error) {
    console.error('Feil ved vurdering av vits:', error);
    res.status(500).json({ 
      error: 'Kunne ikke lagre vurdering', 
      message: 'Prøv igjen senere' 
    });
  }
});

/**
 * GET /api/joke/top
 * Henter de best vurderte vitsene
 */
router.get('/top', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const topJokes = await Joke.find({ totalRatings: { $gte: 3 } })
      .sort({ averageRating: -1, totalRatings: -1 })
      .limit(limit)
      .select('jokeId type setup punchline averageRating totalRatings');

    res.json(topJokes);
  } catch (error) {
    console.error('Feil ved henting av topp-vitser:', error);
    res.status(500).json({ 
      error: 'Kunne ikke hente topp-vitser', 
      message: 'Prøv igjen senere' 
    });
  }
});

module.exports = router; 
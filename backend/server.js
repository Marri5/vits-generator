require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Sikkerhetstiltak
app.use(helmet());

// Rate limiting for å beskytte mot DDoS-angrep
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutter
  max: 100 // maks 100 requests per IP
});
app.use('/api/', limiter);

// CORS-konfigurasjon - kun tillat frontend IP
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://10.12.91.55:3000',
  credentials: true
}));

app.use(express.json());

// MongoDB-tilkobling - lytt kun på intern IP
mongoose.connect(`mongodb://10.12.91.66:27017/vits-generator`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Koblet til MongoDB'))
.catch(err => console.error('❌ MongoDB tilkoblingsfeil:', err));

// Database schema for vits-vurderinger
const vitsSchema = new mongoose.Schema({
  jokeId: { type: Number, required: true, unique: true },
  type: String,
  setup: { type: String, required: true },
  punchline: { type: String, required: true },
  ratings: [{
    rating: { type: Number, min: 1, max: 5, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

// Indekser for raskere søk
vitsSchema.index({ jokeId: 1 });
vitsSchema.index({ averageRating: -1 });

const Vits = mongoose.model('Vits', vitsSchema);

// API Endepunkter

/**
 * GET /api/joke/random
 * Henter en tilfeldig vits fra eksternt API
 */
app.get('/api/joke/random', async (req, res) => {
  try {
    const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
    const joke = response.data;

    // Sjekk om vitsen allerede finnes i databasen
    let existingJoke = await Vits.findOne({ jokeId: joke.id });
    
    if (existingJoke) {
      // Returner vitsen med eksisterende vurderingsdata
      res.json({
        id: joke.id,
        type: joke.type,
        setup: joke.setup,
        punchline: joke.punchline,
        averageRating: existingJoke.averageRating,
        totalRatings: existingJoke.totalRatings
      });
    } else {
      // Returner ny vits uten vurderingsdata
      res.json({
        id: joke.id,
        type: joke.type,
        setup: joke.setup,
        punchline: joke.punchline,
        averageRating: 0,
        totalRatings: 0
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
app.post('/api/joke/:id/rate', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    // Validering av rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Ugyldig vurdering', 
        message: 'Vurdering må være mellom 1 og 5' 
      });
    }

    // Finn eller opprett vits i databasen
    let vits = await Vits.findOne({ jokeId: id });

    if (!vits) {
      // Hent vitsinfo fra eksternt API hvis den ikke finnes
      try {
        const response = await axios.get(`https://official-joke-api.appspot.com/jokes/${id}`);
        const jokeData = response.data;
        
        vits = new Vits({
          jokeId: id,
          type: jokeData.type,
          setup: jokeData.setup,
          punchline: jokeData.punchline,
          ratings: [],
          averageRating: 0,
          totalRatings: 0
        });
      } catch (error) {
        return res.status(404).json({ 
          error: 'Vits ikke funnet',
          message: 'Kunne ikke finne vitsen du prøver å vurdere'
        });
      }
    }

    // Legg til ny vurdering
    vits.ratings.push({ rating: parseInt(rating) });
    vits.totalRatings = vits.ratings.length;
    
    // Beregn ny gjennomsnittsvurdering
    const sum = vits.ratings.reduce((acc, r) => acc + r.rating, 0);
    vits.averageRating = Math.round((sum / vits.totalRatings) * 100) / 100;

    await vits.save();

    res.json({
      success: true,
      averageRating: vits.averageRating,
      totalRatings: vits.totalRatings,
      message: 'Takk for din vurdering!'
    });

  } catch (error) {
    console.error('Feil ved lagring av vurdering:', error);
    res.status(500).json({ 
      error: 'Kunne ikke lagre vurdering', 
      message: 'Prøv igjen senere' 
    });
  }
});

/**
 * GET /api/jokes/top
 * Henter topp-vurderte vitser
 */
app.get('/api/jokes/top', async (req, res) => {
  try {
    const topJokes = await Vits.find({ totalRatings: { $gt: 0 } })
      .sort({ averageRating: -1 })
      .limit(10)
      .select('jokeId setup punchline averageRating totalRatings');

    res.json(topJokes);
  } catch (error) {
    console.error('Feil ved henting av topp-vitser:', error);
    res.status(500).json({ 
      error: 'Kunne ikke hente topp-vitser',
      message: 'Prøv igjen senere'
    });
  }
});

/**
 * GET /api/stats
 * Henter statistikk over alle vurderinger
 */
app.get('/api/stats', async (req, res) => {
  try {
    const totalJokes = await Vits.countDocuments();
    const totalRatings = await Vits.aggregate([
      { $group: { _id: null, total: { $sum: '$totalRatings' } } }
    ]);
    
    const avgRating = await Vits.aggregate([
      { $match: { totalRatings: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$averageRating' } } }
    ]);

    res.json({
      totalJokes: totalJokes,
      totalRatings: totalRatings[0]?.total || 0,
      overallAverageRating: Math.round((avgRating[0]?.avg || 0) * 100) / 100
    });
  } catch (error) {
    console.error('Feil ved henting av statistikk:', error);
    res.status(500).json({ 
      error: 'Kunne ikke hente statistikk',
      message: 'Prøv igjen senere'
    });
  }
});

// Helsesjekk endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Feilhåndtering
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Intern serverfeil',
    message: 'Noe gikk galt på serveren'
  });
});

// Start server - lytt kun på backend IP
app.listen(PORT, '10.12.91.44', () => {
  console.log(`🚀 Backend kjører på http://10.12.91.44:${PORT}`);
  console.log('📝 API dokumentasjon tilgjengelig i /docs/API.md');
}); 
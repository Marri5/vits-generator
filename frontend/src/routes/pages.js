const express = require('express');
const axios = require('axios');

const router = express.Router();

// Backend API URL
const API_URL = process.env.API_URL || 'http://10.12.91.44:3001';

// Authentication middleware - sjekker om bruker er logget inn
const requireAuth = async (req, res, next) => {
  // Vi sjekker auth via frontend session/cookie som sendes til backend
  const authToken = req.cookies?.authToken;
  
  if (!authToken) {
    return res.redirect('/login');
  }
  
  try {
    // Verifiser token med backend
    const response = await axios.get(`${API_URL}/api/user/verify`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    req.user = response.data.user;
    next();
  } catch (error) {
    // Token er ugyldig eller utløpt
    res.clearCookie('authToken');
    res.redirect('/login');
  }
};

// Login side - åpen for alle
router.get('/login', (req, res) => {
  res.render('login');
});

// Register side - åpen for alle
router.get('/registrer', (req, res) => {
  res.render('register');
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.redirect('/login');
});

// Hovedside - krever autentisering
router.get('/', requireAuth, async (req, res) => {
  try {
    res.render('index', { 
      title: 'Vits-Generator',
      apiUrl: API_URL
    });
  } catch (error) {
    console.error('Feil ved rendering av hovedside:', error);
    res.status(500).send('Intern serverfeil');
  }
});

// Topp-vitser side - krever autentisering
router.get('/topp-vitser', requireAuth, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/joke/top`);
    res.render('top-jokes', { 
      title: 'Topp Vitser',
      jokes: response.data
    });
  } catch (error) {
    console.error('Feil ved henting av topp-vitser:', error);
    res.render('top-jokes', { 
      title: 'Topp Vitser',
      jokes: [],
      error: 'Kunne ikke hente topp-vitser'
    });
  }
});

// Statistikk side - krever autentisering
router.get('/statistikk', requireAuth, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/stats`);
    res.render('stats', { 
      title: 'Statistikk',
      stats: response.data
    });
  } catch (error) {
    console.error('Feil ved henting av statistikk:', error);
    res.render('stats', { 
      title: 'Statistikk',
      stats: null,
      error: 'Kunne ikke hente statistikk'
    });
  }
});

// Brukerhistorikk - krever autentisering
router.get('/min-historikk', requireAuth, async (req, res) => {
  try {
    // Send cookies til backend
    const headers = {
      Cookie: req.headers.cookie || ''
    };
    
    const response = await axios.get(`${API_URL}/api/user/history`, { headers });
    res.render('history', { 
      title: 'Min vurderingshistorikk',
      history: response.data
    });
  } catch (error) {
    console.error('Feil ved henting av historikk:', error);
    res.render('history', { 
      title: 'Min vurderingshistorikk',
      history: null,
      error: 'Kunne ikke hente historikk'
    });
  }
});

// Brukerveiledning - krever autentisering
router.get('/hjelp', requireAuth, (req, res) => {
  res.render('help', { 
    title: 'Brukerveiledning'
  });
});

module.exports = router; 
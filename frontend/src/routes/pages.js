const express = require('express');
const axios = require('axios');

const router = express.Router();

// Backend API URL
const API_URL = process.env.API_URL || 'http://10.12.91.44:3001';

// Hovedside
router.get('/', async (req, res) => {
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

// Topp-vitser side
router.get('/topp-vitser', async (req, res) => {
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

// Statistikk side
router.get('/statistikk', async (req, res) => {
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

// Brukerhistorikk
router.get('/min-historikk', async (req, res) => {
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

// Brukerveiledning
router.get('/hjelp', (req, res) => {
  res.render('help', { 
    title: 'Brukerveiledning'
  });
});

module.exports = router; 
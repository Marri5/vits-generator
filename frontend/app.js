require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const PORT = process.env.PORT || 3000;

// Sett opp EJS som view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Bruk layouts
app.use(expressLayouts);
app.set('layout', 'layout');

// Statiske filer
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Backend API URL
const API_URL = process.env.API_URL || 'http://10.12.91.44:3001';

// Hovedside
app.get('/', async (req, res) => {
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
app.get('/topp-vitser', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/jokes/top`);
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
app.get('/statistikk', async (req, res) => {
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

// Brukerveiledning
app.get('/hjelp', (req, res) => {
  res.render('help', { 
    title: 'Brukerveiledning'
  });
});

// 404 håndtering
app.use((req, res) => {
  res.status(404).render('404', { 
    title: '404 - Siden finnes ikke'
  });
});

// Start server - lytt kun på frontend IP
app.listen(PORT, '10.12.91.55', () => {
  console.log(`🚀 Frontend kjører på http://10.12.91.55:${PORT}`);
}); 
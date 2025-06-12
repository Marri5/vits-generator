const express = require('express');
const axios = require('axios');

const router = express.Router();

// Backend API URL
const API_URL = process.env.API_URL || 'http://10.12.91.44:3001';

// Authentication middleware - sjekker om bruker er logget inn
// Siden vi ikke har tilgang til localStorage på server-side, må vi la klienten håndtere auth
const requireAuth = async (req, res, next) => {
  // For server-side rendering, kan vi ikke sjekke JWT direkte
  // La klienten håndtere redirect hvis ikke autentisert
  next();
};

// Login side - åpen for alle
router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Logg inn - Vits Generator'
  });
});

// Register side - åpen for alle
router.get('/registrer', (req, res) => {
  res.render('register', {
    title: 'Registrer deg - Vits Generator'
  });
});

// Logout - må håndteres på klient-siden
router.get('/logout', (req, res) => {
  // Send en side som fjerner localStorage og redirecter
  res.send(`
    <html>
      <body>
        <script>
          localStorage.removeItem('authToken');
          localStorage.removeItem('username');
          window.location.href = '/login';
        </script>
      </body>
    </html>
  `);
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
  // Send en side som henter data på klient-siden
  res.render('top-jokes', { 
    title: 'Topp Vitser',
    jokes: null, // Data hentes på klient-siden
    apiUrl: API_URL
  });
});



// Brukerhistorikk - krever autentisering
router.get('/min-historikk', requireAuth, async (req, res) => {
  // Server-side kan ikke hente JWT fra localStorage
  // Send en side som henter data på klient-siden
  res.render('history', { 
    title: 'Min vurderingshistorikk',
    history: null, // Data hentes på klient-siden
    apiUrl: API_URL
  });
});

// Brukerveiledning - krever autentisering
router.get('/hjelp', requireAuth, (req, res) => {
  res.render('help', { 
    title: 'Brukerveiledning'
  });
});

module.exports = router; 
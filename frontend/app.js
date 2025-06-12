require('dotenv').config();
const express = require('express');

// Import konfigurasjonsmoduler
const { setupExpress } = require('./src/config/express');

// Import routes
const pageRoutes = require('./src/routes/pages');

const app = express();
const PORT = process.env.PORT || 3000;

// Sett opp Express
setupExpress(app);

// Routes
app.use('/', pageRoutes);

// 404 håndtering
app.use((req, res) => {
  res.status(404).render('404', { 
    title: '404 - Siden finnes ikke'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Uventet feil:', err);
  res.status(500).render('error', { 
    title: 'Feil',
    error: 'Intern serverfeil' 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend server kjører på port ${PORT}`);
  console.log(`🔗 Tilgjengelig på: http://10.12.91.55:${PORT}`);
}); 
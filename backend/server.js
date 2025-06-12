require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');

// Import konfigurasjonsmoduler
const { connectDatabase } = require('./src/config/database');
const { setupSecurity } = require('./src/middleware/security');

// Import routes
const jokeRoutes = require('./src/routes/jokes');
const userRoutes = require('./src/routes/users');
const statsRoutes = require('./src/routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

// Koble til database
connectDatabase();

// Sett opp sikkerhetstiltak
setupSecurity(app);

// Cookie parser
app.use(cookieParser());

// Body parser
app.use(express.json());

// Routes
app.use('/api/joke', jokeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/stats', statsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Vits Generator Backend'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Endepunkt ikke funnet',
    message: `Ruten ${req.originalUrl} eksisterer ikke`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Uventet feil:', err);
  res.status(500).json({ 
    error: 'Intern serverfeil', 
    message: 'Noe gikk galt på serveren'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server kjører på port ${PORT}`);
  console.log(`🔗 Tilgjengelig på: http://10.12.91.44:${PORT}`);
}); 
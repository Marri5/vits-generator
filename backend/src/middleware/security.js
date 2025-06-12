const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Sikkerhetstiltak
const setupSecurity = (app) => {
  // Helmet for diverse sikkerhetstiltak
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
};

module.exports = { setupSecurity }; 
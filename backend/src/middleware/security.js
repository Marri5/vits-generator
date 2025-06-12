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

  // CORS-konfigurasjon - tillat både med og uten port
  const allowedOrigins = [
    'http://10.12.91.55',
    'http://10.12.91.55:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  app.use(cors({
    origin: function(origin, callback) {
      // Tillat requests uten origin (f.eks. fra Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
};

module.exports = { setupSecurity }; 
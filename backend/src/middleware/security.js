const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Sikkerhetstiltak
const setupSecurity = (app) => {
  // CORS må settes FØR andre middleware som helmet
  // CORS-konfigurasjon - tillat både med og uten port
  console.log('FRONTEND_URL fra .env:', process.env.FRONTEND_URL);
  
  const allowedOrigins = [
    'http://10.12.91.55',
    'http://10.12.91.55:3000',
    'http://eksamen.wendigo.ikt-fag.no',
    'https://eksamen.wendigo.ikt-fag.no',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  console.log('Tillatte CORS origins:', allowedOrigins);

  app.use(cors({
    origin: function(origin, callback) {
      // Tillat requests uten origin (f.eks. fra Postman, server-side requests)
      if (!origin) return callback(null, true);
      
      // Sjekk om origin er tillatt
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS blokkert for origin: ${origin}`);
        console.log('Tillatte origins:', allowedOrigins);
        // Returner false istedenfor Error for bedre håndtering
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie']
  }));
  
  // Helmet for diverse sikkerhetstiltak - ETTER CORS
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // Rate limiting for å beskytte mot DDoS-angrep
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutter
    max: 100 // maks 100 requests per IP
  });
  app.use('/api/', limiter);
};

module.exports = { setupSecurity }; 
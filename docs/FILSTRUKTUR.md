# Filstruktur - Vits Generator

## Oversikt
Prosjektet er nå reorganisert i en mer modulær og vedlikeholdbar struktur.

## Backend (`/backend/`)

```
backend/
├── server.js                 # Hovedserverfil (strømlinjeformet)
├── package.json
├── .env
├── .env.example
└── src/
    ├── config/
    │   └── database.js        # MongoDB tilkoblingslogikk
    ├── middleware/
    │   ├── auth.js           # Bruker-autentisering og cookie-håndtering
    │   └── security.js       # Sikkerhetstiltak (CORS, rate limiting, helmet)
    ├── models/
    │   ├── Joke.js           # Mongoose schema for vitser
    │   └── User.js           # Mongoose schema for brukere
    └── routes/
        ├── jokes.js          # API-endepunkter for vitser
        ├── users.js          # API-endepunkter for brukere
        └── stats.js          # API-endepunkter for statistikk
```

### Hovedkomponenter:

#### Server.js
- Minimalistisk hovedfil som setter opp Express-appen
- Importerer og bruker modulære komponenter
- Globale error handlers og middleware

#### Config
- `database.js`: Håndterer MongoDB-tilkobling

#### Middleware
- `auth.js`: Bruker-autentisering med cookies og UUID-generering
- `security.js`: Sikkerhetstiltak som Helmet, CORS, rate limiting

#### Models
- `Joke.js`: Database schema for vitser med ratings
- `User.js`: Database schema for bruker-tracking

#### Routes
- `jokes.js`: `/api/joke/*` endepunkter (random, rate, top)
- `users.js`: `/api/user/*` endepunkter (history)
- `stats.js`: `/api/stats` endepunkter

## Frontend (`/frontend/`)

```
frontend/
├── app.js                    # Hovedserverfil (strømlinjeformet)
├── package.json
├── .env
├── .env.example
├── src/
│   ├── config/
│   │   └── express.js        # Express konfigurasjon (EJS, static files)
│   └── routes/
│       └── pages.js          # Alle side-ruter samlet
├── views/                    # EJS templates (uendret)
│   ├── layout.ejs
│   ├── index.ejs
│   ├── top-jokes.ejs
│   ├── stats.ejs
│   ├── history.ejs
│   ├── help.ejs
│   └── 404.ejs
└── public/                   # Statiske filer (uendret)
    ├── css/
    │   └── style.css
    └── js/
        └── main.js
```

### Hovedkomponenter:

#### App.js
- Minimalistisk hovedfil som setter opp Express-appen
- Importerer konfigurasjonsmoduler og ruter

#### Config
- `express.js`: Setter opp EJS, static files, body parsing, cookies

#### Routes
- `pages.js`: Alle frontend side-ruter (/, /topp-vitser, /statistikk, etc.)

## Fordeler med ny struktur

### 🏗️ Modularitet
- Hver fil har et klart ansvar
- Lettere å finne og vedlikeholde kode
- Enklere testing av individuelle komponenter

### 📦 Gjenbrukbarhet
- Middleware kan gjenbrukes på tvers av ruter
- Models er klart separert fra forretningslogikk
- Konfigurasjon er sentralisert

### 🔧 Vedlikeholdbarhet
- Mindre filer som er lettere å forstå
- Tydelig separasjon av bekymringer
- Enklere å legge til nye funksjoner

### 🧪 Testbarhet
- Hver modul kan testes isolert
- Enklere mocking av avhengigheter
- Klarere test-struktur

### 👥 Teamarbeid
- Flere utviklere kan jobbe på forskjellige deler samtidig
- Mindre merge-konflikter
- Tydeligere code review

## Migrering fra gammel struktur

Endringene er bakoverkompatible - alle API-endepunkter og funksjonalitet fungerer som før, men koden er nå bedre organisert og lettere å vedlikeholde. 
# API Dokumentasjon - Vits-Generator

## Oversikt

Vits-Generator API tilbyr endepunkter for å hente vitser, lagre vurderinger og hente statistikk. APIet er bygget med Express.js og bruker MongoDB for datalagring.

**Base URL**: `http://10.12.91.44:3001/api`

## Autentisering

APIet bruker cookie-basert brukeridentifikasjon:
- **Cookie navn**: `userId`
- **Varighet**: 1 år
- **Type**: HttpOnly, Secure (i produksjon), SameSite=strict
- Automatisk generert UUID hvis ikke eksisterer
- Ingen personlig informasjon lagres

Sikkerhetstiltak:
- Rate limiting: Maks 100 requests per 15 minutter per IP
- CORS: Kun tillatt fra frontend IP (10.12.91.55)
- Helmet.js for sikkerhetshoder

## Endepunkter

### 1. Hent tilfeldig vits

Henter en tilfeldig vits fra eksternt API og returnerer den med eventuell vurderingsdata.

**Endpoint**: `GET /api/joke/random`

**Response**:
```json
{
  "id": 123,
  "type": "general",
  "setup": "Why don't scientists trust atoms?",
  "punchline": "Because they make up everything!",
  "averageRating": 4.2,
  "totalRatings": 15,
  "userRating": 4
}
```

**Felter**:
- `userRating`: Brukerens tidligere vurdering (null hvis ikke vurdert)

**Statuskoder**:
- `200 OK`: Vellykket respons
- `500 Internal Server Error`: Serverfeil

**Eksempel**:
```bash
curl http://10.12.91.44:3001/api/joke/random
```

### 2. Vurder en vits

Lagrer en vurdering for en spesifikk vits.

**Endpoint**: `POST /api/joke/:id/rate`

**URL-parametere**:
- `id` (number): ID til vitsen som skal vurderes

**Request Body**:
```json
{
  "rating": 5
}
```

**Validering**:
- `rating` må være et tall mellom 1 og 5

**Response**:
```json
{
  "success": true,
  "averageRating": 4.5,
  "totalRatings": 16,
  "message": "Takk for din vurdering!"
}
```

**Statuskoder**:
- `200 OK`: Vurdering lagret
- `400 Bad Request`: Ugyldig vurdering
- `404 Not Found`: Vits ikke funnet
- `500 Internal Server Error`: Serverfeil

**Eksempel**:
```bash
curl -X POST http://10.12.91.44:3001/api/joke/123/rate \
  -H "Content-Type: application/json" \
  -d '{"rating": 4}'
```

### 3. Hent topp-vurderte vitser

Returnerer de 10 beste vitsene basert på gjennomsnittsvurdering.

**Endpoint**: `GET /api/jokes/top`

**Response**:
```json
[
  {
    "_id": "607f1f77bcf86cd799439011",
    "jokeId": 123,
    "setup": "Why don't scientists trust atoms?",
    "punchline": "Because they make up everything!",
    "averageRating": 4.8,
    "totalRatings": 25
  },
  // ... flere vitser
]
```

**Statuskoder**:
- `200 OK`: Vellykket respons
- `500 Internal Server Error`: Serverfeil

**Eksempel**:
```bash
curl http://10.12.91.44:3001/api/jokes/top
```

### 4. Hent statistikk

Returnerer aggregert statistikk for alle vitser og vurderinger.

**Endpoint**: `GET /api/stats`

**Response**:
```json
{
  "totalJokes": 150,
  "totalRatings": 1234,
  "overallAverageRating": 3.7
}
```

**Statuskoder**:
- `200 OK`: Vellykket respons
- `500 Internal Server Error`: Serverfeil

**Eksempel**:
```bash
curl http://10.12.91.44:3001/api/stats
```

### 5. Brukerhistorikk

Henter brukerens vurderingshistorikk basert på cookie.

**Endpoint**: `GET /api/user/history`

**Response**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "history": [
    {
      "jokeId": 123,
      "setup": "Why don't scientists trust atoms?",
      "punchline": "Because they make up everything!",
      "userRating": 4,
      "averageRating": 4.2,
      "totalRatings": 15,
      "ratedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "totalRatings": 10,
  "averageGivenRating": 3.8
}
```

**Statuskoder**:
- `200 OK`: Vellykket respons
- `500 Internal Server Error`: Serverfeil

**Eksempel**:
```bash
curl http://10.12.91.44:3001/api/user/history \
  -H "Cookie: userId=550e8400-e29b-41d4-a716-446655440000"
```

### 6. Helsesjekk

Sjekker om APIet er tilgjengelig og MongoDB-tilkoblingen fungerer.

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "mongodb": "connected"
}
```

**Statuskoder**:
- `200 OK`: Tjenesten kjører normalt
- `500 Internal Server Error`: Tjenesten har problemer

**Eksempel**:
```bash
curl http://10.12.91.44:3001/api/health
```

## Feilhåndtering

Alle feilresponser følger samme format:

```json
{
  "error": "Kort beskrivelse av feilen",
  "message": "Brukervennlig feilmelding"
}
```

## Rate Limiting

APIet implementerer rate limiting for å beskytte mot misbruk:
- **Grense**: 100 requests per 15 minutter
- **Scope**: Per IP-adresse
- **Headers**: Inkluderer `X-RateLimit-*` headers i responsen

Når grensen er nådd:
```json
{
  "error": "Too many requests",
  "message": "For mange forespørsler. Prøv igjen senere."
}
```

## CORS Policy

APIet tillater kun requests fra frontend-serveren og produksjonsdomenet:
- **Tillatt origin**: `http://10.12.91.55:3000`, `http://eksamen.wendigo.ikt-fag.no`, `https://eksamen.wendigo.ikt-fag.no`
- **Tillatte metoder**: GET, POST, PUT, DELETE, OPTIONS
- **Credentials**: Støttet

## Database Schema

### Vits-modell

```javascript
{
  jokeId: Number,          // Unik ID fra eksternt API
  type: String,            // Kategori (general, knock-knock, etc.)
  setup: String,           // Oppsettet til vitsen
  punchline: String,       // Punchline
  ratings: [{              // Array med alle vurderinger
    userId: String,        // Bruker-ID fra cookie
    rating: Number,        // 1-5
    timestamp: Date        // Når vurderingen ble gitt
  }],
  averageRating: Number,   // Beregnet gjennomsnitt
  totalRatings: Number,    // Totalt antall vurderinger
  createdAt: Date,         // Når vitsen ble lagret
  updatedAt: Date          // Sist oppdatert
}
```

### Bruker-modell

```javascript
{
  userId: String,          // UUID generert av backend
  ratedJokes: [{           // Array med vurderte vitser
    jokeId: Number,        // ID til vitsen
    rating: Number,        // Brukerens vurdering (1-5)
    timestamp: Date        // Når vurderingen ble gitt
  }],
  totalRatings: Number,    // Totalt antall vurderinger
  averageGivenRating: Number, // Gjennomsnitt av alle brukerens vurderinger
  createdAt: Date,         // Når brukeren ble opprettet
  updatedAt: Date          // Sist oppdatert
}
```

## Eksempel-integrasjon

### JavaScript/Fetch
```javascript
// Hent tilfeldig vits
const response = await fetch('http://10.12.91.44:3001/api/joke/random');
const joke = await response.json();

// Vurder vits
const ratingResponse = await fetch(`http://10.12.91.44:3001/api/joke/${joke.id}/rate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ rating: 4 })
});
```

### Axios
```javascript
// Hent topp-vitser
const { data } = await axios.get('http://10.12.91.44:3001/api/jokes/top');

// Hent statistikk
const stats = await axios.get('http://10.12.91.44:3001/api/stats');
```

## Vedlikehold og Overvåking

### Logging
- Alle API-kall logges med tidsstempel
- Feil logges med full stack trace
- MongoDB-tilkoblingsstatus overvåkes

### Ytelse
- Indekser på `jokeId` og `averageRating` for rask søking
- Caching av statistikk-queries vurderes ved høy trafikk

### Backup
- MongoDB bør sikkerhetskopieres regelmessig
- Eksporter viktige data før oppgraderinger 
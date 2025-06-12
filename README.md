# Vits-Generator

En nettbasert applikasjon for å hente, vise og vurdere vitser. Applikasjonen henter vitser fra et eksternt API og lar brukere gi vurderinger fra 1 til 5 stjerner.

## 🚀 Funksjoner

- **Hent tilfeldige vitser** fra eksternt API
- **Vurder vitser** med 1-5 stjerner
- **Se gjennomsnittsvurdering** for hver vits
- **Topp-vitser** - Se de best vurderte vitsene
- **Statistikk** - Oversikt over alle vurderinger
- **Universell utforming** - Tilgjengelig for alle
- **Responsivt design** - Fungerer på alle enheter

## 📋 Systemkrav

- Node.js v14 eller nyere
- MongoDB v5.0 eller nyere
- 3 separate VM-er med følgende IP-adresser:
  - Frontend: 10.12.91.55
  - Backend: 10.12.91.44
  - MongoDB: 10.12.91.66

## 🛠 Installasjon

### 1. MongoDB Server (10.12.91.66)

```bash
# Installer MongoDB
sudo apt update
sudo apt install mongodb-org

# Konfigurer MongoDB til å lytte på intern IP
sudo nano /etc/mongod.conf
# Endre bindIp til: 10.12.91.66

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Backend Server (10.12.91.44)

```bash
# Klon repository
git clone [repository-url]
cd vits-generator/backend

# Installer dependencies
npm install

# Sett miljøvariabler
cp .env.example .env
nano .env

# Start backend
npm start

# For produksjon med PM2
npm install -g pm2
pm2 start server.js --name vits-backend
pm2 save
pm2 startup
```

### 3. Frontend Server (10.12.91.55)

```bash
# Gå til frontend-mappen
cd vits-generator/frontend

# Installer dependencies
npm install

# Sett miljøvariabler
cp .env.example .env
nano .env

# Start frontend
npm start

# For produksjon med PM2
pm2 start app.js --name vits-frontend
pm2 save
```

## 🔧 Konfigurasjon

### Brannmurregler

Se `docs/firewall-setup.sh` for komplette brannmurregler.

### SSL/HTTPS

For produksjon, installer Let's Encrypt sertifikater:
```bash
sudo apt install certbot
sudo certbot certonly --standalone -d [ditt-domene]
```

## 📚 Dokumentasjon

- [API Dokumentasjon](docs/API.md)
- [Arkitektur](docs/ARCHITECTURE.md)
- [Sikkerhet](docs/SECURITY.md)
- [Brukerveiledning](http://10.12.91.55:3000/hjelp)

## 🧪 Testing

```bash
# Backend tester
cd backend
npm test

# Sikkerhetssjekk
npm audit
npm run security-check
```

## 📊 Overvåking

### Helsesjekk
- Frontend: http://10.12.91.55:3000/
- Backend API: http://10.12.91.44:3001/api/health
- MongoDB: Bruk `mongo` CLI på database-serveren

### Logger
- Frontend: `pm2 logs vits-frontend`
- Backend: `pm2 logs vits-backend`
- MongoDB: `/var/log/mongodb/mongod.log`

## 🚨 Feilsøking

Se [Brukerveiledning](http://10.12.91.55:3000/hjelp#feilsoking) for vanlige problemer og løsninger.

## 🛡 Sikkerhet

Systemet implementerer flere sikkerhetstiltak:
- Rate limiting
- Input-validering
- CORS-restriksjoner
- Nettverksisolasjon
- Sikkerhetshoder

Se [SECURITY.md](docs/SECURITY.md) for detaljer.

## 📝 Lisens

Dette prosjektet er utviklet for undervisningsformål.

## 👥 Bidragsytere

- [Ditt navn]

## 📞 Support

Ved problemer, se dokumentasjonen eller kontakt systemadministrator.

# Site URL: <http://13.63.139.190>

## Drift (Docker Compose + nginx)

Allt körs som containrar på en Fedora EC2-instans: `web` (Next.js), `api` (Express), `db` (PostgreSQL 18) och `nginx` som exponerar sajten på port 80 — ingen port behövs i webbläsaren.

## Database

PostgreSQL 18 i `db`-containern med bestående volymen `pgdata`. Tabellerna (`users`, `accounts`, `sessions`) skapas av `database/init.sql` vid första start (och av backendens `CREATE TABLE IF NOT EXISTS` som backup). Databasanvändaren äger databasen, så inga manuella GRANT behövs. Data överlever omstarter via volymen.

### Skapa en Banksajt och publicera på aws

I dagens uppgift ska vi öva på att skapa en react-sajt med backend i express och publicera den på en ec2 instans i aws.

### Data i backend

I bankens backend finns tre databastabeller i PostgreSQL: `users` för användare, `accounts` för bankkonton och `sessions` för engångslösenord. (Lokala tester kör in-memory fallback utan PostgreSQL.)

**Users**
Varje användare har ett id, ett användarnamn och ett lösenord.

```
[{id: 101, username: "Joe", password: "hemligt" }, ...]
```

**Accounts**
Varje bankkonto har ett id, ett användarid och ett saldo.

```
[{id: 1, userId: 101, amount: 200 }, ...]
```

**Sessions**
När en användare loggar in skapas ett engångslösenord. Engångslösenordet och användarid läggs i sessions arrayen.

```
[{userId: 101, token: "nwuefweufh" }, ...]
```

### Sidor på sajten

Banken har följande sidor på sin sajt:

**Landningssida**
Ska innehålla navigering med länkar till Hem, logga in och skapa användare och en hero-section med knapp till skapa användare

**Skapa användare**
Ett fält för användarnamn och ett för lösenord. Datat ska sparas i arrayen users i backend och ett bankkonto skapas i backend med 0 kr som saldo.

**Logga in**
Ett fält för användarnamn och ett för lösenord och en logga in knapp. När man klickat på knappen ska man få tillbaka sitt engångslösenord i response och skickas till kontosidan med useRouter.

**Kontosida**
Här kan man se sitt saldo och sätta in pengar på kontot. För att göra detta behöver man skicka med sitt engångslösenord till backend.

## Hur du klarar uppgiften

1. Klicka på knappen i uppgfiten för att kopiera repot till ditt github-konto
1. Klona repot till din dator med `git clone ...`

### Skapa frontend

1. Skriv `npx create-next-app frontend`.
1. Gå in i projektet: `cd frontend`.

### Skapa backend

1. Backa en nivå med `cd ..`.
1. Skapa en folder: backend och gå med `cd` in i foldern.
1. Skriv `npm init` och tryck Enter på alla frågor.
1. Lägg till `"type": "module"`i package.json
1. I scripts i package.json lägg till: `"start": "node server.js", "dev": "nodemon server.js"`
1. Installera dependencies: `npm i express cors body-parser`
1. Installera nodemon som dev dependency: `npm i -D nodemon`
1. Börja skriva kod i `server.js`

### Endpoints och arrayer

1. I backend skapa tre tomma arrayer: `users`, `accounts` och `sessions`.
1. Skapa endpoints för:

- Skapa användare (POST): "/users"
- Logga in (POST): "/sessions"
- Visa salodo (POST): "/me/accounts"
- Sätt in pengar (POST): "/me/accounts/transactions"

______________________________________________________________________

- När man loggar in ska ett engångslösenord skapas och skickas tillbaka i response.
- När man hämtar saldot ska samma engångslösenord skickas med i Post.

### Startkod för server.js i backend

```
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Generera engångslösenord
function generateOTP() {
    // Generera en sexsiffrig numerisk OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
}

// Din kod här. Skriv dina arrayer


// Din kod här. Skriv dina routes:

// Starta servern
app.listen(port, () => {
    console.log(`Bankens backend körs på http://localhost:${port}`);
});

```

### Exempel på fetch för POST i frontend

```
fetch('http://localhost:3001/users', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        username: 'Användarnamn',
        password: 'Lösenord',
    }),
})
.then(response => response.json())
.then(data => console.log(data))
.catch((error) => {
    console.error('Error:', error);
});

```

## Automatiska tester – Filstruktur för godkänt nivå

Repositoryt innehåller automatiska tester som körs med GitHub Actions. För att testerna ska kunna starta och använda din lösning måste du följa strukturen nedan. Du får organisera koden inuti mapparna som du vill.

### Projektstruktur och kommandon

```text
frontend/                 # Next.js-projekt
  package.json
  package-lock.json
backend/                  # Express-projekt
  package.json
  package-lock.json
  server.js
```

- Använd `npm` så att båda projekten innehåller en `package-lock.json`.
- `npm run dev` i `frontend` ska starta Next.js på port `3000`.
- `npm run build` i `frontend` ska bygga projektet utan fel.
- `npm start` i `backend` ska starta Express på port `3001`.
- Frontend ska anropa backend på `http://127.0.0.1:3001`.

### Sidor och formulär

Följande routes ska finnas:

- `/` – landningssida med rubrik, navigation och hero-knapp eller länk.
- `/register` – skapa användare.
- `/login` – logga in.
- `/account` – visa saldo och sätt in pengar.

Alla formulärfält ska ha en kopplad `label` så att de går att hitta med sitt namn. Använd tydliga svenska eller engelska namn, exempelvis `Användarnamn`, `Lösenord` och `Belopp`. Efter en lyckad inloggning ska användaren skickas till `/account`. Saldot ska visas med valutan `kr` eller `SEK` och uppdateras efter en insättning.

### API-format

Alla endpoints tar emot och svarar med JSON. Ett lyckat anrop ska ge en statuskod inom `200`–`299`.

```text
POST /users
Body: { "username": "Joe", "password": "hemligt" }

POST /sessions
Body: { "username": "Joe", "password": "hemligt" }
Response: { "token": "123456" }

POST /me/accounts
Body: { "token": "123456" }
Response: { "amount": 0 }

POST /me/accounts/transactions
Body: { "token": "123456", "amount": 250 }
Response: { "amount": 250 }
```

Engångslösenordet ska vara en sträng med sex siffror. En ogiltig token till `/me/accounts` ska ge status `401` eller `403`.

### Kör samma tester lokalt

Installera först dependencies i alla tre mappar och bygg frontend:

```bash
npm ci --prefix frontend
npm ci --prefix backend
npm ci --prefix tests
cd tests && npx playwright install chromium && cd ..
npm run build --prefix frontend
npm test --prefix tests
```

Testkommandot startar frontend och backend automatiskt och stänger dem efter testkörningen.

## Publicera på aws

1. Överför hela projektet till din ec2-instans med t.ex. `rsync`

1. Logga in på din instans med ssh och gå med cd dit projektet ligger.

1. Installera Node.js om det inte redan är installerat.

1. Navigera till din backend-mapp och starta din server med node server.js.

1. Navigera till din frontend-mapp i ett nytt terminalfönster. Kör följande:

```
npm install
npm run build
npm run start
```

- Testa att det funkar genom att gå till din sajt i en webbläsare.

______________________________________________________________________

### :boom: Success

Efter denna uppgift ska ni kunna skapa en fullstack sajt med api och publicera på aws.

______________________________________________________________________

### :runner: VG - uppgift

everything is run using docker compose on a Fedora EC2 instance (replacing pm2, also slopbuntu is trash): `web` (Next.js), `api` (Express), `db` (PostgreSQL 18), and `nginx`, which exposes the site on port 80.

**Start the server:**

```bash
cp .env.example .env   # fill POSTGRES_PASSWORD + public IP/Domain in NEXT_PUBLIC_API_URL
chmod 600 .env
docker compose up -d --build
```

**services:**

| Tjänst | Port | Status |
| --------------------- | -------- | ----------------------------------- |
| nginx → web (Next.js) | 80 | `docker compose ps` |
| Backend (Express) | 3001 | `docker compose ps` |
| PostgreSQL | internal | `docker compose exec db pg_isready` |

**typical commands:**

```bash
docker compose ps
docker compose logs
docker compose restart api
docker compose down
```

**verify database (data persists, survives restarts):**

```bash
# put money in,restart api, money should be saved/persist
docker compose restart api
```

**Passwords:** handled via a git-ignored `.env` file (see .env.example) no docker secrets directory necessary, but on a larger, more sensitive scale, then it is preferable to migrate away from .env

**link to site:** <http://13.63.139.190>

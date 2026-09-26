<<<<<<< HEAD
Ni har tidigare byggt en bankapplikation med:

en Next.js-frontend

en Express-backend

deployment till EC2

Docker Compose för att köra hela applikationen

I den här uppgiften ska ni automatisera deploymenten med GitHub Actions.

Målet är att gå från:

=======
# ASSIGNMENT UPDATE — Automatisera deployment med GitHub Actions

Ni har tidigare byggt en bankapplikation med:

- en Next.js-frontend
- en Express-backend
- deployment till EC2
- Docker Compose för att köra hela applikationen

I den här uppgiften ska ni automatisera deploymenten med GitHub Actions.

## Målflöde

Gå från:

```text
>>>>>>> feature/containerizing-compose
Ändra kod
↓
Push till GitHub
↓
SSH till EC2
↓
git pull
↓
docker compose up -d --build
<<<<<<< HEAD

till:

=======
```

till:

```text
>>>>>>> feature/containerizing-compose
Ändra kod
↓
Push till main
↓
GitHub Actions
↓
Kontrollera frontend
↓
Kontrollera backend
↓
Deploy till EC2
↓
Docker Compose
↓
Production
<<<<<<< HEAD

Ni ska även lägga till en feature flag för att förstå skillnaden mellan deployment och release.

Mål

Efter uppgiften ska du kunna:

skapa ett GitHub Actions-workflow

trigga ett workflow vid push till main

köra automatiska kontroller på frontend

använda working-directory i GitHub Actions

använda GitHub Secrets

ansluta till EC2 från GitHub Actions

deploya med Docker Compose

förstå skillnaden mellan deployment och release

använda en enkel feature flag

Del 1 – Skapa workflow-filen

Skapa: .github/workflows/deploy.yml

Workflowet ska köras automatiskt när kod pushas till: main

Flödet ska ungefär se ut så här:

=======
```

Ni ska även lägga till en feature flag för att förstå skillnaden mellan deployment och release.

## Mål

Efter uppgiften ska du kunna:

- skapa ett GitHub Actions-workflow
- trigga ett workflow vid push till `main`
- köra automatiska kontroller på frontend
- använda `working-directory` i GitHub Actions
- använda GitHub Secrets
- ansluta till EC2 från GitHub Actions
- deploya med Docker Compose
- förstå skillnaden mellan deployment och release
- använda en enkel feature flag

---

## Del 1 – Skapa workflow-filen

Skapa: `.github/workflows/deploy.yml`

Workflowet ska köras automatiskt när kod pushas till `main`.

Flödet ska ungefär se ut så här:

```text
>>>>>>> feature/containerizing-compose
Push till main
↓
GitHub Actions startar
↓
Kontrollera Next.js
↓
Deploy
<<<<<<< HEAD

Del 2 – Kontrollera Next.js-frontenden

Eftersom Next.js-projektet ligger i mappen: frontend/

måste npm-kommandona köras där.

I GitHub Actions kan ni använda:

working-directory: ./frontend

Frontenden ska minst:

installera dependencies

köra lint

bygga applikationen

Exempel:

=======
```

## Del 2 – Kontrollera Next.js-frontenden

Eftersom Next.js-projektet ligger i mappen `frontend/` måste npm-kommandona köras där.

I GitHub Actions kan ni använda:

```yaml
working-directory: ./frontend
```

Frontenden ska minst:

- installera dependencies
- köra lint
- bygga applikationen

Exempel:

```yaml
>>>>>>> feature/containerizing-compose
- name: Install frontend dependencies
  working-directory: ./frontend
  run: npm ci

- name: Run frontend lint
  working-directory: ./frontend
  run: npm run lint

- name: Build frontend
  working-directory: ./frontend
  run: npm run build
<<<<<<< HEAD

Det är viktigt att använda rätt arbetsmapp eftersom package.json för frontenden ligger i frontend/.

Del 3 – Testa att workflowet kan misslyckas

Skapa medvetet ett fel i frontend eller backend.

Det kan exempelvis vara:

ett ESLint-fel i Next.js

ett TypeScript-fel

ett fel som gör att frontend-builden misslyckas

Pusha till main.

Kolla i Actions-tabben på Github.

Del 4 – GitHub Secrets
=======
```

> Det är viktigt att använda rätt arbetsmapp eftersom `package.json` för frontenden ligger i `frontend/`.

## Del 3 – Testa att workflowet kan misslyckas

Skapa medvetet ett fel i frontend eller backend. Det kan exempelvis vara:

- ett ESLint-fel i Next.js
- ett TypeScript-fel
- ett fel som gör att frontend-builden misslyckas

Pusha till `main` och kolla i Actions-tabben på GitHub.

## Del 4 – GitHub Secrets
>>>>>>> feature/containerizing-compose

För att GitHub Actions ska kunna ansluta till EC2 behöver ni använda GitHub Secrets.

Gå till:

<<<<<<< HEAD
GitHub Repository
→ Settings
→ Secrets and variables
→ Actions

Skapa de secrets som behövs.

Exempel:

HOST
USERNAME
SSH_KEY

Viktigt

Secret-värden får inte skrivas:

i repositoryt

i README

i deploy.yml

i screenshots

Det är däremot okej att dokumentera själva namnen.

Del 5 – Automatisk deployment till EC2
=======
```text
GitHub Repository → Settings → Secrets and variables → Actions
```

Skapa de secrets som behövs. Exempel:

- `HOST`
- `USERNAME`
- `SSH_KEY`

### Viktigt

Secret-värden får inte skrivas:

- i repositoryt
- i README
- i `deploy.yml`
- i screenshots

Det är däremot okej att dokumentera själva namnen.

## Del 5 – Automatisk deployment till EC2
>>>>>>> feature/containerizing-compose

När både frontend och backend har klarat sina kontroller ska GitHub Actions deploya applikationen.

Workflowet ska:

<<<<<<< HEAD
ansluta till EC2 via SSH

gå till projektets mapp

hämta senaste versionen med git pull

bygga om och starta Docker Compose

Deploymenten kan exempelvis göra:

git pull
↓
docker compose up -d --build

I workflow filen kan man använda tex för att köra ssh från github actions.

- name: Run Docker on EC2
  uses: appleboy/ssh-action@master
  with:
  host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
  key: ${{ secrets.SSH_KEY }}
  port: 22
  script: |
  cd /home/ubuntu/dinbanksajt
  git pull
  sudo docker compose down
  sudo docker compose up --build -d

Varför använder vi --build?

Det räcker inte med:

docker compose restart

Det kommandot startar bara om befintliga containers.

Om koden har ändrats behöver Docker-images byggas om:

docker compose up -d --build

Det gör att den nya frontend- och backend-koden faktiskt kommer med i deploymenten.

Del 6 – Kontrollera deploymenten

Efter en lyckad deployment ska ni kontrollera:

att GitHub Actions är grön

att Next.js-frontenden fungerar

att Express-backenden svarar som tidigare

att den senaste versionen av koden körs på EC2

Målet är:

=======
1. ansluta till EC2 via SSH
2. gå till projektets mapp
3. hämta senaste versionen med `git pull`
4. bygga om och starta Docker Compose

Deploymenten kan exempelvis göra:

```text
git pull
↓
docker compose up -d --build
```

I workflow-filen kan man använda t.ex. följande för att köra SSH från GitHub Actions:

```yaml
- name: Run Docker on EC2
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.HOST }}
    username: ${{ secrets.USERNAME }}
    key: ${{ secrets.SSH_KEY }}
    port: 22
    script: |
      cd /home/ubuntu/dinbanksajt
      git pull
      sudo docker compose down
      sudo docker compose up --build -d
```

### Varför använder vi `--build`?

Det räcker inte med:

```bash
docker compose restart
```

Det kommandot startar bara om befintliga containers. Om koden har ändrats behöver Docker-images byggas om:

```bash
docker compose up -d --build
```

Det gör att den nya frontend- och backend-koden faktiskt kommer med i deploymenten.

## Del 6 – Kontrollera deploymenten

Efter en lyckad deployment ska ni kontrollera:

- att GitHub Actions är grön
- att Next.js-frontenden fungerar
- att Express-backenden svarar som tidigare
- att den senaste versionen av koden körs på EC2

Målet är:

```text
>>>>>>> feature/containerizing-compose
git push
↓
GitHub Actions
↓
CI-kontroller
↓
Deployment
↓
Ny version körs på EC2
<<<<<<< HEAD

utan att ni manuellt behöver SSH in och deploya.

VG -Uppgift – Lägg till en feature flag

Lägg till en mindre ny funktion i banken.

Funktionen behöver inte vara avancerad.

Exempel:

en Savings-sektion

en ny dashboard-panel

en informationsruta

en banner

en ny transaktionsvy

Funktionen ska styras av en feature flag.

Exempel:

FEATURE_NEW_DASHBOARD=false

När flaggan är: false

ska funktionen inte visas.

När flaggan är: true

ska funktionen visas.

Deployment är inte samma sak som release

Deploya applikationen med den nya funktionen inkluderad i koden, men med feature flaggen avstängd.

FEATURE_NEW_DASHBOARD=false

Koden finns då i produktion, men användaren ser inte funktionen.

Detta är: Deployment

Aktivera sedan flaggan:

FEATURE_NEW_DASHBOARD=true

Nu blir funktionen tillgänglig.

Detta är: Release

Alltså:

Deployment
= koden finns i produktion

Release
= funktionen görs tillgänglig för användaren

Slutresultat

När uppgiften är klar ska ert flöde ungefär se ut så här:

=======
```

utan att ni manuellt behöver SSH:a in och deploya.

---

## VG-uppgift – Lägg till en feature flag

Lägg till en mindre ny funktion i banken. Funktionen behöver inte vara avancerad. Exempel:

- en Savings-sektion
- en ny dashboard-panel
- en informationsruta
- en banner
- en ny transaktionsvy

Funktionen ska styras av en feature flag. Exempel:

```bash
FEATURE_NEW_DASHBOARD=false
```

- När flaggan är `false` ska funktionen inte visas.
- När flaggan är `true` ska funktionen visas.

### Deployment är inte samma sak som release

Deploya applikationen med den nya funktionen inkluderad i koden, men med feature flaggen avstängd:

```bash
FEATURE_NEW_DASHBOARD=false
```

Koden finns då i produktion, men användaren ser inte funktionen. Detta är **deployment**.

Aktivera sedan flaggan:

```bash
FEATURE_NEW_DASHBOARD=true
```

Nu blir funktionen tillgänglig. Detta är **release**.

Alltså:

- **Deployment** = koden finns i produktion
- **Release** = funktionen görs tillgänglig för användaren

---

## Slutresultat

När uppgiften är klar ska ert flöde ungefär se ut så här:

```text
>>>>>>> feature/containerizing-compose
Developer
│
▼
Push till main
│
▼
.github/workflows/deploy.yml
│
├── FRONTEND
<<<<<<< HEAD
│ ├── npm ci
│ ├── npm run lint
│ └── npm run build
│
=======
│   ├── npm ci
│   ├── npm run lint
│   └── npm run build
>>>>>>> feature/containerizing-compose
│
▼
Checks passed
│
▼
SSH till EC2
│
▼
git pull
│
▼
docker compose up -d --build
│
▼
Production
<<<<<<< HEAD

Feature flaggen styr sedan om den nya funktionen visas:

Feature flag OFF
→ koden är deployad men funktionen visas inte

Feature flag ON
→ funktionen är released
=======
```

Feature flaggen styr sedan om den nya funktionen visas:

- Feature flag OFF → koden är deployad men funktionen visas inte
- Feature flag ON → funktionen är released
>>>>>>> feature/containerizing-compose

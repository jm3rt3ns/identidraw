# IdentiDraw

A real-time multiplayer drawing and guessing game. Players draw their assigned secret animal while trying to guess what others are drawing.

## How It Works

1. **Create or join a lobby** with friends using a 6-digit code, or use matchmaking to find opponents
2. Each player is assigned a **secret animal** to draw
3. Each player also learns **one other player's** secret animal (but cannot guess that player)
4. **Draw your animal** on the canvas while watching others draw theirs
5. **Guess other players' animals** by selecting their name and typing your guess
6. **Win** by being the last player whose animal hasn't been guessed, or by correctly guessing all guessable players

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Socket.IO client, Firebase Auth, Formik + Yup
- **Backend:** Node.js, Express, Socket.IO, Firebase Admin, Prisma + SQLite (Redis optional)
- **Testing:** Vitest, React Testing Library

## Prerequisites

- Node.js 20+
- A Firebase project with Email/Password authentication enabled
- Redis (optional -- only needed when `STORE_TYPE=redis`)

## Local Development

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project
2. Enable **Email/Password** under Authentication > Sign-in method
3. Go to Project settings > Service accounts > Generate new private key (for server)
4. Go to Project settings > General > Your apps > Add a web app (for client config)

### 2. Environment Variables

```bash
# Server
cp server/.env.example server/.env
# Fill in Firebase service account credentials and other values

# Client
cp client/.env.example client/.env
# Fill in Firebase web app config values
```

### 3. (Optional) Start Redis

By default the server uses an **in-memory store** that requires no external services.
If you need Redis (e.g. for multi-instance deployments), set `STORE_TYPE=redis` in
`server/.env` and start Redis:

```bash
docker compose up -d
```

### 4. Install Dependencies & Initialize Database

```bash
# Root (installs concurrently)
npm install

# Server
cd server && npm install && npx prisma migrate dev --name init && cd ..

# Client
cd client && npm install && cd ..
```

### 5. Run Development Servers

```bash
npm run dev
```

This starts both the backend (port 3001) and frontend dev server (port 5173) concurrently. The Vite dev server proxies API and WebSocket requests to the backend.

### 6. Run Tests

```bash
npm test
```

---

## Deploying to DigitalOcean App Platform

This is the simplest production deployment path. The app is packaged as a single Docker container that serves both the API and the built frontend.

### Prerequisites

- A [DigitalOcean](https://www.digitalocean.com/) account
- [doctl](https://docs.digitalocean.com/reference/doctl/) CLI installed
- A DigitalOcean Container Registry (DOCR) created
- (Optional) A managed Redis database on DigitalOcean -- only if using `STORE_TYPE=redis`

### Step-by-step

#### 1. Create a DigitalOcean Container Registry

```bash
doctl registry create identidraw-registry
```

#### 2. (Optional) Create a Managed Redis Database

Skip this step if you are using the default in-memory store (`STORE_TYPE=memory`).

```bash
doctl databases create identidraw-redis --engine redis --size db-s-1vcpu-1gb --region nyc1
```

Note the connection string from the output.

#### 3. Create the App

Create a file `app-spec.yml`:

```yaml
name: identidraw
region: nyc
services:
  - name: web
    image:
      registry_type: DOCR
      repository: identidraw
      tag: latest
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 3001
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3001"
      - key: STORE_TYPE
        value: memory          # change to "redis" and set REDIS_URL to use Redis
      # - key: REDIS_URL
      #   value: "${redis.CONNECTION_URL}"
      #   type: SECRET
      - key: DATABASE_URL
        value: "file:./prod.db"
      - key: FIREBASE_PROJECT_ID
        value: "your-project-id"
        type: SECRET
      - key: FIREBASE_CLIENT_EMAIL
        value: "your-client-email"
        type: SECRET
      - key: FIREBASE_PRIVATE_KEY
        value: "your-private-key"
        type: SECRET
      - key: CORS_ORIGIN
        value: "https://identidraw-xxxxx.ondigitalocean.app"
      # Uncomment below if using STORE_TYPE=redis
      # databases:
      #   - name: redis
      #     engine: REDIS
      #     production: true
```

Deploy:

```bash
doctl apps create --spec app-spec.yml
```

#### 4. Configure GitHub Actions

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

| Secret | Description |
|--------|-------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | DO API token with read/write access |
| `DOCR_REGISTRY` | Your container registry name (e.g., `identidraw-registry`) |
| `DIGITALOCEAN_APP_ID` | The app ID from `doctl apps list` |

Push to `main` to trigger the CI/CD pipeline.

#### 5. Run Database Migration (first deploy)

After the first deployment, run the Prisma migration inside the container:

```bash
# Find the app's component name
doctl apps list

# Open a console session (or SSH in)
# Run: npx prisma migrate deploy
```

### Environment Notes

- **SQLite** works for single-instance deployments. For multi-instance scaling, switch to PostgreSQL by changing the Prisma datasource provider and connection string.
- **Storage** defaults to an in-memory store (`STORE_TYPE=memory`) which is suitable for single-instance / small-scale deployments. For multi-instance deployments, set `STORE_TYPE=redis` and provide a `REDIS_URL` (install `ioredis` with `npm install ioredis`).
- **Firebase** credentials must be set as environment variables. Never commit them to the repository.
- **CORS_ORIGIN** should match your production domain.

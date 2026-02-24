# Nakama Backend (Canonical Local Stack)

This is the canonical local backend for the Royal Game of Ur app.

- Compose file: `/Users/Michel/Desktop/ur/backend/docker-compose.yml`
- Runtime config: `/Users/Michel/Desktop/ur/backend/nakama.yml`
- Runtime module entrypoint loaded by Nakama: `/nakama/data/modules/build/backend/modules/index.js`

## Prerequisites

- Docker + Docker Compose
- Root project dependencies installed (`npm install`)

## Environment

Create `backend/.env` (not committed) from `backend/.env.example`.

```bash
cp backend/.env.example backend/.env
```

Expected values:

- `POSTGRES_PASSWORD`
- `NAKAMA_SOCKET_SERVER_KEY`
- `NAKAMA_HTTP_KEY`

## Build + Run

From repo root:

```bash
npm run build:backend
npm run backend:dev
```

`backend/docker-compose.yml` runs DB migration before server startup:

- `nakama migrate up --database.address "$NAKAMA_DATABASE_ADDRESS"`
- then `nakama --config /nakama/data/nakama.yml`

## Exposed ports

- `7350` Nakama API + socket
- `7351` Nakama console
- `5432` Postgres

## Production deployment (Vercel web clients)

Use the dedicated production stack in `/Users/Michel/Desktop/ur/backend/deploy`.

- Compose file: `/Users/Michel/Desktop/ur/backend/deploy/docker-compose.prod.yml`
- TLS reverse proxy: `/Users/Michel/Desktop/ur/backend/deploy/Caddyfile`
- Env template: `/Users/Michel/Desktop/ur/backend/deploy/env.production.example`

This keeps raw Nakama ports off the public internet and serves Nakama at `https://nakama.<your-domain>` for HTTPS/WSS browser clients.

## Authoritative multiplayer contract

The server runtime uses shared protocol definitions from:

- `/Users/Michel/Desktop/ur/shared/urMatchProtocol.ts`

Core op codes:

- `ROLL_REQUEST`
- `MOVE_REQUEST`
- `STATE_SNAPSHOT`
- `SERVER_ERROR`

The match handler applies game rules authoritatively and broadcasts canonical snapshots.

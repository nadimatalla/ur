# Royal Game of Ur (Expo + Nakama)

This app supports two runtime transport modes:

- `nakama`: online authoritative multiplayer against a local/remote Nakama server.
- `offline`: local gameplay fallback (no backend connection), including local-vs-bot flow.

## Local-First Runbook (iOS simulator)

1. Install dependencies.

```bash
npm install
```

2. Build Nakama runtime module (`backend/modules/build/backend/modules/index.js`).

```bash
npm run build:backend
```

3. Start the canonical local backend stack.

```bash
npm run backend:dev
```

4. In a separate terminal, set Expo env vars for your Nakama server.

```bash
export EXPO_PUBLIC_GAME_TRANSPORT=nakama
export EXPO_PUBLIC_NAKAMA_HOST=207.154.229.39
export EXPO_PUBLIC_NAKAMA_PORT=7350
export EXPO_PUBLIC_NAKAMA_USE_SSL=false
export EXPO_PUBLIC_NAKAMA_SOCKET_SERVER_KEY=<same value as NAKAMA_SOCKET_SERVER_KEY on backend>
# Optional legacy alias (also supported):
# export EXPO_PUBLIC_NAKAMA_SERVER_KEY=<same value as NAKAMA_SOCKET_SERVER_KEY on backend>
export EXPO_PUBLIC_NAKAMA_TIMEOUT_MS=7000
```

5. Run Expo on iOS simulator.

```bash
npx expo start --ios
```

## Vercel + Droplet Production Wiring

For deployed web matchmaking, the browser must connect to Nakama over HTTPS/WSS.
`localhost` does not work for deployed clients.

1. Deploy Nakama behind TLS on your droplet.
2. Point `nakama.<your-domain>` DNS A record to your droplet IP.
3. Use the production deploy stack in `/Users/Michel/Desktop/ur/backend/deploy`.

```bash
cp backend/deploy/env.production.example backend/deploy/env.production
# fill backend/deploy/env.production with real values
npm run backend:prod:up
```

Then set Vercel project env vars (Production and Preview as needed):

```bash
EXPO_PUBLIC_GAME_TRANSPORT=nakama
EXPO_PUBLIC_NAKAMA_HOST=nakama.<your-domain>
EXPO_PUBLIC_NAKAMA_PORT=443
EXPO_PUBLIC_NAKAMA_USE_SSL=true
EXPO_PUBLIC_NAKAMA_SOCKET_SERVER_KEY=<same value as backend NAKAMA_SOCKET_SERVER_KEY>
EXPO_PUBLIC_NAKAMA_TIMEOUT_MS=7000
```

After changing Vercel env vars, trigger a fresh deploy. Expo web reads these at build time.

### Healthcheck

```bash
curl -i https://nakama.<your-domain>/healthcheck
```

Expected: `HTTP/1.1 200` with body `{}`.

## Offline Revert (one line)

If you want to force local/offline mode without touching code:

```bash
export EXPO_PUBLIC_GAME_TRANSPORT=offline
```

## Scripts

- `npm run build:backend`: compile TS Nakama runtime to `backend/modules/build/backend/modules/index.js`
- `npm run backend:up`: build runtime and start backend stack detached
- `npm run backend:dev`: build runtime and start backend stack attached
- `npm run backend:prod:up`: start production TLS stack (`backend/deploy/docker-compose.prod.yml`)
- `npm run backend:prod:logs`: tail production stack logs

## Backend stack reference

Canonical Nakama stack: `/Users/Michel/Desktop/ur/backend/docker-compose.yml`

Production stack (TLS reverse proxy): `/Users/Michel/Desktop/ur/backend/deploy/docker-compose.prod.yml`

Legacy compose file kept for reference only: `/Users/Michel/Desktop/ur/docker-compose-postgres.yml`

# Nakama Production Deploy (TLS on 443)

This stack is for deployed web clients (for example, Vercel) that need HTTPS/WSS access to Nakama.

- Public ports: `80`, `443` (Caddy)
- Internal Nakama API/socket: `nakama:7350`
- Nakama console: `127.0.0.1:7351` (local-only on droplet)

## 1) Prerequisites

- DNS A record: `nakama.<your-domain>` -> droplet IPv4
- Docker + Docker Compose plugin on the droplet
- Repo checked out on the droplet

## 2) Build runtime module

From repo root:

```bash
npm install
npm run build:backend
```

## 3) Configure production env

```bash
cd backend/deploy
cp env.production.example env.production
```

Set real values in `backend/deploy/env.production`:

- `NAKAMA_DOMAIN`
- `POSTGRES_PASSWORD`
- `NAKAMA_SOCKET_SERVER_KEY`
- `NAKAMA_HTTP_KEY`

## 4) Run production stack

```bash
docker compose --env-file env.production -f docker-compose.prod.yml up -d
```

## 5) Firewall guidance

Expose only HTTP/HTTPS publicly. Keep raw Nakama ports private.

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 7350/tcp
sudo ufw deny 7351/tcp
```

## 6) Vercel env wiring

Set the following in Vercel project settings (Production and Preview as needed):

```bash
EXPO_PUBLIC_GAME_TRANSPORT=nakama
EXPO_PUBLIC_NAKAMA_HOST=nakama.<your-domain>
EXPO_PUBLIC_NAKAMA_PORT=443
EXPO_PUBLIC_NAKAMA_USE_SSL=true
EXPO_PUBLIC_NAKAMA_SOCKET_SERVER_KEY=<same value as NAKAMA_SOCKET_SERVER_KEY>
EXPO_PUBLIC_NAKAMA_TIMEOUT_MS=7000
```

After env changes, trigger a fresh Vercel deploy.

## 7) Verification

Healthcheck:

```bash
curl -i https://nakama.<your-domain>/healthcheck
```

Expected: `HTTP/1.1 200` and body `{}`.

App checks:

1. Deployed app no longer shows "Online multiplayer is not configured".
2. Browser network shows successful auth and active `wss://nakama.<your-domain>/...` socket.
3. Two separate clients can queue and get matched.

Negative test:

1. Set a wrong `EXPO_PUBLIC_NAKAMA_SOCKET_SERVER_KEY` in Vercel.
2. Redeploy.
3. Confirm auth/matchmaking fails (key mismatch validation).

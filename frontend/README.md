# Frontend (FE)

## Purpose
- Next.js UI: feed, post page (free/premium preview), purchase flow, decrypt render, contributions UI.
- Wallet connect + signature login.

## Run locally

```bash
cd frontend
cp .env.example .env.local   # set API URL, Reown project id, and app origin (see below)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page is implemented under `src/app/page.tsx` with sections in `src/components/home/`.

### Auth (Reown AppKit + SIWE + Go JWT)

1. Create a Reown Cloud project at [https://dashboard.reown.com](https://dashboard.reown.com) and set `NEXT_PUBLIC_REOWN_PROJECT_ID` in `.env.local` (required for WalletConnect inside AppKit).
2. Set `NEXT_PUBLIC_APP_ORIGIN` to the same origin as backend `SIWE_URI` (e.g. `http://localhost:3000`).
3. Run the Go API with Postgres and matching `SIWE_DOMAIN` / `SIWE_URI` / `SIWE_CHAIN_ID` (see `backend/docs/identity-auth/README.md`). CORS defaults to `SIWE_URI`.
4. In the header, use **AppKit** connect → AppKit runs SIWE against your API (`POST /v1/auth/nonce` with wallet, then `POST /v1/auth/verify`). JWT is stored in `localStorage` as `km_access_token`; SIWE session hints live in `sessionStorage` under `km_siwe_appkit_session`.

Config lives in `src/config/reown-wagmi.ts` (adapter + networks) and `src/config/reown-siwe.ts` (`createSIWEConfig` → KnowMarket API).

## Structure
- `src/app/` — App Router (`layout.tsx`, `page.tsx`, routes)
- `src/config/` — Reown AppKit + SIWE wiring to the Go API
- `src/components/` — Shared UI (layout + home sections)
- `public/` — static assets


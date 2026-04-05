# PriceWise AI

Price comparison app with live retailer scraping, trust scoring, review aggregation, and price alerts.

## Project Structure

- `client/`: React + Vite frontend
- `server/`: Express API + scraper and review services

## Prerequisites

- Node.js 20+
- `SERPAPI_API_KEY` in `server/.env`

## Install

```bash
npm run install:all
```

## Run

```bash
npm run dev
```

This starts:

- frontend at `http://localhost:5173`
- backend at `http://localhost:3001`

## Stability Checks (Permanent Smoke Test)

Run this any time after starting the backend:

```bash
npm run verify:smoke
```

It validates:

- API health endpoint
- search payload shape and live retailer cards
- reviews payload shape and live review entries

Server-only alternative:

```bash
cd server
npm run smoke
```

## Notes

- Unavailable retailer cards are intentionally removed from the main result list.
- Retailers without live prices remain visible in the unavailable retailer section.
- Retailer logos use local vector rendering to avoid blurred/remote-host failures.

# Weather Tracker

## Run locally

1. Install dependencies:

   npm install

2. Start the app:

   npm run dev

3. Open:

   http://localhost:3000

## What it does

- Stores daily weather logs in a local SQLite database (`data.sqlite`).
- Provides a small UI and a JSON API.

## API

- GET /api/health
- GET /api/logs
- GET /api/logs/:id
- POST /api/logs
- PUT /api/logs/:id
- DELETE /api/logs/:id

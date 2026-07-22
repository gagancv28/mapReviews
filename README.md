# Google Maps Review Analyzer — Backend

## Project Structure

```
guduchi,review/
├── server.js                      # Express entry point
├── routes/
│   └── fetchReviews.js            # POST /api/fetch-reviews
├── services/
│   ├── googleReviews.js           # Fake reviews (real API ready to activate)
│   ├── analyzeReviews.js          # Gemini AI sentiment analysis
│   └── supabaseClient.js          # Supabase admin client
├── schema.sql                     # Supabase table definition
├── add_unique_constraint.sql      # Required migration for upsert
├── .env.example                   # Environment variable template
└── package.json
```

## Quick Start

### 1 — Set up environment variables
```bash
cp .env.example .env
# then edit .env with your real values
```

### 2 — Run Supabase migrations (in Supabase SQL Editor)
```sql
-- First: schema.sql     (creates the reviews table)
-- Then:  add_unique_constraint.sql  (enables upsert deduplication)
```

### 3 — Start the server
```bash
npm run dev          # with hot-reload (Node 18+)
# or
npm start
```

### 4 — Call the route
```bash
curl -X POST http://localhost:3001/api/fetch-reviews \
  -H "Content-Type: application/json" \
  -d '{"place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4"}'
```

## API Reference

### POST /api/fetch-reviews

| Field | Type | Required | Description |
|---|---|---|---|
| `place_id` | `string` | YES | Google Maps Place ID of the business |

**Success response 200**
```json
{
  "success": true,
  "message": "Fetched, analysed, and saved 5 review(s).",
  "data": [ ]
}
```

## Switching to Real Google Maps API

In `services/googleReviews.js`:
1. Uncomment the `fetchGoogleReviews()` function.
2. Add `GOOGLE_MAPS_API_KEY=your-key` to your `.env`.
3. In `routes/fetchReviews.js`, find the TODO comment and swap:
   ```js
   const rawReviews = await fetchGoogleReviews(pid);
   ```
Zero other changes needed — both functions return identical shapes.
# mapReviews

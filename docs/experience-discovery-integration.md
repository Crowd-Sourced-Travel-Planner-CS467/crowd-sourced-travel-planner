# Experience Search & Discovery — Live Data Integration

## Implementation

The discovery page at `/experiences` now calls `GET /api/experiences` to load real rows from the application's Supabase/PostgreSQL database. The original `sampleExperiences.js` fixture is retained for isolated tests only; it is **not** used on the discovery page.

The API returns titles, descriptions, addresses, images, keywords, computed average ratings, and rating counts. It does not expose user IDs or private user data. Results can be filtered by destination/address, multiple keyword terms, and a minimum average rating, then sorted by rating or title. The endpoint uses parameterized SQL, rejects invalid query values, and paginates results (24 per page).

Each result links to `/experiences/:experienceId` for full details. A signed-in user can select one of their saved trips and call the existing authenticated `POST /api/trips/:trip_id/experiences` endpoint.

## Local setup

1. Follow the root README to set up the Supabase PostgreSQL database and backend `.env` file; never commit the credentials.
2. In terminal 1: `cd backend && npm install && npm run dev`.
3. In terminal 2: `cd frontend && npm install && npm run dev`.
4. Visit the Vite URL followed by `/experiences`. The dev proxy forwards API calls to port 3000.
5. Create at least one real experience through the existing Create Experience form, including its initial rating. It should appear in discovery without modifying sample fixtures.

## Tests

```bash
cd backend
node --test tests/discovery.test.js
node --test tests/discoveryRoute.test.js
node --test tests/experiences.test.js

cd ../frontend
npm run lint
npm run build
```

Tests added: seven query-building/validation/mapping tests and three HTTP route tests. The seven pure-function tests were executed through an isolated JavaScript harness; the full Node/Express tests, lint/build, and live Supabase end-to-end checks require running the repository with its dependencies and database.

## Final acceptance checklist

- [ ] An experience created by an actual user appears in discovery.
- [ ] Destination/address search, description/title/keyword search, minimum rating, and sorting work.
- [ ] A second user can rate the experience and its average changes on refresh.
- [ ] Result cards open the correct experience detail page.
- [ ] Signed-in user can add a result to an existing owned trip.
- [ ] Duplicate trip association displays an informative error.
- [ ] Empty results, network errors, no ratings, invalid image URLs, and pagination are handled.
- [ ] Backend tests, frontend lint and build pass.
- [ ] PR reviewed and merged into the team's `main` branch.

## AI assistance disclosure

The live discovery feature implementation, API, SQL query builder, React integration, CSS, tests, and these instructions were drafted with assistance from ChatGPT on November 28, 2026. The contributor should review, validate, and disclose this use according to course and team requirements.

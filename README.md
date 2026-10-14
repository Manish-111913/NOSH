# Nosh Dish Dashboard

This is my submission for the Nosh full stack intern assignment. It's a small dashboard for managing dishes. You can rename a dish or change whether it's published, but nothing is written to the database until you press Save. Every dish has a version number, and the backend uses it to make sure two people editing the same dish can't overwrite each other without knowing.

Stack: React + Vite + Tailwind on the frontend, Node.js + Express on the backend, PostgreSQL for the database. Tests use Vitest/Supertest for the API and Playwright for the browser.

## Running it locally

You'll need Node.js 20 or newer and Docker Desktop. I only use Docker to run Postgres. If you already have Postgres installed you can skip Docker and point `DATABASE_URL` at your own database.

Ports I picked so they don't clash with other projects:

- Postgres: `54329`
- Backend: `4729`
- Frontend: `5729`

Steps:

```bash
git clone https://github.com/Manish-111913/NOSH.git
cd NOSH

# start Postgres (this also creates the nosh_test and nosh_e2e databases)
docker compose up -d

# backend
cd backend
cp .env.example .env        # on PowerShell: Copy-Item .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev                 # http://localhost:4729

# frontend, in a second terminal
cd frontend
npm install
npm run dev                 # http://localhost:5729
```

The frontend talks to `http://localhost:4729` by default, so it doesn't need a `.env` file locally. If your backend runs somewhere else, set `VITE_API_BASE_URL` (see `frontend/.env.example`).

### Backend environment variables

These are in `backend/.env.example`. The password there is just for the local Docker container, not a real secret.

```
NODE_ENV=development
PORT=4729
DATABASE_URL=postgresql://nosh:nosh_local_password@localhost:54329/nosh
DATABASE_SSL=false
CORS_ORIGINS=http://localhost:5729
TEST_DATABASE_URL=postgresql://nosh:nosh_local_password@localhost:54329/nosh_test
```

`CORS_ORIGINS` is a comma separated list of frontend URLs allowed to call the API. `TEST_DATABASE_URL` is only used by the tests, and they refuse to run unless the database name ends in `_test`, because they delete data.

### Useful commands

Inside `backend/`:

- `npm run db:migrate` applies any SQL files in `db/migrations` that haven't run yet
- `npm run db:seed` loads `db/seed/dishes.json` (safe to run again, more on that below)
- `npm run db:reset -- --yes` wipes the dishes table and seeds it again. Dev only, it refuses to run in production
- `npm run dev` starts the API and restarts it when files change
- `npm test` runs the backend tests

Inside `frontend/`:

- `npm run dev` starts the dashboard
- `npm run build` makes a production build
- `npm run test:e2e` runs the browser tests (they start their own backend and frontend on ports 4730/5730 with a separate database)

## Database

There's one table:

```sql
CREATE TABLE dishes (
  dish_id      TEXT        PRIMARY KEY,
  dish_name    TEXT        NOT NULL,
  image_url    TEXT        NOT NULL,
  is_published BOOLEAN     NOT NULL DEFAULT FALSE,
  version      INTEGER     NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

I kept `dish_id` as `TEXT` because the IDs in the supplied JSON are strings ("1", "2", ...). Converting them to integers would work for this data but could break IDs like "007" later.

Migrations are plain SQL files in `backend/db/migrations`. The migrate script records each file it runs in a `schema_migrations` table so nothing runs twice.

The seed script reads the supplied JSON, checks every record (string id, string name and URL, boolean `isPublished`, no duplicate ids), and inserts each dish with version 1 using `INSERT ... ON CONFLICT (dish_id) DO NOTHING`. That means running it again won't create duplicates and won't touch dishes that already exist, so any edits and versions you've saved are kept. If you actually want to throw away edits and go back to the original data, that's what `db:reset` is for.

## API

All responses are JSON. A dish looks like this:

```json
{ "dishId": "1", "dishName": "Jeera Rice", "imageUrl": "https://...", "isPublished": true, "version": 1 }
```

Endpoints:

- `GET /dishes` returns all dishes (an empty array if there are none)
- `GET /dishes/:dishId` returns one dish. The frontend uses this when you reload after a conflict
- `PATCH /dishes/:dishId` updates the name and published status
- `GET /health` returns 200 if the database is reachable, 503 if not

The PATCH body needs exactly these three fields:

```json
{ "dishName": "Paneer Curry", "isPublished": true, "expectedVersion": 1 }
```

Rules the backend checks:

- `dishName` must be a string (max 80 characters). It gets trimmed before saving.
- `isPublished` must be a real boolean. `"true"` as a string is rejected.
- `expectedVersion` must be a positive integer.
- Any other field (like `imageUrl` or `version`) is rejected. The client can't change the image or set the version.
- If the dish ends up published, the trimmed name can't be empty and the stored image URL has to be a valid http/https URL. I only check the format with `new URL()`; I don't download the image.
- If `expectedVersion` doesn't match what's in the database, the update is refused with 409.

On success it returns the saved dish with the version increased by 1. If anything is rejected, the row in the database stays exactly as it was.

Errors all have the same shape:

```json
{ "error": { "code": "DISH_NAME_REQUIRED", "message": "A published dish must have a non-empty name." } }
```

Status codes I use:

- 400 `VALIDATION_ERROR` for missing or wrong-typed fields (with a `details` list), `INVALID_JSON`, `INVALID_DISH_ID`, `DISH_NAME_REQUIRED`, `INVALID_IMAGE_URL`
- 404 `DISH_NOT_FOUND` for an unknown dish, `ROUTE_NOT_FOUND` for an unknown URL
- 409 `VERSION_CONFLICT` when the version is stale. The response also includes `currentDish`, the latest saved version, so the frontend can show what changed
- 503 `DATABASE_UNAVAILABLE` if Postgres can't be reached
- 500 `INTERNAL_ERROR` for anything unexpected. The real error is logged on the server, never sent to the client

Some example requests (these outputs are copied from my local run):

```bash
curl http://localhost:4729/dishes

curl -X PATCH http://localhost:4729/dishes/2 -H "Content-Type: application/json" \
  -d '{"dishName":"Paneer Curry","isPublished":true,"expectedVersion":1}'
# 200 {"dishId":"2","dishName":"Paneer Curry",...,"isPublished":true,"version":2}

# same thing again with the old version number
curl -X PATCH http://localhost:4729/dishes/2 -H "Content-Type: application/json" \
  -d '{"dishName":"Old tab","isPublished":false,"expectedVersion":1}'
# 409 {"error":{"code":"VERSION_CONFLICT",...},"currentDish":{...,"dishName":"Paneer Curry","version":2}}

curl -X PATCH http://localhost:4729/dishes/3 -H "Content-Type: application/json" \
  -d '{"dishName":"   ","isPublished":true,"expectedVersion":1}'
# 400 {"error":{"code":"DISH_NAME_REQUIRED",...}}

curl -X PATCH http://localhost:4729/dishes/999 -H "Content-Type: application/json" \
  -d '{"dishName":"X","isPublished":false,"expectedVersion":1}'
# 404 {"error":{"code":"DISH_NOT_FOUND",...}}
```

On Windows PowerShell use `curl.exe` instead of `curl`, or just run these from Git Bash.

## How it's put together

Backend (`backend/src`):

- `routes/` maps URLs to controller functions
- `controllers/` validates the request and calls the service
- `services/` has the business rules and the transaction for updates
- `repositories/` has all the SQL (always parameterized)
- `validators/` checks request bodies and ids
- `middleware/errorHandler.js` turns every error into the JSON format above

`app.js` takes the database pool as an argument instead of importing it. That's mainly so the tests can build the same app against the test database.

Frontend (`frontend/src/features/dishes`):

- `hooks/useDishes.js` holds what the server returned and refreshes it
- `hooks/useDishDrafts.js` holds the local drafts
- `hooks/useDishEditor.js` handles opening the drawer, saving, discarding and conflicts
- `components/` has the table, the edit drawer and the dialogs

### The design decision I'd point to: locking the row during an update

The part I spent the most time on is making the version check safe when two saves arrive at the same moment. The PATCH handler runs inside one transaction:

1. `BEGIN`
2. `SELECT ... FROM dishes WHERE dish_id = $1 FOR UPDATE`. This locks the row, so if a second request for the same dish comes in, it waits here until the first one finishes.
3. If there's no row, return 404. If the version doesn't match `expectedVersion`, return 409 with the current row.
4. Check the publishing rules against the image URL that's stored in the database.
5. `UPDATE dishes SET dish_name = $2, is_published = $3, version = version + 1 ...`
6. `COMMIT`. Any error rolls back, and the connection always goes back to the pool.

Without the lock, two requests could both read version 1, both pass the check, and both write. With the lock, the second one reads version 2 after the first commits and gets a 409. I have a test that fires 20 saves at once with the same version. Exactly one succeeds and the other 19 get 409. To make sure the test was actually testing something, I removed `FOR UPDATE` once and ran it again, and it failed (two saves went through).

I could have used a single `UPDATE ... WHERE version = $n` instead. I went with the lock because then I can return a clear 404, 409 or 400 and include the latest row in the 409 response without a separate query that might race with another update.

### How drafts work in the frontend

When you edit a dish, the change goes into a draft object `{ dishName, isPublished, baseVersion }`, kept separately from the saved data. `baseVersion` is the version the dish had when you started editing, and that's what gets sent as `expectedVersion` when you save. The frontend never increases the version itself; it just uses what the server sends back.

Drafts are stored in `sessionStorage`, so they survive a page refresh but each browser tab has its own. I wanted that for the two-tab case: tab A's draft shouldn't leak into tab B.

- Close keeps the draft. The table shows "Unsaved local draft" on that row.
- Discard asks for confirmation, deletes the draft, and you're back to the saved values.
- Save is disabled while a request is in progress, and also when the dish would be published with an empty name or a bad image URL. The backend checks the same rules anyway.
- If the save fails (validation error, server error, or the backend is down), the draft stays as it is and you get an error message with a Retry button for connection problems.
- On a 409, the draft is kept and a dialog shows your draft next to the latest saved version. "Keep my draft" leaves everything alone (saving again will conflict again, nothing gets overwritten). "Reload latest version" asks you to confirm, fetches the dish, and only replaces your draft once that fetch succeeds. If the fetch fails, your draft is still there.

One thing I thought about: if a save times out, it might still have gone through on the server. I don't retry automatically. If the user clicks Retry and the first save did land, the version check turns it into a 409 that shows the saved data, instead of saving twice.

### Bonus: picking up changes from elsewhere

I did the optional part using polling. The dashboard fetches `GET /dishes` every 5 seconds while the tab is visible, and right away when you switch back to the tab. So a change made from another tab, Postman or curl shows up within about 5 seconds.

If a newer version arrives for a dish you have a draft for, the draft isn't touched. The drawer shows "A newer saved version is available" and you can review it in the same dialog used for conflicts.

The interval and the visibility listener are cleaned up when the page unmounts. Each request gets an id and only the newest response is applied, so a slow old response can't overwrite newer data. If a refresh fails, the last loaded dishes stay on screen, the header switches to "Disconnected", and polling keeps trying until the server is back.

## Testing

Backend tests run against a real Postgres database (`nosh_test`), not mocks:

```bash
cd backend
npm test
```

79 tests, all passing on my machine. They cover:

- validation (wrong types, missing fields, extra fields, bad versions, bad ids)
- the image URL rules (empty, malformed, ftp, no hostname), plus a check that a well-formed URL to a host that doesn't exist is still accepted, which shows I'm not downloading images
- successful saves, and that `isPublished` is stored as sent and never toggled
- 404 for unknown dishes (and that nothing gets created)
- 409 conflicts and that the first save stays intact
- simultaneous saves (2 and 20 at once)
- seeding: version 1 on insert, and re-seeding after an edit doesn't duplicate or overwrite anything
- data still there after the app and its connection pool are recreated
- 503 when the database is down, and CORS only allowing the configured origin

Browser tests (17, also passing):

```bash
cd frontend
npx playwright install chromium
npm run test:e2e
```

If you'd rather use your installed Chrome, set `PW_CHANNEL=chrome` first (PowerShell: `$env:PW_CHANNEL="chrome"`). These cover loading, empty and error states, search and filter, broken images, the mobile layout, drafts surviving a refresh, discard, save and reload, the publish rules, failed saves with retry, the two-tab conflict, a failed reload after a conflict, and changes from another client showing up automatically.

### Checking it by hand

With the app running:

1. The dashboard shows the 5 dishes from the JSON, all at v1.
2. Edit Paneer Tikka, change the name and click Close. The row says "Unsaved local draft". `curl http://localhost:4729/dishes/2` still shows the old name and version 1. Refresh the page and the draft is still there.
3. Open it again and click Discard, then confirm. The original name comes back.
4. Change the name and click Save. You get a toast with v2. Refresh: still v2. Stop the backend with Ctrl+C, start it again and refresh: still v2.
5. Run `npm run db:seed` again. It prints "Inserted 0, skipped 5" and the edited dish doesn't change.
6. Clear the name while Published is selected. Save gets disabled. The backend rejects it too:
   `curl -X PATCH http://localhost:4729/dishes/3 -H "Content-Type: application/json" -d '{"dishName":"  ","isPublished":true,"expectedVersion":1}'` gives 400 and the dish doesn't change.
7. For the image URL case, all the supplied dishes have valid URLs, so I add a test dish with a bad one, try to publish it, and remove it again:
   ```bash
   docker exec nosh-postgres psql -U nosh -d nosh -c "INSERT INTO dishes (dish_id, dish_name, image_url, is_published) VALUES ('bad-url-test', 'Broken Image Dish', 'ftp://example.com/dish.jpg', false);"
   curl -X PATCH http://localhost:4729/dishes/bad-url-test -H "Content-Type: application/json" -d '{"dishName":"Broken Image Dish","isPublished":true,"expectedVersion":1}'
   # 400 INVALID_IMAGE_URL, the row is still unpublished at version 1
   docker exec nosh-postgres psql -U nosh -d nosh -c "DELETE FROM dishes WHERE dish_id = 'bad-url-test';"
   ```
   While the test dish exists, opening it in the UI and choosing Published shows the image URL error and the row shows the broken-image placeholder.
8. Open the app in two tabs (type the URL in the second tab rather than duplicating the first one, since duplicating copies sessionStorage). Edit the same dish in both. Save in tab A, then save in tab B. Tab B shows the conflict dialog with its draft next to A's saved values. Tab A's change is still in the database. "Keep my draft" keeps B's text; "Reload latest version" replaces it with A's after you confirm.
9. With a draft open, stop the backend and click Save. You get "Unable to save changes", the draft is still editable, and the header says Disconnected. Start the backend again, click Retry, and it saves.
10. With the dashboard open, change a dish with curl. The row updates within about 5 seconds. If you had a draft for that dish, it stays and you get the "newer saved version" banner.

## Deploying (optional)

I set it up for Render (backend and database) and Vercel (frontend), but deploying isn't required for the assignment.

Render: in the dashboard choose New > Blueprint and pick this repo. `render.yaml` creates the API service from `backend/` and a Postgres database. Set `CORS_ORIGINS` to the Vercel URL when it asks. On every start it runs the migrations and the seed (both are safe to repeat) and then starts the API. `/health` should return ok.

Vercel: import the repo, set the root directory to `frontend`, and add `VITE_API_BASE_URL` with the Render URL (no trailing slash). `frontend/vercel.json` has the build settings.

Free Render services go to sleep when idle, so the first request can take up to a minute. Free Render databases also expire after 30 days.

## Known limitations

- Updates from other clients come in by polling, so there can be up to a 5 second delay. I didn't use WebSockets or SSE.
- Drafts belong to one tab. If you close the tab, its drafts are gone.
- The image check only looks at the URL format. A valid URL pointing to a missing image just shows the placeholder.
- An unpublished dish can have an empty name. The table shows it as "(no name)".
- No login, no creating or deleting dishes, no image upload, since those were out of scope.

## Time spent

Roughly TODO hours in total.

## AI use and reused code

The starting UI was generated with Google Stitch and converted to React. I used an AI coding assistant (Claude Code) while building the backend, connecting the frontend, writing tests and writing this README. I've gone through the code and can explain how the drafts, the transaction and row lock, and the conflict handling work.

Libraries: Express, pg, cors, dotenv, React, Vite, Tailwind CSS with the forms plugin, Vitest, Supertest and Playwright. I didn't copy code from any other repository.

# GitHub User Activity

A responsive web app for exploring a GitHub user's recent public activity, backed by the GitHub REST API. The project also retains its original command-line interface (CLI).

## Requirements

- Node.js 18 or newer
- npm

## Run locally

Install dependencies and start the web server:

```sh
npm ci
npm start
```

Open <https://github-user-activity-0rn0.onrender.com>. The server binds to `0.0.0.0` and uses `PORT` when it is set.

The browser sends same-origin requests to the Express API. The server validates the username, calls GitHub using the existing API integration, processes and formats the event data, and returns it to the frontend. No private GitHub credentials are required or sent to the browser; the app only reads public events.

### API endpoints

- `GET /` serves the web application.
- `GET /api/users/:username/events` returns processed activity as JSON.
- `GET /health` returns `{ "status": "ok" }`.

Example:

```sh
curl http://localhost:3000/api/users/torvalds/events
```

Each event includes its GitHub event type, repository name, timestamp, event details, and a readable description. An empty `events` array means the user has no recent public activity.

The API responds with:

- `400` for an invalid username.
- `404` when GitHub cannot find the user.
- `429` when GitHub's API rate limit is reached.
- `502` for network errors or other GitHub API failures.

## Run the CLI

The original CLI remains available:

```sh
npm run cli -- torvalds
```

To also save the raw response to `src/data/activity.json`:

```sh
npm run cli -- torvalds --save
```

Direct invocation continues to work as well:

```sh
node index.js torvalds
```

## Project structure

- `server.js` - Express server, static frontend serving, and API routes.
- `public/index.html` - Page structure and accessible search form.
- `public/style.css` - Responsive visual design.
- `public/app.js` - Search requests, activity cards, and loading/error/empty states.
- `index.js` - Existing CLI entry point.
- `src/github.js` - GitHub API request and upstream error handling.
- `src/activity.js` - Event validation and normalization.
- `src/formatter.js` - Readable event descriptions shared by the CLI and web API.
- `src/validator.js` - GitHub username validation.
- `src/storage.js` - Optional CLI activity file saving.
- `test/` - CLI and Express API tests.

## Tests

Run the existing CLI and web API test suites:

```sh
npm test
```

Tests cover username validation, event processing and formatting, GitHub/network failures, empty activity, the health and API endpoints, and frontend static-file serving.

## Deploy to GitHub and Render

### 1. Push the project to GitHub

Create an empty repository on GitHub (without generating a second README), then from the project directory review the files and push the project to your chosen branch:

```sh
git status
git add .
git commit -m "Prepare GitHub activity web app"
git remote add origin https://github.com/<your-account>/<repository>.git
git push -u origin main
```

Replace the repository URL with your own. If an `origin` remote already exists, keep it and push to your intended branch instead of adding it again. Include `package-lock.json`; do not commit `node_modules/` or private credentials.

### 2. Create a Render Web Service

1. Sign in to [Render](https://render.com/) and choose **New → Web Service**.
2. Connect the GitHub repository and select the deployment branch.
3. Choose the Node runtime.
4. Set the build command to `npm ci`.
5. Set the start command to `npm start`.
6. Create the service and wait for the deployment to finish.

Render supplies `PORT` at runtime. The app reads that value and listens on `0.0.0.0`, so no port or host setting is needed in Render. No GitHub token or other secret environment variable is required for public activity.

### 3. Verify the deployment

Open the Render service URL to use the app. Check the service's health endpoint at `/health`; it should return:

```json
{"status":"ok"}
```

You can also verify the API at `/api/users/torvalds/events`. Review Render's deployment logs if the service does not start. Render can be configured to redeploy automatically when new commits are pushed to the connected branch.

GitHub API unauthenticated rate limits apply. If the limit is reached, the app reports that the user should try again later.

# GitHub User Activity

A responsive web application built with **Node.js and Express** that allows users to explore a GitHub profile's recent public activity, including commits, pushes, and other GitHub events. It uses the GitHub REST API to fetch, process, and display activity in a chronological timeline.

The project also retains its original command-line interface (CLI).

## 🚀 Live Demo

**[Visit GitHub User Activity](https://github-user-activity-0rn0.onrender.com)**

## ✨ Features

- Search GitHub users by username.
- Fetch recent public GitHub events.
- Retrieve recent commits from public repositories owned by the user.
- Display commits and events in a chronological timeline.
- Open individual commits directly on GitHub.
- Show repository names, activity descriptions, and timestamps.
- Responsive and user-friendly interface.
- Input validation and error handling.
- Loading, empty, and error states.
- Original CLI functionality preserved.
- Automated tests using Node.js built-in test runner.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend server and REST API |
| JavaScript | Application logic and frontend functionality |
| HTML5 | Web page structure |
| CSS3 | Responsive styling |
| GitHub REST API | Fetch GitHub activity and commits |
| Node.js Test Runner | Automated testing |
| Render | Web application hosting |

## 📸 Application Preview

Visit the [Live Application](https://github-user-activity-0rn0.onrender.com) to explore the interface.

## 📋 Requirements

- Node.js 18 or newer
- npm
- Git

## 💻 Run Locally

**1. Clone the repository**

```bash
git clone https://github.com/t4run-11/github-user-activity.git
```

**2. Navigate to the project directory**

```bash
cd github-user-activity
```

**3. Install dependencies**

```bash
npm ci
```

**4. Start the web server**

```bash
npm start
```

**5. Open the application**

Visit:

```text
http://localhost:3000
```

The server uses the `PORT` environment variable when available and listens on `0.0.0.0`.

## 🔌 API Endpoints

The Express server provides the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Serves the web application |
| GET | `/api/users/:username/events` | Returns processed GitHub activity as JSON |
| GET | `/health` | Checks server health |

**Example API request:**

```bash
curl http://localhost:3000/api/users/torvalds/events
```

**Example response:**

```json
{
  "username": "octocat",
  "events": [
    {
      "type": "Commit",
      "repository": "octocat/hello-world",
      "createdAt": "2026-01-02T00:00:00Z",
      "description": "Add README",
      "url": "https://github.com/octocat/hello-world/commit/abc123"
    }
  ]
}
```

Each activity contains its type, repository, timestamp, and a readable description. Commit activities also include a direct GitHub commit URL.

An empty `events` array means no activities were found in the data retrieved by the application.

### Error Handling

| HTTP Status | Description |
|---|---|
| 400 | Invalid GitHub username |
| 404 | GitHub user not found |
| 429 | GitHub API rate limit reached |
| 502 | Network or GitHub API error |

## ⌨️ Run the CLI

The original command-line interface is still available.

**Run the CLI:**

```bash
npm run cli -- torvalds
```

**Save the raw activity response:**

```bash
npm run cli -- torvalds --save
```

You can also execute it directly:

```bash
node index.js torvalds
```

## 📁 Project Structure

```text
github-user-activity/
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── src/
│   ├── github.js
│   ├── activity.js
│   ├── formatter.js
│   ├── validator.js
│   ├── storage.js
│   └── data/
│
├── test/
│   ├── app.test.js
│   └── server.test.js
│
├── index.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

### Important Files

- `server.js` – Express server, API routes, and static frontend serving.
- `public/index.html` – Web application structure.
- `public/style.css` – Responsive styling.
- `public/app.js` – Frontend logic, API requests, and activity cards.
- `index.js` – CLI entry point.
- `src/github.js` – GitHub API requests and error handling.
- `src/activity.js` – Activity validation, processing, and sorting.
- `src/formatter.js` – Human-readable activity descriptions.
- `src/validator.js` – GitHub username validation.
- `src/storage.js` – Optional CLI activity storage.
- `test/` – Automated tests for CLI and web API functionality.

## 🧪 Run Tests

Execute the test suite:

```bash
npm test
```

The automated tests cover:

- GitHub username validation.
- Event processing and formatting.
- Commit processing and timeline sorting.
- GitHub API error handling.
- Network failures and rate limits.
- Empty activity responses.
- Express health and API endpoints.
- Frontend static-file serving.

**Current test results: 13 passed, 0 failed.**

## ☁️ Deployment

The application is deployed using [Render](https://render.com/).

Deployment configuration:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Hosting | Render Web Service |

The application uses Render's assigned `PORT` environment variable and does not require a GitHub access token for public activity.

**Live URL:** https://github-user-activity-0rn0.onrender.com

## ⚠️ Notes

- The application retrieves public GitHub activity only.
- GitHub's Events API provides a limited recent activity feed, not a complete history.
- Commit retrieval is limited to recent commits from the public repositories owned by the user that the application checks.
- GitHub's unauthenticated API rate limits apply.
- Render's free service may sleep after inactivity, so the first request can take additional time.

## 👨‍💻 Author

**Tarun Chourasiya**

- GitHub: [@t4run-11](https://github.com/t4run-11)
- Project Repository: [github-user-activity](https://github.com/t4run-11/github-user-activity)
- Live Demo: [GitHub User Activity](https://github-user-activity-0rn0.onrender.com)

---

If you find this project useful, consider giving the repository a ⭐ on GitHub!

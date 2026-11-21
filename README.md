# GitHub User Activity CLI

A small command-line program that fetches a GitHub user's recent public events and prints readable activity summaries. It uses Node.js's built-in `fetch()` and file-system modules, so there are no external dependencies.

## Requirements

- Node.js 18 or newer

## Run the CLI

From the project directory, provide a GitHub username:

```sh
node index.js torvalds
```

Or use the npm script:

```sh
npm start -- torvalds
```

To also save the raw API response:

```sh
node index.js torvalds --save
```

The `--save` option writes `src/data/activity.json`. The file includes the username, the time the data was fetched, and the raw event array. A later `--save` run replaces the previous file.

Example output:

```text
Pushed 2 commits to master in torvalds/linux.
Opened issue #123 "Example issue" in owner/project.
Starred owner/project.
```

The exact output depends on the user's public activity. If GitHub returns no events, the CLI prints:

```text
No recent public activity found.
```

## What the files do

- `index.js` reads and validates command-line arguments, runs the request and processing steps, and prints the output.
- `src/validator.js` checks that the username follows GitHub's 1–39 character username format.
- `src/github.js` sends the HTTP request and reports HTTP and network errors.
- `src/activity.js` extracts the repository, event type, timestamp, and event-specific details from GitHub's JSON.
- `src/formatter.js` turns processed events into terminal-friendly sentences.
- `src/storage.js` writes the raw response to JSON when `--save` is supplied.
- `src/data/activity.json` is created when the save option is used.
- `test/app.test.js` contains automated tests using Node's built-in test runner.

## Events summarized

The CLI has specific summaries for `PushEvent`, `IssuesEvent`, `WatchEvent`, `CreateEvent`, `PullRequestEvent`, `DeleteEvent`, `ForkEvent`, and `ReleaseEvent`. Other event types receive a generic summary.

## Errors

- Missing or malformed usernames show a usage or validation message.
- A 404 response reports that the user was not found.
- A 403 response identifies a rate limit when GitHub's response header indicates one; other 403 responses report an access restriction.
- 5xx responses report a GitHub server error.
- Network and file-saving failures are reported separately.

## Run tests

No dependency installation is needed. Run:

```sh
npm test
```

The tests cover username validation, event processing and formatting, empty and malformed activity, HTTP/network error handling, and CLI input validation.

## How the application works

1. `index.js` reads the username from `process.argv`.
2. `validator.js` checks the username before any request is made.
3. `github.js` requests `https://api.github.com/users/{username}/events` and parses the JSON response.
4. `activity.js` extracts a consistent set of fields from each event.
5. `formatter.js` creates readable descriptions for the terminal.
6. If `--save` was supplied, `storage.js` also saves the raw response as JSON.

import express from "express";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  processActivity,
  processCommits,
  sortTimeline,
} from "./src/activity.js";

import { formatActivity } from "./src/formatter.js";

import {
  fetchUserEvents,
  fetchUserRepositories,
  fetchRepositoryCommits,
} from "./src/github.js";
import { isValidUsername } from "./src/validator.js";

const publicDirectory = fileURLToPath(new URL("./public/", import.meta.url));

function getErrorStatus(error) {
  if (/^GitHub user ".+" was not found\.$/.test(error.message)) {
    return 404;
  }

  if (/rate limit reached/i.test(error.message)) {
    return 429;
  }

  return 502;
}

export function createApp() {
  const app = express();

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/users/:username/events", async (request, response) => {
    const { username } = request.params;

    if (!isValidUsername(username)) {
      response.status(400).json({ error: "Invalid GitHub username." });
      return;
    }

    try {
      const [events, repositories] = await Promise.all([
        fetchUserEvents(username),
        fetchUserRepositories(username),
      ]);

      const eventActivities = processActivity(events);

      const commitResults = await Promise.allSettled(
    repositories.map(async (repository) => {
      const repositoryName = `${repository.owner.login}/${repository.name}`;

      const commits = await fetchRepositoryCommits(
        username,
        repositoryName
      );

      return processCommits(commits, repositoryName);
    })
  );

const commitActivities = commitResults.flatMap((result) =>
  result.status === "fulfilled" ? result.value : []
);

      const timeline = sortTimeline([
        ...eventActivities,
        ...commitActivities,
      ]);

      const descriptions = formatActivity(eventActivities);
      const eventDescriptions = new Map(
        eventActivities.map((activity, index) => [
          activity,
          descriptions[index],
        ])
      );

      response.json({
        username,
        events: timeline.map((activity) => ({
          ...activity,
          description:
            activity.type === "Commit"
              ? activity.description
              : eventDescriptions.get(activity),
        })),
      });
    
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred.";
      response.status(getErrorStatus({ message })).json({ error: message });
    }
  });

  app.get("/", (_request, response) => {
    response.sendFile(resolve(publicDirectory, "index.html"));
  });
  app.use(express.static(publicDirectory));

  return app;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  const port = process.env.PORT || 3000;
  createApp().listen(port, "0.0.0.0", () => {
    console.log(`GitHub User Activity web app listening on port ${port}.`);
  });
}

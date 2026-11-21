import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { processActivity } from "../src/activity.js";
import { formatActivity } from "../src/formatter.js";
import { fetchUserEvents } from "../src/github.js";
import { isValidUsername } from "../src/validator.js";

const indexPath = fileURLToPath(new URL("../index.js", import.meta.url));

test("validates GitHub username format and length", () => {
  for (const username of ["octocat", "a", "octo-cat", "123"]) {
    assert.equal(isValidUsername(username), true, `${username} should be valid`);
  }

  for (const username of [
    "",
    "-octocat",
    "octocat-",
    "octo--cat",
    "has space",
    "a".repeat(40),
    null,
  ]) {
    assert.equal(isValidUsername(username), false);
  }
});

test("processes details for all supported GitHub event types", () => {
  const common = {
    repo: { name: "owner/repo" },
    created_at: "2026-01-01T00:00:00Z",
  };
  const events = [
    { ...common, type: "PushEvent", payload: { ref: "refs/heads/main", size: 2 } },
    {
      ...common,
      type: "IssuesEvent",
      payload: { action: "opened", issue: { number: 7, title: "Bug" } },
    },
    { ...common, type: "WatchEvent", payload: { action: "started" } },
    { ...common, type: "CreateEvent", payload: { ref_type: "branch", ref: "main" } },
    {
      ...common,
      type: "PullRequestEvent",
      payload: { action: "opened", pull_request: { number: 8, title: "Feature" } },
    },
    { ...common, type: "DeleteEvent", payload: { ref_type: "branch", ref: "old" } },
    { ...common, type: "ForkEvent", payload: { forkee: { full_name: "user/repo" } } },
    {
      ...common,
      type: "ReleaseEvent",
      payload: { action: "published", release: { name: "v1", tag_name: "v1.0" } },
    },
  ];

  const activities = processActivity(events);

  assert.equal(activities.length, 8);
  assert.deepEqual(activities[0], {
    type: "PushEvent",
    repository: "owner/repo",
    createdAt: common.created_at,
    details: { ref: "refs/heads/main", commitCount: 2 },
  });
  assert.equal(activities[1].details.title, "Bug");
  assert.equal(activities[2].details.action, "started");
  assert.equal(activities[3].details.refType, "branch");
  assert.equal(activities[4].details.number, 8);
  assert.equal(activities[5].details.ref, "old");
  assert.equal(activities[6].details.forkedRepository, "user/repo");
  assert.equal(activities[7].details.tagName, "v1.0");
});

test("rejects malformed activity and accepts an empty event array", () => {
  assert.deepEqual(processActivity([]), []);
  assert.throws(() => processActivity({}), /Expected GitHub activity to be an array/);
  assert.throws(() => processActivity([{}]), /unexpected structure/);
});

test("formats supported and unknown events, and handles empty activity", () => {
  const activities = [
    { type: "PushEvent", repository: "owner/repo", details: { ref: "refs/heads/main", commitCount: 1 } },
    { type: "IssuesEvent", repository: "owner/repo", details: { action: "opened", number: 7, title: "Bug" } },
    { type: "WatchEvent", repository: "owner/repo", details: {} },
    { type: "CreateEvent", repository: "owner/repo", details: { refType: "branch", ref: "main" } },
    { type: "PullRequestEvent", repository: "owner/repo", details: { action: "closed", number: 8, title: "Feature" } },
    { type: "DeleteEvent", repository: "owner/repo", details: { refType: "branch", ref: "old" } },
    { type: "ForkEvent", repository: "owner/repo", details: { forkedRepository: "user/repo" } },
    { type: "ReleaseEvent", repository: "owner/repo", details: { action: "published", name: "v1" } },
    { type: "NewEvent", repository: "owner/repo", details: {} },
  ];

  assert.deepEqual(formatActivity(activities), [
    "Pushed 1 commit to main in owner/repo.",
    'Opened issue #7 "Bug" in owner/repo.',
    "Starred owner/repo.",
    "Created branch main in owner/repo.",
    'Closed pull request #8 "Feature" in owner/repo.',
    "Deleted branch old in owner/repo.",
    "Forked owner/repo as user/repo.",
    'Published release "v1" in owner/repo.',
    "Recorded NewEvent in owner/repo.",
  ]);
  assert.deepEqual(formatActivity([]), ["No recent public activity found."]);
});

test("fetches and parses GitHub activity with the expected request headers", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (url, options) => {
    assert.match(url, /\/users\/torvalds\/events$/);
    assert.equal(options.headers.Accept, "application/vnd.github+json");
    assert.equal(options.headers["User-Agent"], "github-user-activity-cli");
    return new Response(JSON.stringify([{ type: "PushEvent" }]), { status: 200 });
  };

  assert.deepEqual(await fetchUserEvents("torvalds"), [{ type: "PushEvent" }]);
});

test("reports 404, rate-limited and restricted 403, 5xx, and network errors", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () => new Response("", { status: 404 });
  await assert.rejects(fetchUserEvents("missing-user"), /user "missing-user" was not found/i);

  globalThis.fetch = async () =>
    new Response("", { status: 403, headers: { "x-ratelimit-remaining": "0" } });
  await assert.rejects(fetchUserEvents("octocat"), /rate limit reached/i);

  globalThis.fetch = async () => new Response("", { status: 403 });
  await assert.rejects(fetchUserEvents("octocat"), /access restriction/i);

  globalThis.fetch = async () => new Response("", { status: 503 });
  await assert.rejects(fetchUserEvents("octocat"), /server error \(HTTP 503\)/i);

  globalThis.fetch = async () => {
    throw new TypeError("connection refused");
  };
  await assert.rejects(fetchUserEvents("octocat"), /Network error.*connection refused/i);
});

test("shows usage and validation errors without making a network request", () => {
  const missing = spawnSync(process.execPath, [indexPath], { encoding: "utf8" });
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /Usage: node index\.js/);

  const invalid = spawnSync(process.execPath, [indexPath, "-bad"], { encoding: "utf8" });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Invalid GitHub username/);
});

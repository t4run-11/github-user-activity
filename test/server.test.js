import assert from "node:assert/strict";
import { once } from "node:events";
import { test } from "node:test";
import { createApp } from "../server.js";

async function startServer() {
  const server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

function useGitHubFetch(server, originalFetch, mockFetch) {
  globalThis.fetch = (input, options) => {
    if (String(input).startsWith(server.baseUrl)) {
      return originalFetch(input, options);
    }

    return mockFetch(input, options);
  };
}

test("serves health and returns processed activity for a valid username", async (t) => {
  const originalFetch = globalThis.fetch;
  const server = await startServer();
  t.after(async () => {
    globalThis.fetch = originalFetch;
    await server.close();
  });

  useGitHubFetch(server, originalFetch, async (url) => {
  const requestUrl = new URL(url);

  if (requestUrl.pathname === "/users/octocat/events") {
    return new Response(
      JSON.stringify([
        {
          type: "PushEvent",
          repo: { name: "octocat/hello-world" },
          created_at: "2026-01-01T00:00:00Z",
          payload: { size: 2 },
        },
      ]),
      { status: 200 }
    );
  }

  if (requestUrl.pathname === "/users/octocat/repos") {
    return new Response(
      JSON.stringify([
        {
          name: "hello-world",
          owner: { login: "octocat" },
        },
      ]),
      { status: 200 }
    );
  }

  if (requestUrl.pathname === "/repos/octocat/hello-world/commits") {
    return new Response(
      JSON.stringify([
        {
          commit: {
            message: "Add README",
            author: { date: "2026-01-02T00:00:00Z" },
          },
          html_url: "https://github.com/octocat/hello-world/commit/abc123",
        },
      ]),
      { status: 200 }
    );
  }

  throw new Error(`Unexpected GitHub API request: ${url}`);
});

  const health = await fetch(`${server.baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });

  const response = await fetch(`${server.baseUrl}/api/users/octocat/events`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    username: "octocat",
    events: [
  {
    type: "Commit",
    repository: "octocat/hello-world",
    createdAt: "2026-01-02T00:00:00Z",
    description: "Add README",
    url: "https://github.com/octocat/hello-world/commit/abc123",
  },
  {
    type: "PushEvent",
    repository: "octocat/hello-world",
    createdAt: "2026-01-01T00:00:00Z",
    details: { commitCount: 2 },
    description: "Pushed 2 commits in octocat/hello-world.",
  },
],
  });
});

test("serves the frontend document and static assets", async (t) => {
  const server = await startServer();
  t.after(() => server.close());

  const home = await fetch(`${server.baseUrl}/`);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /GitHub Activity — Dev Pulse/);

  const stylesheet = await fetch(`${server.baseUrl}/style.css`);
  assert.equal(stylesheet.status, 200);
  assert.match(await stylesheet.text(), /@media \(max-width: 640px\)/);

  const script = await fetch(`${server.baseUrl}/app.js`);
  assert.equal(script.status, 200);
  assert.match(await script.text(), /\/api\/users\//);
});

test("rejects invalid usernames and returns empty activity", async (t) => {
  const originalFetch = globalThis.fetch;
  const server = await startServer();
  t.after(async () => {
    globalThis.fetch = originalFetch;
    await server.close();
  });

  useGitHubFetch(server, originalFetch, async () => {
    throw new Error("The API should not be called for invalid usernames.");
  });

  const invalid = await fetch(`${server.baseUrl}/api/users/-invalid/events`);
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: "Invalid GitHub username." });

  useGitHubFetch(server, originalFetch, async () => new Response("[]", { status: 200 }));
  const empty = await fetch(`${server.baseUrl}/api/users/octocat/events`);
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), { username: "octocat", events: [] });
});

test("maps GitHub and network errors to useful API responses", async (t) => {
  const originalFetch = globalThis.fetch;
  const server = await startServer();
  t.after(async () => {
    globalThis.fetch = originalFetch;
    await server.close();
  });

  const cases = [
    {
      fetch: async () => new Response("", { status: 404 }),
      status: 404,
      message: /was not found/,
    },
    {
      fetch: async () =>
        new Response("", {
          status: 403,
          headers: { "x-ratelimit-remaining": "0" },
        }),
      status: 429,
      message: /rate limit reached/,
    },
    {
      fetch: async () => new Response("", { status: 503 }),
      status: 502,
      message: /server error \(HTTP 503\)/,
    },
    {
      fetch: async () => {
        throw new TypeError("connection refused");
      },
      status: 502,
      message: /Network error.*connection refused/,
    },
  ];

  for (const testCase of cases) {
    useGitHubFetch(server, originalFetch, testCase.fetch);
    const response = await fetch(`${server.baseUrl}/api/users/octocat/events`);
    assert.equal(response.status, testCase.status);
    const body = await response.json();
    assert.match(body.error, testCase.message);
  }
});

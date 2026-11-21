export async function fetchUserEvents(username) {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}/events`;
  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "github-user-activity-cli",
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(`Network error while contacting GitHub.${reason}`);
  }

  if (response.status === 404) {
    throw new Error(`GitHub user "${username}" was not found.`);
  }

  if (response.status === 403) {
    if (response.headers.get("x-ratelimit-remaining") === "0") {
      throw new Error("GitHub API rate limit reached. Try again later.");
    }

    throw new Error(
      "GitHub denied this request (HTTP 403), possibly because of an API rate limit or access restriction."
    );
  }

  if (response.status >= 500) {
    throw new Error(`GitHub server error (HTTP ${response.status}). Try again later.`);
  }

  if (!response.ok) {
    throw new Error(`GitHub request failed with HTTP ${response.status}.`);
  }

  return await response.json();
}

async function fetchGitHubJson(url) {
  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "github-user-activity-cli",
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(`Network error while contacting GitHub.${reason}`);
  }

  if (response.status === 403) {
    if (response.headers.get("x-ratelimit-remaining") === "0") {
      throw new Error("GitHub API rate limit reached. Try again later.");
    }

    throw new Error("GitHub denied this request (HTTP 403).");
  }

  if (response.status === 404) {
    throw new Error("GitHub resource was not found.");
  }

  if (response.status >= 500) {
    throw new Error(
      `GitHub server error (HTTP ${response.status}). Try again later.`
    );
  }

  if (!response.ok) {
    throw new Error(`GitHub request failed with HTTP ${response.status}.`);
  }

  return response.json();
}

export async function fetchUserRepositories(username) {
  const url =
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=10`;

  const repositories = await fetchGitHubJson(url);

  if (!Array.isArray(repositories)) {
    throw new TypeError("Expected GitHub repositories to be an array.");
  }

  return repositories;
}

export async function fetchRepositoryCommits(username, repository) {
  const [owner, repo] = repository.split("/");

  if (!owner || !repo) {
    throw new TypeError("Expected repository in owner/repo format.");
  }

  const url =
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?author=${encodeURIComponent(username)}&per_page=5`;

  const commits = await fetchGitHubJson(url);

  if (!Array.isArray(commits)) {
    throw new TypeError("Expected GitHub commits to be an array.");
  }

  return commits;
}

const form = document.querySelector("#search-form");
const usernameInput = document.querySelector("#username");
const searchButton = form.querySelector('button[type="submit"]');
const clearButton = document.querySelector("#clear-button");
const statusRegion = document.querySelector("#status");
const welcomeState = document.querySelector("#welcome-state");
const resultsRegion = document.querySelector("#results");
const resultsTitle = document.querySelector("#results-title");
const resultCount = document.querySelector("#result-count");
const activityList = document.querySelector("#activity-list");

const iconPaths = {
  Commit: "M6 12h4m4 0h4M12 6v12",
  PushEvent: "M7 7 12 2l5 5M12 2v13m-5-4v3a5 5 0 0 0 10 0v-3",
  IssuesEvent: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5m0 4h.01",
  WatchEvent: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z",
  CreateEvent: "M12 5v14m-7-7h14",
  PullRequestEvent: "M6 3v12m0 0-3-3m3 3 3-3m9 6V9m0 0-3 3m3-3 3 3M6 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  DeleteEvent: "M4 7h16m-10 4v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3",
  ForkEvent: "M6 3v12m0 0-3-3m3 3 3-3m9 6V9m0 0-3 3m3-3 3 3M6 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  ReleaseEvent: "m20.6 13.4-7.2 7.2a2 2 0 0 1-2.8 0l-7.2-7.2a2 2 0 0 1 0-2.8l7.2-7.2a2 2 0 0 1 1.4-.6H20v8a2 2 0 0 1-.6 1.4ZM16 8h.01",
};

const iconTones = {
  commit: "violet",
  IssuesEvent: "blue",
  PullRequestEvent: "blue",
  ReleaseEvent: "violet",
  ForkEvent: "violet",
};

let activeRequest;

function setStatus(message, state = "info", loading = false) {
  statusRegion.replaceChildren();
  statusRegion.dataset.state = state;
  statusRegion.hidden = !message;

  if (loading) {
    const spinner = document.createElement("span");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");
    statusRegion.append(spinner);
  }

  if (message) {
    const text = document.createElement("span");
    text.textContent = message;
    statusRegion.append(text);
  }
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function createIcon(eventType) {
  const namespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(namespace, "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("aria-hidden", "true");

  const path = document.createElementNS(namespace, "path");
  path.setAttribute(
    "d",
    iconPaths[eventType] || "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v5m0 4h.01"
  );
  icon.append(path);
  return icon;
}

function displayEventType(eventType) {
  return eventType.replace(/Event$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function createActivityCard(activity) {
  const card = document.createElement("article");
  card.className = "activity-card";

  const icon = document.createElement("div");
  icon.className = "activity-icon";
  icon.dataset.tone = iconTones[activity.type] || "mint";
  icon.append(createIcon(activity.type));

  const content = document.createElement("div");
  content.className = "activity-main";

  const topLine = document.createElement("div");
  topLine.className = "activity-topline";

  const eventType = document.createElement("span");
  eventType.className = "event-type";
  eventType.textContent = displayEventType(activity.type);

  const time = document.createElement("time");
  time.className = "activity-time";
  time.dateTime = activity.createdAt;
  time.textContent = formatTime(activity.createdAt);
  topLine.append(eventType, time);

  const description = document.createElement("p");
  description.className = "activity-description";

  if (activity.type === "Commit" && activity.url) {
    const link = document.createElement("a");
    link.href = activity.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = activity.description;
    description.append(link);
  } else {
    description.textContent = activity.description;
  }

  const repository = document.createElement("span");
  repository.className = "activity-repository";
  repository.append(createIcon("CreateEvent"));

  const repositoryName = document.createElement("span");
  repositoryName.textContent = activity.repository;
  repository.append(repositoryName);

  content.append(topLine, description, repository);
  card.append(icon, content);

  return card;
}


function showActivities(username, events) {
  welcomeState.hidden = true;
  activityList.replaceChildren();

  if (events.length === 0) {
    resultsRegion.hidden = true;
    setStatus(`No recent public activity found for @${username}.`);
    return;
  }

  resultsTitle.textContent = `Recent activity for @${username}`;
  resultCount.textContent = `${events.length} ${events.length === 1 ? "event" : "events"}`;
  activityList.append(...events.map(createActivityCard));
  resultsRegion.hidden = false;
  setStatus("");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = usernameInput.value.trim();

  if (!usernameInput.checkValidity()) {
    usernameInput.reportValidity();
    return;
  }

  activeRequest?.abort();
  activeRequest = new AbortController();
  const request = activeRequest;
  welcomeState.hidden = true;
  resultsRegion.hidden = true;
  searchButton.disabled = true;
  setStatus(`Looking up recent activity for @${username}…`, "info", true);
  statusRegion.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(
      `/api/users/${encodeURIComponent(username)}/events`,
      { signal: request.signal }
    );
    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error || `Request failed with HTTP ${response.status}.`);
    }

    showActivities(body.username, body.events);
  } catch (error) {
    if (error.name !== "AbortError") {
      setStatus(
        error instanceof Error ? error.message : "Could not load GitHub activity.",
        "error"
      );
    }
  } finally {
    if (activeRequest === request) {
      activeRequest = undefined;
      searchButton.disabled = false;
      statusRegion.setAttribute("aria-busy", "false");
    }
  }
});

usernameInput.addEventListener("input", () => {
  clearButton.disabled = usernameInput.value.length === 0;
});

clearButton.addEventListener("click", () => {
  activeRequest?.abort();
  activeRequest = undefined;
  form.reset();
  clearButton.disabled = true;
  searchButton.disabled = false;
  statusRegion.setAttribute("aria-busy", "false");
  setStatus("");
  resultsRegion.hidden = true;
  activityList.replaceChildren();
  welcomeState.hidden = false;
  usernameInput.focus();
});

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : "Updated";
}

function formatEvent(activity) {
  const { type, repository, details } = activity;

  switch (type) {
    case "PushEvent": {
      const count = details.commitCount;
      const commits =
        typeof count === "number"
          ? `${count} commit${count === 1 ? "" : "s"}`
          : "changes";
      const branch = details.ref?.replace(/^refs\/heads\//, "");
      const destination = branch ? ` to ${branch}` : "";
      return `Pushed ${commits}${destination} in ${repository}.`;
    }
    case "IssuesEvent": {
      const number = details.number !== undefined ? ` #${details.number}` : "";
      const title = details.title ? ` "${details.title}"` : "";
      return `${capitalize(details.action)} issue${number}${title} in ${repository}.`;
    }
    case "WatchEvent":
      return `Starred ${repository}.`;
    case "CreateEvent": {
      const created = [details.refType, details.ref].filter(Boolean).join(" ");
      return `Created ${created || "a resource"} in ${repository}.`;
    }
    case "PullRequestEvent": {
      const number = details.number !== undefined ? ` #${details.number}` : "";
      const title = details.title ? ` "${details.title}"` : "";
      return `${capitalize(details.action)} pull request${number}${title} in ${repository}.`;
    }
    case "DeleteEvent": {
      const deleted = [details.refType, details.ref].filter(Boolean).join(" ");
      return `Deleted ${deleted || "a resource"} in ${repository}.`;
    }
    case "ForkEvent":
      return details.forkedRepository
        ? `Forked ${repository} as ${details.forkedRepository}.`
        : `Forked ${repository}.`;
    case "ReleaseEvent": {
      const release = details.name || details.tagName;
      const label = release ? ` "${release}"` : "";
      return `${capitalize(details.action || "Published")} release${label} in ${repository}.`;
    }
    default:
      return `Recorded ${type} in ${repository}.`;
  }
}

export function formatActivity(activities) {
  if (activities.length === 0) {
    return ["No recent public activity found."];
  }

  return activities.map(formatEvent);
}

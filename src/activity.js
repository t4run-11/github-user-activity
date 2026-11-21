function getEventDetails(event) {
  const payload = event.payload ?? {};

  switch (event.type) {
    case "PushEvent":
      return { ref: payload.ref, commitCount: payload.size };
    case "IssuesEvent":
      return {
        action: payload.action,
        number: payload.issue?.number,
        title: payload.issue?.title,
      };
    case "WatchEvent":
      return { action: payload.action };
    case "CreateEvent":
      return { refType: payload.ref_type, ref: payload.ref };
    case "PullRequestEvent":
      return {
        action: payload.action,
        number: payload.pull_request?.number,
        title: payload.pull_request?.title,
      };
    case "DeleteEvent":
      return { refType: payload.ref_type, ref: payload.ref };
    case "ForkEvent":
      return { forkedRepository: payload.forkee?.full_name };
    case "ReleaseEvent":
      return {
        action: payload.action,
        name: payload.release?.name,
        tagName: payload.release?.tag_name,
      };
    default:
      return {};
  }
}

export function processActivity(events) {
  if (!Array.isArray(events)) {
    throw new TypeError("Expected GitHub activity to be an array.");
  }

  return events.map((event) => {
    if (
      !event ||
      typeof event.type !== "string" ||
      typeof event.repo?.name !== "string" ||
      typeof event.created_at !== "string"
    ) {
      throw new TypeError("GitHub activity contains an event with an unexpected structure.");
    }

    return {
      type: event.type,
      repository: event.repo.name,
      createdAt: event.created_at,
      details: getEventDetails(event),
    };
  });
}

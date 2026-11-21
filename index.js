import { fetchUserEvents } from "./src/github.js";
import { processActivity } from "./src/activity.js";
import { formatActivity } from "./src/formatter.js";
import { saveActivity } from "./src/storage.js";
import { isValidUsername } from "./src/validator.js";

async function main() {
  const args = process.argv.slice(2);
  const username = args[0];
  const shouldSave = args.includes("--save");
  const unexpectedArguments = args
    .slice(1)
    .filter((argument) => argument !== "--save");

  if (!username || unexpectedArguments.length > 0) {
    console.error("Usage: node index.js <github-username> [--save]");
    process.exitCode = 1;
    return;
  }

  if (!isValidUsername(username)) {
    console.error("Invalid GitHub username. Use 1-39 letters, numbers, or single hyphens; it cannot start or end with a hyphen.");
    process.exitCode = 1;
    return;
  }

  let events;
  try {
    events = await fetchUserEvents(username);
  } catch (error) {
    console.error(`Could not fetch GitHub activity: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  let activities;
  try {
    activities = processActivity(events);
  } catch (error) {
    console.error(`Could not process GitHub activity: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const descriptions = formatActivity(activities);
  console.log(descriptions.join("\n"));

  if (shouldSave) {
    try {
      const filePath = await saveActivity(username, events);
      console.log(`Saved raw activity JSON to ${filePath}.`);
    } catch (error) {
      console.error(`Could not save GitHub activity: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

await main();

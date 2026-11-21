import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const activityFilePath = join(sourceDirectory, "data", "activity.json");

export async function saveActivity(username, events) {
  await mkdir(dirname(activityFilePath), { recursive: true });

  const savedData = {
    username,
    fetchedAt: new Date().toISOString(),
    events,
  };

  await writeFile(activityFilePath, `${JSON.stringify(savedData, null, 2)}\n`, "utf8");
  return activityFilePath;
}

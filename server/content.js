import { readFileSync } from "node:fs";

export function loadScenario(
  path = new URL("../content/grc-v1.json", import.meta.url),
) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  for (const key of [
    "id",
    "version",
    "name",
    "roles",
    "zones",
    "phases",
    "guides",
  ]) {
    if (!data[key]) throw new Error(`Scenario is missing ${key}`);
  }
  for (const collection of ["roles", "zones", "phases", "guides"]) {
    const ids = data[collection].map((item) => item.id);
    if (new Set(ids).size !== ids.length)
      throw new Error(`Duplicate ${collection} id`);
  }
  if (data.phases.reduce((sum, phase) => sum + phase.minutes, 0) !== 240)
    throw new Error("Session duration must total 240 minutes");
  for (const zone of data.zones)
    if (!data.roles.some((role) => role.id === zone.owner))
      throw new Error(`Invalid owner: ${zone.id}`);
  return data;
}

export { publicRole, elapsedSeconds, currentPhase } from './domain.js';

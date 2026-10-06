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

export function publicRole(role) {
  return {
    id: role.id,
    name: role.name,
    shortName: role.shortName,
    icon: role.icon,
    color: role.color,
    goal: role.goal,
    responsibility: role.responsibility,
    partners: role.partners,
  };
}

export function elapsedSeconds(workshop, now = Date.now()) {
  const running =
    workshop.status === "running" && workshop.started_at
      ? Math.max(0, (now - workshop.started_at) / 1000)
      : 0;
  return Math.min(14400, Math.floor(workshop.elapsed + running));
}

export function currentPhase(phases, elapsed) {
  let end = 0;
  return (
    phases.find((phase) => {
      end += phase.minutes * 60;
      return elapsed < end;
    }) || phases.at(-1)
  );
}

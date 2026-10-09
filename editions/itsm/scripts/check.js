import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { loadScenario } from "../server/content.js";
function files(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(path, entry.name))
      : join(path, entry.name),
  );
}
for (const file of ["server", "public", "test", "scripts"]
  .flatMap(files)
  .filter((f) => /\.m?js$/.test(f))) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status || 1);
}
const scenario = loadScenario();
console.log(
  `JavaScript syntax OK. Scenario: ${scenario.roles.length} roles, ${scenario.zones.length} zones, ${scenario.phases.reduce((n, p) => n + p.minutes, 0)} minutes.`,
);

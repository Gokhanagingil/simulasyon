export function publicRole(role) {
  return Object.fromEntries(['id','name','shortName','icon','color','goal','responsibility','partners'].map(key => [key, role[key]]));
}
export function elapsedSeconds(workshop, now = Date.now()) {
  const running = workshop.status === 'running' && workshop.started_at ? Math.max(0,(now-workshop.started_at)/1000) : 0;
  return Math.min(14400, Math.floor(workshop.elapsed + running));
}
export function currentPhase(phases, elapsed) {
  let end=0;
  return phases.find(phase => {end += phase.minutes*60; return elapsed < end;}) || phases.at(-1);
}

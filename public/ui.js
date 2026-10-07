export const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const initials = (name) =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toLocaleUpperCase("tr");
export const time = (seconds) =>
  `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(Math.floor(seconds) % 60).padStart(2, "0")}`;
export const statuses = {
  open: { label: "Açık", class: "open" },
  monitor: { label: "İzlemde", class: "monitor" },
  closed: { label: "Ziyarete kapalı", class: "closed" },
};
const paths = {
  leaf: "M20 4c-8-1-15 1-15 8a7 7 0 0 0 7 7c7 0 9-7 8-15ZM4 21l11-11",
  map: "m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm4-16-3 7-7 3 3-7 7-3Z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.87a4 4 0 0 1 0 7.75",
  user: "M20 21v-2a7 7 0 0 0-14 0v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  clock: "M12 8v5l3 2m7-3a10 10 0 1 0-20 0 10 10 0 0 0 20 0Z",
  book: "M12 7C9 4 5 4 2 5v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-3-1-7-1-10 2Zm0 0v14",
  settings:
    "m9 3 1-1h4l1 1 1 3 3 1 2 3v4l-2 3-3 1-1 3-1 1h-4l-1-1-1-3-3-1-2-3v-4l2-3 3-1 1-3Zm3 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4",
  chevron: "m9 5 7 7-7 7",
  down: "m6 9 6 6 6-6",
  close: "m6 6 12 12M6 18 18 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  logout: "M9 5H3v14h6m5-14 7 7-7 7m-7-7h14",
  play: "m8 4 13 8-13 8V4Z",
  pause: "M8 4v16M16 4v16",
  check: "m5 12 4 4L19 6",
  lock: "M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z",
  search: "m21 21-5-5m2-6a8 8 0 1 0-16 0 8 8 0 0 0 16 0Z",
  paw: "M7 14c-5 5-1 9 5 6 6 3 10-1 5-6-3-4-7-4-10 0ZM5 7a2 3 0 1 0 0 .1ZM10 4a2 3 0 1 0 0 .1ZM16 4a2 3 0 1 0 0 .1ZM21 8a2 3 0 1 0 0 .1Z",
  waves: "M2 7q3-4 6 0t6 0 6 0M2 12q3-4 6 0t6 0 6 0M2 17q3-4 6 0t6 0 6 0",
  feather: "M20 4C13-3 1 10 7 16c7 6 20-6 13-12ZM3 21 15 9m-8 7 7 1m-3-5 7 1",
  heart: "M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-6 5 1 12 8 17 7-5 14-12 8-17Z",
  shield: "m12 2 9 4v7c-1 5-5 7-9 9-4-2-8-4-9-9V6l9-4Zm-4 10 3 3 5-6",
  box: "m3 6 9-4 9 4v12l-9 4-9-4V6Zm0 0 9 5 9-5m-9 5v11M7 4l10 5",
  bolt: "m13 2-9 12h7l-1 8 10-13h-7l0-7Z",
  ticket: "M3 5h18v5c-4 0-4 4 0 4v5H3v-5c4 0 4-4 0-4V5Zm12 1v3m0 3v2m0 3v2",
  wrench: "M21 3a6 6 0 0 1-8 8l-9 10-3-3 10-9a6 6 0 0 1 8-8l-4 4 4 4 4-4",
  clipboard: "M9 4H5v18h14V4h-4M9 2h6v5H9V2Zm-1 11 2 2 5-5m-7 8h7",
  print: "M6 9V2h12v7M6 17H2V9h20v8h-4M6 14h12v8H6v-8Z",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5",
  menu: "M4 6h16M4 12h16M4 18h16",
  mail: "M3 4h18v16H3V4Zm0 1 9 8 9-8",
  edit: "m14 4 6 6M3 21l2-7L17 2l5 5-12 12-7 2Z",
  info: "M12 8h.01M12 11v6m10-5a10 10 0 1 0-20 0 10 10 0 0 0 20 0Z",
};
export function icon(name, className = "") {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.leaf}"/></svg>`;
}
export function badge(status) {
  const s = statuses[status] || statuses.open;
  return `<span class="status ${s.class}"><span></span>${s.label}</span>`;
}
export function avatar(name, color = "sage", size = "") {
  return `<span class="avatar ${escape(color)} ${size}" aria-hidden="true">${escape(initials(name))}</span>`;
}

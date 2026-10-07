import { escape } from "./ui.js";

// A schematic operational plan. These eight stable keys are shared by both
// scenario packs; changing the drawing must not change zone interactions.
const regions = {
  savanna: {
    d: "M60 79H343L373 109V236L342 281H92L60 251Z",
    label: [74, 94, 160],
    ground: "#dbe0d3",
    name: "Savan",
  },
  birds: {
    d: "M403 79H593V264L574 281H420L403 264Z",
    label: [416, 94, 164],
    ground: "#d6dfd5",
    name: "Kuş alanı",
  },
  water: {
    d: "M621 79H878L918 119V252L889 281H650L621 252Z",
    label: [635, 94, 169],
    ground: "#dfe5e1",
    name: "Su Yaşamı",
  },
  clinic: {
    d: "M60 363H228V494H60Z",
    label: [72, 375, 143],
    ground: "#e4e4dc",
    name: "Klinik",
  },
  education: {
    d: "M252 363H454V494H252Z",
    label: [264, 375, 177],
    ground: "#e2e4db",
    name: "Eğitim merkezi",
  },
  depot: {
    d: "M659 363H794V494H659Z",
    label: [670, 375, 113],
    ground: "#e7e3d9",
    name: "Depo",
  },
  utilities: {
    d: "M818 363H918V494H818Z",
    label: [825, 375, 86],
    ground: "#e1e5df",
    name: "Altyapı",
  },
  entrance: {
    d: "M478 394H635V514H478Z",
    label: [486, 406, 141],
    ground: "#e5e3d9",
    name: "Ziyaretçi merkezi",
  },
};

const landscape = {
  savanna: `
    <path d="M62 139C118 111 141 149 205 133S314 125 372 157M61 156C115 125 153 169 207 151S311 145 373 177M63 174C123 147 151 189 217 171S315 168 373 198M66 193C127 173 157 211 220 191S324 187 371 219" fill="none" stroke="#b8c3ae" stroke-width=".8"/>
    <path d="M89 175C113 153 151 167 161 191S153 237 125 244L90 232Z" fill="#c7d2bd" stroke="#aab9a0" stroke-width=".8"/>
    <path d="M100 184C122 168 144 176 149 197S140 226 117 232M110 189C126 181 139 188 139 203S132 222 119 223" fill="none" stroke="#acbba2" stroke-width=".7"/>
    <path d="M263 208C287 190 322 195 337 214L329 239C311 251 280 242 267 232Z" fill="#a9bdbe" stroke="#809b9e" stroke-width="1"/>
    <path d="M277 214C293 204 316 208 325 218M278 223C293 215 309 220 318 226" fill="none" stroke="#c6d5d4" stroke-width="1"/>
    <path d="M191 129V257M181 248H259" fill="none" stroke="#919d8b" stroke-dasharray="3 4" stroke-width=".9"/>
    <g fill="#d2d5c8" stroke="#7b8978" stroke-width=".9"><path d="M281 129H340V151H281Z"/><path d="M281 139H340M310 129V151" fill="none"/></g>
    <path d="M83 268H143M83 265V271M103 265V271M123 265V271M143 265V271" stroke="#8d9a85" stroke-width="1"/>
    <path d="M348 201V230M343 205H353M343 215H353M343 225H353" fill="none" stroke="#8d9a85" stroke-width="1"/>
  `,
  birds: `
    <path d="M422 131H574V252H422Z" fill="url(#park-hatch)" stroke="#9ba997" stroke-width=".8"/>
    <path d="M435 145H561V238H435Z" fill="#c8d5c6" stroke="#829781" stroke-width="1.2"/>
    <path d="M435 145 561 238M561 145 435 238M477 145V238M519 145V238M435 176H561M435 207H561" stroke="#9bad98" stroke-width=".7"/>
    <path d="M457 170C479 157 510 164 517 184S496 218 472 213S446 186 457 170Z" fill="#b7c8b5" stroke="#8fa38f" stroke-width=".8"/>
    <path d="M475 185C481 176 498 176 503 185S495 203 485 200S470 194 475 185Z" fill="#9bb7b6" stroke="#819e9e" stroke-width=".8"/>
    <path d="M450 257H546M449 252V263M473 252V263M497 252V263M521 252V263M545 252V263" fill="none" stroke="#8b9b87" stroke-width=".9"/>
  `,
  water: `
    <path d="M651 146 692 131H847L879 162V233L852 257H690L651 229Z" fill="#cbd6d2" stroke="#a4b4ae" stroke-width="1"/>
    <path d="M670 164C693 136 731 147 755 157S808 141 840 154S874 203 849 228S806 229 777 234S731 252 701 233S650 191 670 164Z" fill="#a8bdc0" stroke="#7d9c9f" stroke-width="1.1"/>
    <path d="M683 172C705 148 731 160 755 170S808 156 833 167S859 201 840 216S808 216 778 222S734 238 710 220S664 192 683 172Z" fill="none" stroke="#bfd0d0" stroke-width="1"/>
    <path d="M699 181C716 165 733 175 757 184S806 172 825 181S843 202 829 204S804 203 776 210S738 221 719 208S686 193 699 181Z" fill="none" stroke="#c6d4d4" stroke-width="1"/>
    <path d="M689 219 713 212 730 223 723 241 702 240Z" fill="#e1e3d5" stroke="#9aa998" stroke-width=".8"/>
    <path d="M871 148H891V226H871Z" fill="url(#park-deck)" stroke="#8f9c97" stroke-width=".8"/>
    <path d="M644 145H661V207H644Z" fill="#e9e7dd" stroke="#98aaa0" stroke-width=".8"/>
  `,
  clinic: `
    <path d="M77 417H150V434H199V477H77Z" fill="#c5ceca" stroke="#697e79" stroke-width="1.2"/>
    <path d="M88 428H140V466H88ZM153 444H186V466H153Z" fill="#d6ded8" stroke="#8a9b91" stroke-width=".8"/>
    <path d="M114 428V466M88 447H140M153 453H186" fill="none" stroke="#9aaba0" stroke-width=".6"/>
    <path d="M159 417H201V429H159Z" fill="#f0eee6" stroke="#a5aca0" stroke-width=".8"/>
    <path d="M173 415V422M169.5 418.5H176.5" stroke="#637f79" stroke-width="1.7"/>
    <path d="M210 416V480M205 424H215M205 443H215M205 462H215" fill="none" stroke="#a5ada1" stroke-width=".8"/>
  `,
  education: `
    <path d="M275 418H428V477H275Z" fill="#cbd2c8" stroke="#6f8072" stroke-width="1.2"/>
    <path d="M290 431H361V463H290Z" fill="#e3e7da" stroke="#94a28f" stroke-width=".8"/>
    <path d="M370 426H416V470H370ZM377 432H409V464H377Z" fill="#bdcbb9" stroke="#849a80" stroke-width=".8"/>
    <path d="M300 432V462M310 432V462M320 432V462M330 432V462M340 432V462M350 432V462" stroke="#b0bdaa" stroke-width=".6"/>
    <path d="M272 483H431M289 480V487M308 480V487M327 480V487M346 480V487M365 480V487M384 480V487M403 480V487M422 480V487" stroke="#9da999" stroke-width=".8"/>
  `,
  depot: `
    <path d="M678 416H775V463H678Z" fill="#ced0c6" stroke="#79847a" stroke-width="1.2"/>
    <path d="M684 424H769M684 431H769M684 438H769M684 445H769M684 452H769M727 416V463" stroke="#a0a99c" stroke-width=".8"/>
    <path d="M678 469H693V482H678ZM700 469H715V482H700ZM722 469H737V482H722Z" fill="#e3ded0" stroke="#9ca390" stroke-width=".8"/>
    <path d="M748 471H776M748 476H776M748 481H776" stroke="#a7ac9d" stroke-width=".8"/>
  `,
  utilities: `
    <path d="M831 416H905V452H831Z" fill="#b8c7c2" stroke="#6b8078" stroke-width="1.1"/>
    <path d="M838 423H898V445H838Z" fill="#849d99" stroke="#65837e" stroke-width=".8"/>
    <path d="M853 423V445M868 423V445M883 423V445M838 434H898" fill="none" stroke="#bed0c8" stroke-width=".7"/>
    <circle cx="843" cy="474" r="11" fill="#d1d8d0" stroke="#81958a" stroke-width="1"/>
    <circle cx="843" cy="474" r="6" fill="none" stroke="#a3b5a7" stroke-width=".7"/>
    <circle cx="874" cy="474" r="11" fill="#d1d8d0" stroke="#81958a" stroke-width="1"/>
    <circle cx="874" cy="474" r="6" fill="none" stroke="#a3b5a7" stroke-width=".7"/>
    <path d="M898 462V486M894 466H902M894 474H902M894 482H902" stroke="#8d9e8f" stroke-width=".8"/>
  `,
  entrance: `
    <path d="M492 448H621V481H580V495H534V481H492Z" fill="#cbd0c5" stroke="#758273" stroke-width="1.2"/>
    <path d="M502 458H526V472H502ZM588 458H612V472H588Z" fill="#e3e5d9" stroke="#9aaa96" stroke-width=".8"/>
    <path d="M537 450V482M550 450V482M563 450V482M576 450V482" stroke="#9daa94" stroke-width=".8"/>
    <path d="M504 504H610M515 500V508M529 500V508M584 500V508M598 500V508" stroke="#9ba58f" stroke-width=".9"/>
  `,
};

function perimeterPlanting() {
  // Plan symbols: fine concentric canopy outlines, never illustrated trees.
  const points = [
    [46, 140, 9], [45, 176, 8], [45, 213, 10], [43, 250, 8],
    [123, 64, 8], [160, 64, 9], [198, 64, 8], [234, 64, 7],
    [386, 135, 8], [385, 170, 7], [386, 208, 8], [386, 244, 7],
    [605, 131, 7], [605, 167, 6], [605, 206, 7], [605, 244, 6],
    [933, 160, 7], [934, 196, 8], [933, 233, 7], [932, 271, 8],
    [86, 343, 7], [119, 343, 8], [151, 343, 7], [185, 343, 7],
    [278, 343, 7], [312, 343, 7], [345, 343, 8], [379, 343, 7],
    [689, 343, 7], [727, 343, 8], [765, 343, 7], [843, 343, 7],
    [96, 514, 7], [132, 514, 8], [171, 514, 7], [208, 514, 7],
    [283, 514, 7], [317, 514, 7], [351, 514, 8], [388, 514, 7],
    [686, 514, 8], [723, 514, 7], [758, 514, 8], [843, 514, 8], [881, 514, 7],
  ];
  return points.map(([x, y, r]) => `<g transform="translate(${x} ${y})"><circle r="${r}" fill="#dce1d4" stroke="#aab6a1" stroke-width=".6"/><circle r="${r - 3}" fill="none" stroke="#bac5b0" stroke-width=".6"/><path d="M-2 0H2M0-2V2" stroke="#99a88f" stroke-width=".7"/></g>`).join("");
}

export function parkMap(zones = [], selected = "savanna", interactive = true) {
  const info = Object.fromEntries(zones.map((z) => [z.id, z]));
  const areas = Object.entries(regions).map(([id, r], i) => {
    const z = info[id] || { shortName: r.name, status: "open" };
    const status = ["open", "monitor", "closed"].includes(z.status) ? z.status : "open";
    const statusColor = { open: "#638477", monitor: "#aa8248", closed: "#a96a59" }[status];
    const statusName = { open: "Açık", monitor: "İzleniyor", closed: "Kapalı" }[status];
    const active = id === selected && interactive;
    const [x, y, width] = r.label;
    const name = z.shortName || r.name;
    const fontSize = id === "entrance" ? 11 : 12;
    return `<g class="map-region ${active ? "selected" : ""} ${status}" ${interactive ? `role="button" tabindex="0" data-zone="${id}" aria-label="${escape(z.name || name)}" aria-description="${statusName}" aria-pressed="${active}"` : ""}>
      <path class="zone-ground" d="${r.d}" fill="${r.ground}" stroke="${active ? "#3e645c" : "#a6b0a1"}" stroke-width="${active ? 2.6 : 1}"/>
      <g class="map-art" pointer-events="none">${landscape[id]}</g>
      <g class="zone-label" transform="translate(${x} ${y})" pointer-events="none">
        <rect x="0" y="0" width="${width}" height="29" rx="2" fill="#f5f5ed" fill-opacity=".95" stroke="${active ? "#6f8b79" : "#bfc7b7"}" stroke-width=".7"/>
        <text x="10" y="18.5" fill="#667760" font-family="ui-monospace, SFMono-Regular, monospace" font-size="9" font-weight="500">${String(i + 1).padStart(2, "0")}</text>
        <text x="30" y="18.5" fill="#35453d" font-size="${fontSize}" font-weight="600">${escape(name)}</text>
      </g>
      <circle cx="${x + 5}" cy="${y + 37}" r="3" fill="${statusColor}" stroke="#f1f2e9" stroke-width="1" pointer-events="none"/>
    </g>`;
  }).join("");

  return `<svg class="park-svg" viewBox="0 0 980 600" xmlns="http://www.w3.org/2000/svg" ${interactive ? 'role="group" aria-label="Mavi Vadi operasyon yerleşim planı. Bölge seçmek için haritayı veya klavyeyi kullanın."' : 'role="img" aria-label="Mavi Vadi operasyon yerleşim planı"'}>
    <defs>
      <pattern id="park-hatch" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M-2 7 7-2M5 9 9 5" stroke="#a6b2a0" stroke-width=".55" opacity=".45"/></pattern>
      <pattern id="park-deck" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0H5" stroke="#a6b0a5" stroke-width="1"/></pattern>
      <pattern id="park-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#d9ddcf" stroke-width=".4"/></pattern>
    </defs>
    <rect width="980" height="600" fill="#f1f1e9"/>
    <rect x="29" y="49" width="922" height="495" fill="url(#park-grid)" opacity=".6"/>
    <g fill="none" stroke="#d7ddce" stroke-width=".9" pointer-events="none">
      <path d="M31 70C103 49 159 62 220 52S316 42 365 59M32 83C105 61 163 75 223 65S316 55 354 68M27 460C46 414 20 377 42 344M945 373C923 324 966 325 948 285M646 531C716 523 752 536 800 526S911 529 946 507"/>
    </g>
    <g pointer-events="none" fill="none">
      <path d="M48 302H932V535H49V302M388 70V295M607 70V295" stroke="#c7ccc0" stroke-width="1" stroke-dasharray="4 4"/>
      <path d="M42 318H938M242 318V534M466 318V534M647 318V534M807 318V534M557 318V394M557 514V551" stroke="#d6d7cd" stroke-width="20" stroke-linejoin="miter"/>
      <path d="M42 318H938M242 318V534M466 318V534M647 318V534M807 318V534M557 318V394M557 514V551" stroke="#faf9f3" stroke-width="16" stroke-linejoin="miter"/>
      <path d="M242 339V534M466 339V534M647 339V534M807 339V534" stroke="#c8cdc0" stroke-width=".6" stroke-dasharray="5 8"/>
      <path d="M149 281V309M497 281V309M771 281V309M145 328V363M354 328V363M727 328V363M868 328V363" stroke="#c4cbbd" stroke-width="1"/>
    </g>
    <g class="map-art" pointer-events="none">${perimeterPlanting()}</g>
    ${areas}
    <g class="map-art" pointer-events="none">
      <g fill="#768375" font-family="ui-monospace, SFMono-Regular, monospace" font-size="8" letter-spacing="1">
        <text x="184" y="42">A</text><text x="387" y="42">B</text><text x="605" y="42">C</text><text x="824" y="42">D</text>
        <text x="18" y="177">01</text><text x="18" y="324">02</text><text x="18" y="446">03</text>
        <text x="75" y="321" font-size="7" letter-spacing="1.8">ANA GEÇİŞ</text>
        <text x="488" y="361" font-size="7" letter-spacing="1.2">GİRİŞ AKSI</text>
      </g>
      <g stroke="#aab5a2" stroke-width=".7" fill="none"><path d="M37 55V46H46M934 46H943V55M37 533V542H46M934 542H943V533"/><path d="M185 47V51M389 47V51M607 47V51M825 47V51"/></g>
      <g transform="translate(904 31)" stroke="#546958" fill="none" stroke-width="1"><path d="M0 10V-11M-4-4 0-12 4-4"/><text x="11" y="0" stroke="none" fill="#526955" font-size="8" font-weight="600">K</text></g>
      <g transform="translate(61 565)" fill="#637562" font-family="ui-monospace, SFMono-Regular, monospace" font-size="8">
        <path d="M0 0H80M0-3V3M40-3V3M80-3V3" fill="none" stroke="#697963" stroke-width="1"/><path d="M0-1H40" stroke="#697963" stroke-width="2"/>
        <text x="0" y="15">0</text><text x="36" y="15">25</text><text x="73" y="15">50 m</text>
        <text x="105" y="3" font-size="7" letter-spacing="1">REFERANS ÖLÇEK</text>
      </g>
      <path d="M538 540H576M538 535V545M576 535V545" stroke="#839478" stroke-width="1" fill="none"/>
      <text x="557" y="567" text-anchor="middle" fill="#74826a" font-size="8" letter-spacing="1.5">ANA GİRİŞ</text>
      <text x="920" y="568" text-anchor="end" fill="#7c8973" font-family="ui-monospace, SFMono-Regular, monospace" font-size="7.5" letter-spacing="1">MAVİ VADİ / ŞEMATİK YERLEŞİM</text>
    </g>
  </svg>`;
}

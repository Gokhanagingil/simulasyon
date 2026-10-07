import { escape } from "./ui.js";

const regions = {
  savanna: {
    d: "M76 117Q72 76 132 77L343 88Q402 88 423 148L408 269Q397 316 337 326L141 312Q77 300 65 245Z",
    label: [240, 336],
  },
  birds: {
    d: "M489 105Q543 64 628 78Q699 84 718 140L704 221Q674 264 609 254L515 250Q470 226 474 177Z",
    label: [596, 281],
  },
  water: {
    d: "M803 98Q906 59 1004 112Q1054 137 1054 206L1030 289Q991 334 908 321L829 302Q773 280 778 208Z",
    label: [919, 344],
  },
  clinic: {
    d: "M85 423Q122 399 202 409L246 425Q269 449 259 501L239 545Q174 557 112 537L79 512Z",
    label: [172, 564],
  },
  education: {
    d: "M344 450Q358 420 410 420L546 432Q584 444 588 483L575 556Q543 588 474 581L372 567Q329 549 332 496Z",
    label: [462, 600],
  },
  depot: {
    d: "M665 459Q704 433 769 450Q820 466 819 510L803 554Q755 579 697 563L663 534Z",
    label: [738, 592],
  },
  utilities: {
    d: "M872 402Q913 372 984 388L1034 420Q1057 455 1028 496L987 522Q922 530 881 495Z",
    label: [959, 549],
  },
  entrance: {
    d: "M481 635Q520 604 587 609Q655 605 699 641L694 687Q594 716 482 688Z",
    label: [589, 697],
  },
};
function trees() {
  const points = [
    [56, 75],
    [96, 55],
    [386, 57],
    [445, 79],
    [736, 77],
    [1050, 94],
    [1080, 144],
    [49, 295],
    [94, 343],
    [356, 356],
    [439, 310],
    [468, 347],
    [716, 307],
    [772, 332],
    [1068, 326],
    [38, 423],
    [63, 570],
    [116, 599],
    [239, 610],
    [300, 594],
    [650, 587],
    [816, 613],
    [862, 551],
    [1048, 568],
    [1030, 625],
    [902, 661],
    [768, 674],
    [417, 646],
    [350, 690],
    [210, 674],
    [143, 650],
    [67, 644],
    [545, 49],
    [680, 50],
    [938, 50],
    [1065, 250],
    [563, 351],
    [643, 349],
    [709, 394],
    [270, 371],
  ];
  return points
    .map(
      ([x, y], i) =>
        `<g transform="translate(${x} ${y}) scale(${0.65 + (i % 4) * 0.11})"><ellipse cy="14" rx="17" ry="8" fill="#557752" opacity=".12"/><path d="M0 9v12" stroke="#977d58" stroke-width="5"/><circle cx="-7" cy="0" r="15" fill="${i % 2 ? "#688766" : "#819767"}"/><circle cx="8" cy="-3" r="16" fill="${i % 2 ? "#86a07e" : "#9db28a"}"/><circle cy="-11" r="15" fill="${i % 2 ? "#96ad87" : "#adc198"}"/></g>`,
    )
    .join("");
}
const animalDefs = `
 <g id="lion"><ellipse cy="16" rx="27" ry="9" fill="#947044" opacity=".15"/><path d="M-19 3q-21 0-18-16" fill="none" stroke="#bb8952" stroke-width="4"/><circle cx="-36" cy="-15" r="4" fill="#8c643d"/><ellipse rx="25" ry="13" fill="#d3a462"/><path d="M-12 8v11M9 8v11" stroke="#bd8d53" stroke-width="7" stroke-linecap="round"/><circle cx="22" cy="-4" r="18" fill="#ad7850"/><circle cx="22" cy="-5" r="12" fill="#e2b776"/><circle cx="15" cy="-16" r="4" fill="#cb9d62"/><circle cx="28" cy="-16" r="4" fill="#cb9d62"/><circle cx="18" cy="-7" r="1.5" fill="#594b3a"/><circle cx="26" cy="-7" r="1.5" fill="#594b3a"/><path d="m19-1 3 3 3-3" fill="#6a523d"/></g>
 <g id="giraffe"><ellipse cy="32" rx="28" ry="9" fill="#947044" opacity=".13"/><path d="M-14 8v25M10 8v25" stroke="#c29859" stroke-width="6" stroke-linecap="round"/><ellipse cy="4" rx="25" ry="13" fill="#e3c17b"/><path d="M15 6 22-39" stroke="#e3c17b" stroke-width="12"/><ellipse cx="25" cy="-39" rx="13" ry="8" fill="#e3c17b"/><path d="m21-45-2-10m9 11 2-10" stroke="#ab834d" stroke-width="3"/><circle cx="31" cy="-41" r="1.7" fill="#524533"/><g fill="#b68a50"><circle cx="-10" cy="2" r="4"/><circle cx="1" cy="8" r="4"/><circle cx="9" cy="-1" r="4"/><circle cx="19" cy="-16" r="3"/><circle cx="21" cy="-29" r="3"/></g><path d="m-24 4-9-9" stroke="#af854c" stroke-width="3"/></g>
 <g id="zebra"><ellipse cy="19" rx="25" ry="7" fill="#6d7058" opacity=".13"/><path d="M-12 7v14M9 7v14" stroke="#697063" stroke-width="5" stroke-linecap="round"/><ellipse rx="24" ry="12" fill="#f7f4df"/><path d="m15 0 6-20" stroke="#f3efdc" stroke-width="11"/><ellipse cx="26" cy="-19" rx="11" ry="7" fill="#f4efdd"/><path d="m23-25-2-7m8 8 1-7M-16-8l4 18M-6-12l5 23M5-12l5 22M17-9l7 4M19-16l8 3" stroke="#647266" stroke-width="3.5"/><circle cx="30" cy="-21" r="1.5" fill="#495346"/><path d="m-23 2-8-6" stroke="#6e7463" stroke-width="3"/></g>
 <g id="penguin"><ellipse cy="17" rx="13" ry="6" fill="#4c7070" opacity=".14"/><path d="m-7 14-7 5m18-5 8 5" stroke="#d7a568" stroke-width="5" stroke-linecap="round"/><ellipse ry="22" rx="13" fill="#466564"/><ellipse cy="5" rx="9" ry="14" fill="#f6f2dc"/><circle cx="2" cy="-14" r="10" fill="#466564"/><path d="m10-16 10 5-11 2" fill="#dfa56e"/><circle cx="5" cy="-17" r="1.6" fill="#f6f5e9"/><path d="m-11-3-8 10" stroke="#466564" stroke-width="5" stroke-linecap="round"/></g>
 <g id="flamingo"><path d="m-2 8-4 24m10-16 10 9-8 8" stroke="#b98375" stroke-width="2.5" fill="none"/><ellipse rx="15" ry="9" fill="#dba28d"/><path d="M10 0c15-13-6-15 5-25" stroke="#dba28d" stroke-width="5" fill="none"/><circle cx="18" cy="-24" r="5" fill="#e6b09a"/><path d="m22-24 7 3-2 5" stroke="#836f60" stroke-width="3" fill="none"/></g>
 <g id="building"><path d="m-39 13 40 10 40-10v-44l-80 1Z" fill="#6c795f" opacity=".12"/><rect x="-40" y="-28" width="80" height="49" rx="4" fill="#f7f1d9"/><path d="m-47-20 47-25 47 25-47 16Z" fill="#b68a68"/><path d="m0-45 47 25-47 16Z" fill="#a97d5f"/><rect x="-9" y="2" width="18" height="19" rx="2" fill="#6d8e83"/><path d="M-31 0h13v12h-13Zm49 0h13v12H18Z" fill="#91b6a5"/></g>`;

export function parkMap(zones = [], selected = "savanna", interactive = true) {
  const info = Object.fromEntries(zones.map((z) => [z.id, z]));
  const ground = {
    savanna: "#e6d4a5",
    birds: "#bdcf9f",
    water: "#bdd4c3",
    clinic: "#ced8ba",
    education: "#d5d8b6",
    depot: "#d9c9a8",
    utilities: "#c6d1bd",
    entrance: "#d7d7b4",
  };
  const areas = Object.entries(regions)
    .map(([id, r], i) => {
      const z = info[id] || {
        shortName: {
          savanna: "Savan",
          birds: "Kuş alanı",
          water: "Su Yaşamı",
          clinic: "Klinik",
          education: "Eğitim merkezi",
          depot: "Depo",
          utilities: "Altyapı",
          entrance: "Ziyaretçi merkezi",
        }[id],
        status: "open",
      };
      const [x, y] = r.label;
      const width = z.shortName.length * 8 + 51;
      const statusColor =
        { open: "#4b8162", monitor: "#b28035", closed: "#b66858" }[z.status] ||
        "#4b8162";
      return `<g class="map-region ${id === selected && interactive ? "selected" : ""} ${z.status || "open"}" ${interactive ? `role="button" tabindex="0" data-zone="${id}" aria-label="${escape(z.name || z.shortName)}" aria-pressed="${id === selected}"` : ""}>
   <path class="zone-ground" d="${r.d}" fill="${ground[id]}" stroke="${id === selected && interactive ? "#476e54" : "#b5c4a0"}" stroke-width="${id === selected && interactive ? 3 : 1.5}"/>
   <path d="${r.d}" fill="url(#grain)" opacity=".2" pointer-events="none"/>
   <g class="zone-label" transform="translate(${x} ${y})"><rect x="${-width / 2}" y="-17" width="${width}" height="34" rx="17" fill="#faf9ef" stroke="#d2dac5" stroke-width="1"/><circle cx="${-width / 2 + 18}" r="4" fill="${statusColor}"/><text x="9" y="5" text-anchor="middle" fill="#344d3d" font-size="15" font-weight="600">${escape(z.shortName)}</text></g>
  </g>`;
    })
    .join("");
  return `<svg class="park-svg" viewBox="0 0 1110 750" xmlns="http://www.w3.org/2000/svg" ${interactive ? 'role="group" aria-label="Etkileşimli Mavi Vadi park haritası. Bir bölge seçin."' : 'role="img" aria-label="Mavi Vadi hayvanat bahçesinin çizimi"'}>
 <defs>${animalDefs}<pattern id="grain" width="19" height="19" patternUnits="userSpaceOnUse"><circle cx="3" cy="4" r="1" fill="#8a9a66"/><circle cx="15" cy="14" r=".6" fill="#ffffff"/></pattern><pattern id="water-lines" width="38" height="25" patternUnits="userSpaceOnUse"><path d="M3 12q8-4 16 0" stroke="#c1ded3" stroke-width="2" fill="none"/></pattern></defs>
 <rect width="1110" height="750" fill="#e7edda"/>
 <path d="M-30 20Q275-55 472 11T1130 5V40Q852 83 664 54T261 55Q70 54-30 89Z" fill="#d6e2c5"/>
 <path d="M-20 665Q225 611 370 682T818 713Q1030 682 1130 641V770H-20Z" fill="#d9e5c7"/>
 <path d="M-30 374Q141 342 272 375T579 378Q793 354 1140 374M566 365Q530 451 598 648M281 370Q280 457 289 566M837 372Q831 445 842 563M591 368Q603 316 609 264" fill="none" stroke="#cdd2b6" stroke-width="28" stroke-linecap="round"/>
 <path d="M-30 374Q141 342 272 375T579 378Q793 354 1140 374M566 365Q530 451 598 648M281 370Q280 457 289 566M837 372Q831 445 842 563M591 368Q603 316 609 264" fill="none" stroke="#fbf4df" stroke-width="20" stroke-linecap="round"/>
 ${areas}
 <g class="map-art" pointer-events="none">
 <path d="M86 183Q209 154 386 186M128 270q71-29 132 7" stroke="#d2bd8b" stroke-width="2" stroke-dasharray="3 7" fill="none"/>
 <ellipse cx="348" cy="232" rx="35" ry="22" fill="#a9c3a3"/><ellipse cx="348" cy="229" rx="30" ry="17" fill="#87b7b0"/>
 <path d="M100 106v40m0-21h22M387 273v25m-12-15h25" stroke="#ba9a6a" stroke-width="4" stroke-linecap="round"/>
 <use href="#lion" transform="translate(178 235) scale(1.15)"/><use href="#lion" transform="translate(277 264) scale(.85)"/>
 <use href="#giraffe" transform="translate(304 153) scale(1.25)"/><use href="#zebra" transform="translate(166 142) scale(1.05)"/>
 <path d="M838 159Q914 113 993 157Q1031 189 992 244Q936 287 858 258Q805 226 838 159Z" fill="#87b9b2" stroke="#d0dec1" stroke-width="10"/>
 <path d="M838 159Q914 113 993 157Q1031 189 992 244Q936 287 858 258Q805 226 838 159Z" fill="url(#water-lines)"/>
 <ellipse cx="851" cy="137" rx="39" ry="22" fill="#e6e5d2"/><use href="#penguin" transform="translate(835 127) scale(.8)"/><use href="#penguin" transform="translate(868 136) scale(.65)"/>
 <g transform="translate(934 216) rotate(-20)"><ellipse rx="24" ry="17" fill="#6c9875"/><ellipse rx="17" ry="13" fill="#82a07c" stroke="#5f8c6e" stroke-width="2"/><circle cx="29" r="6" fill="#769b78"/><path d="m-13-11-15-10m39 10 12-9m-36 29-15 9m39-9 12 9" stroke="#769b78" stroke-width="7" stroke-linecap="round"/><path d="m0-12-8 7v9l8 8 8-8v-9Z" stroke="#648d6d" fill="none"/></g>
 <path d="M796 274q33 14 60 7" stroke="#d4c9a2" stroke-width="10" stroke-linecap="round"/>
 <ellipse cx="596" cy="189" rx="67" ry="39" fill="#92b8a0"/><ellipse cx="595" cy="184" rx="60" ry="34" fill="#a7cbc0"/>
 <use href="#flamingo" transform="translate(566 171) scale(.83)"/><use href="#flamingo" transform="translate(624 184) scale(.95)"/>
 <path d="M524 125q5-10 13 0 7-10 14 0M657 112q5-10 13 0 7-10 14 0" fill="none" stroke="#58755c" stroke-width="3" stroke-linecap="round"/>
 <use href="#building" transform="translate(163 474) scale(1.4)"/><rect x="152" y="449" width="23" height="7" rx="2" fill="#eff4e5"/><rect x="160" y="441" width="7" height="23" rx="2" fill="#eff4e5"/>
 <use href="#building" transform="translate(458 507) scale(1.8)"/>
 <path d="M368 539h41m-35 8v10m29-10v10M510 553h40m-34 7v8m28-8v8" stroke="#aa8e66" stroke-width="4" stroke-linecap="round"/>
 <use href="#building" transform="translate(739 509) scale(1.25)"/><g fill="#b29c72"><rect x="682" y="520" width="15" height="17" rx="2"/><rect x="700" y="526" width="14" height="17" rx="2"/></g>
 <g transform="translate(952 452)"><rect x="-45" y="-31" width="90" height="66" rx="7" fill="#b2beae"/><path d="M-49-29h99l-10-13h-78Z" fill="#8fa894"/><rect x="-33" y="-20" width="23" height="37" rx="3" fill="#e0e4cf"/><rect x="9" y="-20" width="23" height="37" rx="3" fill="#e0e4cf"/><path d="m-20-10-5 10h8l-6 11m44-21-5 10h8l-6 11" stroke="#d1ad62" stroke-width="3" fill="none"/></g>
 <g transform="translate(590 646)"><rect x="-63" y="-22" width="126" height="30" rx="4" fill="#f0e5c7"/><path d="m-73-23 73-20 73 20-12 9h-122Z" fill="#6e9175"/><path d="M-42 7v-14m42 14v-14m42 14v-14" stroke="#a69574" stroke-width="8"/><text x="0" y="-23" text-anchor="middle" fill="#f7f5df" font-size="10" letter-spacing="3">MAVİ VADİ</text></g>
 ${trees()}
 <g fill="#8b9d73" opacity=".5"><path d="m448 187 4-8 4 8m-10-15 3-7 3 7M335 621l4-8 4 8m-8-17 3-7 3 7M775 620l4-8 4 8m-10-16 3-7 3 7"/></g>
 <g transform="translate(1000 678)"><circle r="24" fill="#eff2e5" stroke="#cbd7bd"/><path d="m0-15 6 22-6-4-6 4Z" fill="#55755e"/><text y="-31" text-anchor="middle" fill="#55755e" font-size="10" letter-spacing="2">KUZEY</text></g>
 <g fill="#9b896f"><circle cx="324" cy="381" r="3"/><circle cx="332" cy="385" r="3"/><circle cx="741" cy="370" r="3"/><circle cx="751" cy="367" r="3"/><circle cx="597" cy="414" r="3"/></g>
 </g>
 </svg>`;
}

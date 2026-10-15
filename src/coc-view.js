// Free Time window: the Clash of Clans card and the "show my base" popup.
import { yearsPlaying, playingLabel, clanLabel, isValidBaseLink } from "./coc.js";

// ---- fill these two in ----
const START_YEAR = 2016; // TODO: the year you started playing
const BASE_LINK = "https://link.clashofclans.com/en?action=OpenLayout&id=TH14%3AHV%3AAAAACQAAAAL3Wl4_5dkux8nFtSfAPCH6";
// ---------------------------

const $ = (id) => document.getElementById(id);

async function init() {
  const label = playingLabel(yearsPlaying(START_YEAR));
  if (label) $("coc-since").textContent = `playing for ${label} · since ${START_YEAR}`;

  try {
    const res = await fetch("data/coc.json");
    if (!res.ok) throw new Error(res.status);
    const d = await res.json();
    $("coc-name").textContent = d.name;
    $("coc-tag").textContent = d.tag;
    $("coc-stats").innerHTML = [
      ["Town Hall", d.townHallLevel],
      ["War stars", d.warStars],
      ["Clan", clanLabel(d.clan)],
    ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  } catch {
    $("coc-name").textContent = "stats unavailable right now";
  }

  // Only show "copy my base" once a real layout link is filled in.
  const link = $("base-link");
  if (isValidBaseLink(BASE_LINK)) {
    link.href = BASE_LINK;
    link.hidden = false;
  }

  // "show my base" opens the screenshot as a popup
  // (the Free Time window itself is handled in main.js)
  wireDialog($("base-dialog"), $("base-open"), $("base-close"));
}

/** Open on button click; close on the close button or a click outside the window. */
function wireDialog(dialog, openBtn, closeBtn) {
  openBtn.addEventListener("click", () => dialog.showModal());
  closeBtn.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
}

init();

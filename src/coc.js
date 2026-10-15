// Pure helpers for the Clash of Clans card (tested in tests/coc.test.js).

/** Whole years since startYear, e.g. 2016 in 2026 -> 10. Never negative. */
export function yearsPlaying(startYear, now = new Date()) {
  const y = Number(startYear);
  if (!Number.isInteger(y) || y < 2012) return null; // CoC launched in 2012
  return Math.max(0, now.getFullYear() - y);
}

/** "10 years", "1 year", or "less than a year". */
export function playingLabel(years) {
  if (years === null) return "";
  if (years === 0) return "less than a year";
  return `${years} year${years === 1 ? "" : "s"}`;
}

/** "Clan Name · Lv 23", or a fallback when not in a clan. */
export function clanLabel(clan) {
  return clan ? `${clan.name} · Lv ${clan.level}` : "Not in a clan";
}

/** A base link is only usable if it's a real Clash of Clans layout link. */
export function isValidBaseLink(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "link.clashofclans.com" && u.searchParams.has("id");
  } catch {
    return false;
  }
}

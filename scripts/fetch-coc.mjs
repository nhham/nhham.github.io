// Fetches my Clash of Clans profile and saves the parts the site needs.
// Run with: npm run coc   (reads COC_API_KEY and COC_PLAYER_TAG from .env)
import { writeFileSync, mkdirSync } from "node:fs";

const key = process.env.COC_API_KEY;
const tag = process.env.COC_PLAYER_TAG;
if (!key || !tag) {
  console.error("Missing COC_API_KEY or COC_PLAYER_TAG in .env");
  process.exit(1);
}

const url = `https://api.clashofclans.com/v1/players/${encodeURIComponent(tag)}`;
const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
const body = await res.json();

if (!res.ok) {
  console.error(`API error ${res.status}: ${body.reason}`);
  process.exit(1);
}

const data = {
  fetchedAt: new Date().toISOString(),
  name: body.name,
  tag: body.tag,
  townHallLevel: body.townHallLevel,
  warStars: body.warStars,
  clan: body.clan ? { name: body.clan.name, level: body.clan.clanLevel } : null,
};

mkdirSync("data", { recursive: true });
writeFileSync("data/coc.json", JSON.stringify(data, null, 2));
console.log(`Saved data/coc.json for ${data.name}`);
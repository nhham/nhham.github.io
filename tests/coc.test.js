import { describe, it, expect } from "vitest";
import { yearsPlaying, playingLabel, clanLabel, isValidBaseLink } from "../src/coc.js";

const oct2026 = new Date("2026-10-15");

describe("yearsPlaying", () => {
  it("normal: 2016 to 2026 is 10", () => expect(yearsPlaying(2016, oct2026)).toBe(10));
  it("edge: started this year is 0", () => expect(yearsPlaying(2026, oct2026)).toBe(0));
  it("edge: a future year is 0, not negative", () => expect(yearsPlaying(2030, oct2026)).toBe(0));
  it("edge: before the game existed is invalid", () => expect(yearsPlaying(2005, oct2026)).toBeNull());
  it("edge: not a number is invalid", () => expect(yearsPlaying("abc", oct2026)).toBeNull());
});

describe("playingLabel", () => {
  it("plural", () => expect(playingLabel(10)).toBe("10 years"));
  it("singular", () => expect(playingLabel(1)).toBe("1 year"));
  it("zero", () => expect(playingLabel(0)).toBe("less than a year"));
  it("invalid shows nothing", () => expect(playingLabel(null)).toBe(""));
});

describe("clanLabel", () => {
  it("normal", () => expect(clanLabel({ name: "$DarkAssasin$", level: 23 })).toBe("$DarkAssasin$ · Lv 23"));
  it("edge: not in a clan", () => expect(clanLabel(null)).toBe("Not in a clan"));
});

describe("isValidBaseLink", () => {
  it("normal: a real layout link", () =>
    expect(isValidBaseLink("https://link.clashofclans.com/en?action=OpenLayout&id=TH14%3AHV%3AAAAA")).toBe(true));
  it("edge: the unfilled placeholder is rejected", () =>
    expect(isValidBaseLink("https://link.clashofclans.com/...")).toBe(false));
  it("edge: another website is rejected", () =>
    expect(isValidBaseLink("https://example.com/?id=1")).toBe(false));
  it("edge: not a URL at all", () => expect(isValidBaseLink("")).toBe(false));
});

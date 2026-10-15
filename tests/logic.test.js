import { describe, it, expect } from "vitest";
import { filterProjects, clampPosition, placeWindows } from "../src/logic.js";
import { projects } from "../src/projects.js";

const sample = [
  { id: "a", tags: ["web", "data"] },
  { id: "b", tags: ["web"] },
  { id: "c", tags: ["markets"] },
];
const ids = (list) => list.map((p) => p.id);

describe("filterProjects", () => {
  it("returns only projects with the chosen tag", () => {
    expect(ids(filterProjects(sample, "web"))).toEqual(["a", "b"]);
    expect(ids(filterProjects(sample, "markets"))).toEqual(["c"]);
  });

  it("returns every project for 'all' (this is what reset uses)", () => {
    expect(ids(filterProjects(sample, "all"))).toEqual(["a", "b", "c"]);
  });

  it("edge case: a tag nothing uses returns an empty list (empty state)", () => {
    expect(filterProjects(sample, "design")).toEqual([]);
  });

  it("edge case: a missing tag behaves like 'all'", () => {
    expect(filterProjects(sample, undefined)).toHaveLength(3);
  });

  it("does not change the original list", () => {
    const copy = structuredClone(sample);
    filterProjects(sample, "web");
    expect(sample).toEqual(copy);
  });

  it("every real project has at least one tag", () => {
    for (const p of projects) expect(p.tags.length).toBeGreaterThan(0);
  });

  it("every project link is a full https URL", () => {
    for (const p of projects) {
      for (const l of p.links ?? []) expect(l.url).toMatch(/^https:\/\//);
    }
  });
});

describe("clampPosition", () => {
  // desktop 1000 x 600, window 200 x 100
  it("leaves a position inside the desktop unchanged", () => {
    expect(clampPosition(300, 200, 200, 100, 1000, 600)).toEqual({ x: 300, y: 200 });
  });

  it("edge case: dragging past the left/top edge stops at 0", () => {
    expect(clampPosition(-50, -80, 200, 100, 1000, 600)).toEqual({ x: 0, y: 0 });
  });

  it("edge case: dragging past the right/bottom edge keeps the window fully visible", () => {
    expect(clampPosition(950, 700, 200, 100, 1000, 600)).toEqual({ x: 800, y: 500 });
  });

  it("edge case: a window wider than the desktop pins to 0", () => {
    expect(clampPosition(40, 10, 1200, 100, 1000, 600)).toEqual({ x: 0, y: 10 });
  });
});

describe("placeWindows", () => {
  const sizes = [{ w: 270, h: 250 }, { w: 270, h: 230 }, { w: 270, h: 260 }, { w: 270, h: 240 }];
  const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const boxes = (r) => r.positions.map((p, i) => ({ ...p, ...sizes[i] }));

  it("phones stack the windows (no positions)", () => {
    expect(placeWindows(390, 800, { x: 20, y: 40, w: 350, h: 300 }, sizes).mode).toBe("stack");
  });

  it("wide screens put windows beside the name without covering it or each other", () => {
    const hero = { x: 395, y: 250, w: 650, h: 300 };
    const r = placeWindows(1440, 840, hero, sizes);
    expect(r.mode).toBe("around");
    const b = boxes(r);
    for (const box of b) {
      expect(overlaps(box, hero)).toBe(false);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.w).toBeLessThanOrEqual(1440);
      expect(box.y + box.h).toBeLessThanOrEqual(r.height);
    }
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) expect(overlaps(b[i], b[j])).toBe(false);
  });

  it("edge case: a normal-size (not full screen) window tiles under the name instead of stacking", () => {
    const hero = { x: 200, y: 40, w: 500, h: 280 };
    const small = sizes.map((s) => ({ ...s, w: 240 }));
    const r = placeWindows(900, 650, hero, small);
    expect(r.mode).toBe("below");
    const b = r.positions.map((p, i) => ({ ...p, ...small[i] }));
    for (const box of b) {
      expect(box.y).toBeGreaterThanOrEqual(hero.y + hero.h);
      expect(box.x + box.w).toBeLessThanOrEqual(900);
      expect(overlaps(box, { ...r.folder, w: 96, h: 90 })).toBe(false);
    }
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) expect(overlaps(b[i], b[j])).toBe(false);
    expect(r.height).toBeGreaterThan(r.folder.y + 90); // desktop grows to fit
  });
});

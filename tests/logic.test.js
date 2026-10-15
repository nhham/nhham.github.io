import { describe, it, expect } from "vitest";
import { filterProjects, clampPosition } from "../src/logic.js";
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

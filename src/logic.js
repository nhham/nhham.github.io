// Pure logic for the desktop. No DOM access here, so every function can be
// unit-tested directly (see tests/logic.test.js).

export const TAGS = ["all", "web", "data", "design", "markets"];

/** Below this width (phones) the project windows stack in one column. */
export const STACK_MAX = 700;

/**
 * Return the projects that match a tag.
 * "all" (or a missing tag) returns every project.
 * An unknown tag returns an empty array, which the page shows as the empty state.
 */
export function filterProjects(projects, tag) {
  if (!tag || tag === "all") return [...projects];
  return projects.filter((p) => p.tags.includes(tag));
}

/**
 * Keep a dragged window fully inside an area.
 * x, y = where the window's top-left corner wants to go
 * w, h = window size;  maxW, maxH = area size
 */
export function clampPosition(x, y, w, h, maxW, maxH) {
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
  return { x: clamp(x, 0, maxW - w), y: clamp(y, 0, maxH - h) };
}

/**
 * Decide where the project windows go so they never cover the name.
 *   W, H   desktop size
 *   hero   the name block's box {x, y, w, h}
 *   sizes  each window's {w, h}
 * Returns { mode, positions, height }:
 *   "stack"  phones: windows stack in one column (CSS handles it)
 *   "around" wide screens: two windows left of the name, two on the right
 *   "below"  medium screens: name on top, windows tiled underneath in two
 *            staggered columns, so it still looks like a desktop
 *            (also returns where the free-time folder goes)
 */
export function placeWindows(W, H, hero, sizes) {
  if (W < STACK_MAX) return { mode: "stack", positions: [], height: H };

  const M = 16;      // edge margin
  const GAP = 24;    // space between windows and the name
  const DOCK = 96;   // keep clear of the dock at the bottom
  const maxW = Math.max(...sizes.map((s) => s.w));

  // ---- around: is there room beside the name for a window column? ----
  const sideRoom = hero.x - M - GAP;
  if (sideRoom >= maxW) {
    const positions = sizes.map((s, i) => {
      const right = i % 2 === 1;
      const lower = i >= 2;
      const gutter = hero.x - GAP;                     // width of each side gutter
      const xLeft = Math.max(M, Math.round((gutter - s.w) / 2));
      const x = right ? W - xLeft - s.w : xLeft;
      const yTop = right ? 40 : 24;                    // small stagger looks hand-placed
      const above = sizes[i - 2];
      const y = lower ? Math.max(yTop + above.h + 28, H - DOCK - s.h) : yTop;
      return { x, y };
    });
    const height = Math.max(H, ...positions.map((p, i) => p.y + sizes[i].h + DOCK));
    return { mode: "around", positions, height };
  }

  // ---- below: two staggered columns under the name ----
  const COLGAP = 28;
  const total = maxW * 2 + COLGAP;
  const x0 = Math.max(M, Math.round((W - total) / 2));
  let y = hero.y + hero.h + 36;
  const positions = [];
  for (let i = 0; i < sizes.length; i += 2) {
    const rowH = Math.max(sizes[i].h, (sizes[i + 1] || sizes[i]).h);
    positions.push({ x: x0, y });
    if (sizes[i + 1]) positions.push({ x: x0 + maxW + COLGAP, y: y + 22 });
    y += rowH + 22 + COLGAP;
  }
  // the free-time folder sits centered under the windows
  const folder = { x: Math.round(W / 2 - 48), y };
  return { mode: "below", positions, folder, height: Math.max(H, y + 110 + DOCK) };
}

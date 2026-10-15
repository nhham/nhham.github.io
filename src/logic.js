// Pure logic for the interactive desktop. No DOM access here, so every
// function can be unit-tested directly (see tests/logic.test.js).

export const TAGS = ["all", "web", "data", "design", "markets"];

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
 * Keep a dragged window fully inside the desktop.
 * x, y   = where the window's top-left corner wants to go
 * w, h   = window size
 * maxW, maxH = desktop size
 * Returns the closest position where the whole window is still visible.
 */
export function clampPosition(x, y, w, h, maxW, maxH) {
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
  return {
    x: clamp(x, 0, maxW - w),
    y: clamp(y, 0, maxH - h),
  };
}

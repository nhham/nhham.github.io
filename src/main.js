// Wires the pure logic (logic.js) to the page: project windows, layout,
// window buttons, the Free Time window, the dock, filter tabs, and the clock.
import { TAGS, STACK_MAX, filterProjects, clampPosition, placeWindows } from "./logic.js";
import { projects } from "./projects.js";

const $ = (id) => document.getElementById(id);
const desktop = $("desktop");
const windowsEl = $("windows");
const tabsEl = $("tabs");
const emptyEl = $("empty");
const freeWin = $("free-win");
const folder = $("free-open");
const isPhone = () => window.innerWidth < STACK_MAX;
let topZ = 10;
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let mode = null;            // "around" | "below" | "stack"
const moved = new Set();    // windows the visitor dragged keep their spot on resize

const lights = (name) => `
  <div class="lights">
    <button class="light close" type="button" data-act="close" aria-label="Close ${name}"></button>
    <button class="light min" type="button" data-act="min" aria-label="Minimize ${name}"></button>
    <button class="light max" type="button" data-act="max" aria-label="Expand ${name}"></button>
  </div>`;

// ---- build project windows ----
for (const p of projects) {
  const win = document.createElement("article");
  win.className = "window";
  win.dataset.id = p.id;
  win.innerHTML = `
    <div class="titlebar">${lights(p.file)}<span>${p.file}</span></div>
    <div class="body">
      <h2>${p.title}</h2>
      <p class="org">${p.org}</p>
      <p class="blurb">${p.blurb}</p>
      <div class="chips">
        ${p.tags.map((t) => `<span class="chip ${t}">${t}</span>`).join("")}
        <span class="status ${p.status === "shipped" ? "shipped" : ""}">● ${p.status}</span>
      </div>
      ${p.links?.length ? `<div class="links">${p.links
        .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label} ↗</a>`)
        .join("")}</div>` : ""}
    </div>`;
  windowsEl.appendChild(win);
  wireWindow(win, desktop);
}
freeWin.querySelector(".titlebar").insertAdjacentHTML("afterbegin", lights("free time"));
wireWindow(freeWin, null);

// ---- layout: place windows around (or under) the name ----
function heroBox() {
  // measure the actual text and buttons, not the full-width hero block
  const d = desktop.getBoundingClientRect();
  const rects = [];
  for (const el of desktop.querySelectorAll(".hero h1, .hero .lede, .hero .hint")) {
    const r = document.createRange();
    r.selectNodeContents(el);
    rects.push(r.getBoundingClientRect());
  }
  for (const b of desktop.querySelectorAll(".hero .btn")) rects.push(b.getBoundingClientRect());
  const x1 = Math.min(...rects.map((r) => r.left)), x2 = Math.max(...rects.map((r) => r.right));
  const y1 = Math.min(...rects.map((r) => r.top)), y2 = Math.max(...rects.map((r) => r.bottom));
  return { x: x1 - d.left, y: y1 - d.top, w: x2 - x1, h: y2 - y1 };
}

function setMode(next) {
  if (next !== mode) moved.clear();
  mode = next;
  desktop.dataset.layout = next;
}

function layout() {
  const wins = [...windowsEl.children];
  const W = desktop.clientWidth;
  const H = window.innerHeight - desktop.offsetTop; // visible height under the menu bar

  if (isPhone()) {
    setMode("stack");
    desktop.style.height = "";
    for (const w of wins) w.style.left = w.style.top = "";
    folder.style.left = folder.style.top = "";
    return;
  }

  // try "around" first; if it doesn't fit, switch the hero to the top and tile below
  desktop.style.height = Math.max(H, 560) + "px";
  for (const tryMode of ["around", "below"]) {
    desktop.dataset.layout = tryMode;
    const sizes = wins.map((w) => ({ w: w.offsetWidth, h: w.offsetHeight }));
    const r = placeWindows(W, Math.max(H, 560), heroBox(), sizes);
    if (r.mode !== tryMode) continue;
    setMode(r.mode);
    desktop.style.height = r.height + "px";
    wins.forEach((w, i) => {
      const p = moved.has(w.dataset.id)
        ? clampPosition(w.offsetLeft, w.offsetTop, w.offsetWidth, w.offsetHeight, W, r.height)
        : r.positions[i];
      w.style.left = p.x + "px";
      w.style.top = p.y + "px";
    });
    placeFileIcons();
    if (moved.has("folder")) {
      const p = clampPosition(folder.offsetLeft, folder.offsetTop, folder.offsetWidth, folder.offsetHeight, W, r.height);
      folder.style.left = p.x + "px"; folder.style.top = p.y + "px";
    } else {
      folder.style.left = r.folder ? r.folder.x + "px" : "";
      folder.style.top = r.folder ? r.folder.y + "px" : "";
    }
    return;
  }
}

// ---- window behavior: drag, bring to front, close / expand ----
function front(win) { win.style.zIndex = ++topZ; }

function wireWindow(win, area) {
  const bar = win.querySelector(".titlebar");
  let sx, sy, ox, oy, dragging = false;
  const bounds = () => area
    ? { W: area.clientWidth, H: area.clientHeight, top: 0 }
    : { W: window.innerWidth, H: window.innerHeight, top: 56 }; // fixed window stays under the menu bar

  win.addEventListener("pointerdown", () => front(win));
  bar.addEventListener("pointerdown", (e) => {
    if (isPhone() || e.target.closest(".light") || win.classList.contains("zoomed")) return;
    e.preventDefault();
    dragging = true;
    sx = e.clientX; sy = e.clientY; ox = win.offsetLeft; oy = win.offsetTop;
    win.classList.add("dragging");
    bar.setPointerCapture(e.pointerId);
  });
  bar.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const b = bounds();
    const p = clampPosition(ox + e.clientX - sx, oy + e.clientY - sy - b.top,
      win.offsetWidth, win.offsetHeight, b.W, b.H - b.top);
    win.style.left = p.x + "px";
    win.style.top = p.y + b.top + "px";
  });
  const stop = () => {
    if (!dragging) return;
    dragging = false;
    win.classList.remove("dragging");
    moved.add(win.dataset.id);
  };
  bar.addEventListener("pointerup", stop);
  bar.addEventListener("pointercancel", stop);

  win.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "close") closeWin(win);
    if (act === "min") minimizeWin(win);
    if (act === "max") {
      win.classList.toggle("zoomed");
      front(win);
      if (area && !isPhone()) {  // keep a bigger project window on the desktop
        const p = clampPosition(win.offsetLeft, win.offsetTop, win.offsetWidth, win.offsetHeight, area.clientWidth, area.clientHeight);
        win.style.left = p.x + "px"; win.style.top = p.y + "px";
      }
    }
  });
}

// ---- the Mac "genie" (suck) effect ----
// The window's bottom pinches toward the target while it slides and shrinks into it.
// Run backwards (reverse = true) to pop a window back out.
function genie(win, target, { reverse = false, duration = 420 } = {}) {
  if (calm()) return Promise.resolve();
  const w = win.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const dx = t.left + t.width / 2 - (w.left + w.width / 2);
  const dy = t.top + t.height / 2 - (w.top + w.height / 2);
  const below = dy > 0;                                     // sucked down (dock) or up?
  const tx = Math.min(95, Math.max(5, ((t.left + t.width / 2 - w.left) / w.width) * 100));
  const pinch = below
    ? `polygon(0% 0%, 100% 0%, ${tx + 7}% 100%, ${tx - 7}% 100%)`
    : `polygon(${tx - 7}% 0%, ${tx + 7}% 0%, 100% 100%, 0% 100%)`;
  const frames = [
    { offset: 0, transform: "none", clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", opacity: 1 },
    { offset: 0.45, transform: `translate(${dx * 0.2}px, ${dy * 0.2}px) scale(0.85, 0.9)`, clipPath: pinch, opacity: 1 },
    { offset: 1, transform: `translate(${dx}px, ${dy}px) scale(0.04)`, clipPath: pinch, opacity: 0 },
  ];
  if (reverse) frames.reverse().forEach((f) => (f.offset = 1 - f.offset));
  return win.animate(frames, { duration, easing: reverse ? "cubic-bezier(.2,.8,.3,1)" : "cubic-bezier(.6,0,.8,.4)" }).finished;
}

const dock = document.querySelector(".dock");
const fileOf = (win) => projects.find((p) => p.id === win.dataset.id)?.file ?? "window";
const TAG_COLOR = { web: "#2563eb", data: "#16a34a", design: "#f2600c", markets: "#7c3aed" };
const colorOf = (win) => TAG_COLOR[projects.find((p) => p.id === win.dataset.id)?.tags[0]] ?? "#66625c";

function hide(win) { win.classList.add("gone"); win.classList.remove("zoomed"); }
async function show(win, from) {
  win.classList.remove("gone");
  front(win);
  await genie(win, from, { reverse: true });
}

// yellow: minimize into a tile in the dock; click the tile to bring it back
async function minimizeWin(win) {
  if (win === freeWin) return closeFree();
  if (!dock.querySelector(".dock-sep")) dock.insertAdjacentHTML("beforeend", '<span class="dock-sep" aria-hidden="true"></span>');
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "dock-item dock-mini";
  tile.dataset.win = win.dataset.id;
  tile.style.setProperty("--c", colorOf(win));
  tile.innerHTML = `<span class="ic mini-ic" aria-hidden="true">${win.querySelector("h2").textContent[0]}</span><span class="tip">${fileOf(win)}</span>`;
  tile.setAttribute("aria-label", `Restore ${fileOf(win)}`);
  dock.appendChild(tile);
  tile.addEventListener("click", async () => {
    await show(win, tile);
    removeTile(tile);
  });
  await genie(win, tile);
  hide(win);
}
function removeTile(tile) {
  tile.remove();
  if (!dock.querySelector(".dock-mini")) dock.querySelector(".dock-sep")?.remove();
}

// red: close into a file icon on the desktop where the window was; click it to reopen
async function closeWin(win) {
  if (win === freeWin) return closeFree();
  if (isPhone()) return minimizeWin(win);        // stacked phone layout: send it to the dock instead
  const icon = document.createElement("button");
  icon.type = "button";
  icon.className = "desk-file";
  icon.dataset.win = win.dataset.id;
  icon.style.setProperty("--c", colorOf(win));
  icon.innerHTML = `<span class="file-icon" aria-hidden="true"></span><span class="folder-name">${fileOf(win)}</span>`;
  icon.setAttribute("aria-label", `Reopen ${fileOf(win)}`);
  desktop.appendChild(icon);
  placeFileIcon(icon, win);
  icon.addEventListener("click", async () => {
    icon.remove();
    await show(win, icon);
  });
  await genie(win, icon.querySelector(".file-icon"));
  hide(win);
  icon.classList.add("pop-in");
}
function placeFileIcon(icon, win) {
  const x = win.offsetLeft + win.offsetWidth / 2 - icon.offsetWidth / 2;
  const y = win.offsetTop + 24;
  const p = clampPosition(x, y, icon.offsetWidth, icon.offsetHeight, desktop.clientWidth, desktop.clientHeight);
  icon.style.left = p.x + "px";
  icon.style.top = p.y + "px";
}
function placeFileIcons() {
  for (const icon of desktop.querySelectorAll(".desk-file")) {
    placeFileIcon(icon, windowsEl.querySelector(`[data-id="${icon.dataset.win}"]`));
  }
}
// bring back every closed or minimized window at once (used by the filter tabs)
function restoreAll() {
  for (const el of document.querySelectorAll(".desk-file, .dock-mini")) el.remove();
  dock.querySelector(".dock-sep")?.remove();
  for (const win of windowsEl.children) win.classList.remove("gone");
}

// ---- Free Time window (opened from the desktop folder or the dock) ----
// It pops out of whatever opened it and gets sucked back into it on close.
let lastOpener = null;

/** The transform that shrinks the window onto the opener's icon. */
function shrinkOnto(opener) {
  if (isPhone()) return "translateY(100%)";            // phones: slide up from the bottom
  const w = freeWin.getBoundingClientRect();
  const o = (opener || folder).getBoundingClientRect();
  const dx = o.left + o.width / 2 - (w.left + w.width / 2);
  const dy = o.top + o.height / 2 - (w.top + w.height / 2);
  return `translate(${dx}px, ${dy}px) scale(0.08)`;
}

function openFree(opener) {
  lastOpener = opener;
  const wasHidden = freeWin.hidden;
  freeWin.hidden = false;
  front(freeWin);
  if (wasHidden && !isPhone()) {
    // open centered in the visible screen
    freeWin.style.left = Math.max(16, (window.innerWidth - freeWin.offsetWidth) / 2) + "px";
    freeWin.style.top = Math.max(64, (window.innerHeight - freeWin.offsetHeight) / 2 - 30) + "px";
  }
  if (wasHidden && !calm()) {
    if (isPhone()) freeWin.animate([{ transform: shrinkOnto(opener) }, { transform: "none" }], { duration: 300, easing: "ease-out" });
    else genie(freeWin, opener || folder, { reverse: true });
  }
  syncFree();
  freeWin.querySelector(".light.close").focus({ preventScroll: true });
}

function closeFree() {
  const done = () => {
    freeWin.hidden = true;
    freeWin.classList.remove("zoomed");
    syncFree();
    (lastOpener || folder).focus({ preventScroll: true });
  };
  if (calm() || freeWin.hidden) return done();
  if (isPhone()) {
    freeWin.animate([{ transform: "none" }, { transform: shrinkOnto(lastOpener) }], { duration: 220, easing: "ease-in" }).onfinish = done;
  } else {
    genie(freeWin, lastOpener || folder).then(done);
  }
}

// ---- the free-time folder can be dragged around the desktop too ----
// A short press opens it; moving more than a few pixels drags it instead.
(() => {
  let sx, sy, ox, oy, pressed = false, dragging = false, justDragged = false;
  folder.addEventListener("pointerdown", (e) => {
    if (isPhone() || e.button !== 0) return;
    pressed = true; dragging = false;
    sx = e.clientX; sy = e.clientY; ox = folder.offsetLeft; oy = folder.offsetTop;
    folder.setPointerCapture(e.pointerId);
  });
  folder.addEventListener("pointermove", (e) => {
    if (!pressed) return;
    if (!dragging && Math.hypot(e.clientX - sx, e.clientY - sy) < 5) return;
    dragging = true;
    folder.classList.add("dragging");
    const p = clampPosition(ox + e.clientX - sx, oy + e.clientY - sy,
      folder.offsetWidth, folder.offsetHeight, desktop.clientWidth, desktop.clientHeight);
    folder.style.left = p.x + "px";
    folder.style.top = p.y + "px";
  });
  const stop = () => {
    if (!pressed) return;
    pressed = false;
    if (dragging) { justDragged = true; moved.add("folder"); }
    folder.classList.remove("dragging");
  };
  folder.addEventListener("pointerup", stop);
  folder.addEventListener("pointercancel", stop);
  // swallow the click that follows a drag so it doesn't open the window
  folder.addEventListener("click", (e) => {
    if (justDragged) { justDragged = false; e.stopImmediatePropagation(); }
  }, true);
})();

function syncFree() {
  const open = !freeWin.hidden;
  for (const b of document.querySelectorAll('[data-open="free"]')) b.classList.toggle("running", open);
  document.body.classList.toggle("sheet-open", open && isPhone());
}
for (const b of document.querySelectorAll('[data-open="free"]')) b.addEventListener("click", () => openFree(b));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !freeWin.hidden && !document.querySelector("dialog[open]")) closeWin(freeWin);
});

// ---- filter tabs (clicking one also brings back closed and minimized windows) ----
for (const tag of TAGS) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "tab";
  b.textContent = tag;
  b.dataset.tag = tag;
  b.setAttribute("aria-pressed", tag === "all" ? "true" : "false");
  b.addEventListener("click", () => applyFilter(tag));
  tabsEl.appendChild(b);
}
$("reset").addEventListener("click", () => applyFilter("all"));

function applyFilter(tag) {
  restoreAll();
  const visible = new Set(filterProjects(projects, tag).map((p) => p.id));
  for (const win of windowsEl.children) {
    const on = visible.has(win.dataset.id);
    win.classList.toggle("faded", !on);
    win.classList.toggle("pop", on && tag !== "all");
  }
  for (const b of tabsEl.children) b.setAttribute("aria-pressed", String(b.dataset.tag === tag));
  emptyEl.hidden = visible.size > 0;
  $("empty-tag").textContent = tag;
}

// ---- clock ----
const clock = $("clock");
const tick = () => (clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
tick();
setInterval(tick, 30_000);

// ---- start ----
layout();
document.fonts?.ready.then(layout);   // re-measure once the web font loads
let timer;
window.addEventListener("resize", () => {
  clearTimeout(timer);
  timer = setTimeout(() => { layout(); syncFree(); }, 80);
});

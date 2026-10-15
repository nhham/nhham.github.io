// Wires the pure logic (logic.js) to the page.
import { TAGS, filterProjects, clampPosition } from "./logic.js";
import { projects } from "./projects.js";

const desktop = document.getElementById("desktop");
const windowsEl = document.getElementById("windows");
const tabsEl = document.getElementById("tabs");
const emptyEl = document.getElementById("empty");
const emptyTag = document.getElementById("empty-tag");
const isStacked = () => window.matchMedia("(max-width: 1100px)").matches;
let topZ = 10;

// ---- build windows ----
for (const p of projects) {
  const win = document.createElement("article");
  win.className = "window";
  win.dataset.id = p.id;
  win.style.left = p.x + "%";
  win.style.top = p.y + "%";
  win.innerHTML = `
    <div class="titlebar"><i></i><i></i><i></i><span>${p.file}</span></div>
    <div class="body">
      <h2>${p.title}</h2>
      <p class="org">${p.org}</p>
      <p class="blurb">${p.blurb}</p>
      <div class="chips">
        ${p.tags.map((t) => `<span class="chip">${t}</span>`).join("")}
        <span class="status ${p.status === "shipped" ? "shipped" : ""}">● ${p.status}</span>
      </div>
      ${p.link ? `<a class="open" href="${p.link}" target="_blank" rel="noopener">open ↗</a>` : ""}
    </div>`;
  windowsEl.appendChild(win);
  makeDraggable(win);
}

// ---- filter tabs ----
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
document.getElementById("reset").addEventListener("click", () => applyFilter("all"));

function applyFilter(tag) {
  const visible = new Set(filterProjects(projects, tag).map((p) => p.id));
  for (const win of windowsEl.children) {
    const on = visible.has(win.dataset.id);
    win.classList.toggle("faded", !on);
    win.classList.toggle("pop", on && tag !== "all");
  }
  for (const b of tabsEl.children) b.setAttribute("aria-pressed", String(b.dataset.tag === tag));
  emptyEl.hidden = visible.size > 0;
  emptyTag.textContent = tag;
}

// ---- dragging (desktop only) ----
function makeDraggable(win) {
  const handle = win.querySelector(".titlebar");
  let startX, startY, origX, origY;

  handle.addEventListener("pointerdown", (e) => {
    if (isStacked()) return;
    e.preventDefault();
    win.style.zIndex = ++topZ;
    win.classList.add("dragging");
    startX = e.clientX; startY = e.clientY;
    origX = win.offsetLeft; origY = win.offsetTop;
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener("pointermove", (e) => {
    if (!win.classList.contains("dragging")) return;
    const { x, y } = clampPosition(
      origX + e.clientX - startX,
      origY + e.clientY - startY,
      win.offsetWidth, win.offsetHeight,
      desktop.clientWidth, desktop.clientHeight,
    );
    win.style.left = x + "px";
    win.style.top = y + "px";
  });

  const stop = () => win.classList.remove("dragging");
  handle.addEventListener("pointerup", stop);
  handle.addEventListener("pointercancel", stop);
}

// ---- clock ----
const clock = document.getElementById("clock");
const tick = () => (clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
tick();
setInterval(tick, 30_000);

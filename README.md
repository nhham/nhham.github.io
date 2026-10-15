# nathaniel ham: personal site

**Live:** https://nhham.github.io

A "desktop" style personal site showing what I'm working on right now (Regulate, SAIL 2027, NOBE) plus Priors.

## Interactive feature

- **Filter:** the tabs in the top bar (all · web · data · design · markets) bring matching project windows forward and fade the rest. A tag with no projects shows an empty-folder window with a **reset** button.
- **Drag:** on larger screens, drag any window by its title bar. Windows can't be dragged off the desktop; they stop at the edge.
- On screens narrower than 1100px the windows stack in one column and dragging is turned off.

The logic lives in `src/logic.js` as two pure functions (`filterProjects`, `clampPosition`), so it can be tested without a browser. `src/main.js` connects them to the page.

## Setup

Requires Node 20+.

```bash
git clone https://github.com/nhham/nhham.github.io.git
cd nhham.github.io
npm install
```

To view locally, serve the folder with any static server, e.g. `npx serve .` or `python3 -m http.server`, and open the printed URL. (Opening `index.html` directly won't work because the page uses JavaScript modules.)

## Tests and checks

```bash
npm run check   # every JS file parses, every linked file exists, page has title + viewport tag
npm test        # Vitest unit tests (tests/logic.test.js)
npm run build   # copies the site into dist/
```

Tests cover normal use and edge cases:
- filtering by a tag, "all"/reset, an unused tag (empty state), a missing tag, and that the original list isn't modified
- dragging inside the desktop, past the top/left edge, past the bottom/right edge, and a window wider than the desktop

## CI/CD

- **`.github/workflows/ci.yml`** runs checks, tests, and build on **every pull request** and every push to `main`.
- **Branch protection** on `main` requires the `checks-and-tests` job to pass before a PR can merge.
- **`.github/workflows/deploy.yml`** runs on every push to `main`: it re-runs checks and tests, builds, and deploys `dist/` to **GitHub Pages**. If anything fails, nothing deploys.

To update the site: branch → commit → open a PR → checks pass → merge → it deploys automatically.

To change the projects shown, edit `src/projects.js`.

## AI use and limitations

I used Claude (Anthropic) to help scaffold this project: the page layout and styling, the drag/filter logic, the tests, and the GitHub Actions workflows. I chose the design direction and content, reviewed and ran everything, and set up the repo, branch protection, and deployment myself.

Limitations: dragging uses pointer events and is disabled on small screens; window positions reset on reload; the tests cover the logic functions, not the visual layout.

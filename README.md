# nathaniel ham: personal site

**Live:** https://nhham.github.io

A "desktop" style personal site showing what I'm working on right now (Regulate, SAIL 2027, NOBE) plus Priors.

## Interactive feature

- **Filter:** the tabs in the top bar (all · web · data · design · markets) bring matching project windows forward and fade the rest. A tag with no projects shows an empty-folder window with a **reset** button.
- **Drag:** on larger screens, drag any window by its title bar. Windows can't be dragged off the desktop; they stop at the edge.
- On screens narrower than 1100px the windows stack in one column and dragging is turned off.

The logic lives in `src/logic.js` as two pure functions (`filterProjects`, `clampPosition`), so it can be tested without a browser. `src/main.js` connects them to the page.

## Free-time folder + Clash of Clans

The **free-time** folder on the desktop opens a window with my hobbies (volleyball, basketball, Clash of Clans). The Clash of Clans card shows my Town Hall, war stars, clan, how long I've played, and a **show my base** popup.

- Stats come from the official Clash of Clans API, but **the site never calls the API**. The API key is locked to whitelisted IP addresses and must stay secret, so `scripts/fetch-coc.mjs` runs on my own machine and saves only the fields the site needs to `data/coc.json`, which is committed. The page reads that file.
- To refresh the stats:
  1. Create `.env` in the repo root (it's in `.gitignore`, never commit it):
     ```
     COC_API_KEY=your-key-from-developer.clashofclans.com
     COC_PLAYER_TAG="#YOURTAG"
     ```
     The tag needs quotes because `.env` files treat `#` as a comment.
  2. Run `npm run coc`, then commit the updated `data/coc.json`.
- `START_YEAR` and `BASE_LINK` are set at the top of `src/coc-view.js`. The base screenshot is `assets/base.jpg`.
- Logic is in `src/coc.js` (`yearsPlaying`, `playingLabel`, `clanLabel`, `isValidBaseLink`) and tested in `tests/coc.test.js`, including edge cases like a future start year, not being in a clan, and an unfilled base link.

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

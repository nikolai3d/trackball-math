# Repository Guidelines

## Project Structure & Module Organization
This repo is a lightweight Three.js demo served directly from the project root. `index.html` bootstraps the scene and loads `three.min.js` (vendor copy) plus `main.js`. All custom logic lives in `main.js`, which groups scene setup, math utilities, and input behaviors. Add new helpers as focused modules inside `main.js`, or create additional `.js` files referenced from `index.html` if a feature grows beyond a single responsibility. Keep any static assets in the root for now; document new folders if you introduce them.

## Build, Test, and Development Commands
Run a local server so textures and shaders load correctly:
- `python3 -m http.server 8000` (serve root on http://localhost:8000)
- `npx http-server .` if you prefer a Node-based static server
Reload after edits to confirm changes. No bundler or build step is required today.

## Coding Style & Naming Conventions
Use four-space indentation and keep semicolons, mirroring existing code. Prefer `const`/`let`, descriptive camelCase for functions, and PascalCase for classes like `ObjectBehavior`. Group related utilities (e.g., `MatrixUtils`) and add brief comments only where the math is non-obvious. Avoid modifying `three.min.js`; drop in a new vendor file if you upgrade Three.js.

## Testing Guidelines
There is no automated test suite yet. After changes, launch the local server, rotate the zeppelin, toggle the grid, and check the browser console for warnings. When altering matrix math, validate extreme interactions (fast drags, repeated toggles) to catch regressions.

## Commit & Pull Request Guidelines
Follow the existing history: concise, imperative-style subjects (`Robust trackball rotation`, `World grid overlay`). Group related edits in a single commit. Pull requests should include: a summary of behavior changes, steps to reproduce testing, and screenshots or short clips for any visual adjustments. Link relevant issues and call out follow-up work if applicable.

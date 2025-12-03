<!-- Copilot / AI agent guidance for contributors -->
# Project snapshot & quick start

- **What this repo is:** A React + Vite single-page app using TailwindCSS and Supabase to store TTRPG character data.
- **Dev commands:** `npm install` then `npm run dev` (dev server), `npm run build` (production build), `npm run preview` (preview build), `npm run lint` (ESLint).

# High-level architecture (what matters to an AI)

- **Entry point / routing:** `src/main.jsx` mounts the app; `src/App.jsx` declares routes and connects pages in `src/pages/`.
- **Pages:** page components live in `src/pages/` (e.g. `SWCharacterOverview.jsx`, `SWEotECharacterCreator.jsx`) — they are large, stateful React components that fetch from Supabase.
- **API / persistence:** `src/supabaseClient.js` exports a `supabase` client used throughout. Supabase table names observed: `user`, `SW_player_characters`, `SW_equipment`, `skills`, `SW_abilities`, `races`, `SW_dice`, `SW_character_equipment`, `SW_career`.
- **Styling & build:** Vite (`vite.config.js`) + Tailwind (`tailwind.config.js`). Tailwind content scans `./src/**/*.{js,jsx,ts,tsx}`.

# Important project-specific patterns and conventions

- **LocalStorage-driven state:** pages expect `localStorage.username` and `localStorage.loadedCharacterId`; many pages early-return or navigate based on these values. Search for `localStorage.getItem`.
- **Supabase usage pattern:** components call `.from('<table>').select(...).eq(...).single()` or `.in()`; errors are logged with `console.error` and not always surfaced to UI. When modifying queries, preserve `.select()` fields used by the UI.
- **Comma-encoded fields:** fields such as `skills_rank` and `talents` are stored as comma-separated strings. Code frequently splits/parses these into arrays or counts — replicate that parsing when adding features.
- **Canvas assets & naming:** several components draw on `<canvas>` and load image resources with names like `/SW_<Stat>.png` and `/SW_Force_Rating.png`. Keep asset filenames and query params (`?t=${Date.now()}`) for cache-busting.
- **Dice strings:** dice pools are represented as color-letter strings (e.g. `GYYYB`) and mapped via `SW_dice` table to human-readable names (`colour` → `name`). When altering dice logic, update both the pool generator and UI clicks that open the dice popup.

# Where to look for behavior when debugging

- `src/pages/SWCharacterOverview.jsx`: largest stateful page — contains data-fetching logic, derived state (dice pools, soak/wound calculations), and many UI tables. Most Supabase interactions live here.
- `src/supabaseClient.js`: contains the Supabase URL and anon key — be careful: this repo currently includes an anon key in source.
- `src/App.jsx` + `src/main.jsx`: routing and app bootstrap; change here if you add new top-level routes.

# Integration & external dependencies

- **Supabase:** network calls to your Supabase instance. Tables and field names referenced in code must match the DB schema. Use the same column names when creating migrations or adding fields.
- **Tailwind + Vite plugins:** `@tailwindcss/vite` is used in `vite.config.js`; the project expects Tailwind to run via Vite during dev.

# Code style & small rules for PRs

- Keep changes minimal and localized to pages/components the feature affects. Many components rely on specific field names and derived state — refactors should preserve those contracts.
- Avoid moving data-parsing logic out of component fetchers unless you also update all call sites. For example, `skills_rank` splitting and rank counting are used by dice pool calculations.
- Preserve existing UI layout constraints (many components use fixed widths or inline styles for canvas and tables).

# Useful code examples (copy-paste friendly)

- Dev server: `npm run dev`
- Example Supabase query pattern used across pages:
  `const { data, error } = await supabase.from('SW_equipment').select('id, name, skill, damage, critical')` 

# Security & sensitive info

- `src/supabaseClient.js` contains an anon key. Treat it as part of the current environment; do not commit additional secrets here. If rotating keys, update this file and any environment deployment accordingly.

# If you need to add tests or run linters

- Lint: `npm run lint` (ESLint). There are no tests present — add scoped unit tests for small pure helpers rather than large page components.

# Quick notes for follow-up or missing info

- No project-level CI config found for tests or formatting; include scripts in `package.json` if adding automation.
- If anything in this guidance is unclear or you want more examples (e.g., typical Supabase table schemas, common UI flows), tell me which area to expand.

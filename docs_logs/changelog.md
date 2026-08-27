# Pumpkinzzz Changelog

This changelog documents the development history, structural designs, and code files added/modified for the Pumpkinzzz project schedule tracking application.

## [1.0.0-dev] - 2026-08-27 (CSV Workflow, Timeline, and Component Refactor)

### Changed
- **CSV import confirmation:** Product Type imports are parsed and staged before database changes. The confirmation view separates new product types from existing conflicts, supports per-row Keep existing/Keep imported choices, and provides Keep all existing/Keep all imported actions.
- **CSV import modes:** The confirmation view clearly identifies partial CSVs (product type plus components only) versus full CSV backups (schedules, milestones, components, and procurement lead times). Partial imports create invalid new product types; overwriting an existing product type clears its schedules, milestones, lead times, and component attachments. Full imports rebuild configuration and restore the exported product type status.
- **CSV component compatibility:** Full exports now write one component per lead-time row. Imports split semicolon-separated component values and support legacy exports that repeated the full component list, preserving individual component lead times. Components appearing on milestone rows are also attached.
- **Safe overwrite cleanup:** `src/renderer/utils/db.js` clears lead-time rows before milestones and avoids deleting schedules referenced by existing project records, preventing SQLite foreign-key failures during full imports.
- **Manual component creation:** Create and Attach reuses an existing global component when names match case-insensitively, avoiding duplicate-name constraint failures.
- **Milestone timeline:** Timeline entries show the direct relationship to their anchor and, only for deeper descendants, the cumulative relationship to the root milestone. Root and direct-root entries omit repeated information.
- **Collapsible CSV controls:** Batch Registration with CSV is collapsed by default and can be opened by clicking the section or arrow. It supports keyboard toggling and keeps action clicks from collapsing the section.
- **UI modularization:** Extracted presentation-only components from `ProductTypeManager.jsx`:
  - `src/renderer/components/BatchCsvSection.jsx` owns the collapsible CSV action panel.
  - `src/renderer/components/ImportReview.jsx` owns the two-table import confirmation view.
  - `src/renderer/components/MilestoneTimeline.jsx` owns pure timeline/tree presentation and calculations.
  `ProductTypeManager.jsx` remains the stateful container for database access, import/export handlers, product-type state, and callbacks.

### Current Architecture Notes
- The renderer uses explicit callback props between the stateful Product Type container and extracted presentation components. The extracted components do not import `db` or CSV utilities.
- Full backup CSVs include a `Product Type Status` column so status can be restored after import.
- Product-type overwrite cleanup preserves schedules referenced by projects; those schedules may be reused by the imported configuration rather than deleted.
- `ProductTypeManager.jsx` still contains the remaining detail tabs, CRUD handlers, import application logic, and modal markup. Further extraction should preserve the container/presentation boundary established above.

### Verification
- `conda run -n pumpkinzzz-env npm run build:frontend` passed after the refactor and CSV workflow changes.
- Editor diagnostics reported no errors in `ProductTypeManager.jsx`, `BatchCsvSection.jsx`, `ImportReview.jsx`, or `MilestoneTimeline.jsx`.
- Direct JSX parsing with esbuild passed for `ProductTypeManager.jsx`.

## [1.0.0-dev] - 2026-08-26 (Internal Test 2)

### Changed
- **Dashboard:** Added dynamic tab titles/subtitles, renamed the Projects tab, redesigned the selected-project banner and timeline, added milestone urgency summaries, and added milestone comparison bars with chronological validation.
- **Project Tracker:** Added configurable granular milestone statuses, persisted actual component received dates with before/after anchor status, and applied separate component urgency thresholds.
- **Settings:** Added separate Urgent and Very Urgent threshold inputs for milestones and components, persisted locally with the existing date preference.
- **Product Type Registry:** Changed the landing slogan, moved CSV actions into Bulk Registration, added contextual status help, anchored timing text, valid-schedule filtering for combined exports, milestone-only export, and full product-type backup export.
- **Product Registry:** Updated the landing slogan and guidance about valid or sub-valid schedules.
- **Database:** Added a backward-compatible `actual_received_dates` project column migration.

### Verification
- `conda run -n pumpkinzzz-env npm run build:frontend` passed.
- `conda run -n pumpkinzzz-env node scripts/check-phases.js` passed.
- Editor diagnostics and `git diff --check` passed.

### Follow-up
- Product Type destructive overwrite imports and pre-flight import confirmation are intentionally left for a dedicated acceptance pass because they can delete existing schedules.

## [1.0.0-dev] - 2026-08-26 (Sections 2-5)

### Changed
- **`src/renderer/components/ProjectTracker.jsx`:** Added an expandable project information panel, moved project editing beside that panel, displayed confirmed actual dates as text with an edit action, added date-format-aware output, and added independent sorting controls for milestone and component columns.
- **`src/renderer/components/Dashboard.jsx`:** Replaced the KPI-first view with Product, Product Type, and Components tabs. Product view now selects a project, shows expandable details, renders a vertical milestone timeline with consecutive durations, and supports user-defined milestone comparison bars with chronological validation.
- **`src/renderer/components/Settings.jsx` and `src/renderer/utils/date.js`:** Added a persistent local date-format setting supporting `yyyy-mm-dd` and `dd-mm-yyyy`, shared across dashboard and tracker displays.
- **`src/renderer/App.jsx`:** Added Settings navigation and passed the date preference to date-dependent screens.

### Verification
- `conda run -n pumpkinzzz-env npm run build:frontend` completed successfully after each implementation slice.
- `conda run -n pumpkinzzz-env node scripts/check-phases.js` passed all repository checks.
- Editor diagnostics reported no errors in the touched renderer files.

## [1.0.0-dev] - 2026-08-26

### Changed
- **`src/renderer/components/ProductTypeManager.jsx` (Internal Test 1 - Section 1.1 and 1.2):** Added the Product Type CSV template flow, three schedule views (relationship tree, chronological timelines, and master records), icon actions, friendly before/after milestone wording, searchable product-type/component attachment, and per-schedule validity feedback.
- **`README.md`:** Updated the project structure and Product Type Registry feature description for the `docs_logs/` document layout and Section 1 refinements.

### Verification
- `conda run -n pumpkinzzz-env npm run build:frontend` completed successfully.
- Editor diagnostics reported no errors for `ProductTypeManager.jsx`.

---

## [1.0.0-dev] - 2026-08-24

### Added
- **`plan.md`**: Detailed implementation architecture, unified milestone propagation rules, and 7-phase build tracker.
- **`changelog.md`**: Initiated this changelog to record progress and architectural revisions systematically.
- **`package.json`**: App manifest and scripts supporting concurrently running React (Vite) and Electron, with build targets configured for Windows and macOS.
- **`vite.config.js`**: Vite configuration supporting alias resolver (`@/` to `src/renderer/`), base URL for relative loading inside Electron, and hot-reload development servers.
- **`tailwind.config.js` & `postcss.config.js`**: Tailwind CSS integration for frontend layout design.
- **`index.html`**: Entry page wrapper for the React frontend, configured to load modular scripts locally.
- **`src/main.js`**: Electron main process. Controls browser window lifecycle, establishes local SQLite connection with foreign key constraints, implements schema initialization on startup, and sets up high-performance database querying, file system dialogue, and file access handlers over IPC.
- **`src/preload.js`**: Electron preload script. Exposes a secure, custom, type-safe API context window to the React renderer (`window.electronAPI`) using contextBridge.
- **`src/renderer/index.css`**: Tailwind base styling sheet for global typography and background colors.
- **`src/renderer/main.jsx`**: React renderer entry point initializing the strict mode context and mounting the App.
- **`src/renderer/App.jsx`**: Tabbed layout dashboard template containing the skeleton sidebar navigation and header bar.
- **`src/renderer/utils/scheduler.js`**: Core Scheduling Calculation Engine. Features:
  - Recursive top-down target deadline calculation for milestones (`Anchor Date + Offset (Days)`). Supports arbitrary nesting and chained custom milestones.
  - Component Order Deadline evaluation (`Anchor Milestone Date - Lead Time (Days)`) and dynamic urgency color-coding (Pending, On Track, Urgent, Extremely Urgent, Overdue).
- **`scripts/check-phases.js`**: An automated testing and validation script. Expanded to include **CHECK 4** verifying RFC 4180 CSV parsing, product type serialization alignments, and nested anchor relationship trees.
- **`src/renderer/utils/csv.js`**: Lightweight, RFC 4180-compliant CSV parser and generator with support for multi-pass schema interpretation (schedules, nested milestones, and lead times).
- **`src/renderer/components/ProductTypeManager.jsx`**: Feature-complete registry module for managing Product Types, Schedules, custom Milestone dependency chains, global parts, and Component-Schedule Lead Times, with interactive recursive visual tree structures and Electron bridge hooks.

- **`src/renderer/components/ProductRegistry.jsx`**: Manual product registration form and real-time spreadsheet grid bulk upload verifier with cell-level error flagging (clashing Tag Nos, missing compulsory fields, date formats).
- **`src/renderer/components/ProjectTracker.jsx`**: Project monitoring board providing live milestone countdowns, urgency color-coded component order tracking, and inline actual completion date recorders that instantly trigger downstream recursive tree re-propagations.

- **`src/renderer/components/Dashboard.jsx`**: Executive operations dashboard featuring real-time KPI metrics cards and an interactive timeline Gantt Chart visualizer tracking project durations and milestone markers.

- **`package.json`**: Configured `electron-builder` targets (`dmg` for macOS, `nsis` for Windows) and production build scripts to compile the standalone installer into the `release/` directory.

- **`src/renderer/components/ProductTypeManager.jsx` (Internal Test 1 - Section 1 Fixes)**:
  - Renamed title to "Product Type Registry" and added Validity Status Guide modal and inquiry button explaining `valid`, `sub-valid`, and `invalid` states (1.1.2).
  - Explicitly notified users that new product types start as `invalid` and require configuration (1.1.3).
  - Displayed duplicate name warnings inside the modal popup with friendly wording "Product type already exists" (1.1.4).
  - Added "Get CSV Template" for Product Types and "Get Schedule Template" for Schedules (1.1.5, 1.2.9).
  - Standardized Milestone Master Records edit and delete buttons to use icons (1.2.1).
  - Made Milestone Relationship Tree Diagram scrollable horizontally (`overflow-x-auto min-w-[700px]`, 1.2.2).
  - Encapsulated negative offset numbers into user-friendly 3-field milestone modal (`days`, `direction` before/after, anchor, 1.2.4).
  - Displayed friendly relationship text (e.g. `28 days after Production Start`) in Tree Diagram and Master Records table (1.2.5).
  - Added attached components search filter textbox (1.2.6).
  - Added individual "Save Lead Times for this Schedule" button per schedule card (1.2.7).
  - Added schedule validity status badges with hover tooltips (1.2.8).

---

## Current Status (Stage 7 of 7) ── [COMPLETED + SECTION 1 INTERNAL TEST REFINEMENTS]
- **Phase 1: Environment Setup** ── **[COMPLETED]** (Conda environment built, Node installed, Electron + React structure verified and compiling).
- **Phase 2: Database Schema & IPC Layer** ── **[COMPLETED]** (Schema designed and coded, database automatically instantiates local tables on startup, IPC handlers defined).
- **Phase 3 & Core Logic** ── **[COMPLETED]** (Propagating schedule and component logic written, verified and modularized).
- **Phase 4: Product Type Management UI** ── **[COMPLETED]** (Product Type list and details screen built with visual milestone relationship tree and CSV import/export handlers).
- **Phase 5: Product Registry & Project Tracker UI** ── **[COMPLETED]** (Manual project form, bulk CSV spreadsheet verifier with error-correction grid, and project tracker monitoring actual dates & countdowns).
- **Phase 6: Interactive Dashboard & Gantt Chart** ── **[COMPLETED]** (Executive dashboard with summary metric cards and interactive Gantt timeline visualizer).
- **Phase 7: Exporting & Packaging** ── **[COMPLETED]** (Configured `electron-builder` targets and release pipelines for Windows and macOS standalone installers).

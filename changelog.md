# Pumpkinzzz Changelog

This changelog documents the development history, structural designs, and code files added/modified for the Pumpkinzzz project schedule tracking application.

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

---

## Current Status (Stage 5 of 7)
- **Phase 1: Environment Setup** ── **[COMPLETED]** (Conda environment built, Node installed, Electron + React structure verified and compiling).
- **Phase 2: Database Schema & IPC Layer** ── **[COMPLETED]** (Schema designed and coded, database automatically instantiates local tables on startup, IPC handlers defined).
- **Phase 3 & Core Logic** ── **[COMPLETED]** (Propagating schedule and component logic written, verified and modularized).
- **Phase 4: Product Type Management UI** ── **[COMPLETED]** (Product Type list and details screen built with visual milestone relationship tree and CSV import/export handlers).
- **Phase 5: Product Registry & Project Tracker UI** ── **[COMPLETED]** (Manual project form, bulk CSV spreadsheet verifier with error-correction grid, and project tracker monitoring actual dates & countdowns).

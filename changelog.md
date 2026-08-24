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

---

## Current Status (Stage 3 of 7)
- **Phase 1: Environment Setup** ── **[COMPLETED]** (Conda environment built, Node installed, Electron + React structure verified and compiling).
- **Phase 2: Database Schema & IPC Layer** ── **[COMPLETED]** (Schema designed and coded, database automatically instantiates local tables on startup, IPC handlers defined).
- **Phase 5 (Partial): Core Logic** ── **[COMPLETED]** (Propagating schedule and component logic written and modularized).

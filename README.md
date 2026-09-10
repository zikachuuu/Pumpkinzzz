# 🎃 Pumpkinzzz - A Project Schedule Management Application

Pumpkinzzz is a local-first project schedule tracking and management application designed specifically for the manufacturing industry. Key features include:

- 🔖 **Create Product Types:** Product types are templates that define the milestones and BOM for projects registered under them.

- 📅 **Automatic Milestone and Procurement Order Deadlines Generation:** Once a project is registered under a product type, Pumpkinzzz automatically calculates the milestone and procurement order deadlines based on the product type's configuration.

- ⚙️ **Manage Project Manufacturing Lifecycle:** Pumpkinzzz provides a clean, easy to use interface to track and update the progress of each projects as they move through the manufacturing lifecycle.

- 📊 **Build Gantt Charts:** Build beautiful, custom Gantt charts for each project to visualize the manufacturing lifecycle and track progress.

As a local-first application, Pumpkinzzz does not require an internet connection to operate all features. All data is never uploaded on to the internet and instead stored within your device, ensuring your company sensitive project data is safe and secure.

## 📥 Download and Installation

> Pumpkinzzz is designed for 💻 Windows and 🍎 macOS (Apple) Computers. It currently does not support phones, tablets, or other mobile devices (iOS, Android, etc).

Head over to the [latest release](https://github.com/zikachuuu/Pumpkinzzz/releases/latest) to download the latest installer for your operating system (Windows or macOS). 

After you have installed the installer:

1. Locate the file you just downloaded (usually in your Downloads folder) and double-click it.

2. Follow the setup prompts on your screen:

   - For 💻 Windows users, you may be prompted to choose to install for "Only for me" or "Anyone who uses this computer". Select the default option or check with your company's IT / cybersecurity team if you are using a work computer. Leaving the destination folder set to the default location is completely fine.

3. Once the setup completes, open Pumpkinzzz to get started.

## 🚀 Quick Start Guide

This guide is designed for those who are not familiar with the current project schedule management process.

### 1. ✍️ Register a Product Type

No projects can be created without registering to a product type. Product types are templates that define:

- 🗓️ Schedules and 🚩 Milestones

  - 🚩 Milestones are the key dates that define the manufacturing lifecycle of a project, for example: "Design Complete", "Parts Ordered", "Assembly Complete", etc.  

  - 🗓️ Schedules are the collection of milestones that define the manufacturing lifecycle of a project. Every schedule start with a "🤝 Contract Signed" milestone and ends with a "🎉 ROS (Required On Site)" milestone (We will call them default milestones). A product type can have multiple schedules, each with its own set of milestones, depending on its intended circumstances (e.g. a "Standard" schedule and an "Expedited" schedule).

  - In a schedule, each custom (none-default) milestone is anchored to another milestone in terms of a positive or negative offset (in days). For example, "Parts Ordered" can be anchored to "Design Complete" with an offset of +5 days, meaning that the deadline for the "Parts Ordered" milestone is 5 days after the deadline for the "Design Complete" milestone.

  - The default milestones ("🤝 Contract Signed" and "🎉 ROS") are not anchored to any other milestones. When a project is registered, the user will be prompted to select a start date for the "🤝 Contract Signed" milestone and an end date / deadline for the "🎉 ROS" milestone. The deadline for all other milestones will be automatically calculated based on the offsets defined in this schedule.

- 🧱 BOM (Bill of Materials)

  - BOM is a list of all the components (raw materials, parts) that are required to manufacture this product type.

- 🕒 Procurement Lead Times

  - Similar to milestones, every component in the BOM also have a deadline to be ordered by. The deadline is defined by the anchored milestone and procurement lead time.

  - The anchored milestone is the milestone that this component is required. For example, if a component is anchored to the "Assembly Start" milestone, then the component must be delivered before the "Assembly Start" milestone deadline.  
   
  - The procurement lead time is the number of days it takes to procure this component from the supplier. For example, continuing from the above example, if the component has a procurement lead time of 5 days, then the deadline for ordering this component is 5 days before the "Assembly Start" milestone deadline (so that it can be delivered on time before assembly starts).

Every product type can have multiples schedules, each with its own set of milestones and associated procurement lead times. Each product type has exactly one BOM, which is shared across all schedules.

### 2. 📝 Register a Project

After registering a product type, you can now register a project under that product type.

When registering a project, you will be prompted to select a schedule from the product type's schedules. You will also be prompted to select a start date for the "🤝 Contract Signed" milestone and an end date / deadline for the "🎉 ROS" milestone. The deadlines for all other milestones and component order deadlines will be automatically calculated based on the offsets defined in the selected schedule.

### 3. 🔎 Track and Manage Project Progress

View the project in the Project Tracker tab. It will show you the number of milestones and components procurement under each status:

- 🟢 On Track (more than 30 days before deadline)
- 🟡 Urgent (within 30 days of deadline)
- 🟠 Very Urgent (within 7 days of deadline)
- 🔴 Overdue (past deadline)

You can also update the actual completion date of each milestone and the actual order date of each component. The status of each milestone and component will be automatically updated based on the actual completion/received dates.

- 🔵 Completed (Before deadline)
- ⭕ Completed (After deadline)

### 4. 📊 Build Gantt Charts in Dashboard

Your manager or client does not have to see or know any of the above details. They only have to see the Dashboard tab, where you can build a custom Gantt chart for each project. Each row in the Gantt chart specifies a start milestone and an end milestone, and the Gantt chart will show the duration between the two milestones. Depending on the agendas, you can have any number of rows and any milestone as the start and end milestones. 

Note that the Gantt chart is not automatically generated. You have to manually select the start and end milestones for each row in the Gantt chart.

Also remenber to save the Gantt chart after you have built it, otherwise it will be lost when you close the app or switch tabs. 5 slots are provided for you to save and load different Gantt charts.

### 5. 🗂️ Export and Import Data

As mentioned, Pumpkinzzz is a local-first application - all data is saved in your local device. What if you want to share the data with your colleagues, manager, or clients? What if you are switching to a new computer and want to transfer the data? Pumpkinzzz provides an export and import feature to help you with that.

Pumpkinzzz export and import data using Spreadsheet CSV files, which looks like and can be opened in Microsoft Excel, Google Sheets, or any other spreadsheet software. You can export and import the following data:

- Product Types (including schedules, milestones, BOM, and procurement lead times)
- Projects

When exporting, you can choose to export all data or only selected product types and projects. When importing, you can choose to overwrite existing data or keep existing data.


### 6. 👌 Quality of Life Features

- Change the date format between `YYYY-MM-DD` and `DD/MM/YYYY` in the Settings tab.

- Change the start day of the week between Sunday and Monday in the Settings tab.

- Change the number of days for the "Urgent" and "Very Urgent" status in the Settings tab.

## Questions? 

If you have any questions, feedback, or feature requests, please feel free to

- Open a [GitHub issue](https://github.com/zikachuuu/Pumpkinzzz/issues) to report bugs or request features.
- Alternatively, [email](mailto:le0003hi@e.ntu.edu.sg) the developer directly

</br>

---
---

</br>

## Technical Documentation

This section describes the implementation currently present in the repository. Pumpkinzzz is an offline-first Electron desktop application: the React renderer owns presentation and interaction, while the Electron main process owns privileged filesystem and SQLite access. The two processes communicate through a narrow `contextBridge` API exposed as `window.electronAPI`.

## Architecture and Technology

### Runtime layers

- **Electron main process:** `src/main.cjs` creates the application window, initializes SQLite, handles application lifecycle events, and implements IPC (Inter-Process Communication) handlers for database, settings, and file operations.

- **Preload isolation layer:** `src/preload.js` exposes the approved IPC methods through `contextBridge`. The renderer does not receive Node.js integration and cannot directly import `fs`, `path`, or `sqlite3`.

- **React renderer:** `src/renderer/main.jsx` mounts the React application. `src/renderer/App.jsx` provides the top-level navigation shell and renders the Dashboard, Product Type Manager, Project Registry, Project Tracker, Settings, and Version Update screens.

- **Build toolchain:** Vite compiles the renderer with `@vitejs/plugin-react`. Tailwind CSS is loaded from `src/renderer/index.css` and scans the renderer source tree according to `tailwind.config.js`.

- **Persistence:** SQLite is accessed through the Electron main process using the `sqlite3` package. User preferences are stored in both renderer `localStorage` and the Electron-managed `settings.json`; `src/renderer/utils/date.js` normalizes and synchronizes the two representations.

### Security and process boundaries

The BrowserWindow is configured with `contextIsolation: true` and `nodeIntegration: false`. Renderer code must use the functions explicitly exposed by `preload.js`, for example:

```js
const productTypes = await window.electronAPI.dbQuery(
  'SELECT * FROM product_types ORDER BY name ASC'
);
```

Database calls use parameter arrays for values rather than interpolating user input into SQL. Schema initialization enables SQLite foreign keys, allowing related schedules, milestones, components, and saved Gantt rows to be constrained by their parent records.

### Data model

`src/main.cjs` creates the following tables on startup:

- `product_types`: product templates and their derived validity status.
- `schedules`: schedule variants belonging to a product type.
- `milestones`: schedule milestones, including self-referencing anchor relationships and day offsets.
- `components`: globally reusable component definitions and remarks.
- `product_type_components`: the product-type BOM join table, including required component count.
- `component_schedules`: per-schedule component lead-time configuration and anchor milestone.
- `projects`: registered projects linked to a product type and schedule.
- `saved_gantt_chart`: up to five saved Gantt layouts per project.

The renderer database facade lives in `src/renderer/utils/db.js`. It provides domain operations such as product-type CRUD, schedule and milestone management, BOM attachment, lead-time persistence, project CRUD, and Gantt persistence instead of scattering SQL through UI components.

## Current Project Structure

```text
.
├── index.html                         # Vite HTML entry point
├── package.json                        # Scripts, dependencies, Electron-builder metadata
├── vite.config.js                     # Vite React build and dev-server configuration
├── tailwind.config.js                 # Tailwind content scanning configuration
├── postcss.config.js                  # PostCSS/Tailwind integration
├── settings.json                      # Development workspace settings fallback
├── scripts/
│   └── check-phases.js                # Repository and behavior verification script
├── docs_logs/                         # Plans, requirements, tests, and change records
└── src/
    ├── main.cjs                       # Electron main process and SQLite/IPC handlers
    ├── preload.js                     # Context-isolated renderer API
    └── renderer/
        ├── main.jsx                   # React DOM entry point
        ├── App.jsx                    # Application shell and tab navigation
        ├── index.css                  # Tailwind entry point and global CSS
        ├── components/ui/             # Shared presentation primitives and modals
        │   ├── Alert.jsx
        │   ├── Modal.jsx
        │   ├── StatusBadge.jsx
        │   ├── UsageCapsule.jsx
        │   └── FormattedDateInput.jsx
        ├── features/
        │   ├── dashboard/              # Summary metrics, projects, components, Gantt views
        │   ├── product-type-manager/   # Product types, schedules, BOM, lead times, CSV flows
        │   ├── project-registry/       # Single and bulk project registration
        │   ├── project-tracker/        # Project monitoring and actual-date updates
        │   └── setting/                # Preferences and version-update screen
        └── utils/
            ├── db.js                   # Renderer-side database service facade
            ├── csv.js                  # CSV parsing and serialization
            ├── date.js                 # Date and preference normalization
            └── scheduler.js             # Milestone and procurement deadline calculations
```

### Feature-module conventions

Feature modules generally follow this pattern:

- The feature root component owns screen composition and passes callbacks to child views.
- `hooks/` contains stateful data loading, derived state, and mutation orchestration.
- `components/` contains feature-specific reusable UI.
- `views/` contains major subviews within a feature, such as BOM, schedules, and lead times.
- `services/` contains import/export and database-application workflows that are too large for a component.

`ProductTypeManager.jsx` is the container for the product-type workflow. `useProductType.jsx` manages the overview list and filtering. `useProductTypeConfig.jsx` manages selected product-type configuration and validity. The presentation views receive data and callbacks; they should not introduce direct database calls when a parent hook or service can own that mutation.

## Product-Type Import and Export Contracts

The Product Type Manager supports two CSV workflows:

- **Partial import:** imports product type names and BOM component information. New product types start with `invalid` status. For an existing product type, the import wizard allows the user to keep the existing record or replace its configuration.
- **Full backup import:** restores schedules, milestones, component attachments, anchor milestones, lead times, and status. Component lead-time records are represented as individual component rows; legacy semicolon-separated component values remain supported by the importer.

Imports are parsed first and applied only after the review wizard confirms each product type decision. This staging step is important because overwrite operations may remove schedules, milestones, lead-time rows, and BOM links. Schedules referenced by existing projects require special handling so SQLite foreign-key constraints are not violated.

Exports are generated by `exportCsvService.jsx`. Batch export supports BOM-oriented and full-configuration formats, with product-type selection handled by `ExportSelectionModal.jsx`.

## Development Setup

### Prerequisites

The project is developed and tested with Node.js 20 through Conda. A regular Node.js installation also works if it provides a compatible Node/npm pair.

```bash
conda create -y -n pumpkinzzz-env nodejs=20 -c conda-forge
conda run -n pumpkinzzz-env node --version
conda run -n pumpkinzzz-env npm --version
```

### Install dependencies

Run this from the repository root:

```bash
conda run -n pumpkinzzz-env npm install
```

This installs React, React DOM, Electron, Vite, Tailwind/PostCSS, `sqlite3`, `lucide-react`, and the Electron-builder packaging toolchain.

### Run the development application

```bash
conda run -n pumpkinzzz-env npm run dev
```

The `dev` script starts Vite and Electron concurrently. Vite serves the renderer on `http://localhost:5173`; the Electron main process loads that URL when `app.isPackaged` is false. The development window opens DevTools automatically. Because the application uses Electron IPC and SQLite, opening `index.html` directly in a browser is not a supported test method.

Individual processes can also be started when debugging:

```bash
conda run -n pumpkinzzz-env npm run dev:frontend
conda run -n pumpkinzzz-env npm run dev:electron
```

The Electron process expects the Vite server to be available on port `5173`. Vite is configured with `strictPort: true`, so a conflicting process must be stopped before starting the development application.

## Verification and Build Commands

### Repository verification

```bash
conda run -n pumpkinzzz-env node scripts/check-phases.js
```

This repository-level script checks expected project phases and file structure and exercises selected database, CSV, and scheduling behavior. It is not a replacement for manual UI testing of the Electron application.

### Frontend build

```bash
conda run -n pumpkinzzz-env npm run build:frontend
```

Vite writes the production renderer bundle to `dist/`. The configured relative base path (`base: './'`) allows the packaged Electron window to load the generated assets from disk.

### Production package

```bash
conda run -n pumpkinzzz-env npm run build
```

This runs `build:frontend` followed by `build:electron`. Electron-builder packages the `dist/` directory, `src/main.cjs`, `src/preload.js`, and `package.json` into the application. The configured targets are:

- **macOS:** DMG installer, categorized as a productivity application.
- **Windows:** NSIS installer with optional installation-directory selection.

Build artifacts are written to `release/`. To build explicit targets, use Electron-builder directly, for example:

```bash
conda run -n pumpkinzzz-env npx electron-builder --mac
conda run -n pumpkinzzz-env npx electron-builder --win
```

The package metadata is configured for GitHub publishing under `zikachuuu/pumpkinzzz`. Publishing is a separate release operation; creating a local installer does not automatically upload it.

## Runtime Data and Client Installation

When packaged, Electron stores the SQLite database and settings under the platform-specific Electron user-data directory returned by `app.getPath('userData')`. The current files are:

- `pumpkinzzz.db`: application data, including product types, schedules, milestones, components, projects, and Gantt layouts.
- `settings.json`: date format, start-of-week, urgency thresholds, and version-update preference.

This is intentionally different from the repository root. Users should not edit the database or settings file while the application is running; use the application UI or the documented IPC-backed workflows instead.

Clients only need the installer for normal use. They do not need Node.js, Conda, npm, a separate server, or a cloud database. The application runs locally and does not require an internet connection for its core workflows. Internet access is only relevant when users download installers or when a future release workflow checks GitHub-hosted resources.

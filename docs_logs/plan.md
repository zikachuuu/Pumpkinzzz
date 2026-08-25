ok# Pumpkinzzz Build Plan

This plan outlines the step-by-step architecture and implementation plan for **Pumpkinzzz**, a cross-platform local manufacturing schedule tracking desktop application.

---

## 1. System Architecture

The application will be built as a self-contained cross-platform desktop application using the following stack:

```
+-----------------------------------------------------------+
|                      ELECTRON WRAPPER                     |
|  (Manages desktop window, native filesystem, CSV files)   |
|                                                           |
|    +------------------------+   IPC    +-------------+    |
|    | REACT FRONTEND (Vite)  |<-------->| SQLITE DB   |    |
|    | (Gantt, Tracker, UI)   |  (Bridge)| (Local File)|    |
|    +------------------------+          +-------------+    |
+-----------------------------------------------------------+
```

- **Runtime Environment:** **Electron** (for cross-platform Windows & macOS compatibility, local packaging, and access to the local file system).
- **Frontend:** **React** + **Vite** + **Tailwind CSS** (for responsive, modern, and rapid UI development).
- **Database:** **SQLite** (using `better-sqlite3` or `sqlite3` inside the Electron main process) to store all local data safely.
- **Communication:** Electron **IPC (Inter-Process Communication)** bridge to securely expose safe database queries and OS functions (such as CSV import/export) to the React renderer.
- **Data Exchange:** **CSV** format for import/exporting lists (with validation, error flagging, and row rejection).

---

## 2. Core Scheduling Logic (Unified Tree Propagation)

All milestone deadlines propagate recursively using a single, unified calculation logic, regardless of whether they root at `Contract Signed` or `ROS`:

1. **Unified Milestone Deadline Calculation:**
   - For any milestone $X$, its targeted deadline is computed as:
     $$\text{Targeted Deadline}_X = \text{Date}_Y + \text{Offset (Days)}_X$$
   - Where $Y$ is the Anchor Milestone of $X$.
   - $\text{Date}_Y$ is the **Actual Date** if $Y$ is `Contract Signed` (or if it has been marked completed with an actual completion date), or the **Targeted Deadline** of $Y$ otherwise.
   - The offset can be positive or negative (representing days after or before the anchor milestone's date respectively).
   - If a custom milestone deadline lies before `Contract Signed` or after `ROS`, it is allowed but a warning is displayed.

2. **Component Order Deadlines:**
   - $$\text{Latest Component Order Date} = \text{Anchor Milestone's Targeted Deadline} - \text{Lead Time (Days)}$$

---

## 3. Implementation Phases

### Phase 1: Environment Setup
- [ ] Create a Conda environment (`pumpkinzzz-env`) with `nodejs` and `npm` for development.
- [ ] Initialize Electron + Vite + React structure within the environment.
- [ ] Install required developer dependencies (`electron`, `vite`, `tailwindcss`, `better-sqlite3`, etc.).
- [ ] Configure `main.js` (Electron entry point) and `preload.js` (IPC bridge).
- [ ] Configure Tailwind CSS for UI styling.
- [ ] Set up basic cross-platform window spawning.

### Phase 2: Database Schema & IPC Layer
- [ ] Initialize SQLite database (`pumpkinzzz.db`) locally in the app data directory.
- [ ] Create the database tables:
  - `product_types` (ID, Name, Status)
  - `schedules` (ID, Product Type ID, Name)
  - `milestones` (ID, Schedule ID, Name, Anchor ID, Offset, Remarks)
  - `components` (ID, Name, Remarks)
  - `product_type_components` (Component ID, Product Type ID)
  - `component_schedules` (Schedule ID, Component ID, Anchor Milestone ID, Lead Time)
  - `projects` (Tag No, Description, Product Type ID, Schedule ID, Customer, Contract No, Sales Ref, PM, Engineer Owner, Procurement Owner, Production Owner, FAT Owner, Contract Signed Date, ROS Date, Notes, Actual Completion Dates)
- [ ] Implement database connection and core SQL queries in Electron's Main process.
- [ ] Establish IPC bridge handlers in `preload.js` for safe communication.

### Phase 3: Core Business Logic (Propagation Engine)
- [ ] Implement the recursive milestone calculation utility (DFS or top-down traversal on the milestone trees).
- [ ] Implement the component order deadline calculation engine.
- [ ] Create test suites/mocks in Node/Vitest to verify logic calculation accuracy with positive, negative, and chained offsets.

### Phase 4: Product Type Management UI
- [ ] Build the Product Type List screen (Create, View, Delete, Edit, Sort/Filter).
- [ ] Create an intuitive, visually represented milestone relationship tree diagram.
- [ ] Add CSV import/export handlers for Product Types and Schedules.

### Phase 5: Product Registry & Project Tracker UI
- [ ] Build the Product Registry form for manually adding projects (with dropdowns, validations).
- [ ] Build the Bulk Product Registry CSV upload with real-time grid error corrections (highlighting invalid fields and Tag No clashes).
- [ ] Build the Project Tracker interface showing status (overdue, urgent, complete) and countdowns to milestones/components.
- [ ] Enable updating the actual completion date for milestones.

### Phase 6: Interactive Dashboard & Gantt Chart
- [ ] Build the Customizable Dashboard screen with scalable widgets/blocks.
- [ ] Build a large, custom-styled Gantt Chart visualizing milestones and component lead times on a timeline.
- [ ] Enable dashboard saving and layout adjustment.

### Phase 7: Exporting & Packaging
- [ ] Configure standard Electron builder tools (e.g. `electron-builder`) to compile installers for Windows and macOS.
- [ ] Create easy execution scripts for the target environment.

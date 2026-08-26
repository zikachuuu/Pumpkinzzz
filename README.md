# Pumpkinzzz

Pumpkinzzz is a high-performance, cross-platform project schedule tracking application designed specifically for the manufacturing industry. It ensures that machines ordered by customers are delivered on time by tracking every milestone of the manufacturing lifecycle (from contract signing to Required On Site delivery) and evaluating component raw material order lead times.

---

## 🚀 Key Features & Capabilities

- **Unified Milestone Deadline Chaining:** Supports multiple custom milestones anchored to other milestones. Calculations propagate dynamically down tree-like structures based on positive/negative offsets (days) relative to anchor dates.
- **Component Lead Time Tracking:** Tracks components relative to their milestones and warns of late ordering based on lead times ($Targeted\ Deadline - Lead\ Time = Latest\ Order\ Date$).
- **Local SQLite Storage:** Self-contained data storage requiring zero cloud APIs or web servers, securing company data locally.
- **Interactive Operations Dashboard:** Separate Product, Product Type, and Components views. Product view supports expandable project information, a vertical milestone timeline with durations, and user-defined milestone comparison bars.
- **Project Tracker:** Expanded project details, confirmed actual-date display/editing, sortable milestone and component tables, and consistent configurable date formatting.
- **Settings:** Local date display preference for ISO (`yyyy-mm-dd`) or day-first (`dd-mm-yyyy`) output.
- **Urgency Configuration:** Separate milestone and component thresholds for Urgent and Very Urgent statuses, defaulting to 30 and 7 days.
- **Component Receipt Tracking:** Project Tracker stores actual received dates per component and reports whether receipt occurred before or after its anchor deadline.
- **Product Type & Schedule Master Configuration (Phase 4):** A robust registry enabling users to manage product types, build custom milestone dependency graphs, attach raw parts, and establish custom order lead times. Product Type Registry includes validity guidance, searchable component attachment, relationship/timeline/record views, and per-schedule completion feedback.
- **Interactive Milestone Tree Diagram (Phase 4):** Visualizes the recursive hierarchical anchors and offset relations of custom milestones starting from root boundary boundaries.
- **Phase 4 CSV Import & Export Enablers:** Dedicated flat CSV parsers/stringifiers allowing instant local backups or communication transfers of Product Types and Schedule Configurations.
- **Robust CSV Bulk Importers (Phase 5):** High-quality bulk uploads with visual verification spreadsheets highlighting validation errors and key constraints (such as clashing Tag Nos).

---

## 🛠 Tech Stack

- **Desktop Framework:** **Electron** (Cross-platform compatibility for Windows & macOS).
- **Frontend App:** **React** + **Vite** (Rapid development, HMR, performance).
- **CSS Utility:** **Tailwind CSS** (Clean, modern layouts).
- **Database Backend:** **SQLite** (`sqlite3` driver) inside Electron main process, supporting complete relational tables and foreign keys.

---

## 📂 Project Structure

```
.
├── src/
│   ├── main.js             # Electron Main Process (SQLite and OS interactions)
│   ├── preload.js          # Secure, safe Electron IPC Bridge
│   └── renderer/           # Vite-compiled React Frontend Code
│       ├── main.jsx        # App entry point
│       ├── App.jsx         # Main Tabbed sidebar layout and navigation
│       ├── index.css       # Tailwind entry point
│       ├── components/
│       │   ├── ProductTypeManager.jsx # Product Type & Schedule Configuration Dashboard (Phase 4)
│       │   ├── ProductRegistry.jsx    # Project registration and CSV verification
│       │   ├── ProjectTracker.jsx     # Project monitoring and receipt tracking
│       │   ├── Dashboard.jsx           # Product, product type, and component dashboards
│       │   └── Settings.jsx            # Workspace display settings
│       └── utils/
│           ├── csv.js        # RFC 4180 CSV parsing & serialization utilities (Phase 4)
│           ├── date.js       # Shared date format preference and display helpers
│           └── scheduler.js # Core calculation engine (milestone & component rules)
├── index.html              # Frontend DOM mount
├── docs_logs/              # Internal plans, test reports, changelog, and project records
│   ├── plan.md             # 7-Phase Build plan and architectural specifications
│   ├── changelog.md        # Detailed file change tracking log
│   └── Internal Test 1.md  # Incremental internal review feedback
├── tailwind.config.js      # CSS configuration file
├── vite.config.js          # Vite build options
└── package.json            # Dependencies and npm execution scripts
```

---

## 💻 Developer Setup, Installation & How to Run for Testing

### ❓ Can I just double-click `index.html` to test the app?
**No.** Pumpkinzzz is not a standard static website. It is an **Electron desktop application** that communicates with a local **SQLite database (`pumpkinzzz.db`)** and utilizes secure Inter-Process Communication (IPC) bridges (`window.electronAPI`). If you try to double-click `index.html` in your web browser, it will fail because the browser does not have access to Node.js backend databases or desktop dialog APIs.

Instead, you run the app via Node.js/Electron wrapper commands. Follow these simple steps:

### 1. Prerequisite: Conda Environment Setup
We use Conda to package the required Node.js environment on your system cleanly. Open your terminal and run:

```bash
# Create the environment with Node.js 20 and npm
conda create -y -n pumpkinzzz-env nodejs=20 -c conda-forge

# Verify node and npm are available
conda run -n pumpkinzzz-env node -v
conda run -n pumpkinzzz-env npm -v
```

### 2. Install Project Dependencies
Install the required packages within your conda environment:

```bash
conda run -n pumpkinzzz-env npm install
```

### 3. How to Run the App Live for Testing (Development Mode)
To launch the live desktop application window (which automatically compiles the React frontend on Vite and spawns the Electron app simultaneously):

```bash
conda run -n pumpkinzzz-env npm run dev
```
*This opens the interactive **Pumpkinzzz Desktop App** window where you can click around tabs, test the Product Types registry, upload CSV files, register projects, and view countdowns.*

### 4. How to Run Automated Verification Tests
To run the automated verification script (which checks all 7 phases, verifies file structures, inspects SQLite database tables, and tests core scheduling and CSV parsing round-trips):

```bash
conda run -n pumpkinzzz-env node scripts/check-phases.js
```

## 📦 Packaging, Distribution & Client Usage (Phase 7)

### 📤 How to Package into a Single Installer File to Email to Clients
To compile Pumpkinzzz into a standalone, production-ready desktop installer (which bundles the React frontend, Electron runtime, and SQLite database engine into a single file for distribution), run:

```bash
conda run -n pumpkinzzz-env npm run build
```

This single command:
1. Compiles and minifies the React frontend static assets (`npm run build:frontend`).
2. Packages the application using **electron-builder** (`npm run build:electron`).

Once finished, a standalone installer file (`.dmg` for macOS or `.exe` NSIS installer for Windows) will be generated inside the **`release/`** directory. You can take this installer file and email it directly to your client!

### 📥 How Clients Use It on Their End (Zero Setup)
Clients do **not** need to install Node.js, Conda, or configure any cloud database or server. All they have to do is:
1. Receive and open the installer file (`Pumpkinzzz Setup.exe` or `Pumpkinzzz.dmg`) sent by email.
2. Double-click to install the app onto their computer.
3. Launch **Pumpkinzzz** directly from their desktop or applications menu.

All company schedule data, product types, and project records are automatically secured locally on their machine in a self-contained SQLite database file (`pumpkinzzz.db`), ensuring 100% data privacy and zero internet connection requirements.

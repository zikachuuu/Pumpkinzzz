# Pumpkinzzz

Pumpkinzzz is a high-performance, cross-platform project schedule tracking application designed specifically for the manufacturing industry. It ensures that machines ordered by customers are delivered on time by tracking every milestone of the manufacturing lifecycle (from contract signing to Required On Site delivery) and evaluating component raw material order lead times.

---

## 🚀 Key Features & Capabilities

- **Unified Milestone Deadline Chaining:** Supports multiple custom milestones anchored to other milestones. Calculations propagate dynamically down tree-like structures based on positive/negative offsets (days) relative to anchor dates.
- **Component Lead Time Tracking:** Tracks components relative to their milestones and warns of late ordering based on lead times ($Targeted\ Deadline - Lead\ Time = Latest\ Order\ Date$).
- **Local SQLite Storage:** Self-contained data storage requiring zero cloud APIs or web servers, securing company data locally.
- **Interactive Gantt & Dashboard Visualizations:** A fully functional dashboard interface containing customized, responsive Gantt Chart visual charts.
- **Robust CSV Bulk Importers:** High-quality bulk uploads with visual verification spreadsheets highlighting validation errors and key constraints (such as clashing Tag Nos).

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
│       ├── App.jsx         # Sidebar and Tab Navigation layouts
│       ├── index.css       # Tailwind entry point
│       └── utils/
│           └── scheduler.js # Core calculation engine (milestone & component rules)
├── index.html              # Frontend DOM mount
├── plan.md                 # 7-Phase Build plan and architectural specifications
├── changelog.md            # Detailed file change tracking log
├── tailwind.config.js      # CSS configuration file
├── vite.config.js          # Vite build options
└── package.json            # Dependencies and npm execution scripts
```

---

## 💻 Developer Setup & Installation

To run or work on Pumpkinzzz locally, follow these steps:

### 1. Prerequisite: Conda Environment Setup
We use Conda to package the required Node.js environment on your system cleanly.

```bash
# Create the environment with Node.js 20 and npm
conda create -y -n pumpkinzzz-env nodejs=20 -c conda-forge

# Verify node and npm are available
conda run -n pumpkinzzz-env node -v
conda run -n pumpkinzzz-env npm -v
```

### 2. Install Project Dependencies
Run the installation script within your conda environment:

```bash
conda run -n pumpkinzzz-env npm install
```

### 3. Run Development Server
Run the concurrent task which compiles React on Vite (port `5173`) and launches Electron simultaneously:

```bash
conda run -n pumpkinzzz-env npm run dev
```

### 4. Build and Package
To build the compiled, distributable installer (DMG for macOS, NSIS for Windows):

```bash
# Compile React static files
conda run -n pumpkinzzz-env npm run build:frontend

# Package using electron-builder
conda run -n pumpkinzzz-env npm run build:electron
```
*(No end-user configuration or Node.js environment is required to run the packaged output executable.)*

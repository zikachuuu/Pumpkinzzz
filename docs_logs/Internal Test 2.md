Internal Test 2

# 1\. Dashboard Interface

## 1.1 General UI

1.1.1 For the main block with static title "Operations Dashboard", make it dynamic based on the active tab: Project Dashboard", "Product Type Dashboard", or "Components Dashboard".

1.1.2 Rename button in same block "Product" to "Projects"

1.1.3 Make the subtitle below title, currently a static "Review one product lifecycle, product type health, or component demand.", dynamic

- Projects Tab: "Review the schedule and current progress of a selected project".
- Product Type Tab: "Review the consolidated status of the projects under a selected product type".
- Components Tab: "Review the demand of a selected component".

## 1.2 Project Dashboard Tab (Formerly Products)

1.2.1 In the block with title "Select Product" and drop down list, rename title to "Select Project"

1.2.2 Project Banner Redesign (Mirror to that of Project Tracker Interface)

- Layout: 2 columns.
- Fields: Tag No (slightly larger font), Customer, Product, Schedule, Contract Signed, ROS Deadline, and Value (below).
- Urgency Stats: Display counts for "completed before deadline", "completed after deadline", "on track", "urgent", "very urgent", and "currently overdue".
- Toggle: Add a right-aligned expand/collapse arrow; allow clicking anywhere on the banner to toggle.
- Expanded View: Show project info only (do not show milestones/components in this expanded state).

1.2.3 Milestone Timeline Component:

- Add 3 columns: Deadline Date, Actual Completion Date, and Status (completed before/after deadline, on track, urgent, very urgent, overdue).
- Visual Spacing: Adjust vertical row spacing dynamically using a bounded logarithmic-like scale or similar to visually represent the time duration between consecutive milestones (enforce a min and max pixel height so it doesn't break the UI).
- Connections: Add downward arrows between consecutive milestones, centered under the milestone name.
- Duration Labels: Display the exact duration text (Raw days + Year/Month/Day format) to the right of the downward arrows.

1.2.5 The milestone duration comparison block is totally wrong (also rename to gaant chart builder).

- Layout: Left side = narrow Start/End milestone selectors (validate End is after Start). Right side = scrollable horizontal timeline.
- Timeline visual: Use dynamic but readable scales (show months like Jan, Feb, or weeks if shorter duration overall), add distinct colors for bars, and implement a zig-zag time-skip UI for massive durations. Allow horizontal scrolling but not too wide.
- Save Feature: Add 5 save slots so users can save/load a snapshot of the selected project + Gantt chart for meetings.

1.2.7 Bottom Block: Add a "Component Order Deadlines & Lead Times" block at the bottom, identical to the one in the Project Tracker interface.

## 1.3 Product Type Dashboard Interface

1.3.1 Can keep current overview style but allow user to select / click to focus on a particular product type. Display summarized info: Schedules (Chronological timeline view, component lead times, schedule status), Component list, and Registered Projects. Registered Projects view: Use the redesigned Project Banner from 1.2. Interactivity: Make all summarized elements clickable, redirecting the user to the relevant detailed interface.

## 1.4 Components Dashboard Interface

1.4.1 Similar to 1.3, beside showing the overview of all components, make it clickable to that user can see exactly for one particular component, the product type and projects involved in.

# 2\. Product Type Registry

## 2.1 Landing Page

2.1.1 Change the main block slogan from Product Type to: "Register new product types".

2.1.2 Move the 3 CSV buttons (Get, Import, Export) to a new distinct "Bulk Registration" section below the main block, including a short description of bulk functionalities.

2.1.3 Remove the static Status Guide button. Instead, add a clickable ? icon next to product type status badges that triggers the explanation popup (e.g., explaining why a schedule is invalid).

## 2.2 Product Type Interface

2.2.1 In schedules and milestone tab, Add hover tooltips to schedule status badges to explain the status without requiring a click.

2.2.2 In schedules and milestone tab, chronological timeline tab, Add a new text line to each milestone detailing "Days to \[Anchored Milestone\]". Omit if anchored to the base boundary.

2.2.3 In attached components tab, Consolidate the search UI into a single search bar (supporting both typing and dropdown selection) with a separate filter bar for Product Type.

## 2.3 CSV Import and Export functions

2.3.1 The csv export import function is a bit buggy, and I understand that its because my instructions wasn't clear. So to clarify, when I say import and export for product type, there are a lot of things user can do

The following options appear once user go to 2.2 Product Type interface (by choosing a product type).

1. Import / Export / Get template (any number of) schedules (milestone + lead time, 2 csv) of one product type
   - - Can only export valid schedules (with lead time filled)

- If product type does not exist, will inform user and ask if want to create product type. Also create all the necessary components if does not exist (inform user first)
- If product does exist, will fail if components list does not match the existing one. User will be redirected to a page to edit the components (the components in imported csv but not in existing will be greyed out to indicate removed; the components not in imported but in existing will be highlighted to inform user to add new anchor and lead time for them).

1. Import / Export / Get template only milestone of (any number of) schedule of one product type (one csv)
   - - Can export any schedule (if imported then they are all invalid)

The following options appear once user is in the 2.1 landing page

1. Import / Export / Get template of (any number of) product type and its component list (one csv)
   - - Import only work if product type does not exist, otherwise user has a choice to discard change or overwrite (overwrite will discard all schedules associated!!! Must let user double confirm)
2. Import all information of (any number of) product types, including component list, all schedules, and all associated lead time (ie full backup).
   - - Okay if product type does not exist, overwrite if product type exist

# 3\. Product Registry Interface (rename it to project registry)

## 3.1 Landing Page

3.1.1 Similar to point 2.1.1, the main block should not repeat the title "Product Registration Dashboard", instead change it to some slogan like "Register new projects here" and in the description remind user that need to have subvalid schedules

## 3.2 CSV Import and Export

3.2.1 Move CSV buttons to a new block below the manual registration form.

3.2.2 Pre-flight Confirmation: On import, parse the CSV and show a confirmation table modal. Display which projects will succeed and which will fail (fail if product type or schedule is invalid/missing). Provide "Abort" and "Continue" buttons.

# 4\. Project Tracker

## 4.1 Landing Page

For the banner of each project:

- Apply the exact Project Banner redesign specified in Section 1.2 to the Project Tracker. (Difference is here can edit / delete, in dashboard cannot edit or delete)
- Unexpanded Banner: Add a summarized component status count (similar to the milestone urgency stats).
- Milestones Table: Update the Status/Countdown column with the new granular statuses (completed before deadline, completed after deadline on track, urgent, very urgent, overdue). For active statuses, display "Due in X days".
- Components Table: Add urgency statuses (on track, urgent, very urgent, overdue, received before \[anchor\], received after \[anchor\]). Add a new editable column for "Actual Received Date"5. Setting Page

# 5\. Settings Interface

Add configuration inputs for the threshold number of days that trigger "Urgent" and "Very Urgent" statuses. Separate these settings for Milestones and Components

## Implementation Status

Reviewed and implemented on 2026-08-26. Dashboard, tracker, settings, Product Type landing/export flows, and Product Registry wording were updated. Actual component received dates are persisted per project/component, and urgency thresholds default to 30/7 days separately for milestones and components.

The remaining CSV overwrite/import confirmation behavior is a deliberate follow-up because it can discard existing schedules and requires a dedicated acceptance test for the confirmation wording and rollback expectations.
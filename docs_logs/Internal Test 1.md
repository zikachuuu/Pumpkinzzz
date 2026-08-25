Internal Test 1

# 1\. Product Types Interface

## 1.1 Main Page / Landing Page

1.1.1 Rename menu name on the left hand side from "Product Type" to "Product Type Registry"

1.1.2 In the main block with title "Product Types Master Registry", export csv, import csv, new product type buttons

- Rename "Product Types Master Registry" to "Product Type Registry" (matching)
- Add a Validity Status question / inquiry button on the right, when user click, will pop up an explanation on the 3 types of status (valid, sub-valid, invalid). Also specify that all newly created product types are invalid at first until required information are filled.

1.1.3 When user click on create new product type, the pop up (with the create product type button) must clearly say that it will be invalid and inform user to go fill up information. Same with the "product type created successfully" pop up. End line is user must be fully aware that they need to promptly fill up information / config before using.

1.1.4 When user tried to create a product type with same name, now the app successfully stops it. But the create new product type pop up does not go away, and the repeated name warning is on the main interface, so the warning is mostly covered by the pop up. Also, the word in warning is very technical. Display the warning in the pop up instead. And make the wording more user friendly, just simple like "product type already exists"

1.1.5 there is export csv and import csv, but there should also be a get csv template button if user want to eg bulk upload

CSV import and export has not been checked yet

## 1.2 Product Type Manage Config

1.2.1 In Milestone Relationship Tree Diagram, edit and delete buttons are icons. But in Milestone Master Records, edit and delete buttons are words. Standardize to icons

1.2.2 The milestones in the tree diagram may not be displayed properly if screen width is small and tree is deep. Make the view better for narrow screen (maybe horizontal scroll)

1.2.3 On top of the 2 views, add a third view (in between tree diagram and master record), that shows the chronological order of each milestone for each tree, like a linear timeline, since we know the relative time between milestone. So I suppose 2 parallel, vertical timelines, one for ROS, one for contract signed, with milestones stacked together.

1.2.4 In add custom milestone pop up, now is anchor and offset days. Change to 3 fields, deadline happens (number of days) days (before / after) (anchor milestone). So basically we encapsulate the idea of positive and negative offset days from user. User may be confused by negative numbers. User just want to input if this milestone happen before or after the anchored one, and by how many days.

1.2.5 And same for tree diagram and master record, encapsulate the notion of negative offset. In master record just add one more column that says before or after anchor, and offset days is purely positive (although backend its of course still positive or negative). In Tree diagram, now is eg +28 days from anchor or -3 days from anchor, change to 28 days after (anchor name) or 3 days before (anchor name). so pull the actual anchor name instead of just static "anchor" word

1.2.6 In attached components page, attach existing components seems like a neat idea (I didn't think of that), but its not going to scale graciously. Like its going to be a super long list in the drop down list. How about split into two search criteria, first by product type, then by existing components in that product type. Also if possible add support to search using textbox for a product type (from global).

1.2.7 In component lead time, add a button to save lead time for a single schedule (now is must save for all schedule), one button per schedule

1.2.8 In both schedules & milestone tab and component lead time tab, it need to show for each schedule, whether its valid or invalid. And have a question mark to indicate that user can hover. Once user hover across, show the reason for not valid (tell user to indicate lead time first)

1.2.9 there is import schedule csv and export schedule csv, but should also have a get csv template button

CSV import and export has not been checked yet

# 2\. Product Registry Interface

No issue for this page as of now. Have not tested CSV yet. When a new product is registered its auto directed to product tracker page is a nice touch.

# 3\. Project Tracker Interface

## 3.1 Main Page / Landing Page

3.1.1 clicking on a project now expands the milestone and components, which is nice. But I still don't see the other detailed info for this project. I need to click on the edit icon, which is not very intuitive. Add maybe a detailed info box that can be expanded, and shift the edit icon beside it (so user know that the edit is for editing the detailed info). But make it neat still, don't make it to have buttons everywhere.

3.1.2 all dates are displayed in yyyy-mm-dd, but in date editing box is dd-mm-yyyy. Have a setting toggle to standardize all to be either of the 2 (not mixed)

3.1.3 the actual completion date, after user have added the date, will appear as a text with a edit button beside it (instead of still being a date selection field). This is to highlight that the date has already been added and confirmed (not leaving it hanging).

3.1.4 Allow user to sort milestone and component table by any column (eg alphabetically, targeted deadline, etc etc)

# 4\. Dashboard

Sorry but dashboard is completely wrong. There are 3 tabs in the dashboard, each focusing on one business interest – product, product type, components.

## 4.1 Product

This is the main tab, and the only tab in the original excel workbook presented by client. So here the first thing is user select a product to display, and the information related to, like contract signed and ROS date, product type, customer, etc etc. Of course for less important information, use a expandable box so that management can one shot see all info without needing to go to project tracker interface. Then display the milestones on a timeline. Maybe a vertical one, the left hand side are the milestones in sequence. And in case the duration between 2 consecutive milestone is too large compared to the rest, its going to skew the axis and squeeze everything else together, then its not going to look very nice. In this case then maybe use a zigzag line or other methods to indicate a large time skip.

Also add duration between every 2 pairs of consecutive milestones on the timeline, so that user know how much time between every 2 pair of milestones.

Management may also wish to know the duration between 2 pairs of not necessarily consecutive milestones. This is where Gannt chart shines. So it's a table with no rows at first (or an empty sample row), and user can add any number of new rows. Each row user can indicate the start milestone and end milestone. Need to check to ensure the milestone used as end has a later deadline than start. Then the right hand side of the table there will be a horizontal time axis and horizontal bar to indicate the start and end date and duration. And as user add more rows these horizontal bar eventually forms a gannt chart.

The axis exact granularity is flexible and dynamic, scale dynamically as user add or delete rows. But bottom line is information is clear and not too crammed or overlapping. Scale can be like days, weeks, months, etc. Even the interval don't have to be fixed right, if some duration is stupidly long, then its gonna make the chart very long horizontally, not very ui friendly. Like it can be long but once its beyond a certain length, then just make the interval a bit varied.

## 4.2 Product Type

TBD…

## 4.3 Components

TBD…

# 5\. Others

## 5.1 Settings Page

5.1.1 Add a new settings page in the bottom of the left menu bar.

5.1.2 Now this page only has toggle date format (3.1.2), but we can add more in the future
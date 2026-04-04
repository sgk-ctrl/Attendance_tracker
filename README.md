# HNPS Junior Band Attendance Tracker

A simple, phone-friendly attendance app for volunteer parents and coordinators of the HNPS Junior Band. Open the link, count the students, and you're done.

---

## Quick Start (for Volunteers)

You don't need to install anything. The app runs in your phone's web browser.

1. **Open the link** you were given (works on any phone, tablet, or computer).
2. **Check the date and session** shown on screen. The app automatically detects whether it's a Monday afternoon or Wednesday morning session. If needed, change the session using the dropdown.
3. **Tap "Start Attendance"** to begin.
4. **Count the students** for each instrument section. Use the **+** and **-** buttons next to each instrument to enter how many students are present. You'll see a running total at the bottom of the screen.
5. **Tap "Next"** once all instruments are filled in.
6. **Review the resolve screen.** If your count matches the expected number for a section, the app marks everyone as present automatically. If a count doesn't match, you'll see a list of student names -- just tap the ones who are here.
7. **Tap "Submit Attendance"** when everything looks right.
8. **Done!** You'll see a summary showing who was present and who was absent.

**What you'll see at each step:**

- **Step 1 (Date screen):** Today's date in large text, a session picker (Monday Afternoon or Wednesday Morning), and the current term. A blue "Start Attendance" button at the bottom.
- **Step 2 (Counting screen):** A list of all 11 instrument sections, each with the expected student count and +/- buttons. Cards turn green when your count matches, orange when it doesn't, and red if you enter zero. A sticky footer shows your running total.
- **Step 3 (Resolve screen):** A summary of auto-resolved sections (matches and zeros) and, if needed, individual student checklists for sections where the count didn't match. A progress bar at the top tracks your steps.
- **Step 4 (Summary screen):** A large number showing total present out of total enrolled, a breakdown by instrument, and a list of absent students.

---

## Features

- **Tally-based attendance** -- Instead of checking off all 71+ students one by one, you simply count how many are present in each instrument section. Much faster during a busy rehearsal.
- **Auto-resolve for matches and zeros** -- If your count matches exactly (everyone's here) or is zero (nobody's here), the app handles it automatically. No extra tapping needed.
- **Individual student marking for mismatches** -- When the count doesn't match, the app shows you the student list for just that section so you can tap who's present.
- **Smart session detection** -- On Mondays it defaults to "Monday Afternoon (3:10 PM)"; on Wednesdays it defaults to "Wednesday Morning (7:45 AM)".
- **Term auto-detection** -- Automatically determines the current school term based on the date, with an option to manually override.
- **Offline support** -- If you lose internet, the app saves your data locally and shows a banner to sync when you're back online.
- **Edit after submission** -- Made a mistake? You can go back and edit counts or individual student marks from the summary screen.
- **Attendance reports** -- Switch to the Reports tab to see attendance rates by instrument and by student, with colour-coded percentage bars.
- **CSV export** -- Download attendance data as a spreadsheet file for record-keeping.
- **Progress indicator** -- A step indicator at the top (1-2-3-done) so you always know where you are.
- **Works on any device** -- Phone, tablet, laptop, desktop. Any modern web browser.
- **Unsaved data warning** -- If you try to close the browser or navigate away with unsaved attendance, you'll get a warning.
- **Haptic feedback** -- A subtle vibration on supported phones when you tap the +/- buttons.

---

## Detailed User Guide

### Taking Attendance (Step by Step)

#### 1. Opening the App

Open the link in your phone's browser (Safari, Chrome, or any other). You'll see today's date displayed prominently in the centre of the screen.

The app does not require a login. Anyone with the link can take attendance.

#### 2. Confirming the Date and Session

- The **date** is set automatically to today. (The app is designed for same-day attendance -- you don't pick a different date.)
- The **session type** is pre-selected based on the day of the week:
  - Monday -> "Monday Afternoon (3:10 PM)"
  - Wednesday -> "Wednesday Morning (7:45 AM)"
  - Any other day -> defaults to Monday Afternoon; change it with the dropdown if needed.
- The **term** (e.g. "Term 1, 2026") is auto-calculated. If it's wrong (e.g. near the start or end of term), tap the small "edit" link next to the term badge and select the correct term.

If attendance has already been recorded for this session, you'll see an orange warning banner and a "View / Edit Existing" button.

#### 3. Counting Students by Instrument

After tapping "Start Attendance", you'll see a list of all 11 instrument sections. For each one:

- The **instrument name** and **expected count** are shown on the left.
- Use the **-** and **+** buttons on the right to enter how many students you can see for that section.
- The card's left border changes colour to give you feedback:
  - **Green border + checkmark** = your count matches the expected number (all present).
  - **Orange border + warning icon** = your count is different from expected (you'll need to identify who's missing or extra).
  - **Red border + dash** = you entered zero (entire section absent).
  - **Grey dashed border + circle** = not yet entered.

The sticky footer at the bottom shows:
- How many of the 11 instruments you've entered so far.
- A running total of students accounted for out of the total enrolled.

The "Next" button stays disabled until all 11 instruments have a count entered.

#### 4. Resolving Mismatches

After tapping "Next", the app does the heavy lifting:

- **Sections where the count matches** are auto-resolved. All students in those sections are marked present. No action needed from you.
- **Sections where the count is zero** are auto-resolved. All students are marked absent.
- **Sections where the count doesn't match** require your attention. You'll see a list of student names for each mismatched section. Tap the name of each student who **is present**. A green checkbox appears next to their name.

At the bottom, a validation message tells you how many sections still need resolution. The "Submit Attendance" button is disabled until every mismatch section has exactly the right number of students selected.

For example, if you entered 5 for Flute (expected 7), you need to tap exactly 5 students from the Flute list.

#### 5. Reviewing and Submitting

Once all sections are resolved (either automatically or by you), the validation message turns green: "All sections resolved."

Tap **"Submit Attendance"** to save everything.

You'll see a summary screen with:
- The total number of students present out of the total enrolled.
- A breakdown by instrument (e.g. "Flute: 5 / 7").
- A list of absent students, grouped by instrument.

#### 6. What to Do if Something Goes Wrong

- **Internet drops while submitting:** The app saves your attendance data to your phone's local storage. Next time you open the app, you'll see an orange banner at the top saying "You have unsaved attendance. Tap to sync." Tap it to retry.
- **You entered the wrong count:** From the summary screen, tap "Edit Counts" to go back to the counting screen. Adjust and re-submit.
- **You marked the wrong student:** From the summary screen, tap "Edit Students" to go back to the resolve screen where you can change individual student marks.
- **The app shows a red error message:** Don't panic. Error messages stay on screen for 6 seconds (you can also tap them to dismiss). If it says "Data saved locally for retry," your work is safe and will sync when connectivity returns.
- **You accidentally close the browser:** If you had unsaved data, it may be lost. The app does warn you before closing, but some browsers don't always show the warning. Try to complete and submit before closing.

---

### Viewing Reports

#### 1. Switching to the Reports Tab

On the main screen, tap **"Reports"** in the tab bar at the top (next to "Attendance"). The report loads automatically.

#### 2. Filtering by Year and Term

Use the dropdown menus to select:
- **Year** (e.g. 2026, 2025)
- **Term** (Term 1, 2, 3, 4, or "All Terms")

Tap **"Generate Report"** to refresh the data.

#### 3. Understanding the Report

The report has two sections:

**By Instrument:**
A table showing each instrument section, the total attendance count vs. possible attendance, and an attendance rate percentage with a colour-coded bar:
- Green bar = 80% or higher (good)
- Orange bar = 50-79% (needs attention)
- Red bar = below 50% (concern)

**By Student:**
A table listing every student with their instrument, how many sessions they attended, and their attendance percentage. Students are sorted from lowest to highest attendance so you can quickly spot who's been missing.

#### 4. Exporting CSV

Tap the **"Export CSV"** button below the report tables. A file named something like `hnps-attendance-2026-term1.csv` will download to your device. You can open it in Excel, Google Sheets, or Numbers.

The CSV includes: Student Name, Instrument, Sessions Attended, Total Sessions, and Attendance %.

---

### Editing Existing Attendance

If attendance has already been recorded for a session, the main screen shows:
- An orange warning banner: "Attendance already recorded for this session."
- A **"View / Edit Existing"** button.

Tapping "View / Edit Existing" loads the previously saved data into the counting screen, with all counts and student marks pre-filled. You can adjust anything and re-submit.

From the **summary screen** after submission, you also have two edit options:
- **"Edit Counts"** -- takes you back to the instrument counting screen (Step 2).
- **"Edit Students"** -- takes you back to the individual student marking screen (Step 3).

---

## Frequently Asked Questions

### "What if I lose internet connection?"

The app caches instrument and student data on your phone. If you lose connection:
- You can still fill in attendance using the cached data.
- When you submit, if the save fails, the app stores your attendance locally.
- Next time you open the app with internet, you'll see a banner: "You have unsaved attendance. Tap to sync." Just tap it.

Your data won't be lost.

### "What if two volunteers take attendance at the same time?"

The last submission wins. If two people submit for the same session, the second submission will overwrite the first. It's best to have only one person taking attendance per session, or coordinate so one person handles it.

### "What if a student joins or leaves the band?"

Student data is managed in the database (see the "For Band Coordinators" section below). When a student is added or removed, the app will reflect the change next time it loads. Students are never deleted -- they are marked as inactive, so historical attendance records are preserved.

### "How do I get the attendance report for the term?"

1. Open the app and tap the "Reports" tab.
2. Select the year and term.
3. Tap "Generate Report."
4. Tap "Export CSV" to download a spreadsheet.

### "What if I make a mistake?"

- **Before submitting:** Just tap the +/- buttons to change counts, or tap student names to toggle their attendance.
- **After submitting:** Tap "Edit Counts" or "Edit Students" on the summary screen to go back and make changes. Then re-submit.
- **After leaving the app:** Open the app again. It will show "Attendance already recorded for this session." Tap "View / Edit Existing" to make corrections.

### "Can I use this on my laptop or desktop?"

Yes. The app works in any modern web browser. It's designed for phones first, but looks and works fine on larger screens too.

### "What if it's not a Monday or Wednesday?"

You can still take attendance on any day. Just select the correct session type from the dropdown menu (Monday Afternoon or Wednesday Morning) before tapping "Start Attendance."

### "What does the orange warning mean on the main screen?"

It means attendance has already been recorded for this date and session. You can view and edit it, or start fresh.

---

## For Band Coordinators

### How to Add or Remove Students

Students are stored in the Supabase database. To manage them:

1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **hnps-band-attendance** project.
3. Go to the **Table Editor** and select the **students** table.
4. To **add a student:** Click "Insert row" and fill in `first_name`, `last_name`, `grade`, `instrument_id`, and set `active` to `true`.
5. To **remove a student:** Don't delete the row. Instead, set the `active` column to `false`. This preserves their historical attendance records.
6. To **move a student to a different instrument:** Change their `instrument_id` to the ID of the new instrument.

The app loads fresh student data each time it's opened, so changes take effect immediately.

### How to View the Database

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **hnps-band-attendance** project (region: ap-southeast-2, Sydney).
3. Use the **Table Editor** to browse all four tables (see Technical Details below).
4. Use the **SQL Editor** for custom queries if needed.

### Term Dates Management

Terms are auto-calculated in the app using approximate date ranges:
- **Term 1:** January 1 to April 11
- **Term 2:** April 12 to July 11
- **Term 3:** July 12 to September 19
- **Term 4:** September 20 to December 31

If the auto-detection is wrong for a particular day (e.g. near term boundaries), volunteers can manually override the term using the "edit" link on the date screen.

There is no separate term dates table to maintain -- the logic is built into the app.

### How to Export Reports

1. Open the app in any browser.
2. Tap the "Reports" tab.
3. Select the year and term, then tap "Generate Report."
4. Tap "Export CSV" to download the data as a spreadsheet.

The CSV file contains every student's name, instrument, sessions attended, total sessions, and attendance percentage.

---

## Technical Details

### Architecture

The app is a **single HTML file** with no build step, no server code, and no framework. It uses:

- **HTML + CSS + JavaScript** (vanilla, no React/Vue/Angular)
- **Supabase** (hosted PostgreSQL database with REST API) for data storage
- **ES Modules** via CDN (`@supabase/supabase-js@2`)
- **localStorage** for offline caching and pending-sync queue

To deploy, you just host the single HTML file anywhere (Netlify, GitHub Pages, a school web server, or even open it as a local file).

### Supabase Project

- **Project name:** hnps-band-attendance
- **Region:** ap-southeast-2 (Sydney)
- **API URL:** `https://dirdanwihxwfuqldruoy.supabase.co`
- **Auth:** Uses the anonymous (public) API key. No user login required.

### Database Schema (4 Tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| **instruments** | List of instrument sections | `id`, `name`, `display_order` |
| **students** | All band members (past and present) | `id`, `first_name`, `last_name`, `grade`, `instrument_id`, `active` |
| **sessions** | Each attendance session (one per date+type) | `id`, `session_date`, `session_type`, `term`, `year` |
| **attendance** | Individual attendance records | `session_id`, `student_id`, `present` |

**Relationships:**
- `students.instrument_id` references `instruments.id`
- `attendance.session_id` references `sessions.id`
- `attendance.student_id` references `students.id`
- `attendance` has a unique constraint on `(session_id, student_id)`, enabling upsert behaviour

### Row Level Security (RLS)

Supabase RLS is configured to allow the anonymous role to read and write the necessary tables. Since this is a small school app without user authentication, the anonymous API key provides full access. The key is embedded in the HTML file.

**Note for future maintenance:** If the app needs to be restricted (e.g. only certain parents can take attendance), you would add Supabase Auth and RLS policies that check the authenticated user.

### Offline Resilience (localStorage)

The app uses localStorage for two purposes:

1. **Data caching:** Instruments and student lists are cached locally (`hnps_instruments`, `hnps_students`, `hnps_cache_time`). If the network fails, the app falls back to cached data.
2. **Pending sync queue:** If attendance submission fails, the records are saved to localStorage under a key like `pending_attendance_2026-03-24_monday_afternoon`. A banner appears on the home screen to retry syncing.

### Session Types

| Session | Day | Time | Key |
|---------|-----|------|-----|
| Monday Afternoon | Monday | 3:10 PM | `monday_afternoon` |
| Wednesday Morning | Wednesday | 7:45 AM | `wednesday_morning` |

---

## Instruments and Student Counts (Current)

The band currently has 11 instrument sections. The exact student counts are managed in the database and may change as students join or leave. Below is the structure:

| # | Instrument | Students |
|---|-----------|----------|
| 1 | Flute | Loaded from database |
| 2 | Clarinet | Loaded from database |
| 3 | Alto Saxophone | Loaded from database |
| 4 | Tenor Saxophone | Loaded from database |
| 5 | Trumpet | Loaded from database |
| 6 | French Horn | Loaded from database |
| 7 | Trombone | Loaded from database |
| 8 | Euphonium | Loaded from database |
| 9 | Tuba | Loaded from database |
| 10 | Percussion | Loaded from database |
| 11 | Bass Guitar | Loaded from database |

The total enrolled student count (currently shown as 71 in the app) updates automatically based on how many active students are in the database.

---

## License

MIT License

Copyright (c) 2026 HNPS Junior Band

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

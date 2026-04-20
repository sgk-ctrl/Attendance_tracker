# Band Attendance App -- Coordinator Guide

This guide is for band coordinators and parent volunteers. It covers everything you need to do day-to-day, plus how to manage students, volunteers, and the app itself.

## Accessing the App

**App URL:** https://hnps-band-attendance.vercel.app

Open the link in your phone's browser (Safari, Chrome, or any other). The app works on phones, tablets, and computers.

You need to be on the approved list to log in. If you are not on the list, the app will tell you "Not Authorized" after you try to sign in. Ask the app administrator to add your email.

### How to log in

1. Open the app URL.
2. Enter your email address.
3. Tap "Send Magic Link".
4. Check your email inbox (and spam folder) for a message from Supabase.
5. Tap the link in the email. You will be signed into the app automatically.

You stay signed in until you manually sign out or clear your browser data.

## Day-to-Day Operations

### Taking Attendance

**Before rehearsal starts:**

1. Open the app on your phone.
2. If you see a band selector screen, tap your band (e.g. "HNPS Junior Band").
3. You will see today's date and a pre-selected time:
   - On **Wednesdays**, the time defaults to **7:45 AM** (morning rehearsal).
   - On all other days, it defaults to **3:10 PM** (afternoon rehearsal).
4. If the date or time is wrong, tap to change it.
5. Check the term badge (e.g. "Term 1, 2026"). If it is wrong, tap the edit link next to it and select the correct term.
6. Tap **"Start Attendance"**.

**If you see an orange banner saying "Attendance already recorded for this session":**
- Someone has already taken attendance for this date and time.
- Tap **"View / Edit Existing"** to see or change the existing records.

**Counting students (Step 1):**

7. You will see a list of all instrument sections (Flute, Clarinet, Trumpet, etc.).
8. For each instrument, count how many students are present and use the **+** and **-** buttons to enter the number.
9. Each card changes color as you enter a count:
   - **Green** = your count matches the expected number (everyone is here).
   - **Orange** = your count is different (some students are missing or there are extras).
   - **Red** = you entered zero (nobody from this section is here).
   - **Grey** = you have not entered a count yet.
10. The sticky bar at the bottom shows your progress: how many instruments you have filled in and the running total of students.
11. Once all instruments have a count, tap **"Next"**.

**Resolving mismatches (Step 2):**

12. The app automatically handles sections where everyone is present or everyone is absent. You do not need to do anything for those.
13. For sections where the count does not match, you will see a list of student names.
    - If **most students are absent** (count is half or fewer), tap the students who **are present**. A green tick will appear next to their name.
    - If **most students are present** (count is more than half), all students start as present and the prompt asks you to tap the students who **are absent**.
14. You must select exactly the right number of students. For example, if you entered 5 for Flute (out of 7 expected), either 5 must be marked present or 2 must be marked absent.
15. The bar at the bottom tells you how many sections still need resolution.
16. Once all sections show "resolved", tap **"Submit Attendance"**.

**After submitting (Step 3):**

17. You will see a summary showing:
    - Total students present out of total enrolled.
    - A breakdown by instrument.
    - A list of absent students.
18. If you made a mistake:
    - Tap **"Edit Counts"** to go back and change instrument counts.
    - Tap **"Edit Students"** to go back and change individual student marks.
19. When you are happy, tap **"Done"** to return to the main screen.

### Viewing Reports

1. On the main screen, tap the **"Reports"** tab at the top.
2. Select the **Year** and **Term** you want to see (or leave Term blank for all terms).
3. Tap **"Generate Report"**.
4. You will see a table showing:
   - Each student's name and instrument.
   - How many sessions they attended out of how many were held.
   - Their attendance percentage, color-coded:
     - **Green** = 80% or higher.
     - **Orange** = 50-79%.
     - **Red** = below 50%.
5. To download the report as a spreadsheet, tap **"Export CSV"**. The file will download to your phone or computer. You can open it in Excel, Google Sheets, or Numbers.

### Resetting a Session (admin only)

If attendance was recorded for the wrong date or needs to be completely redone:

1. On the main screen, select the date and time of the session you want to delete.
2. You will see the orange "Attendance already recorded" banner.
3. Below the "View / Edit Existing" button, expand the **"Danger zone (admin only)"** section. (This section only appears if you are an admin.)
4. Tap the red **"Reset This Session"** button inside the danger zone.
5. Confirm the deletion when prompted.
6. The session and all its attendance records will be permanently deleted.
7. You can now tap "Start Attendance" to record fresh attendance for that date and time.

## Managing the Volunteer List

Volunteers are the parent helpers who are allowed to log into the app and record attendance.

### Adding a new volunteer

1. Open https://supabase.com/dashboard in a web browser (computer is easiest).
2. Log in with the Supabase account credentials (ask the app administrator if you do not have them).
3. In the left sidebar, click **SQL Editor**.
4. Paste the following into the editor, replacing the email and name:
   ```sql
   INSERT INTO allowed_users (email, name, role)
   VALUES ('their.email@example.com', 'Their Full Name', 'volunteer');
   ```
5. Click the green **Run** button.
6. Tell the new volunteer to:
   - Go to https://hnps-band-attendance.vercel.app
   - Enter their email address
   - Click the magic link in their email

### Removing a volunteer

1. Open the Supabase SQL Editor (same steps as above).
2. Paste the following, replacing the email:
   ```sql
   UPDATE allowed_users SET active = false
   WHERE email = 'their.email@example.com';
   ```
3. Click **Run**.

The volunteer will not be able to log in or access any data after this. Their email stays in the system in case you need to re-activate them later (just set `active` back to `true`).

### Checking who has access

1. Open the Supabase SQL Editor.
2. Run:
   ```sql
   SELECT email, name, role, active
   FROM allowed_users
   ORDER BY role, name;
   ```
3. You will see a table of all users, their roles, and whether they are active.

### Making someone an admin

Admins can do everything volunteers can do, plus delete sessions (the "Reset This Session" button).

1. Open the Supabase SQL Editor.
2. Run:
   ```sql
   UPDATE allowed_users SET role = 'admin'
   WHERE email = 'their.email@example.com';
   ```

## Managing Students

### Adding a new student

1. Open the Supabase SQL Editor.
2. First, find the instrument ID for the student's instrument:
   ```sql
   SELECT id, name FROM instruments WHERE band_id = 1 ORDER BY display_order;
   ```
   This will show something like:
   | id | name |
   |----|------|
   | 1 | Flute |
   | 2 | Clarinet |
   | 3 | Alto Saxophone |
   | ... | ... |

3. Note the `id` number for the instrument the student plays.
4. Run the following, filling in the student's details:
   ```sql
   INSERT INTO students (first_name, last_name, instrument_id, grade, band_id)
   VALUES ('First', 'Last', 3, 'Year 3', 1);
   ```
   Replace `3` with the instrument ID from step 2. Replace `1` with the band ID (1 = Junior Band).
5. The student will appear in the app the next time someone opens it.

### Removing a student (deactivate)

Do not delete students from the database. Deactivate them instead, so their historical attendance records are preserved.

1. Open the Supabase SQL Editor.
2. Run:
   ```sql
   UPDATE students SET active = false
   WHERE first_name = 'First' AND last_name = 'Last' AND band_id = 1;
   ```
3. The student will no longer appear in the attendance flow, but their past records remain.

### Re-activating a student

If a student returns to the band:
```sql
UPDATE students SET active = true
WHERE first_name = 'First' AND last_name = 'Last' AND band_id = 1;
```

### Moving a student to a different instrument

```sql
UPDATE students
SET instrument_id = (SELECT id FROM instruments WHERE name = 'Flute' AND band_id = 1)
WHERE first_name = 'First' AND last_name = 'Last' AND band_id = 1;
```

Replace `'Flute'` with the name of the new instrument.

### Checking the current student list

```sql
SELECT s.first_name, s.last_name, i.name AS instrument, s.grade
FROM students s
JOIN instruments i ON s.instrument_id = i.id
WHERE s.band_id = 1 AND s.active = true
ORDER BY i.display_order, s.last_name, s.first_name;
```

## Adding a New Band

If the school adds a Senior Band, Concert Band, or similar:

1. Open the Supabase SQL Editor.
2. Create the band:
   ```sql
   INSERT INTO bands (name, short_name, color)
   VALUES ('HNPS Senior Band', 'Senior Band', '#e53e3e');
   ```
3. Find the new band's ID:
   ```sql
   SELECT id FROM bands WHERE name = 'HNPS Senior Band';
   ```
   Let's say it returns `2`.

4. Add the instruments for the new band (adjust the list as needed):
   ```sql
   INSERT INTO instruments (name, display_order, band_id) VALUES
     ('Flute', 1, 2),
     ('Clarinet', 2, 2),
     ('Alto Saxophone', 3, 2),
     ('Tenor Saxophone', 4, 2),
     ('Trumpet', 5, 2),
     ('French Horn', 6, 2),
     ('Trombone', 7, 2),
     ('Euphonium', 8, 2),
     ('Tuba', 9, 2),
     ('Percussion', 10, 2),
     ('Bass Guitar', 11, 2);
   ```
   Replace `2` with whatever ID was returned in step 3.

5. Add the students (repeat for each student):
   ```sql
   -- First, check the instrument IDs for the new band
   SELECT id, name FROM instruments WHERE band_id = 2 ORDER BY display_order;

   -- Then add each student
   INSERT INTO students (first_name, last_name, instrument_id, grade, band_id)
   VALUES ('Alice', 'Smith', <instrument_id>, 'Year 5', 2);
   ```

6. The new band will appear on the app's band selector screen automatically.

## Updating Term Dates for Next Year

The app needs to know the school term dates so it can automatically detect which term a rehearsal falls in.

**2026 and 2027 dates are already set up** in both the database and the code. You only need to add new years going forward (2028+), typically in January each year.

1. Open the Supabase SQL Editor.
2. Run the following, replacing the dates with the actual NSW school term dates for the new year:
   ```sql
   INSERT INTO term_dates (year, term, start_date, end_date) VALUES
     (2028, 1, '2028-01-27', '2028-04-06'),
     (2028, 2, '2028-04-24', '2028-07-07'),
     (2028, 3, '2028-07-24', '2028-09-29'),
     (2028, 4, '2028-10-16', '2028-12-20');
   ```
3. You can find the official NSW term dates on the Department of Education website each year.

Note: The developer also needs to add the new year's dates to `constants.js` and update `REPORT_YEARS`. The `calcTerm()` function is year-aware, so it will automatically use the correct dates once they are added.

## Troubleshooting

### "Magic link not arriving"

- Check your **spam/junk folder**. The email comes from Supabase (noreply@mail.app.supabase.io).
- Make sure your email address is on the approved list. Ask an admin to run:
  ```sql
  SELECT * FROM allowed_users WHERE email = 'your.email@example.com';
  ```
  If nothing comes back, your email has not been added yet.
- Supabase free tier has email rate limits: **4 emails per hour**. If you or others have requested multiple magic links recently, wait an hour and try again.
- Try a different email address if you have one on the approved list.

### "Too many requests" or button shows a countdown

- After sending a magic link, the button shows a **60-second countdown** ("Wait 59s..."). This is normal -- just wait for the timer to finish before trying again.
- If you see a "Too many requests" error, Supabase's rate limit has been hit. The app automatically starts the 60-second countdown. Wait for it to expire and try once more.
- Supabase free tier allows **4 magic link emails per hour**. If multiple volunteers are trying to log in at the same time, some may need to wait.

### "App shows blank screen"

- **Hard refresh** the page: on iPhone Safari, pull down on the page to refresh. On Android Chrome, tap the three dots menu and tap "Reload". On a computer, press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac).
- **Clear the app data**: go to your browser settings, find "Clear browsing data" or "Website data", and clear data for the app URL.
- **Check if Supabase is paused**: the Supabase free tier pauses projects after 7 days of inactivity. A GitHub Actions keep-alive workflow (`.github/workflows/keep-alive.yml`) pings Supabase daily to prevent this automatically. If the project is still paused, check that the `SUPABASE_ANON_KEY` GitHub secret is set in the repo settings. To restore manually, go to https://supabase.com/dashboard/project/dirdanwihxwfuqldruoy and click "Restore".

### "Data not saving"

- Check your internet connection. Try opening another website to confirm you are online.
- If you submitted attendance and saw a red error message saying "Data saved locally for retry", your data is safe. Next time you open the app with a working internet connection, you will see an orange banner saying "You have unsaved attendance. Tap to sync." Tap it to retry.
- If the save keeps failing even with internet, the Supabase project may be paused (see above).

### "Can't see any students/instruments"

- Your email might not be in the `allowed_users` table. The app's security rules (Row Level Security) block access to student data for unauthorized users.
- Try signing out and signing back in: tap the menu or back button to get to the main screen, then sign out and sign in again.
- If the problem persists, ask an admin to check that your email is in `allowed_users` with `active = true`.

### "Wrong term showing"

- The app guesses the term based on the date. Near the start or end of a term, it might guess wrong.
- Tap the small edit link next to the term badge on the main screen and select the correct term manually.

### "Two people took attendance at the same time"

- The last submission wins. If two volunteers recorded attendance for the same session, the second one's data overwrites the first.
- To avoid this, coordinate so only one person records attendance per session.
- If the wrong data was saved, an admin can reset the session and re-record (see "Resetting a Session" above).

## Important Links

| What | URL |
|------|-----|
| Live app | https://hnps-band-attendance.vercel.app |
| Supabase dashboard | https://supabase.com/dashboard/project/dirdanwihxwfuqldruoy |
| GitHub repo | https://github.com/sgk-ctrl/Attendance_tracker |
| Privacy policy | https://hnps-band-attendance.vercel.app/privacy.html |

## Emergency: If Everything Breaks

1. **The app is a static website.** It cannot "crash" like a server. If the app URL is loading but showing a blank screen, it is likely a Supabase issue (see troubleshooting above).

2. **If Supabase is down or paused**, the app will still open, but it will not be able to load or save data. Attendance data entered while offline is saved to your phone's browser storage and will sync automatically when the connection is restored. You will see the orange "unsaved attendance" banner.

3. **If you need to completely reset the app**, contact the app developer. They can restore the Supabase project, redeploy the app, or recover data from backups.

4. **All student data is in Supabase.** Nothing is permanently stored on phones. If someone's phone is lost or broken, no data is lost. They just need to log in again on a new device.

5. **If the Vercel deployment breaks**, the backup is available at https://sgk-ctrl.github.io/Attendance_tracker/ (this may be slightly behind the main deployment).

6. **In an absolute emergency**, attendance can be taken on paper and entered into the app later by selecting the correct past date.

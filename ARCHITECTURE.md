# Architecture

## Overview

The HNPS Band Attendance Tracker is a React single-page application backed by a Supabase PostgreSQL database. The frontend is built with React 19, Vite 8, and Tailwind CSS 4. Authentication uses Supabase magic links (passwordless email). The app is deployed on Vercel with GitHub Pages as a backup. All data queries go directly from the browser to Supabase's auto-generated REST API -- there is no custom backend server.

## Folder Structure

```
app/
├── public/
│   ├── manifest.json              # PWA manifest (app name, icons, theme)
│   ├── sw.js                      # Service worker (cache-first for static assets)
│   ├── privacy.html               # Static privacy policy page
│   └── icon.svg                   # App icon
├── src/
│   ├── main.jsx                   # Entry point — renders App into DOM
│   ├── App.jsx                    # Router setup (hash router), auth guards
│   ├── index.css                  # Global styles, CSS variables, Tailwind imports
│   │
│   ├── pages/
│   │   ├── Login.jsx              # Magic link login form + not-authorized screen
│   │   ├── BandSelector.jsx       # Band picker (root route "/")
│   │   ├── BandHome.jsx           # Main page: attendance setup, reports, events tabs
│   │   ├── AttendanceFlow.jsx     # 3-step attendance flow (tally → resolve → summary)
│   │   ├── EventAttendance.jsx    # Event-specific attendance taking
│   │   ├── EventsList.jsx         # Events listing page
│   │   └── Dashboard.jsx          # Cross-band dashboard view
│   │
│   ├── components/
│   │   ├── attendance/
│   │   │   ├── InstrumentCard.jsx # Single instrument tally card with +/- stepper
│   │   │   ├── Stepper.jsx        # Reusable +/- number input
│   │   │   ├── TallyFooter.jsx    # Sticky footer with running total and Next button
│   │   │   ├── ResolveSection.jsx # Per-instrument student checklist for mismatches
│   │   │   ├── StudentRow.jsx     # Individual student toggle row
│   │   │   ├── SummaryHero.jsx    # Large present/total display on summary screen
│   │   │   ├── BreakdownList.jsx  # Per-instrument breakdown on summary screen
│   │   │   ├── AbsentList.jsx     # Absent students grouped by instrument
│   │   │   ├── DatePicker.jsx     # Date selector component
│   │   │   ├── TimePicker.jsx     # Hour/minute/AM-PM picker
│   │   │   └── TermBadge.jsx      # Editable term/year badge
│   │   ├── reports/
│   │   │   ├── ReportFilters.jsx  # Year and term filter dropdowns
│   │   │   ├── DetailedRegister.jsx # Full attendance register table
│   │   │   ├── InstrumentReport.jsx # Per-instrument attendance summary
│   │   │   ├── StudentReport.jsx  # Per-student attendance summary
│   │   │   └── ExportButtons.jsx  # CSV export functionality
│   │   ├── events/
│   │   │   ├── EventCard.jsx      # Event display card with link to attendance
│   │   │   └── StudentCheckList.jsx # Student checklist for event attendance
│   │   ├── layout/
│   │   │   ├── Layout.jsx         # Shared layout wrapper (toast provider)
│   │   │   ├── Header.jsx         # App header with title, subtitle, back button
│   │   │   ├── TabBar.jsx         # Tab navigation (Attendance / Reports / Events)
│   │   │   ├── ProgressIndicator.jsx # 3-step progress bar for attendance flow
│   │   │   ├── Spinner.jsx        # Loading spinner overlay
│   │   │   └── ToastContainer.jsx # Toast notification renderer
│   │   └── ui/
│   │       ├── Button.jsx         # Reusable button (primary, secondary, success)
│   │       ├── Card.jsx           # Rounded card container
│   │       ├── Badge.jsx          # Small colored badge
│   │       ├── PctBar.jsx         # Percentage progress bar (green/orange/red)
│   │       ├── EmptyState.jsx     # Empty state with icon and message
│   │       └── WarningBanner.jsx  # Orange warning banner
│   │
│   ├── hooks/
│   │   ├── useAttendanceFlow.js   # State machine for tally → resolve → submit → summary
│   │   ├── useBandData.js         # Fetches band info, instruments, and students
│   │   ├── useBands.js            # Fetches list of all bands
│   │   ├── useReports.js          # Fetches and computes attendance reports
│   │   ├── useEvents.js           # CRUD for band events
│   │   ├── useNavGuard.js         # Warns before navigating away with unsaved data
│   │   └── useOfflineSync.js      # Detects and retries pending offline attendance
│   │
│   ├── context/
│   │   ├── AuthContext.jsx        # React context for Supabase auth state
│   │   └── ToastContext.jsx       # React context for toast notifications
│   │
│   └── lib/
│       ├── supabase.js            # Supabase client initialization (env vars with hardcoded fallback)
│       ├── constants.js           # Day/month names, TERM_DATES_2026/2027, TERM_DATES_BY_YEAR, REPORT_YEARS
│       └── utils.js               # Date formatting, year-aware calcTerm(), localStorage helpers
│
├── vite.config.js                 # Vite config (React plugin, Tailwind, base path)
└── package.json                   # Dependencies and scripts
```

## Data Flow

### General pattern

```
User action → React component → Custom hook → Supabase JS client → PostgreSQL (via REST API)
```

All database operations go through the `@supabase/supabase-js` client configured in `lib/supabase.js`. The client authenticates using the JWT from the magic link session stored in localStorage.

### Attendance flow in detail

This is the core workflow of the app, managed by the `useAttendanceFlow` hook as a 3-step state machine:

**Step 1 -- Tally (BandHome + AttendanceFlow)**
1. User opens a band's home page (`BandHome.jsx`).
2. The date defaults to today. Time defaults based on day of week: Wednesday = 7:45 AM, all others = 3:10 PM.
3. The app checks if a session already exists for this date/time/band combination (`checkExisting` query).
4. User taps "Start Attendance" (new session) or "View / Edit Existing" (edit mode).
5. Navigation to `AttendanceFlow.jsx` with session params passed via `location.state`.
6. `useAttendanceFlow` initializes: in edit mode it fetches existing attendance records; in new mode it starts blank.
7. User enters a count for each instrument section using +/- steppers.
8. The footer shows progress (instruments filled / total) and a running present count.

**Step 2 -- Resolve**
1. User taps "Next" (only enabled when all instruments have a count).
2. `goToResolve()` processes each instrument:
   - Count matches expected: auto-mark all students present.
   - Count is zero: auto-mark all students absent.
   - Count differs: add to mismatch list for manual resolution.
3. For mismatched sections where the count is less than or equal to half the expected students, users tap individual student names to mark them **present** (default absent).
4. For mismatched sections where the count exceeds half the expected students, students default to **present** and the prompt is inverted -- users tap the students who are **absent** ("Tap the N absent student(s)").
5. Validation ensures the number of checked students matches the tally count for each section.

**Step 3 -- Submit and Summary**
1. User taps "Submit Attendance" (only enabled when all sections are resolved).
2. `submitAttendance()` runs:
   a. **Session creation** uses an insert-with-fallback pattern: first checks if a session exists (select), waits 300ms, re-checks, then inserts. If the insert hits a duplicate, it falls back to selecting the existing session. This avoids needing a unique constraint while handling concurrent creation.
   b. **Attendance saving** uses a select-existing then update/insert pattern: fetches existing attendance records for the session, updates those that already exist, and inserts new ones.
   c. If the network call fails, records are saved to localStorage via `savePendingAttendance()` for later retry.
3. On success, the summary screen shows total present/absent with per-instrument breakdown.
4. User can tap "Edit Counts" (back to step 1), "Edit Students" (back to step 2), or "Done" (back to BandHome).

### Offline resilience

- `useBandData` caches instruments and students to localStorage on every successful fetch using band-scoped keys (e.g. `hnps_instruments_${bandId}`), and falls back to the cache if the network fails. The old global `CACHE_KEYS` constant has been removed.
- `useOfflineSync` scans localStorage for `pending_attendance_*` keys and shows a sync banner on BandHome. Pending attendance keys now include bandId: `pending_attendance_${bandId}_${dateStr}_${sessionType}`. The `retrySync()` function filters by `band_id` on session lookup and creation.
- The service worker (`sw.js`) uses a stale-while-revalidate strategy for static assets and explicitly skips caching Supabase API calls.

## Database Schema

### bands
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | Auto-increment |
| name | text | Unique. e.g. "HNPS Junior Band" |
| short_name | text | Nullable. e.g. "Junior Band" |
| color | text | Hex color, default `#2b6cb0` |
| active | boolean | Default true |
| created_at | timestamptz | Default now() |

### instruments
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | Auto-increment |
| name | text | Unique. e.g. "Flute", "Trumpet" |
| display_order | integer | Controls UI ordering, default 0 |
| band_id | integer (FK) | References bands.id |

### students
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | Auto-increment |
| first_name | text | |
| last_name | text | |
| instrument_id | integer (FK) | References instruments.id |
| grade | text | Nullable. e.g. "Year 3" |
| active | boolean | Default true. Set false to deactivate (never delete). |
| created_at | timestamptz | Default now() |
| band_id | integer (FK) | References bands.id |

### sessions
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | Auto-increment |
| session_date | date | e.g. 2026-03-24 |
| session_type | text | Check constraint: `morning`, `afternoon`, `monday_afternoon`, `wednesday_morning` |
| session_time | text | Nullable. e.g. "3:10 PM", "7:45 AM" |
| term | integer | Nullable. 1-4 |
| year | integer | Default current year |
| recorded_by | text | Nullable. Email of the volunteer who recorded |
| band_id | integer (FK) | References bands.id |
| created_at | timestamptz | Default now() |

### attendance
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | Auto-increment |
| session_id | integer (FK) | References sessions.id |
| student_id | integer (FK) | References students.id |
| present | boolean | Default false |
| recorded_at | timestamptz | Default now() |

### band_events
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | Auto-increment |
| band_id | integer (FK) | References bands.id |
| name | text | e.g. "Spring Concert" |
| event_type | text | Check constraint: `concert`, `competition`, `eisteddfod`, `other` |
| event_date | date | |
| event_time | text | Nullable |
| venue | text | Nullable |
| notes | text | Nullable |
| created_at | timestamptz | Default now() |

### event_attendance
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | Auto-increment |
| event_id | integer (FK) | References band_events.id |
| student_id | integer (FK) | References students.id |
| present | boolean | Default false |
| recorded_at | timestamptz | Default now() |

### term_dates
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | Auto-increment |
| year | integer | e.g. 2026 |
| term | integer | Check constraint: 1-4 |
| start_date | date | e.g. 2026-01-27 |
| end_date | date | e.g. 2026-04-03 |

Current data (NSW 2026 school terms):
| Term | Start | End |
|------|-------|-----|
| 1 | 2026-01-27 | 2026-04-03 |
| 2 | 2026-04-20 | 2026-07-03 |
| 3 | 2026-07-20 | 2026-09-25 |
| 4 | 2026-10-12 | 2026-12-17 |

### allowed_users
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | Auto-increment |
| email | text | Unique. Used to match against Supabase auth JWT |
| name | text | Nullable. Display name |
| role | text | Check constraint: `admin`, `coordinator`, `volunteer`. Default `volunteer` |
| active | boolean | Default true. Set false to revoke access |
| created_at | timestamptz | Default now() |

### user_roles (future use)
| Column | Type | Notes |
|--------|------|-------|
| id | integer (PK) | Auto-increment |
| user_email | text | |
| band_id | integer (FK) | Nullable. References bands.id |
| role | text | Check constraint: `coordinator`, `volunteer`, `viewer` |
| created_at | timestamptz | Default now() |

This table is not currently used by the app. It exists for future per-band role assignments.

### Entity relationships

```
bands ──┬── instruments ── students ── attendance ── sessions
        ├── sessions                                    │
        ├── students                                    │
        ├── band_events ── event_attendance ── students │
        └── user_roles (future)                         │
                                                        │
allowed_users (standalone, checked by RLS functions) ───┘
```

## Row Level Security (RLS)

All tables have RLS enabled. Access is controlled by two PostgreSQL functions:

### `is_allowed_user()`
Returns true if the authenticated user's email exists in `allowed_users` with `active = true`.
```sql
RETURN EXISTS (
  SELECT 1 FROM allowed_users
  WHERE email = auth.jwt()->>'email'
  AND active = true
);
```

### `is_admin_user()`
Returns true if the authenticated user's email exists in `allowed_users` with `role = 'admin'` and `active = true`.
```sql
RETURN EXISTS (
  SELECT 1 FROM allowed_users
  WHERE email = auth.jwt()->>'email'
  AND role = 'admin'
  AND active = true
);
```

### Policy summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| bands | Any authenticated or anon | -- | -- | -- |
| instruments | Any authenticated or anon | -- | -- | -- |
| term_dates | Any authenticated or anon | -- | -- | -- |
| allowed_users | Any authenticated | -- | -- | -- |
| user_roles | Public (open read) | -- | -- | -- |
| students | Allowed user | -- | -- | -- |
| sessions | Allowed user | Allowed user | -- | Admin only |
| attendance | Allowed user | Allowed user | Allowed user | Admin only |
| band_events | Allowed user | Allowed user | Allowed user | Admin only |
| event_attendance | Allowed user | Allowed user | Allowed user | Admin only |

Key points:
- **Reference data** (bands, instruments, term_dates) is readable by any authenticated user, no allow-list check needed.
- **Student and attendance data** requires the user's email to be in `allowed_users` with `active = true`.
- **DELETE operations** on sessions, attendance, band_events, and event_attendance are restricted to admin users only. This is why "Reset This Session" only appears for admins in the UI.

## Authentication Flow

1. User visits the app and is not authenticated.
2. `ProtectedRoute` in `App.jsx` checks `useAuth()` -- if no user, redirects to `/login`.
3. User enters their email on the login screen.
4. `supabase.auth.signInWithOtp()` sends a magic link to that email address. The send button then enters a 60-second cooldown ("Wait 59s" countdown) to prevent rate-limit abuse. A 429 rate-limit response from Supabase also triggers this cooldown.
5. User clicks the magic link in their email. The link redirects back to the app with auth tokens in the URL hash.
6. `supabase.auth.onAuthStateChange()` fires in `AuthContext.jsx`, setting the user state.
7. `Login.jsx` checks if the user's email exists in the `allowed_users` table.
8. If the email is not found, the app shows a "Not Authorized" screen and offers to sign out.
9. If authorized, the user is redirected to the band selector (`/`).

## Key Design Decisions

### Why tally-based workflow (not 71 checkboxes)
Counting "8 flutes present" is much faster than scrolling through 71 student names during a noisy rehearsal. The tally step takes under a minute. Only mismatched sections require individual student selection, which typically affects 2-3 sections at most.

### Why React (migrated from vanilla JS)
The original app was a single HTML file. As features grew (multi-band support, events, reports, offline sync), a component-based architecture became necessary. React enables reusable components (InstrumentCard, StudentRow), proper state management via hooks, and clean routing between views.

### Why no native app (PWA is sufficient)
The app has about 10 regular users (parent volunteers). A PWA with `manifest.json` and a service worker provides "add to home screen" capability, offline caching, and instant loading -- all without App Store deployment. The service worker caches static assets and falls back to cache when offline.

### Why magic link auth (not passwords)
Parent volunteers are not technical users. Magic links eliminate the need to create, remember, or reset passwords. The user enters their email, clicks a link, and they are in. The `allowed_users` table acts as an access control list.

### Why select-then-insert instead of upsert
The `sessions` table does not have a unique constraint on `(session_date, session_time, band_id)`. Instead of relying on database-level uniqueness, the app uses an application-level pattern: check if a session exists (SELECT), wait briefly, re-check, then INSERT if none found. If the INSERT hits a duplicate, it falls back to selecting the existing one. This defensive approach handles concurrent creation without requiring schema changes.

### Why light/dark auto-theme
The app uses CSS custom properties with `prefers-color-scheme` media queries. Volunteers use the app outdoors in Australian sunlight (afternoon rehearsals) and indoors (morning rehearsals). The auto-theme ensures readability in both conditions without manual switching.

### Why Vercel over GitHub Pages for production
Vercel provides clean URLs without hash routing (SPA rewrites via `vercel.json`), automatic HTTPS, and instant deploys on push. GitHub Pages requires hash routing and has no server-side rewrite support, so it serves as a backup deployment.

### Why the resolve prompt inverts for majority-present sections
When a section's count exceeds half the expected students, most students are present. Asking the volunteer to tap the 2 absent students is faster and less error-prone than tapping 15 present ones. The prompt switches to "Tap the N absent student(s)" and defaults everyone to present, which is a behavioral design choice that optimizes for the common case.

### Why hash router
The app uses `createHashRouter` from react-router-dom. This ensures deep links work on both Vercel (which has SPA rewrites) and GitHub Pages (which does not). Hash-based routes like `/#/band/1/attendance` work everywhere without server configuration.

## Adding a New Band

To add a new band (e.g. "HNPS Senior Band"):

```sql
-- 1. Create the band
INSERT INTO bands (name, short_name, color)
VALUES ('HNPS Senior Band', 'Senior Band', '#e53e3e');

-- 2. Note the new band's ID
SELECT id FROM bands WHERE name = 'HNPS Senior Band';
-- Assume it returns 2

-- 3. Add instruments for the new band
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

-- 4. Add students (repeat for each student)
INSERT INTO students (first_name, last_name, instrument_id, grade, band_id)
VALUES ('Alice', 'Johnson', <instrument_id>, 'Year 5', 2);

-- 5. Find instrument IDs for reference
SELECT id, name FROM instruments WHERE band_id = 2 ORDER BY display_order;
```

The app's BandSelector page will automatically show the new band once it exists in the database.

## Updating Term Dates

The `term_dates` table stores the official NSW school term dates. The app also has hardcoded fallback dates in `lib/constants.js` (`TERM_DATES_2026`, `TERM_DATES_2027`) exposed via `TERM_DATES_BY_YEAR`. The `calcTerm()` function in `utils.js` is year-aware -- it looks up the correct year's dates automatically.

**2026 and 2027 dates are already in both the database and the code.** `REPORT_YEARS` already includes 2027. To add future years (2028+):

### Database update
```sql
INSERT INTO term_dates (year, term, start_date, end_date) VALUES
  (2028, 1, '2028-01-27', '2028-04-06'),
  (2028, 2, '2028-04-24', '2028-07-07'),
  (2028, 3, '2028-07-24', '2028-09-29'),
  (2028, 4, '2028-10-16', '2028-12-20');
```

### Code update
Add a `TERM_DATES_2028` constant in `constants.js`, add it to `TERM_DATES_BY_YEAR`, and add 2028 to `REPORT_YEARS`.

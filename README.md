# HNPS Band Attendance Tracker

A mobile-first React web app for tracking rehearsal attendance at HNPS (school band program). Designed for parent volunteers and band coordinators to quickly record which students are present by counting instrument sections, rather than checking off 71+ names individually. Built on Supabase for real-time data storage with magic-link authentication and offline support.

## Quick Start (for developers)

1. Clone the repo
   ```bash
   git clone https://github.com/sgk-ctrl/Attendance_tracker.git
   cd Attendance_tracker
   ```
2. Install dependencies
   ```bash
   cd app && npm install
   ```
3. Create `.env` in the `app/` directory with your Supabase credentials
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   > **Note:** The Supabase URL and anon key are currently hardcoded in `app/src/lib/supabase.js`. For local development you can either update that file directly or refactor it to read from environment variables.
4. Start the dev server
   ```bash
   npm run dev
   ```
5. Open http://localhost:5173

## Deployment

### Vercel (production)

- **URL:** https://hnps-band-attendance.vercel.app
- Auto-deploys from the `react-rebuild` branch
- `vercel.json` in the repo root configures the build command (`cd app && npm install && VERCEL=1 npm run build`), output directory (`app/dist`), and SPA rewrites so all routes serve `index.html`
- The Vite config sets `base: '/'` when the `VERCEL` env var is present
- Remember to add the Vercel URL to **Supabase Auth > URL Configuration > Redirect URLs**

### GitHub Pages (backup)

- **URL:** https://sgk-ctrl.github.io/Attendance_tracker/
- Serves from the `react-rebuild` branch
- Uses base path `/Attendance_tracker/` (set automatically in `vite.config.js` when not on Vercel)
- Uses `createHashRouter` so deep links work without server-side rewrites

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `react-rebuild` | Production (live on Vercel and GitHub Pages) |
| `dev` | Feature development and testing |
| `attendance_v2` | Multi-band management feature (band setup, CSV import) |
| `main` | Legacy vanilla JS version (single HTML file) |

## Managing Users

All user management is done via the Supabase SQL Editor or Table Editor.

### Add a volunteer
```sql
INSERT INTO allowed_users (email, name, role)
VALUES ('parent@example.com', 'Jane Smith', 'volunteer');
```

### Add an admin
```sql
INSERT INTO allowed_users (email, name, role)
VALUES ('coordinator@example.com', 'John Doe', 'admin');
```

### Remove access
```sql
UPDATE allowed_users SET active = false WHERE email = 'parent@example.com';
```

### Check who has access
```sql
SELECT email, name, role, active FROM allowed_users ORDER BY role, name;
```

## Admin Features

### Creating a Band via the App

Admins can create and configure bands directly through the app UI instead of using SQL:

1. **Create a band:** On the Band Selector screen, click the dashed "+" Add Band card. Enter a band name and short name, then click Create.
2. **Configure the band:** Click the gear icon on any band card to open the Band Setup page.

### Band Setup Page

The Band Setup page has 4 tabs:

- **Details** -- Edit band name, short name, and practice schedule (day of week + time). Click Save to persist changes.
- **Instruments** -- Add instruments by name. Delete instruments that have no students assigned.
- **Students** -- Add students individually (first name, last name, year, instrument). Activate or deactivate students.
- **Import** -- Bulk-import students from a CSV file.

### CSV Import

Import students in bulk using a CSV file:

1. Prepare a CSV with columns: `first_name`, `last_name`, `year`, `instrument`
   - Header names are normalized (e.g. "First Name", "first name", "first_name" all work)
   - Instruments not already in the band are created automatically
2. Go to Band Setup > Import tab
3. Upload the CSV file
4. Preview the parsed data (rows are color-coded for validation)
5. Click Import to add all students

### Practice Schedules

Each band can have a practice day and time configured in Band Setup > Details. The `defaultTimeForBand` utility uses this data to pre-fill the time picker when taking attendance.

## Tech Stack

- **Frontend:** React 19 + Vite 8 + Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + REST API)
- **Auth:** Supabase Magic Link (email-based, passwordless)
- **Hosting:** Vercel (production), GitHub Pages (backup)
- **PWA:** `manifest.json` + service worker for offline caching
- **Routing:** react-router-dom v7 with hash-based routing
- **Offline:** localStorage for data caching and pending-sync queue
- **CSV Import:** Papa Parse for student CSV import

## License

MIT License

Copyright (c) 2026 HNPS Junior Band

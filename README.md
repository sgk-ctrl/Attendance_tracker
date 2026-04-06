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

## Tech Stack

- **Frontend:** React 19 + Vite 8 + Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + REST API)
- **Auth:** Supabase Magic Link (email-based, passwordless)
- **Hosting:** Vercel (production), GitHub Pages (backup)
- **PWA:** `manifest.json` + service worker for offline caching
- **Routing:** react-router-dom v7 with hash-based routing
- **Offline:** localStorage for data caching and pending-sync queue

## License

MIT License

Copyright (c) 2026 HNPS Junior Band

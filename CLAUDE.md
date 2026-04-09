# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SRO Web App — a centralized platform for the UP Baguio Student Relations Office that digitizes activity requests, annual reports, and organization recognition applications. Built by Group SpaceBar (CMSC 128).

## Development Commands

### Frontend (sroapp/)
```bash
cd sroapp
npm install
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run lint      # ESLint
```

### Backend (srobackend/)
```bash
cd srobackend
npm install
npm run dev       # nodemon with auto-restart
npm start         # Production server at http://localhost:3000
```

Both servers must run simultaneously. The Vite dev server proxies `/api` and `/activities` to `localhost:3000`.

## Architecture

**Monorepo with two apps:**
- `sroapp/` — React 19 + Vite + Tailwind CSS + ShadCN UI
- `srobackend/` — Express 5 (ES modules) + PostgreSQL via Supabase
- `database/` — SQL schemas and RLS policies
- `database/migrations/` — Supabase migration files (see Database Migrations below)

### Authentication Flow
Google OAuth via Supabase → JWT stored in session → `authFetch()` wrapper attaches Bearer token to all API calls. Email must be `@up.edu.ph`. On first login, backend creates account record via `POST /auth/check-or-create`. If user's email matches an org's `adviser_email`, they're auto-assigned role_id=5 (Adviser).

### Role-Based Access Control
| role_id | Role | Access |
|---------|------|--------|
| 1 | Student | Submit forms, track status |
| 2 | SRO Admin | Approve/reject submissions |
| 3 | ODSA Admin | Activity Requests + Annual Reports only |
| 4 | SuperAdmin | Full access (hardcoded emails in `sroapp/src/lib/permissions.js`) |
| 5 | Adviser | Endorse/reject activity requests for their org(s) |

### Activity Approval Flow
Student → Adviser (endorse/reject) → SRO (approve/reject) → ODSA (final approve/reject)

### Frontend Route Protection
- `<PrivateRoute>` — checks Supabase auth + @up.edu.ph email
- `<RequireUser>` — role_id 1 or 4
- `<RequireAdminRole>` — uses `childrenByRole` pattern: `{ 2: <Component/>, 3: <Component/>, ... }`

All routes defined in `sroapp/src/routes/index.jsx`.

### Backend Middleware Chain
- `authMiddleware` — JWT validation, sets `req.user` and `req.account`
- `verifyAdminRoles` — restricts to role_id 2, 3, 4, or 5
- `verifySuperAdmin` — restricts to role_id 4
- `verifyOwnership` — checks `account_id` matches authenticated user

### Key Patterns
- **API calls**: Always use `authFetch()` from `sroapp/src/lib/api-config.js` — never raw `fetch()` or axios
- **File uploads**: FormData via multer → streamed to Google Drive → web view link stored in DB
- **Validation**: Zod schemas on frontend (`sroapp/src/lib/zodSchemas.js`), sanitization on backend (`srobackend/src/lib/sanitize.js`)
- **Notifications**: Supabase real-time subscriptions (`sroapp/src/lib/notifications.js`)
- **State management**: React hooks + context only (no Redux/Zustand)
- **Data fetching**: Direct Supabase queries for reads; backend API for mutations and auth-required operations

## Database Migrations

**All Supabase schema/policy changes must be documented as migration files in `database/migrations/`.**

Rules:
- File naming: `YYYYMMDD_description.sql` (e.g., `20260315_add_adviser_role_to_rls.sql`)
- **NEVER edit existing migration files** — if there's an error, create a new migration file that fixes it
- Each migration should include a header comment with date and description
- Run migrations in Supabase SQL Editor in chronological order
- This ensures we have a clear history of all DB changes

### Backend API Route Groups
```
/auth                    — User authentication (check-or-create, verify)
/activityRequest         — Activity submissions (multipart/form-data)
/activityEdit            — Activity modifications
/api/organization        — Organization CRUD
/api/orgApplication      — Org application submissions
/api/annualReport        — Annual report submissions
/api/activities          — Admin activity management
/api/appointments        — Interview slot booking
/api/org-applications    — Admin org application approval
/api/documents           — Google Drive document templates
/api/email-services      — Email notifications (rate limited: 10 req/min)
/health                  — Health check
```

### Security
- CORS whitelist: localhost:5173, localhost:4173, `FRONTEND_URL` env var
- Rate limiting: 100 req/min global, 10 req/min on auth and email endpoints
- Row Level Security policies in `database/rls_policies.sql` and `database/migrations/`
- Input sanitization + Zod validation + safe regex patterns

## Environment Variables

Root `.env` is loaded by both apps. Required variables:

**Frontend:** `VITE_BACKEND_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

**Backend:** `PORT`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_SERVICE_ROLE_KEY`, `GDRIVE_FOLDER_ID`, `GDRIVE_ANNUAL_REPORT_FOLDER_ID`, `GDRIVE_ORG_APP_FOLDER_ID`, `GDRIVE_CLIENT_EMAIL`, `GDRIVE_PROJECT_ID`, `GDRIVE_PRIVATE_KEY`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_SENDER_EMAIL`

## External Services

- **Supabase** — Auth (Google OAuth), PostgreSQL database, real-time subscriptions
- **Google Drive API** — File upload/storage via service account
- **Gmail** — Email notifications via Nodemailer + OAuth 2.0
- **Puppeteer** — PDF generation for approval slips

# Shaurya unified operations

One role-protected Next.js application for master administrators and volunteers.

## Capabilities

- Master admin analytics for participants, colleges, QR inventory, slots, scan
  attempts, successful verifications, and per-volunteer performance.
- Admin management of admins, volunteers, participants, QR assignment, and food
  slot start/pause/close controls, including staff edit/remove/restore and role
  changes.
- Field-specific participant search, assignment/status filters, sorting, and a
  retained participant timeline for QR, account, scan, and meal activity.
- Volunteer QR assignment with search-only access and transactional QR claiming.
- Volunteer food verification with one meal per participant per active slot.
- Signed HttpOnly sessions and scrypt password hashing.
- Public registration API used by the separate static registration site.
- Installable PWA with 192/512/maskable icons, update notifications, connection
  status, security headers, and a safe offline fallback. Protected pages and API
  responses are deliberately network-only and are never stored by the service worker.

## Database boundary

Pages and server actions depend on PlatformStore in src/server/data/contracts.ts.
The current adapter is Prisma/PostgreSQL. Replacing the provider requires a new
PlatformStore adapter; UI and domain workflows do not import Supabase.

## Setup

1. Copy .env.example to .env and configure it.
2. Run npm install.
3. Run npm run db:generate.
4. Apply prisma/migrations/20261001_unified_operations/migration.sql to an
   existing prototype database, or run npm run db:push for a fresh database.
5. Set BOOTSTRAP_ADMIN_PASSWORD and run npm run db:seed.
6. Run npm run dev.

Before deployment, run `npm run verify` from the repository root. It executes
strict type checking, ESLint, regression tests, Prisma generation, and the
production build.

Use `npm run dev:https` when testing the QR camera from a phone or another
device. Browsers permit camera access on localhost or HTTPS, but normally block
it on a plain HTTP LAN address.

The registration site must be listed in REGISTRATION_ORIGINS.

Provider-neutral import commands:

    npm run import:qrs -- /path/to/qr_codes.json
    npm run import:participants -- /path/to/participants.csv

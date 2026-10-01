# Shaurya QR ecosystem

The repository now contains exactly two deployable sites:

| Site | Path | Purpose |
| --- | --- | --- |
| Registration | apps/registration-page | Lightweight public HTML/CSS/JS registration |
| Operations | apps/unified-platform | Next.js admin and volunteer platform |

## Operations roles

### Master admin

- Create, edit, remove, restore, promote, and demote volunteers or other administrators.
- View participant, college, QR, slot, and progressive verification analytics.
- Compare each volunteer's total scan attempts with successful verifications.
- Create food days and slots, then start, pause, reset, close, or delete them.
- Search participants in pages of 50 and add, remove, restore, assign, or
  unassign QR cards.
- Filter participants by active/removed and assigned/unassigned state, search a
  specific field, sort results, and open each participant's retained history.

### Volunteer

- QR assignment: search a participant, register them if missing, and scan an
  available QR card.
- Food verification: scan a participant QR against the active meal slot.
- View the active day/meal, total slot progress, personal attempts and verified
  meals, recent activity, and search a specific participant.
- Volunteers never receive the complete participant list.

## Architecture

Browser clients never receive database credentials. Registration calls the
public API exposed by the operations app. Every privileged mutation runs on the
server and checks a signed, HttpOnly role session.

The app depends on the PlatformStore contract, not Supabase. Prisma/PostgreSQL
is the first adapter; another database can be supported by implementing the
same contract and selecting it in src/server/data/index.ts.

## Commands

Run from the repository root:

    npm run dev
    npm run dev:https     # use for phone/camera testing over the local network
    npm run typecheck
    npm run lint
    npm run build
    npm run verify

See apps/unified-platform/README.md and apps/registration-page/README.md for
deployment and database setup.

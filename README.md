# Shaurya QR ecosystem

The repository contains two deployable sites:

| Site | Path | Purpose |
| --- | --- | --- |
| Registration | `apps/registration-page` | Lightweight public HTML/CSS/JS registration |
| Operations | `apps/unified-platform` | Next.js admin and volunteer platform |

## Operations roles

### Master admin

- Create, edit, remove, restore, promote, and demote volunteers or other administrators.
- View participant, college, QR, slot, and progressive verification analytics.
- Compare each volunteer's total scan attempts with successful verifications.
- Create food days and slots, then start, pause, reset, close, or delete them.
- Search participants in pages of 50 and add, remove, restore, assign, or unassign QR cards.
- Filter participants by active/removed and assigned/unassigned state, search a specific field, sort results, and open each participant's retained history.

### Volunteer

- Search for a participant, register them if missing, and assign an available QR card.
- Verify participant QR codes against the active meal slot.
- View active meal progress, personal attempts, successful verifications, and recent activity.
- Search for a specific participant without receiving the complete participant list.

## Architecture

Browser clients never receive database credentials. Registration calls the public API exposed by the operations app. Every privileged mutation runs on the server and checks a signed, HttpOnly role session.

The UI depends on the `PlatformStore` contract rather than a database provider. Prisma/PostgreSQL is the current adapter; another database can be supported by implementing the same contract in `src/server/data`.

## Commands

Run from the repository root:

```bash
npm run dev
npm run dev:https
npm run typecheck
npm run lint
npm run build
npm run verify
```

Use `npm run dev:https` for phone camera testing over the local network. See `apps/unified-platform/README.md` and `apps/registration-page/README.md` for deployment and database setup.

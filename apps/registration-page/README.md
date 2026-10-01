# Shaurya registration site

This is the lightweight public registration site. It has no database credentials
and never talks to Supabase or another provider directly.

1. Deploy apps/unified-platform.
2. Set apiBaseUrl in config.js to that deployment URL.
3. Add this registration site's origin to REGISTRATION_ORIGINS in the unified
   platform environment.
4. Serve this directory with any static host.

For local development, run python3 -m http.server 4173 from this directory.
The default config.js points to http://localhost:3000.
